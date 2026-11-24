"""Tests for secure SMTP delivery and email challenge persistence."""
from __future__ import annotations

from unittest.mock import patch

import pytest

from app import create_app
from app.config import ProductionConfig, TestingConfig
from app.services.email_service import EmailDeliveryError, EmailService


def test_smtp_delivery_uses_starttls_and_auth_when_configured():
    cfg = TestingConfig()
    cfg.SQLALCHEMY_DATABASE_URI = "sqlite://"
    app = create_app(config_object=cfg)
    app.config.update(
        SMTP_HOST="smtp.example.test", SMTP_PORT=587, SMTP_USERNAME="mailer",
        SMTP_PASSWORD="smtp-secret", SMTP_FROM="no-reply@example.test",
        SMTP_USE_SSL=False, SMTP_STARTTLS=True, SMTP_TIMEOUT_SECONDS=4,
        ENV_NAME="development",
    )
    with app.app_context(), patch("app.services.email_service.smtplib.SMTP") as factory:
        server = factory.return_value
        EmailService().send_message("user@example.test", "Subject", "Body")

    factory.assert_called_once_with("smtp.example.test", 587, timeout=4)
    server.starttls.assert_called_once()
    server.login.assert_called_once_with("mailer", "smtp-secret")
    server.send_message.assert_called_once()
    assert server.send_message.call_args.args[0]["To"] == "user@example.test"


def test_smtp_failure_does_not_expose_provider_error_text():
    cfg = TestingConfig()
    cfg.SQLALCHEMY_DATABASE_URI = "sqlite://"
    app = create_app(config_object=cfg)
    app.config.update(
        SMTP_HOST="smtp.example.test", SMTP_FROM="no-reply@example.test",
        SMTP_USE_SSL=True, SMTP_STARTTLS=False, ENV_NAME="development",
    )
    with app.app_context(), patch(
        "app.services.email_service.smtplib.SMTP_SSL",
        side_effect=RuntimeError("password=do-not-leak"),
    ):
        with pytest.raises(EmailDeliveryError) as caught:
            EmailService().send_message("user@example.test", "Subject", "Body")
    assert "do-not-leak" not in str(caught.value)


def test_production_config_requires_secure_smtp(monkeypatch):
    monkeypatch.setenv(
        "FLASK_DATABASE_URL",
        "postgresql://dbuser:dbpassword@db.example.test:5432/career?sslmode=require",
    )
    monkeypatch.setenv("PASSWORD_PEPPER", "p" * 40)
    monkeypatch.setenv("SECRET_KEY", "s" * 40)
    monkeypatch.setenv("FRONTEND_ORIGIN", "https://career.example.test")
    monkeypatch.setenv("MFA_ENCRYPTION_KEY", "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=")
    for name in ("SMTP_HOST", "SMTP_FROM", "SMTP_USERNAME", "SMTP_PASSWORD"):
        monkeypatch.delenv(name, raising=False)
    with pytest.raises(RuntimeError, match="SMTP"):
        ProductionConfig.validate()


def test_production_config_accepts_complete_starttls_settings(monkeypatch):
    monkeypatch.setenv(
        "FLASK_DATABASE_URL",
        "postgresql://dbuser:dbpassword@db.example.test:5432/career?sslmode=require",
    )
    monkeypatch.setenv("PASSWORD_PEPPER", "p" * 40)
    monkeypatch.setenv("SECRET_KEY", "s" * 40)
    monkeypatch.setenv("FRONTEND_ORIGIN", "https://career.example.test")
    monkeypatch.setenv("MFA_ENCRYPTION_KEY", "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=")
    monkeypatch.setenv("SMTP_HOST", "smtp.example.test")
    monkeypatch.setenv("SMTP_FROM", "no-reply@example.test")
    monkeypatch.setenv("SMTP_USERNAME", "mailer")
    monkeypatch.setenv("SMTP_PASSWORD", "a-secure-password")
    monkeypatch.setenv("SMTP_STARTTLS", "true")
    monkeypatch.setenv("SMTP_USE_SSL", "false")
    monkeypatch.setenv("RATE_LIMIT_BACKEND", "redis")
    monkeypatch.setenv("REDIS_URL", "rediss://cache.example.test:6379/0")
    ProductionConfig.validate()


