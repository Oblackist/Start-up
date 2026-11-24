"""Pytest fixtures for the Career Arena · Exam Arena backend.

Provides:
- create_app_testing() — an app with TestingConfig + a temp SQLite file.
- client — Flask test client bound to that app.
- register_and_login(email, password) — helper that POSTs register, confirms
  the test-only OTP from the database, and returns the CSRF token.
- do_csrf_post(client, url, json, csrf_token) — POST with the
  X-CSRF-Token header (the test client sends cookies automatically).
- clean_rate_limiter() — clears the in-memory rate limiter between tests.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import tempfile
from typing import Any

import pytest

# Set sensible test env BEFORE importing the app.
os.environ.setdefault("FLASK_ENV", "testing")
os.environ.setdefault("FRONTEND_ORIGIN", "http://localhost:5173")
os.environ.setdefault("SECRET_KEY", "test-secret-not-for-production")
os.environ.setdefault("PASSWORD_PEPPER", "test-pepper-not-for-production-but-nonempty")
# Tests must NOT depend on a developer's real .env / shell exports:
# captcha stays OFF unless a test enables it on the app config.
os.environ["TURNSTILE_SECRET_KEY"] = ""


@pytest.fixture()
def temp_db_path(tmp_path) -> str:
    """Absolute path to a temp SQLite file unique to the test."""
    return str(tmp_path / "test.db")


def create_app_testing(db_uri: str | None = None, *, seed: bool = False):
    """Build a Flask app for tests.

    Args:
        db_uri: SQLite URI (default in-memory `sqlite://`).
        seed: if True, populate subjects/topics/questions before returning.
    """
    # Late import to allow env override above.
    from app import create_app
    from app.config import TestingConfig

    cfg = TestingConfig()
    if db_uri is None:
        cfg.SQLALCHEMY_DATABASE_URI = "sqlite://"
    else:
        cfg.SQLALCHEMY_DATABASE_URI = db_uri
    app = create_app(config_object=cfg)
    # In tests we want a SINGLE connection so the in-memory DB persists across
    # the same request. With a file SQLite we can use a normal pool.
    app.config["TESTING"] = True

    with app.app_context():
        from app.extensions import db
        # For an in-memory sqlite, create tables on this app context.
        db.create_all()
        if seed:
            from scripts.seed import run as seed_run
            seed_run()
    return app


@pytest.fixture()
def app(temp_db_path):
    """An app with a real temp file SQLite + seeded content."""
    app = create_app_testing(f"sqlite:///{temp_db_path}", seed=True)
    yield app
    # Teardown: drop everything so the file is clean for the next test.
    with app.app_context():
        from app.extensions import db
        db.session.remove()
        db.drop_all()
    # Also clear the in-memory rate limiter between tests.
    from app.security.rate_limit import limiter
    limiter.clear_all()


@pytest.fixture()
def client(app):
    return app.test_client()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_csrf_cookie(client) -> str:
    """Read the csrf_token cookie from the test client's cookie jar."""
    cookie = next(
        (c for c in client.get_cookie("csrf_token") if c is not None),
        None,
    )
    if cookie is None:
        return ""
    return cookie.value


def register_payload(name="Ülvi", email="user@example.com", password="Parol1ab"):
    return {
        "name": name,
        "email": email,
        "password": password,
        "confirm": password,
    }


def register_and_login(client, email="user@example.com", password="Parol1ab",
                       name="Ülvi"):
    """Register, confirm the test OTP, and return its authenticated CSRF token."""
    r = client.post("/api/v1/auth/register", json=register_payload(name, email, password))
    assert r.status_code == 201, r.get_json()
    assert r.get_json().get("requires_verification") is True
    outbox = client.application.extensions.get("test_mail_outbox", [])
    assert outbox, "registration email was not recorded in the test mail sink"
    match = re.search(r"\b\d{6}\b", outbox[-1].get_content())
    code = match.group(0) if match else None
    assert code and len(code) == 6
    verified = client.post("/api/v1/auth/verify-otp", json={"email": email, "code": code})
    assert verified.status_code == 200, verified.get_json()
    csrf = _extract_csrf_from_response(verified)
    assert csrf, "email verification did not issue a CSRF cookie"
    return csrf, password, email


def _extract_csrf_from_response(response) -> str:
    """Pull csrf_token out of Set-Cookie (works with Flask test client)."""
    for header in response.headers.getlist("Set-Cookie"):
        if header.startswith("csrf_token="):
            # header is like "csrf_token=xxx; Path=/; ..."
            return header.split(";", 1)[0].split("=", 1)[1]
    return ""


def _extract_session_cookie(response) -> str:
    for header in response.headers.getlist("Set-Cookie"):
        if header.startswith("session_token="):
            return header.split(";", 1)[0].split("=", 1)[1]
    return ""


def do_csrf_post(client, url, json_data: Any, csrf_token: str | None = None,
                 method: str = "POST"):
    """POST/PUT with the X-CSRF-Token header. The test client persists cookies."""
    headers = {}
    if csrf_token:
        headers["X-CSRF-Token"] = csrf_token
    fn = getattr(client, method.lower())
    return fn(url, json=json_data, headers=headers)


def get_csrf_via_endpoint(client) -> str:
    """GET /auth/csrf — requires a session (call after register/login)."""
    r = client.get("/api/v1/auth/csrf")
    assert r.status_code == 200, r.get_json()
    body = r.get_json()
    return body["csrf_token"]


def clear_rate_limiter():
    from app.security.rate_limit import limiter
    limiter.clear_all()
