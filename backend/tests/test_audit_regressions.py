"""Regressions for the November account-lifecycle security review."""
import datetime as dt
import hashlib
import re
import time
import threading
from concurrent.futures import ThreadPoolExecutor

import pytest
from sqlalchemy import update
from sqlalchemy.orm import Session as IndependentSession

from app.extensions import db
from app.models.mfa import MfaChallenge
from app.models.user import PasswordResetToken, Session, User
from app.security.totp import totp_code
from app.services.auth_service import auth_service
from app.utils.errors import ApiError
from tests.conftest import register_and_login, register_payload
from tests.test_mfa import _enroll_mfa


@pytest.fixture(autouse=True)
def stable_totp_clock(monkeypatch):
    # Enrollment deliberately uses the previous accepted time step. Freeze the
    # clock per test so a 30-second rollover cannot invalidate that setup.
    timestamp = time.time()
    monkeypatch.setattr(time, "time", lambda: timestamp)


def test_email_verification_budget_survives_ip_rotation(app, client):
    email = "verification-budget@example.com"
    assert client.post("/api/v1/auth/register", json=register_payload(email=email)).status_code == 201
    correct = re.search(r"\b\d{6}\b", app.extensions["test_mail_outbox"][-1].get_content()).group()
    wrong = "111111" if correct != "111111" else "222222"
    for index in range(5):
        response = client.post("/api/v1/auth/verify-otp", json={"email": email, "code": wrong},
                               environ_overrides={"REMOTE_ADDR": f"192.0.2.{index + 1}"})
        assert response.status_code == 400
    rejected = client.post("/api/v1/auth/verify-otp", json={"email": email, "code": correct},
                           environ_overrides={"REMOTE_ADDR": "192.0.2.99"})
    assert rejected.status_code == 429
    assert client.get_cookie("session_token") is None


def test_registration_budget_survives_email_rotation(app, client):
    app.config["RATE_LIMIT_REGISTER_MAX"] = 2
    for index in range(2):
        assert client.post("/api/v1/auth/register", json=register_payload(
            email=f"pending-{index}@example.com")).status_code == 201
    rejected = client.post("/api/v1/auth/register", json=register_payload(email="pending-third@example.com"))
    assert rejected.status_code == 429
    with app.app_context():
        assert db.session.query(User).count() == 2
    assert len(app.extensions["test_mail_outbox"]) == 2


def test_reset_consumes_sibling_links_and_pending_mfa(app, client):
    _secret, _codes, password, email = _enroll_mfa(client)
    client.post("/api/v1/auth/logout")
    token = client.post("/api/v1/auth/login", json={"email": email, "password": password}).get_json()["challenge_token"]
    for _ in range(2):
        assert client.post("/api/v1/auth/password-reset/request", json={"email": email}).status_code == 200
    messages = app.extensions["test_mail_outbox"][-2:]
    links = [re.search(r"#token=([A-Za-z0-9_-]+)", message.get_content()).group(1) for message in messages]
    assert links[0] != links[1]
    first = client.post("/api/v1/auth/password-reset/confirm", json={"token": links[0], "new_password": "NewSecure1ab"})
    assert first.status_code == 200
    sibling = client.post("/api/v1/auth/password-reset/confirm", json={"token": links[1], "new_password": "StolenLink1ab"})
    assert sibling.status_code == 400
    with app.app_context():
        assert db.session.query(PasswordResetToken).filter_by(used_at=None).count() == 0
        assert db.session.query(MfaChallenge).filter_by(challenge_hash=hashlib.sha256(token.encode()).hexdigest()).one().consumed_at is not None


