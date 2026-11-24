"""Tests for POST /auth/login (no enumeration, throttling, success)."""
from __future__ import annotations

from tests.conftest import (
    register_and_login,
    register_payload,
    _extract_csrf_from_response,
)


class TestLogin:
    def test_abandoned_registration_has_same_login_error_as_unknown_email(self, client):
        registration = register_payload()
        response = client.post("/api/v1/auth/register", json=registration)
        assert response.status_code == 201, response.get_json()
        outbox = client.application.extensions["test_mail_outbox"]
        sent_messages = len(outbox)

        credentials = {"email": registration["email"], "password": registration["password"]}
        pending = client.post("/api/v1/auth/login", json=credentials)
        unknown = client.post("/api/v1/auth/login", json={**credentials, "email": "unknown@example.com"})

        assert pending.status_code == unknown.status_code == 401
        assert pending.get_json()["error"] == unknown.get_json()["error"]
        assert not pending.headers.getlist("Set-Cookie")
        assert len(outbox) == sent_messages

    def test_login_success_returns_user_and_cookies(self, client):
        register_and_login(client)
        r = client.post("/api/v1/auth/login", json={
            "email": "user@example.com",
            "password": "Parol1ab",
        })
        assert r.status_code == 200, r.get_json()
        body = r.get_json()
        assert body["user"]["email"] == "user@example.com"
        # cookies set
        csrf = _extract_csrf_from_response(r)
        assert csrf, "csrf cookie missing"
        assert any(
            h.startswith("session_token=") for h in r.headers.getlist("Set-Cookie")
        )

    def test_login_wrong_password_returns_401(self, client):
        register_and_login(client)
        r = client.post("/api/v1/auth/login", json={
            "email": "user@example.com",
            "password": "WrongPass1",
        })
        assert r.status_code == 401
        body = r.get_json()
        assert body["error"]["code"] == "invalid_credentials"
        # error message matches the contract
        assert body["error"]["message"] == "E-poçt və ya parol yanlışdır"

    def test_login_unknown_email_returns_same_error_as_wrong_password(self, client):
        r = client.post("/api/v1/auth/login", json={
            "email": "ghost@example.com",
            "password": "WrongPass1",
        })
        assert r.status_code == 401
        body = r.get_json()
        assert body["error"]["code"] == "invalid_credentials"
        # Identical message for non-existent email vs wrong password.
        assert body["error"]["message"] == "E-poçt və ya parol yanlışdır"

    def test_login_normalizes_email(self, client):
        register_and_login(client, email="User@Example.COM")
        r = client.post("/api/v1/auth/login", json={
            "email": "USER@example.com",
            "password": "Parol1ab",
        })
        assert r.status_code == 200, r.get_json()

    def test_login_throttling_5_attempts_then_429(self, client):
        register_and_login(client)
        bad = {"email": "user@example.com", "password": "WrongPass1"}
        # 5 failed attempts → all 401
        for i in range(5):
            r = client.post("/api/v1/auth/login", json=bad)
            assert r.status_code == 401, f"attempt {i}: {r.status_code}"
        # 6th attempt within window → 429
        r = client.post("/api/v1/auth/login", json=bad)
        assert r.status_code == 429, r.get_json()
        body = r.get_json()
        assert body["error"]["code"] == "rate_limited"
        assert "retry_after" in body["error"]["fields"]

    def test_login_success_resets_failure_counter(self, client):
        register_and_login(client)
        bad = {"email": "user@example.com", "password": "WrongPass1"}
        # 4 fails
        for _ in range(4):
            r = client.post("/api/v1/auth/login", json=bad)
            assert r.status_code == 401
        # Success — resets the counter
        r = client.post("/api/v1/auth/login", json={
            "email": "user@example.com", "password": "Parol1ab",
        })
        assert r.status_code == 200
        # 4 more fails after success — must all be 401 (counter reset)
        for _ in range(4):
            r = client.post("/api/v1/auth/login", json=bad)
            assert r.status_code == 401, r.get_json()
