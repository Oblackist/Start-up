"""Tests for session lifecycle: logout, /me, refresh persistence."""
from __future__ import annotations

from tests.conftest import (
    register_payload,
    register_and_login,
    _extract_csrf_from_response,
    _extract_session_cookie,
)


class TestSession:
    def test_logout_clears_session(self, client):
        csrf, _pw, _email = register_and_login(client)
        r = client.post("/api/v1/auth/logout")
        assert r.status_code == 200, r.get_json()
        # After logout, /auth/me should 401
        me = client.get("/api/v1/auth/me")
        assert me.status_code == 401

    def test_logout_is_idempotent_when_no_session(self, client):
        # Calling logout without a session returns 200 (idempotent)
        r = client.post("/api/v1/auth/logout")
        assert r.status_code == 200, r.get_json()
        assert r.get_json() == {"ok": True}

    def test_me_returns_user_when_session_valid(self, client):
        register_and_login(client)
        r = client.get("/api/v1/auth/me")
        assert r.status_code == 200, r.get_json()
        assert "user" in r.get_json()
        assert r.get_json()["user"]["email"] == "user@example.com"

    def test_me_returns_401_when_no_session(self, client):
        r = client.get("/api/v1/auth/me")
        assert r.status_code == 401

    def test_login_rotates_session_id(self, client):
        register_and_login(client)
        # First login: capture session cookie
        r1 = client.post("/api/v1/auth/login", json={
            "email": "user@example.com", "password": "Parol1ab",
        })
        assert r1.status_code == 200
        sess1 = _extract_session_cookie(r1)
        csrf1 = _extract_csrf_from_response(r1)
        assert sess1 and csrf1

        # Second login: session id and csrf should be different
        r2 = client.post("/api/v1/auth/login", json={
            "email": "user@example.com", "password": "Parol1ab",
        })
        assert r2.status_code == 200
        sess2 = _extract_session_cookie(r2)
        csrf2 = _extract_csrf_from_response(r2)
        assert sess2 and csrf2
        assert sess1 != sess2, "session token must rotate on login"
        assert csrf1 != csrf2, "csrf token must rotate on login"

    def test_session_persists_across_requests(self, client):
        register_and_login(client)
        # Multiple GETs should all succeed
        for _ in range(3):
            r = client.get("/api/v1/auth/me")
            assert r.status_code == 200

    def test_csrf_endpoint_returns_token_and_sets_cookie(self, client):
        register_and_login(client)
        r = client.get("/api/v1/auth/csrf")
        assert r.status_code == 200
        body = r.get_json()
        assert body["csrf_token"]
        # Cookie is set
        assert any(
            h.startswith("csrf_token=") for h in r.headers.getlist("Set-Cookie")
        )

    def test_expired_session_treated_as_logged_out(self, app, client):
        # Create a session and force-expire it.
        register_and_login(client)
        with app.app_context():
            from app.extensions import db
            from app.models.user import Session
            import datetime as _dt
            row = db.session.query(Session).first()
            row.expires_at = _dt.datetime.now(_dt.timezone.utc) - _dt.timedelta(hours=1)
            db.session.commit()
        # Now /me should 401
        r = client.get("/api/v1/auth/me")
        assert r.status_code == 401

    def test_authenticated_activity_slides_idle_expiry_without_changing_absolute_expiry(self, app, client):
        register_and_login(client)
        with app.app_context():
            from app.extensions import db
            from app.models.user import Session
            import datetime as _dt

            row = db.session.query(Session).first()
            absolute_expiry = row.absolute_expires_at
            row.expires_at = _dt.datetime.now(_dt.timezone.utc) + _dt.timedelta(minutes=2)
            db.session.commit()

        response = client.get("/api/v1/auth/me")
        assert response.status_code == 200

        with app.app_context():
            row = db.session.query(Session).first()
            now = _dt.datetime.now(_dt.timezone.utc)
            idle_expiry = row.expires_at
            if idle_expiry.tzinfo is None:
                idle_expiry = idle_expiry.replace(tzinfo=_dt.timezone.utc)
            actual_absolute = row.absolute_expires_at
            if actual_absolute.tzinfo is None:
                actual_absolute = actual_absolute.replace(tzinfo=_dt.timezone.utc)
            expected_absolute = absolute_expiry
            if expected_absolute.tzinfo is None:
                expected_absolute = expected_absolute.replace(tzinfo=_dt.timezone.utc)
            assert idle_expiry >= now + _dt.timedelta(minutes=29)
            assert actual_absolute == expected_absolute

    def test_sliding_idle_expiry_never_exceeds_absolute_expiry(self, app, client):
        register_and_login(client)
        with app.app_context():
            from app.extensions import db
            from app.models.user import Session
            import datetime as _dt

            row = db.session.query(Session).first()
            row.absolute_expires_at = _dt.datetime.now(_dt.timezone.utc) + _dt.timedelta(minutes=1)
            row.expires_at = _dt.datetime.now(_dt.timezone.utc) + _dt.timedelta(seconds=30)
            db.session.commit()

        response = client.get("/api/v1/auth/me")
        assert response.status_code == 200

        with app.app_context():
            row = db.session.query(Session).first()
            assert row.expires_at == row.absolute_expires_at
