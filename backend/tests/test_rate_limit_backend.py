"""Shared limiter behavior and production fail-closed configuration."""
from __future__ import annotations

import pytest
import sys
from types import SimpleNamespace

from app import create_app
from app.config import ProductionConfig, TestingConfig
from app.security.rate_limit import RateLimiterUnavailable, RedisRateLimiter, limiter
from tests.conftest import create_app_testing


class RedisScriptStub:
    def __init__(self, results):
        self.results = list(results)
        self.calls = []

    def eval(self, script, key_count, *args):
        self.calls.append((script, key_count, args))
        result = self.results.pop(0)
        if isinstance(result, Exception):
            raise result
        return result

    def delete(self, key):
        self.deleted = key
        return 1


def test_redis_limiter_uses_one_atomic_fixed_window_script_and_hides_raw_keys():
    stub = RedisScriptStub([[1, 0], [0, 17]])
    shared = RedisRateLimiter(stub)
    assert shared.hit("192.0.2.1|person@example.com", "login", 5, 900) == (True, 0)
    assert shared.hit("192.0.2.1|person@example.com", "login", 5, 900) == (False, 17)

    first_script, key_count, args = stub.calls[0]
    assert key_count == 1
    assert "INCR" in first_script and "EXPIRE" in first_script
    assert args[0].startswith("careerarena:rl:v1:login:")
    assert "person@example.com" not in args[0]
    assert args[1:] == (900, 5)
    assert stub.calls[0][2][0] == stub.calls[1][2][0]


def test_redis_limiter_reset_deletes_the_corresponding_hashed_bucket():
    stub = RedisScriptStub([])
    shared = RedisRateLimiter(stub)
    shared.reset("ip|user@example.com", "login")
    assert stub.deleted.startswith("careerarena:rl:v1:login:")
    assert "user@example.com" not in stub.deleted


def test_redis_limiter_backend_errors_are_not_downgraded_to_memory():
    shared = RedisRateLimiter(RedisScriptStub([OSError("redis password must not leak")]))
    with pytest.raises(RateLimiterUnavailable):
        shared.hit("ip", "login", 5, 900)


def test_rate_limiter_backend_failure_returns_sanitized_503(client, app):
    app.extensions["rate_limiter"] = RedisRateLimiter(
        RedisScriptStub([OSError("redis password must not leak")])
    )
    response = client.post("/api/v1/auth/login", json={"email": "a@example.com", "password": "bad"})
    assert response.status_code == 503
    assert response.get_json()["error"]["code"] == "rate_limit_unavailable"
    assert "redis password" not in response.get_data(as_text=True)


def test_dev_and_test_apps_use_the_process_local_limiter():
    app = create_app_testing()
    with app.app_context():
        assert app.extensions["rate_limiter"] is limiter


def test_redis_backend_is_selected_only_after_a_successful_startup_ping(monkeypatch):
    monkeypatch.delenv("RATE_LIMIT_BACKEND", raising=False)
    monkeypatch.delenv("REDIS_URL", raising=False)
    client = SimpleNamespace(ping=lambda: True)
    factory = SimpleNamespace(from_url=lambda *args, **kwargs: client)
    monkeypatch.setitem(sys.modules, "redis", SimpleNamespace(Redis=factory))
    cfg = TestingConfig()
    cfg.RATE_LIMIT_BACKEND = "redis"
    cfg.REDIS_URL = "rediss://cache.example.test:6379/0"
    app = create_app(config_object=cfg)
    assert isinstance(app.extensions["rate_limiter"], RedisRateLimiter)


def test_redis_backend_startup_failure_aborts_without_memory_fallback(monkeypatch):
    monkeypatch.delenv("RATE_LIMIT_BACKEND", raising=False)
    monkeypatch.delenv("REDIS_URL", raising=False)
    client = SimpleNamespace(ping=lambda: (_ for _ in ()).throw(OSError("unavailable")))
    factory = SimpleNamespace(from_url=lambda *args, **kwargs: client)
    monkeypatch.setitem(sys.modules, "redis", SimpleNamespace(Redis=factory))
    cfg = TestingConfig()
    cfg.RATE_LIMIT_BACKEND = "redis"
    cfg.REDIS_URL = "redis://cache.example.test:6379/0"
    with pytest.raises(RuntimeError, match="startup aborted"):
        create_app(config_object=cfg)


def test_production_requires_tls_redis_for_shared_rate_limits(monkeypatch):
    monkeypatch.setenv(
        "FLASK_DATABASE_URL",
        "postgresql://dbuser:dbpassword@db.example.test:5432/career?sslmode=require",
    )
    values = {
        "PASSWORD_PEPPER": "p" * 40,
        "SECRET_KEY": "s" * 40,
        "FRONTEND_ORIGIN": "https://career.example.test",
        "MFA_ENCRYPTION_KEY": "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=",
        "SMTP_HOST": "smtp.example.test",
        "SMTP_FROM": "noreply@example.test",
        "SMTP_STARTTLS": "true",
        "SMTP_USE_SSL": "false",
    }
    for name, value in values.items():
        monkeypatch.setenv(name, value)
    monkeypatch.delenv("REDIS_URL", raising=False)
    monkeypatch.setenv("RATE_LIMIT_BACKEND", "memory")
    with pytest.raises(RuntimeError, match="RATE_LIMIT_BACKEND"):
        ProductionConfig.validate()

    monkeypatch.setenv("RATE_LIMIT_BACKEND", "redis")
    monkeypatch.setenv("REDIS_URL", "redis://cache.example.test:6379/0")
    with pytest.raises(RuntimeError, match="rediss"):
        ProductionConfig.validate()

    monkeypatch.setenv("REDIS_URL", "rediss://:secret@cache.example.test:6379/0")
    ProductionConfig.validate()
    monkeypatch.setenv("RATE_LIMIT_WINDOW", "0")
    with pytest.raises(RuntimeError, match="must be positive"):
        ProductionConfig.validate()
