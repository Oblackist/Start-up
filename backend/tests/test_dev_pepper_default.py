"""Regression tests for the dev-config pepper default (GH-style bug: register 500s).

Root cause guarded against: a developer who started the backend without
copying `.env.example` (so PASSWORD_PEPPER was unset/empty) got a server that
booted fine (DevConfig performed no pepper validation) but every
register/login 500s inside `_apply_pepper()` with
`RuntimeError: PASSWORD_PEPPER is not configured`.

Fix:
  * DevConfig provides a non-empty default pepper.
  * create_app() re-resolves PASSWORD_PEPPER from the environment AFTER
    load_dotenv() (so a real .env pepper is honored).
  * _pepper() reads from current_app.config (call-time), falling back to env
    only outside an app context.
  * ProductionConfig.validate() still rejects empty/placeholder/short peppers,
    AND the dev default string is in _PLACEHOLDER_VALUES so production can
    never ship it.
"""
from __future__ import annotations

import os

import pytest

from app import create_app
from app.config import DevConfig, ProductionConfig, _PLACEHOLDER_VALUES

DEV_DEFAULT = "dev-pepper-not-for-production-please-set-a-real-one-in-.env"


def _dev_app(tmp_path, monkeypatch, *, pepper_env=None):
    """Build a DEV app via the ENV-DRIVEN boot path (create_app with no
    config object), pointed at a temp DB through FLASK_DATABASE_URL.

    pepper_env:
      None  -> do not touch PASSWORD_PEPPER (caller controls it via monkeypatch)
      ""    -> explicitly delete it (simulate missing .env)
      str   -> set it to that value
    """
    monkeypatch.setenv("FLASK_ENV", "development")
    monkeypatch.setenv("FLASK_DATABASE_URL", "sqlite:///" + str(tmp_path / "t.db"))
    monkeypatch.delenv("DATABASE_URL", raising=False)
    if pepper_env == "":
        monkeypatch.delenv("PASSWORD_PEPPER", raising=False)
    elif pepper_env is not None:
        monkeypatch.setenv("PASSWORD_PEPPER", pepper_env)
    return create_app()


def test_dev_default_string_is_in_placeholder_set():
    """The dev default pepper must be rejected by ProductionConfig.validate()."""
    assert DEV_DEFAULT in _PLACEHOLDER_VALUES


def test_app_dev_has_nonempty_pepper_without_env(tmp_path, monkeypatch):
    """With no .env / no PASSWORD_PEPPER, the dev app still has a non-empty pepper."""
    app = _dev_app(tmp_path, monkeypatch, pepper_env="")
    assert app.config["PASSWORD_PEPPER"], "dev app must have a non-empty pepper"
    assert len(app.config["PASSWORD_PEPPER"]) >= 16


def test_app_dev_honors_real_pepper_from_env(tmp_path, monkeypatch):
    """A real pepper set in the env overrides the dev default."""
    app = _dev_app(tmp_path, monkeypatch, pepper_env="a-real-strong-pepper-0123456789")
    assert app.config["PASSWORD_PEPPER"] == "a-real-strong-pepper-0123456789"


def test_hash_password_works_in_dev_without_env_pepper(tmp_path, monkeypatch):
    """The register path: hash_password must not raise under a dev app with no env."""
    app = _dev_app(tmp_path, monkeypatch, pepper_env="")
    from app.security.password import hash_password, verify_password

    with app.app_context():
        encoded = hash_password("Password1")
        assert encoded and not encoded.startswith("Password1")
        assert verify_password("Password1", encoded) is True
        assert verify_password("wrong", encoded) is False
        assert hash_password("Password1") != encoded  # unique salt


def test_register_succeeds_in_dev_without_env_pepper(tmp_path, monkeypatch):
    """End-to-end: POST /auth/register returns 201 even with no .env/pepper."""
    app = _dev_app(tmp_path, monkeypatch, pepper_env="")
    from app.services.auth_service import email_service
    monkeypatch.setattr(email_service, "is_configured", lambda: True)
    monkeypatch.setattr(email_service, "send_verification", lambda *_args: None)
    with app.app_context():
        from app.extensions import db
        db.create_all()
    client = app.test_client()
    resp = client.post(
        "/api/v1/auth/register",
        json={"name": "Aysel Yusifli", "email": "aysel@example.com",
              "password": "Salam123", "confirm": "Salam123"},
        headers={"Origin": "http://localhost:5173"},
    )
    assert resp.status_code == 201, resp.get_json()
    body = resp.get_json()
    assert body["user"]["email"] == "aysel@example.com"
    assert "password_hash" not in body["user"]
    assert body["requires_verification"] is True
    # No authenticated session exists until the email code is verified.
    set_cookie = resp.headers.getlist("Set-Cookie")
    joined = "\n".join(set_cookie)
    assert "session_token=" not in joined
    assert "csrf_token=" not in joined


def test_duplicate_register_returns_409_not_500(tmp_path, monkeypatch):
    """A duplicate email must return 409 (not crash the server)."""
    app = _dev_app(tmp_path, monkeypatch)
    from app.services.auth_service import email_service
    monkeypatch.setattr(email_service, "is_configured", lambda: True)
    monkeypatch.setattr(email_service, "send_verification", lambda *_args: None)
    with app.app_context():
        from app.extensions import db
        db.create_all()
    client = app.test_client()
    payload = {"name": "Dup", "email": "dup@example.com",
               "password": "Salam123", "confirm": "Salam123"}
    r1 = client.post("/api/v1/auth/register", json=payload,
                     headers={"Origin": "http://localhost:5173"})
    r2 = client.post("/api/v1/auth/register", json=payload,
                     headers={"Origin": "http://localhost:5173"})
    assert r1.status_code == 201
    assert r2.status_code == 409, r2.get_json()


def test_production_rejects_empty_pepper(monkeypatch):
    monkeypatch.delenv("PASSWORD_PEPPER", raising=False)
    monkeypatch.setenv("SECRET_KEY", "a-strong-real-secret-of-sufficient-length")
    monkeypatch.setenv("FRONTEND_ORIGIN", "https://example.com")
    with pytest.raises(RuntimeError):
        ProductionConfig.validate()


def test_production_rejects_dev_default_pepper(monkeypatch):
    monkeypatch.setenv("PASSWORD_PEPPER", DEV_DEFAULT)
    monkeypatch.setenv("SECRET_KEY", "a-strong-real-secret-of-sufficient-length")
    monkeypatch.setenv("FRONTEND_ORIGIN", "https://example.com")
    with pytest.raises(RuntimeError):
        ProductionConfig.validate()
