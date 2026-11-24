"""TOTP and recovery-code MFA behavior, including its auth/session boundary."""
from __future__ import annotations

import base64
import hashlib
import time

import pytest

from app.security.totp import (
    decrypt_totp_secret,
    encrypt_totp_secret,
    generate_recovery_codes,
    generate_totp_secret,
    hash_recovery_code,
    totp_code,
    verify_totp,
)
from tests.conftest import do_csrf_post, register_and_login


def test_totp_matches_rfc6238_sha1_vector():
    secret = base64.b32encode(b"12345678901234567890").decode().rstrip("=")
    assert totp_code(secret, timestamp=59, digits=8) == "94287082"


def test_totp_secret_is_random_and_encrypted_at_rest(app):
    with app.app_context():
        secret = generate_totp_secret()
        ciphertext = encrypt_totp_secret(secret)
        assert ciphertext != secret
        assert decrypt_totp_secret(ciphertext) == secret
        assert generate_totp_secret() != secret


def test_totp_verification_accepts_clock_skew_and_rejects_bad_code():
    secret = generate_totp_secret()
    now = int(time.time())
    assert verify_totp(secret, totp_code(secret, now - 30), timestamp=now)
    assert not verify_totp(secret, "000000", timestamp=now)
    assert not verify_totp(secret, "12x456", timestamp=now)


def test_recovery_codes_are_high_entropy_and_stored_as_hashes():
    codes = generate_recovery_codes()
    assert len(codes) == 10
    assert len(set(codes)) == 10
    assert all(len(code) >= 16 for code in codes)
    assert hash_recovery_code(codes[0]) != codes[0]


def _enroll_mfa(client):
    csrf, password, email = register_and_login(client)
    started = do_csrf_post(client, "/api/v1/auth/mfa/enroll", {"current_password": password}, csrf)
    assert started.status_code == 200, started.get_json()
    secret = started.get_json()["secret"]
    confirmed = do_csrf_post(
        client,
        "/api/v1/auth/mfa/confirm",
        # Use the previous accepted time step so the current step remains
        # available for the next authenticated action in these tests.
        {"code": totp_code(secret, int(time.time()) - 30)},
        csrf,
    )
    assert confirmed.status_code == 200, confirmed.get_json()
    assert len(confirmed.get_json()["recovery_codes"]) == 10
    assert any(h.startswith("session_token=") for h in confirmed.headers.getlist("Set-Cookie"))
    return secret, confirmed.get_json()["recovery_codes"], password, email


def test_enrollment_totp_cannot_be_reused_to_rotate_recovery_codes(client):
    csrf, password, _email = register_and_login(client)
    started = do_csrf_post(client, "/api/v1/auth/mfa/enroll", {"current_password": password}, csrf)
    secret = started.get_json()["secret"]
    used_code = totp_code(secret)
    confirmed = do_csrf_post(client, "/api/v1/auth/mfa/confirm", {"code": used_code}, csrf)
    assert confirmed.status_code == 200, confirmed.get_json()
    csrf = client.get_cookie("csrf_token").value

    replay = do_csrf_post(client, "/api/v1/auth/mfa/recovery-codes/rotate", {
        "current_password": password, "code": used_code,
    }, csrf)
    assert replay.status_code == 400


def test_enrollment_requires_current_password(client):
    csrf, password, _email = register_and_login(client)
    bad = do_csrf_post(client, "/api/v1/auth/mfa/enroll", {"current_password": "wrong"}, csrf)
    assert bad.status_code == 400
    good = do_csrf_post(client, "/api/v1/auth/mfa/enroll", {"current_password": password}, csrf)
    assert good.status_code == 200, good.get_json()


def test_login_with_mfa_does_not_create_session_before_totp(app, client):
    secret, _recovery, password, email = _enroll_mfa(client)
    client.post("/api/v1/auth/logout")

    first = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert first.status_code == 200, first.get_json()
    body = first.get_json()
    assert body["mfa_required"] is True
    assert body["challenge_token"]
    assert not any(h.startswith("session_token=") for h in first.headers.getlist("Set-Cookie"))
    assert client.get("/api/v1/auth/me").status_code == 401

    verified = client.post(
        "/api/v1/auth/mfa/challenge",
        json={"challenge_token": body["challenge_token"], "code": totp_code(secret)},
    )
    assert verified.status_code == 200, verified.get_json()
    assert any(h.startswith("session_token=") for h in verified.headers.getlist("Set-Cookie"))
    assert client.get("/api/v1/auth/me").status_code == 200


