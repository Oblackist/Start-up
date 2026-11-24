"""Tests for POST /auth/register."""
from __future__ import annotations

from tests.conftest import register_payload


class TestRegister:
    def test_register_creates_pending_user_without_session_cookies(self, client):
        r = client.post("/api/v1/auth/register", json=register_payload())
        assert r.status_code == 201, r.get_json()
        body = r.get_json()
        assert body["user"]["email"] == "user@example.com"
        assert body["requires_verification"] is True
        assert not any(h.startswith("session_token=") for h in r.headers.getlist("Set-Cookie"))
        assert not any(h.startswith("csrf_token=") for h in r.headers.getlist("Set-Cookie"))

    def test_verification_issues_session_and_rejects_replay(self, app, client):
        import re

        client.post("/api/v1/auth/register", json=register_payload())
        code = re.search(r"\b\d{6}\b", app.extensions["test_mail_outbox"][-1].get_content()).group(0)
        verified = client.post("/api/v1/auth/verify-otp", json={
            "email": "user@example.com", "code": code,
        })
        assert verified.status_code == 200, verified.get_json()
        assert any(h.startswith("session_token=") for h in verified.headers.getlist("Set-Cookie"))
        assert client.get("/api/v1/auth/me").status_code == 200

        replay = client.post("/api/v1/auth/verify-otp", json={
            "email": "user@example.com", "code": code,
        })
        assert replay.status_code == 400
        assert client.get("/api/v1/auth/me").status_code == 200

    def test_register_email_normalized_lowercased(self, client):
        r = client.post(
            "/api/v1/auth/register",
            json=register_payload(email="User.Name@Example.COM", name="Test"),
        )
        assert r.status_code == 201, r.get_json()
        body = r.get_json()
        user = body.get("user") or body
        assert user["email"] == "user.name@example.com"

    def test_register_accepts_custom_email_domain(self, client):
        r = client.post("/api/v1/auth/register", json=register_payload(email="learner@school.edu"))
        assert r.status_code == 201, r.get_json()
        assert r.get_json()["user"]["email"] == "learner@school.edu"

    def test_register_duplicate_email_returns_409(self, client):
        # First registration succeeds
        r1 = client.post("/api/v1/auth/register", json=register_payload())
        assert r1.status_code == 201
        # Second registration with the same (normalized) email → 409
        r2 = client.post("/api/v1/auth/register", json=register_payload())
        assert r2.status_code == 409, r2.get_json()
        assert r2.get_json()["error"]["code"] == "email_exists"

    def test_register_short_password_rejected(self, client):
        p = register_payload()
        p["password"] = "Ab1"
        p["confirm"] = "Ab1"
        r = client.post("/api/v1/auth/register", json=p)
        assert r.status_code == 400, r.get_json()
        assert r.get_json()["error"]["code"] == "validation_failed"

    def test_register_password_no_letter_rejected(self, client):
        p = register_payload()
        p["password"] = "12345678"
        p["confirm"] = "12345678"
        r = client.post("/api/v1/auth/register", json=p)
        assert r.status_code == 400, r.get_json()
        assert r.get_json()["error"]["code"] == "validation_failed"

    def test_register_password_no_digit_rejected(self, client):
        p = register_payload()
        p["password"] = "AbcdEfgh"
        p["confirm"] = "AbcdEfgh"
        r = client.post("/api/v1/auth/register", json=p)
        assert r.status_code == 400, r.get_json()
        assert r.get_json()["error"]["code"] == "validation_failed"

    def test_register_password_too_long_rejected(self, client):
        p = register_payload()
        p["password"] = "Ab1" + "x" * 100
        p["confirm"] = p["password"]
        r = client.post("/api/v1/auth/register", json=p)
        assert r.status_code == 400, r.get_json()

    def test_register_confirm_mismatch_rejected(self, client):
        p = register_payload()
        p["confirm"] = "OtherPass1"
        r = client.post("/api/v1/auth/register", json=p)
        assert r.status_code == 400, r.get_json()

    def test_register_unknown_field_rejected(self, client):
        p = register_payload()
        p["admin"] = True
        r = client.post("/api/v1/auth/register", json=p)
        assert r.status_code == 400
        assert r.get_json()["error"]["code"] == "validation_failed"

    def test_register_missing_fields_rejected(self, client):
        r = client.post("/api/v1/auth/register", json={})
        assert r.status_code == 400, r.get_json()

    def test_register_response_shape(self, client):
        r = client.post("/api/v1/auth/register", json=register_payload())
        body = r.get_json()
        user = body.get("user") or body
        for k in ("id", "name", "email", "created_at", "last_login_at"):
            assert k in user, f"missing key {k} in user"
        # password_hash must NEVER appear
        assert "password_hash" not in user
        assert "pepper" not in user