@pytest.mark.parametrize("changed", ["consumed", "attempts", "counter"])
def test_mfa_cannot_trust_a_stale_security_snapshot(app, client, changed):
    secret, _codes, password, email = _enroll_mfa(client)
    client.post("/api/v1/auth/logout")
    token = client.post("/api/v1/auth/login", json={"email": email, "password": password}).get_json()["challenge_token"]
    now = dt.datetime.now(dt.timezone.utc)
    code = totp_code(secret, int(time.time()))
    with app.app_context():
        # Retain the objects another in-flight request might have loaded before
        # a competing transaction changed the proof/challenge state.
        challenge = db.session.query(MfaChallenge).filter_by(challenge_hash=hashlib.sha256(token.encode()).hexdigest()).one()
        user = db.session.get(User, challenge.user_id)
        with IndependentSession(db.engine) as competitor:
            if changed == "counter":
                competitor.execute(update(User).where(User.id == user.id).values(mfa_last_counter=int(time.time()) // 30))
            else:
                values = {"consumed_at": now} if changed == "consumed" else {"attempts": 5}
                competitor.execute(update(MfaChallenge).where(MfaChallenge.id == challenge.id).values(**values))
            competitor.commit()
        with app.test_request_context("/api/v1/auth/mfa/challenge", method="POST"):
            with pytest.raises(ApiError):
                auth_service.mfa_challenge({"challenge_token": token, "code": code})
        db.session.expire_all()
        assert db.session.query(Session).count() == 0
        if changed == "attempts":
            assert db.session.get(MfaChallenge, challenge.id).attempts == 5


def test_legacy_captcha_expires(monkeypatch):
    from app.services import captcha_service as service
    service.captcha_store.clear()
    monkeypatch.setattr(service, "generate_random_code", lambda: "ABCDE")
    monkeypatch.setattr(time, "monotonic", lambda: 1000.0)
    key, _ = service.create_captcha()
    monkeypatch.setattr(time, "monotonic", lambda: 1401.0)
    try:
        assert service.verify_captcha(key, "ABCDE") is False
    finally:
        service.captcha_store.clear()


def test_legacy_captcha_store_evicts_oldest_at_capacity(monkeypatch):
    from app.services import captcha_service as service
    service.captcha_store.clear()
    monkeypatch.setattr(service, "MAX_CAPTCHA_ENTRIES", 3, raising=False)
    monkeypatch.setattr(service, "generate_random_code", lambda: "ABCDE")
    keys = [service.create_captcha()[0] for _ in range(4)]
    try:
        assert service.verify_captcha(keys[0], "ABCDE") is False
        assert service.verify_captcha(keys[-1], "ABCDE") is True
        assert service.verify_captcha(keys[-1], "ABCDE") is False
    finally:
        service.captcha_store.clear()


@pytest.mark.parametrize("proof", ["totp", "recovery", "invalid"])
def test_parallel_mfa_requests_consume_proof_or_attempt_budget_once(app, client, proof):
    secret, codes, password, email = _enroll_mfa(client)
    client.post("/api/v1/auth/logout")
    token = client.post("/api/v1/auth/login", json={"email": email, "password": password}).get_json()["challenge_token"]
    code = {"totp": totp_code(secret), "recovery": codes[0], "invalid": "ZZZZ-ZZZZ-ZZZZ-ZZZZ"}[proof]
    barrier = threading.Barrier(8)

    def submit(index):
        with app.test_client() as worker:
            barrier.wait(timeout=10)
            return worker.post("/api/v1/auth/mfa/challenge", json={"challenge_token": token, "code": code},
                               environ_overrides={"REMOTE_ADDR": f"192.0.2.{index + 1}"}).status_code

    with ThreadPoolExecutor(max_workers=8) as pool:
        statuses = list(pool.map(submit, range(8)))
    with app.app_context():
        challenge = db.session.query(MfaChallenge).filter_by(challenge_hash=hashlib.sha256(token.encode()).hexdigest()).one()
        if proof == "invalid":
            assert set(statuses) <= {400, 429}
            assert challenge.attempts == 5
            assert db.session.query(Session).count() == 0
        else:
            assert statuses.count(200) == 1
            assert statuses.count(400) == 7
            assert db.session.query(Session).count() == 1


def test_legacy_captcha_rejects_non_ascii_input(monkeypatch):
    from app.services import captcha_service as service
    monkeypatch.setattr(service, "generate_random_code", lambda: "ABCDE")
    key, _ = service.create_captcha()
    assert service.verify_captcha(key, "əəəəə") is False
