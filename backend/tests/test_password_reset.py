"""Tests for password reset (token expiry + single-use)."""
from __future__ import annotations

import datetime as _dt
import hashlib
from unittest.mock import patch

import pytest

from tests.conftest import register_and_login


def _request_reset_token(client, email):
    """Trigger reset with a deterministic test token; never scrape logs."""
    token = "unit-test-reset-token-0123456789"
    with patch("app.services.auth_service.secrets.token_urlsafe", return_value=token):
        r = client.post("/api/v1/auth/password-reset/request", json={"email": email})
        assert r.status_code == 200
    return token


class TestPasswordReset:
    def test_reset_confirmation_is_rate_limited_by_ip(self, app, client):
        app.config["RATE_LIMIT_RESET_CONFIRM_MAX"] = 2
        payload = {"token": "x" * 50, "new_password": "NewParol1cd"}
        assert client.post("/api/v1/auth/password-reset/confirm", json=payload).status_code == 400
        assert client.post("/api/v1/auth/password-reset/confirm", json=payload).status_code == 400
        limited = client.post("/api/v1/auth/password-reset/confirm", json=payload)
        assert limited.status_code == 429

    def test_reset_preflight_does_not_consume_post_rate_limit(self, app, client):
        app.config["RATE_LIMIT_RESET_CONFIRM_MAX"] = 1
        url = "/api/v1/auth/password-reset/confirm"
        assert client.options(url).status_code == 204
        assert client.options(url).status_code == 204
        payload = {"token": "x" * 50, "new_password": "NewParol1cd"}
        assert client.post(url, json=payload).status_code == 400
        assert client.post(url, json=payload).status_code == 429

    def test_profile_email_challenge_is_rate_limited(self, app, client):
        csrf, _password, email = register_and_login(client)
        app.config["RATE_LIMIT_PROFILE_EMAIL_VERIFY_MAX"] = 2
        payload = {"email": email, "code": "000000"}
        assert client.post("/api/v1/user/profile/verify-otp", json=payload,
                           headers={"X-CSRF-Token": csrf}).status_code == 400
        assert client.post("/api/v1/user/profile/verify-otp", json=payload,
                           headers={"X-CSRF-Token": csrf}).status_code == 400
        limited = client.post("/api/v1/user/profile/verify-otp", json=payload,
                              headers={"X-CSRF-Token": csrf})
        assert limited.status_code == 429

    def test_reset_request_returns_ok_even_for_unknown_email(self, client):
        r = client.post("/api/v1/auth/password-reset/request",
                        json={"email": "ghost@example.com"})
        assert r.status_code == 200, r.get_json()
        assert r.get_json() == {"ok": True}

    def test_reset_request_creates_token_for_existing_user(self, app, client, caplog):
        register_and_login(client)
        token = _request_reset_token(client, "user@example.com")
        assert token
        email = app.extensions["test_mail_outbox"][-1].get_content()
        assert token in email
        assert "http://localhost:5173/reset-password#token=" in email
        assert token not in "\n".join(record.getMessage() for record in caplog.records)
        # Verify a token row exists in the DB
        from app.extensions import db
        from app.models.user import PasswordResetToken
        with app.app_context():
            row = db.session.query(PasswordResetToken).one()
            assert row.token_hash == hashlib.sha256(token.encode()).hexdigest()

    def test_reset_confirm_with_valid_token_changes_password(self, app, client):
        register_and_login(client)
        token = _request_reset_token(client, "user@example.com")
        r = client.post("/api/v1/auth/password-reset/confirm", json={
            "token": token,
            "new_password": "NewParol1cd",
        })
        assert r.status_code == 200, r.get_json()
        # Old password must no longer work
        login = client.post("/api/v1/auth/login", json={
            "email": "user@example.com", "password": "Parol1ab",
        })
        assert login.status_code == 401
        # New password must work
        login = client.post("/api/v1/auth/login", json={
            "email": "user@example.com", "password": "NewParol1cd",
        })
        assert login.status_code == 200

    def test_reset_confirm_invalid_token_returns_400(self, client):
        r = client.post("/api/v1/auth/password-reset/confirm", json={
            "token": "x" * 50,
            "new_password": "NewParol1cd",
        })
        assert r.status_code == 400
        assert r.get_json()["error"]["code"] == "invalid_or_expired_token"

    def test_reset_confirm_used_token_cannot_be_reused(self, app, client):
        register_and_login(client)
        token = _request_reset_token(client, "user@example.com")
        # First use succeeds
        r1 = client.post("/api/v1/auth/password-reset/confirm", json={
            "token": token, "new_password": "NewParol1cd",
        })
        assert r1.status_code == 200
        # Second use with same token fails
        r2 = client.post("/api/v1/auth/password-reset/confirm", json={
            "token": token, "new_password": "Another1ef",
        })
        assert r2.status_code == 400
        assert r2.get_json()["error"]["code"] == "invalid_or_expired_token"

    def test_reset_confirm_expired_token_returns_400(self, app, client):
        register_and_login(client)
        token = _request_reset_token(client, "user@example.com")
        # Force-expire the row in DB
        with app.app_context():
            from app.extensions import db
            from app.models.user import PasswordResetToken
            row = db.session.query(PasswordResetToken).first()
            row.expires_at = _dt.datetime.now(_dt.timezone.utc) - _dt.timedelta(minutes=1)
            db.session.commit()
        r = client.post("/api/v1/auth/password-reset/confirm", json={
            "token": token, "new_password": "NewParol1cd",
        })
        assert r.status_code == 400
        assert r.get_json()["error"]["code"] == "invalid_or_expired_token"

    def test_reset_confirm_invalidates_all_sessions(self, app, client):
        # The helper completes email verification and establishes a session.
        register_and_login(client)
        # Request + confirm a reset
        token = _request_reset_token(client, "user@example.com")
        r = client.post("/api/v1/auth/password-reset/confirm", json={
            "token": token, "new_password": "NewParol1cd",
        })
        assert r.status_code == 200
        # Old session cookie must no longer work
        me = client.get("/api/v1/auth/me")
        assert me.status_code == 401

    def test_reset_request_throttled_per_ip(self, app, client):
        # 3 requests → 200; 4th → 429
        for i in range(3):
            r = client.post("/api/v1/auth/password-reset/request",
                            json={"email": "nobody@example.com"})
            assert r.status_code == 200, f"attempt {i}: {r.status_code}"
        r = client.post("/api/v1/auth/password-reset/request",
                        json={"email": "nobody@example.com"})
        assert r.status_code == 429
