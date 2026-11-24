"""Re-authentication and session revocation for account security changes."""
from __future__ import annotations

import re
import time

from tests.conftest import do_csrf_post, register_and_login
from app.security.totp import totp_code


def test_profile_edits_require_current_password(client):
    csrf, password, _email = register_and_login(client)

    missing = client.put("/api/v1/user/profile", json={"name": "New Name"},
                         headers={"X-CSRF-Token": csrf})
    assert missing.status_code == 400

    wrong = client.put("/api/v1/user/profile", json={
        "name": "New Name", "current_password": "WrongPass1",
    }, headers={"X-CSRF-Token": csrf})
    assert wrong.status_code == 400
    assert wrong.get_json()["error"]["code"] == "invalid_current_password"

    accepted = client.put("/api/v1/user/profile", json={
        "name": "New Name", "current_password": password,
    }, headers={"X-CSRF-Token": csrf})
    assert accepted.status_code == 200, accepted.get_json()
    assert client.get("/api/v1/auth/me").get_json()["user"]["name"] == "New Name"


def test_changing_password_revokes_other_sessions_but_keeps_rotated_current(client, app):
    csrf, password, email = register_and_login(client)
    other = app.test_client()
    assert other.post("/api/v1/auth/login", json={"email": email, "password": password}).status_code == 200

    changed = do_csrf_post(client, "/api/v1/auth/change-password", {
        "current_password": password, "new_password": "NewPassword2",
    }, csrf)
    assert changed.status_code == 200, changed.get_json()
    assert client.get("/api/v1/auth/me").status_code == 200
    assert other.get("/api/v1/auth/me").status_code == 401
    assert len(client.get("/api/v1/auth/sessions").get_json()["sessions"]) == 1


def test_email_change_requires_password_and_revokes_other_sessions(client, app):
    csrf, password, email = register_and_login(client)
    other = app.test_client()
    assert other.post("/api/v1/auth/login", json={"email": email, "password": password}).status_code == 200
    new_email = "updated@example.com"

    wrong = client.put("/api/v1/user/profile", json={
        "email": new_email, "current_password": "WrongPass1",
    }, headers={"X-CSRF-Token": csrf})
    assert wrong.status_code == 400

    requested = client.put("/api/v1/user/profile", json={
        "email": new_email, "current_password": password,
    }, headers={"X-CSRF-Token": csrf})
    assert requested.status_code == 200, requested.get_json()
    outbox = client.application.extensions["test_mail_outbox"]
    match = re.search(r"\b\d{6}\b", outbox[-1].get_content())
    assert match
    verified = client.post("/api/v1/user/profile/verify-otp", json={
        "email": new_email, "code": match.group(0),
    }, headers={"X-CSRF-Token": client.get_cookie("csrf_token").value})
    assert verified.status_code == 200, verified.get_json()
    assert verified.get_json()["user"]["email"] == new_email
    assert client.get("/api/v1/auth/me").status_code == 200
    assert other.get("/api/v1/auth/me").status_code == 401


def test_mfa_protected_profile_edit_requires_fresh_password_and_totp(client):
    from tests.test_mfa import _enroll_mfa

    secret, _recovery, password, _email = _enroll_mfa(client)
    csrf = client.get_cookie("csrf_token").value
    missing = client.put("/api/v1/user/profile", json={
        "name": "Protected Name", "current_password": password,
    }, headers={"X-CSRF-Token": csrf})
    assert missing.status_code == 400

    code = totp_code(secret, int(time.time()) + 30)
    accepted = client.put("/api/v1/user/profile", json={
        "name": "Protected Name", "current_password": password, "mfa_code": code,
    }, headers={"X-CSRF-Token": csrf})
    assert accepted.status_code == 200, accepted.get_json()

    replay = client.put("/api/v1/user/profile", json={
        "name": "Another Name", "current_password": password, "mfa_code": code,
    }, headers={"X-CSRF-Token": csrf})
    assert replay.status_code == 400
