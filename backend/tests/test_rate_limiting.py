"""Tests for in-memory rate limiting."""
from __future__ import annotations

from tests.conftest import register_payload, register_and_login


class TestRateLimiting:
    def test_login_throttle_after_5_failures_returns_429(self, client):
        register_and_login(client)
        bad = {"email": "user@example.com", "password": "WrongPass1"}
        for _ in range(5):
            r = client.post("/api/v1/auth/login", json=bad)
            assert r.status_code == 401
        r = client.post("/api/v1/auth/login", json=bad)
        assert r.status_code == 429
        body = r.get_json()
        assert body["error"]["code"] == "rate_limited"
        assert body["error"]["fields"]["retry_after"] > 0

    def test_register_throttle_after_5_attempts_returns_429(self, client):
        payload = register_payload(email="user@example.com")
        # First registration succeeds; subsequent duplicates return 409 but
        # still count toward the rate-limit bucket.
        r1 = client.post("/api/v1/auth/register", json=payload)
        assert r1.status_code == 201
        for i in range(4):
            r = client.post("/api/v1/auth/register", json=payload)
            assert r.status_code == 409, f"attempt {i}: {r.status_code}"
        # 6th attempt within window → 429
        r = client.post("/api/v1/auth/register", json=payload)
        assert r.status_code == 429

    def test_password_reset_throttle_after_3_returns_429(self, client):
        for i in range(3):
            r = client.post("/api/v1/auth/password-reset/request",
                            json={"email": "nobody@example.com"})
            assert r.status_code == 200, f"attempt {i}: {r.status_code}"
        # 4th attempt within window → 429
        r = client.post("/api/v1/auth/password-reset/request",
                        json={"email": "nobody@example.com"})
        assert r.status_code == 429
        assert r.get_json()["error"]["code"] == "rate_limited"

    def test_rate_limit_per_ip_email_not_global(self, client):
        # 5 bad logins for user1@example.com should NOT block user2@example.com.
        register_and_login(client, email="user1@example.com")
        for _ in range(5):
            client.post("/api/v1/auth/login", json={
                "email": "user1@example.com", "password": "WrongPass1",
            })
        # user2 has not been touched
        register_and_login(client, email="user2@example.com")
        r = client.post("/api/v1/auth/login", json={
            "email": "user2@example.com", "password": "Parol1ab",
        })
        assert r.status_code == 200, r.get_json()

    def test_rate_limit_audited(self, app, client):
        from app.extensions import db
        from app.models.audit import AuditLog
        register_and_login(client)
        bad = {"email": "user@example.com", "password": "WrongPass1"}
        for _ in range(5):
            client.post("/api/v1/auth/login", json=bad)
        # 6th triggers 429 + audit_log entry
        client.post("/api/v1/auth/login", json=bad)
        with app.app_context():
            hits = db.session.query(AuditLog).filter(
                AuditLog.action == "rate_limit_hit"
            ).count()
            assert hits >= 1, "rate_limit_hit must be audited"
