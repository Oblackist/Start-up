"""Production database selection must fail closed on local/cleartext DBs."""

import pytest

from app.config import ProductionConfig, resolve_db_url_for_app


def _set_valid_production_environment(monkeypatch):
    values = {
        "PASSWORD_PEPPER": "p" * 40,
        "SECRET_KEY": "s" * 40,
        "FRONTEND_ORIGIN": "https://career.example.test",
        "MFA_ENCRYPTION_KEY": "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=",
        "SMTP_HOST": "smtp.example.test",
        "SMTP_FROM": "noreply@example.test",
        "SMTP_STARTTLS": "true",
        "SMTP_USE_SSL": "false",
        "RATE_LIMIT_BACKEND": "redis",
        "REDIS_URL": "rediss://cache.example.test:6379/0",
    }
    for key, value in values.items():
        monkeypatch.setenv(key, value)


def test_production_rejects_missing_database_url(monkeypatch):
    _set_valid_production_environment(monkeypatch)
    monkeypatch.delenv("FLASK_DATABASE_URL", raising=False)
    monkeypatch.delenv("DATABASE_URL", raising=False)

    with pytest.raises(RuntimeError, match="PostgreSQL"):
        ProductionConfig.validate()


def test_production_rejects_sqlite_database_url(monkeypatch):
    _set_valid_production_environment(monkeypatch)
    monkeypatch.setenv("FLASK_DATABASE_URL", "sqlite:///instance/app.db")

    with pytest.raises(RuntimeError, match="PostgreSQL"):
        ProductionConfig.validate()


@pytest.mark.parametrize("raw_url", [
    "postgresql://user:password@db.example.test:5432/career?sslmode=require",
    "postgres://user:password@db.example.test:5432/career?sslmode=verify-full",
])
def test_production_accepts_tls_postgresql_url(monkeypatch, raw_url):
    _set_valid_production_environment(monkeypatch)
    monkeypatch.setenv("FLASK_DATABASE_URL", raw_url)

    ProductionConfig.validate()


@pytest.mark.parametrize("raw_url", [
    "postgresql://user:password@db.example.test:5432/career",
    "postgresql://user:password@db.example.test:5432/career?sslmode=disable",
])
def test_production_rejects_postgresql_without_required_tls(monkeypatch, raw_url):
    _set_valid_production_environment(monkeypatch)
    monkeypatch.setenv("FLASK_DATABASE_URL", raw_url)

    with pytest.raises(RuntimeError, match="sslmode"):
        ProductionConfig.validate()


@pytest.mark.parametrize("origin", [
    "",
    "*",
    "http://career.example.test",
    "https://",
    "https://career.example.test/api",
    "https://career.example.test?origin=other",
    "https://user:password@career.example.test",
    "https://career.example.test:invalid",
    "https://bad host.example",
    "https://career.example.test:0",
    "https://career.example.test:443",
])
def test_production_rejects_invalid_frontend_origins(monkeypatch, origin):
    _set_valid_production_environment(monkeypatch)
    monkeypatch.setenv("FLASK_DATABASE_URL", "postgresql://user:password@db.example.test:5432/career?sslmode=require")
    monkeypatch.setenv("FRONTEND_ORIGIN", origin)

    with pytest.raises(RuntimeError, match="FRONTEND_ORIGIN"):
        ProductionConfig.validate()


def test_production_accepts_an_exact_https_frontend_origin(monkeypatch):
    _set_valid_production_environment(monkeypatch)
    monkeypatch.setenv("FLASK_DATABASE_URL", "postgresql://user:password@db.example.test:5432/career?sslmode=require")
    monkeypatch.setenv("FRONTEND_ORIGIN", "https://career.example.test:8443")

    ProductionConfig.validate()


def test_postgres_urls_are_normalized_to_explicit_psycopg_driver(monkeypatch):
    monkeypatch.setenv(
        "FLASK_DATABASE_URL",
        "postgres://user:password@db.example.test:5432/career?sslmode=require",
    )
    monkeypatch.delenv("DATABASE_URL", raising=False)

    resolved, ignored = resolve_db_url_for_app()

    assert resolved == (
        "postgresql+psycopg://user:password@db.example.test:5432/"
        "career?sslmode=require"
    )
    assert ignored is None
