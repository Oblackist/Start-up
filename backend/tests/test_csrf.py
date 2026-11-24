"""Tests for CSRF synchronizer token behavior."""
from __future__ import annotations

import pytest

from tests.conftest import (
    register_payload,
    register_and_login,
    _extract_csrf_from_response,
    do_csrf_post,
    get_csrf_via_endpoint,
)


class TestCsrf:
    def test_post_without_csrf_header_after_login_returns_403(self, client):
        csrf, _, _ = register_and_login(client)
        # Don't include the header → 403
        r = client.post("/api/v1/tests", json={"subject_id": "math"})
        assert r.status_code == 403, r.get_json()
        assert r.get_json()["error"]["code"] == "csrf_failed"

    def test_post_with_valid_csrf_header_passes(self, client):
        csrf, _, _ = register_and_login(client)
        # Include the right header — should NOT be a csrf error (might be 4xx
        # for other reasons but not csrf_failed).
        r = client.post("/api/v1/tests", json={"subject_id": "math"},
                        headers={"X-CSRF-Token": csrf})
        assert r.status_code != 403, r.get_json()
        assert "csrf_failed" not in str(r.get_json())

    def test_post_with_wrong_csrf_header_returns_403(self, client):
        register_and_login(client)
        r = client.post("/api/v1/tests", json={"subject_id": "math"},
                        headers={"X-CSRF-Token": "wrong-token"})
        assert r.status_code == 403
        assert r.get_json()["error"]["code"] == "csrf_failed"

    def test_get_endpoints_exempt_from_csrf(self, client):
        # GET /me without csrf header should be a clean 401 (no session), not 403 csrf
        r = client.get("/api/v1/auth/me")
        assert r.status_code == 401
        body = r.get_json()
        assert body["error"]["code"] != "csrf_failed"

    def test_change_password_requires_csrf(self, client):
        csrf, _pw, _email = register_and_login(client)
        # No CSRF → 403
        r = client.post("/api/v1/auth/change-password", json={
            "current_password": "Parol1ab",
            "new_password": "NewParol1cd",
        })
        assert r.status_code == 403
        assert r.get_json()["error"]["code"] == "csrf_failed"

    def test_change_password_succeeds_with_valid_csrf(self, client):
        csrf, _pw, _email = register_and_login(client)
        r = do_csrf_post(client, "/api/v1/auth/change-password", {
            "current_password": "Parol1ab",
            "new_password": "NewParol1cd",
        }, csrf)
        assert r.status_code == 200, r.get_json()

    def test_submit_test_requires_csrf(self, client):
        csrf, _, _ = register_and_login(client)
        # Start a test first
        start = client.post("/api/v1/tests", json={"subject_id": "math"},
                            headers={"X-CSRF-Token": csrf})
        assert start.status_code == 201, start.get_json()
        attempt_id = start.get_json()["attempt_id"]
        # Submit without csrf → 403
        r = client.post(f"/api/v1/tests/{attempt_id}/submit",
                        json={"answers": {"1": "A"}})
        assert r.status_code == 403
        assert r.get_json()["error"]["code"] == "csrf_failed"

    def test_logout_does_not_require_csrf(self, client):
        # Per the contract, logout is idempotent and doesn't strictly need
        # a csrf header. We accept it (it clears the session).
        csrf, _, _ = register_and_login(client)
        r = client.post("/api/v1/auth/logout")
        assert r.status_code == 200

    def test_password_reset_endpoints_exempt_from_csrf(self, client):
        # Reset request/confirm don't require a session/csrf (token in body).
        r = client.post("/api/v1/auth/password-reset/request",
                        json={"email": "nobody@example.com"})
        assert r.status_code == 200, r.get_json()
        # Confirm with bogus token → 400 (not 403 csrf)
        r2 = client.post("/api/v1/auth/password-reset/confirm",
                         json={"token": "x" * 30, "new_password": "NewParol1cd"})
        assert r2.status_code == 400, r2.get_json()
        assert r2.get_json()["error"]["code"] == "invalid_or_expired_token"
