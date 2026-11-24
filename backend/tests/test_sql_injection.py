"""Tests for SQL-injection resistance (ORM-only, parameterized)."""
from __future__ import annotations

from tests.conftest import register_payload, register_and_login


class TestSqlInjection:
    def test_login_email_with_sql_syntax_is_safe(self, client):
        client.post("/api/v1/auth/register", json=register_payload())
        # Classic tautology string — should NOT bypass authentication.
        r = client.post("/api/v1/auth/login", json={
            "email": "' OR '1'='1",
            "password": "anything",
        })
        assert r.status_code == 400  # bad email format
        # Slightly more email-shaped string:
        r = client.post("/api/v1/auth/login", json={
            "email": "' OR '1'='1' -- @example.com",
            "password": "anything",
        })
        assert r.status_code in (400, 401)

    def test_register_email_with_quote_safe(self, client):
        p = register_payload()
        p["email"] = "a'b@example.com"
        r = client.post("/api/v1/auth/register", json=p)
        # Email regex doesn't allow quotes; either 400 (good) or 201 if regex
        # is permissive. Either way, no SQL error should surface.
        assert r.status_code in (201, 400)
        # Verify no error message leaks SQL/traceback
        if r.status_code != 201:
            body = r.get_json()
            assert "sqlite" not in str(body).lower()
            assert "traceback" not in str(body).lower()

    def test_subjects_id_with_sql_does_not_break(self, client):
        # Try a path with classic SQLi payload — must not raise 500.
        r = client.get("/api/v1/subjects/' OR '1'='1")
        # Werkzeug will likely 404 — that's fine; we just verify no 500 leak.
        assert r.status_code != 500
        body = r.get_json()
        assert "sqlite" not in str(body).lower()

    def test_tests_endpoint_with_sql_in_path(self, client):
        csrf, _, _ = register_and_login(client)
        r = client.post("/api/v1/tests/1' OR '1'='1/submit",
                        json={"answers": {"1": "A"}},
                        headers={"X-CSRF-Token": csrf})
        # Werkzeug 404 for non-int attempt_id is fine; no 500 leak.
        assert r.status_code != 500

    def test_register_email_normalization_no_drop(self, client):
        # Whitespace should be stripped (not stored verbatim).
        client.post("/api/v1/auth/register",
                     json=register_payload(email="user@example.com"))
        # Attempt to register with trailing whitespace → must not create a
        # second user via case/whitespace trick.
        r = client.post("/api/v1/auth/register",
                        json=register_payload(email=" user@example.com "))
        assert r.status_code in (409, 400)  # 409 (dup) or 400 (regex reject)
        # Verify only ONE user exists in DB
        from app.extensions import db
        from app.models.user import User
        with client.application.app_context():
            count = db.session.query(User).filter(
                User.email.like("%user@example.com%")
            ).count()
            assert count == 1, f"expected exactly 1 user, got {count}"
