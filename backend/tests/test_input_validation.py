"""Tests for input validation (marshmallow schemas, strict)."""
from __future__ import annotations

import pytest

from tests.conftest import register_payload


class TestInputValidation:
    def test_register_name_too_long(self, client):
        p = register_payload()
        p["name"] = "A" * 81
        r = client.post("/api/v1/auth/register", json=p)
        assert r.status_code == 400

    def test_register_name_empty(self, client):
        p = register_payload()
        p["name"] = "   "
        r = client.post("/api/v1/auth/register", json=p)
        assert r.status_code == 400

    def test_register_invalid_email_format(self, client):
        p = register_payload()
        p["email"] = "not-an-email"
        r = client.post("/api/v1/auth/register", json=p)
        assert r.status_code == 400

    def test_register_email_with_internal_space(self, client):
        p = register_payload()
        p["email"] = "user @example.com"
        r = client.post("/api/v1/auth/register", json=p)
        assert r.status_code == 400

    def test_register_password_min_boundary_8_chars_ok(self, client):
        p = register_payload()
        p["password"] = "Abcdef12"  # 8 chars, has letter+digit
        p["confirm"] = p["password"]
        r = client.post("/api/v1/auth/register", json=p)
        assert r.status_code == 201, r.get_json()

    def test_register_password_max_boundary_72_chars_ok(self, client):
        p = register_payload()
        p["password"] = "A1" + "b" * 70  # 72 chars
        p["confirm"] = p["password"]
        r = client.post("/api/v1/auth/register", json=p)
        assert r.status_code == 201, r.get_json()

    def test_register_password_73_chars_rejected(self, client):
        p = register_payload()
        p["password"] = "A1" + "b" * 71  # 73 chars
        p["confirm"] = p["password"]
        r = client.post("/api/v1/auth/register", json=p)
        assert r.status_code == 400

    def test_create_test_invalid_subject(self, client):
        from tests.conftest import register_and_login, do_csrf_post
        csrf, _, _ = register_and_login(client)
        # subject_id that doesn't exist → 404
        r = client.post("/api/v1/tests", json={"subject_id": "nonexistent"},
                        headers={"X-CSRF-Token": csrf})
        assert r.status_code == 404

    def test_create_test_missing_subject(self, client):
        from tests.conftest import register_and_login
        csrf, _, _ = register_and_login(client)
        r = client.post("/api/v1/tests", json={},
                        headers={"X-CSRF-Token": csrf})
        assert r.status_code == 400

    def test_create_test_with_invalid_topic(self, client):
        from tests.conftest import register_and_login
        csrf, _, _ = register_and_login(client)
        r = client.post("/api/v1/tests",
                        json={"subject_id": "math", "topic_id": "zzz"},
                        headers={"X-CSRF-Token": csrf})
        assert r.status_code == 404

    def test_submit_test_bad_answer_keys(self, client):
        from tests.conftest import register_and_login, do_csrf_post
        csrf, _, _ = register_and_login(client)
        start = client.post("/api/v1/tests", json={"subject_id": "math"},
                            headers={"X-CSRF-Token": csrf})
        attempt_id = start.get_json()["attempt_id"]
        # Non-numeric key → 400
        r = client.post(f"/api/v1/tests/{attempt_id}/submit",
                        json={"answers": {"not-a-number": "A"}},
                        headers={"X-CSRF-Token": csrf})
        assert r.status_code == 400

    def test_register_content_type_must_be_json(self, client):
        # Flask's get_json(force=True, silent=True) accepts anything; we
        # validate body shape, so an empty body returns 400.
        r = client.post("/api/v1/auth/register", data="hello", content_type="text/plain")
        assert r.status_code == 400

    def test_login_extra_field_rejected(self, client):
        client.post("/api/v1/auth/register", json=register_payload())
        r = client.post("/api/v1/auth/login", json={
            "email": "user@example.com",
            "password": "Parol1ab",
            "extra": "ignored",
        })
        # Contract §4: reject unknown fields.
        assert r.status_code == 400
        assert r.get_json()["error"]["code"] == "validation_failed"