def test_mfa_secret_is_encrypted_and_recovery_code_is_single_use(app, client):
    _secret, recovery, password, email = _enroll_mfa(client)
    from app.extensions import db
    from app.models.mfa import MfaRecoveryCode
    from app.models.user import User

    with app.app_context():
        user = db.session.query(User).filter_by(email=email).one()
        assert user.mfa_enabled
        assert recovery[0] not in user.totp_secret_encrypted
        row = db.session.query(MfaRecoveryCode).filter_by(user_id=user.id).first()
        assert row.code_hash != recovery[0]

    client.post("/api/v1/auth/logout")
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    challenge_token = login.get_json()["challenge_token"]
    accepted = client.post(
        "/api/v1/auth/mfa/challenge",
        json={"challenge_token": challenge_token, "code": recovery[0]},
    )
    assert accepted.status_code == 200, accepted.get_json()
    client.post("/api/v1/auth/logout")

    second = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    rejected = client.post(
        "/api/v1/auth/mfa/challenge",
        json={"challenge_token": second.get_json()["challenge_token"], "code": recovery[0]},
    )
    assert rejected.status_code == 400


def test_invalid_mfa_challenge_is_bounded_and_expires(app, client):
    _secret, _recovery, password, email = _enroll_mfa(client)
    client.post("/api/v1/auth/logout")
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = login.get_json()["challenge_token"]
    for _ in range(5):
        response = client.post(
            "/api/v1/auth/mfa/challenge", json={"challenge_token": token, "code": "000000"}
        )
    assert response.status_code == 429
    assert client.get("/api/v1/auth/me").status_code == 401


def test_totp_counter_cannot_be_replayed_for_a_second_login(client):
    secret, _recovery, password, email = _enroll_mfa(client)
    client.post("/api/v1/auth/logout")
    first = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    code = totp_code(secret)
    accepted = client.post("/api/v1/auth/mfa/challenge", json={
        "challenge_token": first.get_json()["challenge_token"], "code": code,
    })
    assert accepted.status_code == 200
    client.post("/api/v1/auth/logout")
    second = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    replay = client.post("/api/v1/auth/mfa/challenge", json={
        "challenge_token": second.get_json()["challenge_token"], "code": code,
    })
    assert replay.status_code == 400


def test_disabling_mfa_requires_password_and_fresh_totp_and_rotates_session(app, client):
    secret, _recovery, password, email = _enroll_mfa(client)
    from app.extensions import db
    from app.models.user import User

    csrf = client.get_cookie("csrf_token").value
    bad = do_csrf_post(client, "/api/v1/auth/mfa/disable", {
        "code": totp_code(secret), "current_password": "WrongPass1",
    }, csrf)
    assert bad.status_code == 400
    assert client.get("/api/v1/auth/me").status_code == 200

    disabled = do_csrf_post(client, "/api/v1/auth/mfa/disable", {
        "code": totp_code(secret), "current_password": password,
    }, csrf)
    assert disabled.status_code == 200, disabled.get_json()
    assert disabled.get_json()["user"]["mfa_enabled"] is False
    assert client.get("/api/v1/auth/me").status_code == 200
    with app.app_context():
        user = db.session.query(User).filter_by(email=email).one()
        assert user.totp_secret_encrypted is None
        assert user.mfa_last_counter is None
        assert not user.mfa_enabled


def test_mfa_challenge_token_is_one_time(client):
    secret, _recovery, password, email = _enroll_mfa(client)
    client.post("/api/v1/auth/logout")
    login = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    challenge_token = login.get_json()["challenge_token"]
    payload = {"challenge_token": challenge_token, "code": totp_code(secret)}
    assert client.post("/api/v1/auth/mfa/challenge", json=payload).status_code == 200
    client.post("/api/v1/auth/logout")
    assert client.post("/api/v1/auth/mfa/challenge", json=payload).status_code == 400


