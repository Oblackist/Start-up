"""Tests for authorization (IDOR): cannot read/submit another user's attempt."""
from __future__ import annotations

from tests.conftest import (
    register_payload,
    register_and_login,
)


def _start_attempt(client, csrf):
    r = client.post("/api/v1/tests", json={"subject_id": "math"},
                    headers={"X-CSRF-Token": csrf})
    assert r.status_code == 201, r.get_json()
    return r.get_json()["attempt_id"]


class TestAuthorization:
    def test_user_cannot_read_another_users_attempt(self, app, client):
        # User A registers, starts, submits an attempt.
        csrf_a, _, _ = register_and_login(client, email="a@example.com")
        aid = _start_attempt(client, csrf_a)
        submit = client.post(f"/api/v1/tests/{aid}/submit",
                              json={"answers": {"1": "A"}},
                              headers={"X-CSRF-Token": csrf_a})
        assert submit.status_code == 200, submit.get_json()

        # User B registers, tries to read A's attempt → 403 or 404.
        # We picked 403 (owner-only) for /tests/<id>.
        # Logout A first
        client.post("/api/v1/auth/logout")
        csrf_b, _, _ = register_and_login(client, email="b@example.com")
        r = client.get(f"/api/v1/tests/{aid}")
        assert r.status_code in (403, 404), r.get_json()
        # And specifically must NOT be 200
        assert r.status_code != 200
        # Body must not leak the result
        body = r.get_json()
        assert "results" not in body
        assert "score" not in body

    def test_user_cannot_submit_another_users_attempt(self, app, client):
        csrf_a, _, _ = register_and_login(client, email="a@example.com")
        aid = _start_attempt(client, csrf_a)

        client.post("/api/v1/auth/logout")
        csrf_b, _, _ = register_and_login(client, email="b@example.com")
        r = client.post(f"/api/v1/tests/{aid}/submit",
                        json={"answers": {"1": "A"}},
                        headers={"X-CSRF-Token": csrf_b})
        assert r.status_code == 403, r.get_json()
        assert r.get_json()["error"]["code"] == "forbidden"

    def test_get_nonexistent_attempt_returns_404(self, client):
        csrf, _, _ = register_and_login(client)
        r = client.get("/api/v1/tests/9999999")
        assert r.status_code == 404
        assert r.get_json()["error"]["code"] == "not_found"

    def test_submit_nonexistent_attempt_returns_404(self, client):
        csrf, _, _ = register_and_login(client)
        r = client.post("/api/v1/tests/9999999/submit",
                        json={"answers": {"1": "A"}},
                        headers={"X-CSRF-Token": csrf})
        assert r.status_code == 404

    def test_me_progress_requires_session(self, client):
        r = client.get("/api/v1/me/progress")
        assert r.status_code == 401

    def test_me_attempts_requires_session(self, client):
        r = client.get("/api/v1/me/attempts")
        assert r.status_code == 401

    def test_practice_cards_requires_session(self, client):
        r = client.get("/api/v1/practice/cards")
        assert r.status_code == 401

    def test_me_attempts_only_returns_own_attempts(self, app, client):
        # User A makes an attempt.
        csrf_a, _, _ = register_and_login(client, email="a@example.com")
        aid = _start_attempt(client, csrf_a)
        client.post(f"/api/v1/tests/{aid}/submit",
                    json={"answers": {"1": "A"}},
                    headers={"X-CSRF-Token": csrf_a})

        # User B has no attempts.
        client.post("/api/v1/auth/logout")
        register_and_login(client, email="b@example.com")
        r = client.get("/api/v1/me/attempts")
        assert r.status_code == 200
        body = r.get_json()
        # B must see zero attempts (not A's attempt)
        assert body["total"] == 0
        assert body["items"] == []
