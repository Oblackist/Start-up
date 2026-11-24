"""Tests for error handling — never leak secrets/tracebacks/SQL."""
from __future__ import annotations

from tests.conftest import register_payload, register_and_login


class TestErrorHandling:
    def test_404_returns_envelope(self, client):
        r = client.get("/api/v1/subjects/nonexistent")
        assert r.status_code == 404
        body = r.get_json()
        assert "error" in body
        assert "code" in body["error"]
        assert "message" in body["error"]

    def test_400_validation_envelope(self, client):
        r = client.post("/api/v1/auth/register", json={})
        assert r.status_code == 400
        body = r.get_json()
        assert "error" in body
        assert body["error"]["code"] == "validation_failed"
        assert "message" in body["error"]

    def test_401_envelope(self, client):
        r = client.get("/api/v1/auth/me")
        assert r.status_code == 401
        body = r.get_json()
        assert body["error"]["code"] == "unauthorized"

    def test_500_no_traceback_no_sql(self, app, client):
        # Force an unhandled exception by monkey-patching the Flask view
        # function directly. Flask stores the registered function in
        # `app.view_functions` keyed by endpoint name.
        endpoint = "subjects.list_subjects"
        original = app.view_functions.get(endpoint)

        def boom():
            raise RuntimeError("DB connection string is sqlite:///etc/passwd "
                               "with secret=abc123")

        app.view_functions[endpoint] = boom
        try:
            r = client.get("/api/v1/subjects")
            assert r.status_code == 500, r.get_json()
            body = r.get_json()
            assert body["error"]["code"] == "internal_error"
            body_str = str(body).lower()
            assert "traceback" not in body_str
            assert "sqlite" not in body_str
            assert "passwd" not in body_str
            assert "runtimeerror" not in body_str
            assert "secret" not in body_str
        finally:
            if original is not None:
                app.view_functions[endpoint] = original

    def test_login_failure_no_leak(self, client):
        r = client.post("/api/v1/auth/login", json={
            "email": "ghost@example.com", "password": "WrongPass1",
        })
        assert r.status_code == 401
        body = r.get_json()
        # Message must be the same regardless of whether email exists.
        assert body["error"]["message"] == "E-poçt və ya parol yanlışdır"
        # No password_hash, no pepper, no token anywhere in the response
        body_str = str(body).lower()
        assert "password_hash" not in body_str
        assert "pepper" not in body_str
        assert "token" not in body_str

    def test_register_response_no_secret_fields(self, client):
        r = client.post("/api/v1/auth/register", json=register_payload())
        body = r.get_json()
        user = body.get("user") or body
        assert "password_hash" not in user
        assert "pepper" not in user
        assert "session_token" not in user
        assert "csrf_token" not in user

    def test_unknown_route_returns_404_envelope(self, client):
        r = client.get("/api/v1/nope")
        assert r.status_code == 404

    def test_method_not_allowed(self, client):
        # DELETE on /auth/me should not be allowed
        r = client.delete("/api/v1/auth/me")
        assert r.status_code in (404, 405)

    def test_request_body_too_large(self, client):
        # MAX_CONTENT_LENGTH = 1 MiB. Send a 2 MiB body to /auth/register.
        big = {"name": "x" * (1024 * 1024 * 2)}
        r = client.post("/api/v1/auth/register", json=big)
        # Either 400 (body cap) or 413
        assert r.status_code in (400, 413)