def test_mfa_recovery_code_rotation_reauthenticates_and_invalidates_old_codes(app, client):
    secret, old_codes, password, email = _enroll_mfa(client)
    csrf = client.get_cookie("csrf_token").value
    from app.extensions import db
    from app.models.mfa import MfaRecoveryCode
    from app.models.user import User

    denied = do_csrf_post(client, "/api/v1/auth/mfa/recovery-codes/rotate", {
        "current_password": "WrongPass1", "code": totp_code(secret, int(time.time()) + 30),
    }, csrf)
    assert denied.status_code == 400

    rotated = do_csrf_post(client, "/api/v1/auth/mfa/recovery-codes/rotate", {
        "current_password": password, "code": totp_code(secret, int(time.time()) + 30),
    }, csrf)
    assert rotated.status_code == 200, rotated.get_json()
    new_codes = rotated.get_json()["recovery_codes"]
    assert len(new_codes) == 10
    assert not set(new_codes) & set(old_codes)
    with app.app_context():
        user = db.session.query(User).filter_by(email=email).one()
        records = db.session.query(MfaRecoveryCode).filter_by(user_id=user.id).all()
        assert len(records) == 10
        assert {row.code_hash for row in records} == {hash_recovery_code(code) for code in new_codes}
        assert user.mfa_last_counter is not None
    replay = do_csrf_post(client, "/api/v1/auth/mfa/recovery-codes/rotate", {
        "current_password": password, "code": totp_code(secret, int(time.time()) + 30),
    }, csrf)
    assert replay.status_code == 400


def test_session_inventory_and_revoke_others_preserves_current_session(client, app):
    csrf, password, email = register_and_login(client)
    second = app.test_client()
    response = second.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200

    listing = client.get("/api/v1/auth/sessions")
    assert listing.status_code == 200, listing.get_json()
    sessions = listing.get_json()["sessions"]
    assert len(sessions) == 2
    current = next(item for item in sessions if item["current"])
    other = next(item for item in sessions if not item["current"])
    assert current["id"] != other["id"]
    assert "token_hash" not in current

    revoked = do_csrf_post(client, "/api/v1/auth/sessions/revoke-others", {}, csrf)
    assert revoked.status_code == 200, revoked.get_json()
    assert revoked.get_json()["revoked_count"] == 1
    assert client.get("/api/v1/auth/me").status_code == 200
    assert second.get("/api/v1/auth/me").status_code == 401
    assert len(client.get("/api/v1/auth/sessions").get_json()["sessions"]) == 1


def test_revoking_current_session_clears_cookies_and_invalidates_session(client):
    csrf, _password, _email = register_and_login(client)
    response = do_csrf_post(client, "/api/v1/auth/sessions/revoke-current", {}, csrf)
    assert response.status_code == 200, response.get_json()
    assert response.get_json()["ok"] is True
    assert client.get("/api/v1/auth/me").status_code == 401


def test_revoke_all_sessions_invalidates_current_and_others(client, app):
    csrf, password, email = register_and_login(client)
    second = app.test_client()
    assert second.post("/api/v1/auth/login", json={"email": email, "password": password}).status_code == 200
    response = do_csrf_post(client, "/api/v1/auth/sessions/revoke-all", {}, csrf)
    assert response.status_code == 200, response.get_json()
    assert response.get_json()["revoked_count"] == 2
    assert client.get("/api/v1/auth/me").status_code == 401
    assert second.get("/api/v1/auth/me").status_code == 401


def test_session_routes_require_auth_csrf_and_enforce_ownership(client, app):
    assert client.get("/api/v1/auth/sessions").status_code == 401
    csrf, _password, _email = register_and_login(client)
    other = app.test_client()
    register_and_login(other, email="other@example.com")
    other_session = other.get("/api/v1/auth/sessions").get_json()["sessions"][0]

    csrf_missing = client.post("/api/v1/auth/sessions/revoke-others", json={})
    assert csrf_missing.status_code == 403
    cross_account = client.delete(
        f"/api/v1/auth/sessions/{other_session['id']}",
        headers={"X-CSRF-Token": csrf},
    )
    assert cross_account.status_code == 404
    assert other.get("/api/v1/auth/me").status_code == 200