def test_app_applies_dotenv_loaded_mail_and_mfa_settings(monkeypatch):
    monkeypatch.setenv("SMTP_HOST", "mailpit.test")
    monkeypatch.setenv("SMTP_PORT", "1025")
    monkeypatch.setenv("SMTP_FROM", "dev@career.test")
    monkeypatch.setenv("SMTP_STARTTLS", "false")
    monkeypatch.setenv("SMTP_USE_SSL", "false")
    monkeypatch.setenv("MFA_ENCRYPTION_KEY", "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=")
    app = create_app(config_object=TestingConfig())
    assert app.config["SMTP_HOST"] == "mailpit.test"
    assert app.config["SMTP_PORT"] == 1025
    assert app.config["SMTP_FROM"] == "dev@career.test"
    assert app.config["SMTP_STARTTLS"] is False
    assert app.config["MFA_ENCRYPTION_KEY"].startswith("YWFh")


def test_development_registration_without_mail_config_fails_before_creating_user(tmp_path):
    from app.config import DevConfig
    from app.extensions import db
    from app.models.user import User

    cfg = DevConfig()
    cfg.SQLALCHEMY_DATABASE_URI = f"sqlite:///{tmp_path / 'no-mail.db'}"
    cfg.SMTP_HOST = ""
    cfg.SMTP_FROM = ""
    app = create_app(config_object=cfg)
    with app.app_context():
        db.create_all()
    response = app.test_client().post("/api/v1/auth/register", json={
        "name": "Learner", "email": "learner@example.com",
        "password": "Password1", "confirm": "Password1",
    })
    assert response.status_code == 503
    with app.app_context():
        assert db.session.query(User).count() == 0


def test_register_sends_code_and_persists_only_keyed_hash(app, client, caplog):
    from app.extensions import db
    from app.models.user import User
    from app.services.auth_service import hash_verification_code

    response = client.post("/api/v1/auth/register", json={
        "name": "Learner", "email": "learner@example.com",
        "password": "Password1", "confirm": "Password1",
    })
    assert response.status_code == 201, response.get_json()
    message = app.extensions["test_mail_outbox"][-1]
    content = message.get_content()
    import re
    code = re.search(r"\b\d{6}\b", content).group(0)
    with app.app_context():
        user = db.session.query(User).filter_by(email="learner@example.com").one()
        assert user.otp_hash == hash_verification_code("learner@example.com", code)
        assert not hasattr(user, "otp_code")
    assert code not in "\n".join(record.getMessage() for record in caplog.records)


def test_resend_verification_uses_same_response_for_unknown_and_pending(app, client):
    before = len(app.extensions.get("test_mail_outbox", []))
    unknown = client.post("/api/v1/auth/verification/resend", json={"email": "ghost@example.com"})
    assert unknown.status_code == 200 and unknown.get_json() == {"ok": True}
    assert len(app.extensions.get("test_mail_outbox", [])) == before

    client.post("/api/v1/auth/register", json={
        "name": "Learner", "email": "learner@example.com",
        "password": "Password1", "confirm": "Password1",
    })
    resent = client.post("/api/v1/auth/verification/resend", json={"email": "learner@example.com"})
    assert resent.status_code == 200 and resent.get_json() == {"ok": True}
    assert len(app.extensions["test_mail_outbox"]) == before + 2


def test_resend_rotates_challenge_and_invalidates_previous_code(app, client):
    import re

    client.post("/api/v1/auth/register", json={
        "name": "Learner", "email": "learner@example.com",
        "password": "Password1", "confirm": "Password1",
    })
    old_code = re.search(r"\b\d{6}\b", app.extensions["test_mail_outbox"][-1].get_content()).group(0)
    client.post("/api/v1/auth/verification/resend", json={"email": "learner@example.com"})
    new_code = re.search(r"\b\d{6}\b", app.extensions["test_mail_outbox"][-1].get_content()).group(0)
    assert new_code != old_code
    old = client.post("/api/v1/auth/verify-otp", json={"email": "learner@example.com", "code": old_code})
    new = client.post("/api/v1/auth/verify-otp", json={"email": "learner@example.com", "code": new_code})
    assert old.status_code == 400
    assert new.status_code == 200
