"""Tests for the Cloudflare Turnstile captcha gate on LOGIN (CONTRACT §7).

Patching strategy (consistent across the whole file): the HTTP-level tests
monkeypatch `app.security.captcha.verify_captcha` (the single seam between
the service and the provider). The provider contract itself is unit-tested
separately by monkeypatching `urllib.request.urlopen` — stdlib only, no new
dependencies, fail-closed on any provider error.
"""
from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request

import pytest

from app.security.captcha import CaptchaResult
from tests.conftest import register_and_login

TEST_SECRET = "1x0000000000000000000000000000000AA"
TOKEN = "turnstile-token-abc123"
SECRET_TOKEN_VALUE = "SUPER-SECRET-TOKEN-VALUE"


class _FakeResponse:
    def __init__(self, payload: bytes, status: int = 200):
        self._payload = payload
        self.status = status

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def read(self, n: int = -1) -> bytes:
        return self._payload


# ---------------------------------------------------------------------------
# HTTP-level behavior on POST /api/v1/auth/login
# ---------------------------------------------------------------------------

class TestCaptchaDisabled:
    def test_no_token_login_proceeds(self, app, client):
        """Captcha disabled (TURNSTILE_SECRET_KEY empty) → skip entirely."""
        assert app.config["TURNSTILE_SECRET_KEY"] == ""
        register_and_login(client, email="free@example.com")
        r = client.post("/api/v1/auth/login", json={
            "email": "free@example.com", "password": "Parol1ab",
        })
        assert r.status_code == 200, r.get_json()
        assert r.get_json()["user"]["email"] == "free@example.com"

    def test_wrong_credentials_still_401(self, client):
        register_and_login(client, email="free2@example.com")
        r = client.post("/api/v1/auth/login", json={
            "email": "free2@example.com", "password": "WrongPass1",
        })
        assert r.status_code == 401
        assert r.get_json()["error"]["code"] == "invalid_credentials"


class TestCaptchaEnabled:
    @pytest.fixture()
    def enabled(self, app):
        app.config["TURNSTILE_SECRET_KEY"] = TEST_SECRET
        return app

    def _login(self, client, email="cap@example.com", password="Parol1ab", **extra):
        body = {"email": email, "password": password}
        body.update(extra)
        return client.post("/api/v1/auth/login", json=body)

    # -- missing token -----------------------------------------------------
    def test_missing_token_400_captcha_required(self, enabled, client):
        register_and_login(client, email="cap@example.com")
        r = self._login(client)
        assert r.status_code == 400, r.get_json()
        body = r.get_json()
        assert body["error"]["code"] == "captcha_required"
        assert "request_id" in body

    def test_empty_token_400_captcha_required(self, enabled, client):
        register_and_login(client, email="cap@example.com")
        r = self._login(client, captcha_token="")
        assert r.status_code == 400
        assert r.get_json()["error"]["code"] == "captcha_required"

    def test_null_token_400_captcha_required(self, enabled, client):
        register_and_login(client, email="cap@example.com")
        r = self._login(client, captcha_token=None)
        assert r.status_code == 400
        assert r.get_json()["error"]["code"] == "captcha_required"

    def test_token_over_2048_chars_is_schema_rejected(self, enabled, client):
        register_and_login(client, email="cap@example.com")
        r = self._login(client, captcha_token="x" * 2049)
        assert r.status_code == 400
        assert r.get_json()["error"]["code"] == "validation_failed"

    # -- invalid token -----------------------------------------------------
    def test_invalid_token_400_captcha_invalid(self, enabled, client, monkeypatch):
        register_and_login(client, email="cap@example.com")

        def fake_verify(token, remote_ip):
            assert token == TOKEN
            return CaptchaResult(ok=False, reason="invalid", provider_status=200)

        monkeypatch.setattr("app.security.captcha.verify_captcha", fake_verify)
        r = self._login(client, captcha_token=TOKEN)
        assert r.status_code == 400, r.get_json()
        assert r.get_json()["error"]["code"] == "captcha_invalid"

    def test_invalid_token_rejected_before_credentials(self, enabled, client, monkeypatch):
        """Wrong password AND invalid captcha → captcha error wins (400, not 401)."""
        register_and_login(client, email="cap@example.com")
        monkeypatch.setattr(
            "app.security.captcha.verify_captcha",
            lambda token, ip: CaptchaResult(False, "invalid", 200),
        )
        r = self._login(client, password="WrongPass1", captcha_token=TOKEN)
        assert r.status_code == 400
        assert r.get_json()["error"]["code"] == "captcha_invalid"

    # -- valid token -------------------------------------------------------
    def test_valid_token_proceeds_to_credential_check(self, enabled, client, monkeypatch):
        register_and_login(client, email="cap@example.com")
        seen = {}

        def fake_verify(token, remote_ip):
            seen["token"] = token
            seen["ip"] = remote_ip
            return CaptchaResult(True, None, 200)

        monkeypatch.setattr("app.security.captcha.verify_captcha", fake_verify)
        r = self._login(client, captcha_token=TOKEN)
        assert r.status_code == 200, r.get_json()
        assert r.get_json()["user"]["email"] == "cap@example.com"
        assert seen["token"] == TOKEN

    def test_valid_token_wrong_password_still_401(self, enabled, client, monkeypatch):
        """Captcha passed but credentials wrong → normal 401 flow."""
        register_and_login(client, email="cap@example.com")
        monkeypatch.setattr(
            "app.security.captcha.verify_captcha",
            lambda token, ip: CaptchaResult(True, None, 200),
        )
        r = self._login(client, password="WrongPass1", captcha_token=TOKEN)
        assert r.status_code == 401
        assert r.get_json()["error"]["code"] == "invalid_credentials"

    # -- provider unavailable (fail closed) ---------------------------------
    def test_provider_unavailable_503_captcha_unavailable(self, enabled, client, monkeypatch):
        register_and_login(client, email="cap@example.com")
        monkeypatch.setattr(
            "app.security.captcha.verify_captcha",
            lambda token, ip: CaptchaResult(False, "unavailable", None),
        )
        r = self._login(client, captcha_token=TOKEN)
        assert r.status_code == 503, r.get_json()
        body = r.get_json()
        assert body["error"]["code"] == "captcha_unavailable"
        assert "request_id" in body

    # -- audit + no token leakage -------------------------------------------
    def test_captcha_failed_audit_without_token(self, enabled, client, monkeypatch):
        register_and_login(client, email="cap@example.com")
        monkeypatch.setattr(
            "app.security.captcha.verify_captcha",
            lambda token, ip: CaptchaResult(False, "invalid", 200),
        )
        self._login(client, captcha_token=SECRET_TOKEN_VALUE)
        with enabled.app_context():
            from app.extensions import db
            from app.models.audit import AuditLog
            rows = db.session.query(AuditLog).filter(
                AuditLog.action == "captcha_failed").all()
            assert len(rows) >= 1
            for row in rows:
                dumped = json.dumps(row.details_json or {})
                assert SECRET_TOKEN_VALUE not in dumped
                assert "token" not in dumped  # reason only, never the token
                assert row.details_json.get("reason") == "invalid"

    def test_error_response_includes_request_id_and_never_echoes_token(
            self, enabled, client, monkeypatch):
        register_and_login(client, email="cap@example.com")
        monkeypatch.setattr(
            "app.security.captcha.verify_captcha",
            lambda token, ip: CaptchaResult(False, "invalid", 200),
        )
        r = self._login(client, captcha_token=SECRET_TOKEN_VALUE)
        assert r.status_code == 400
        body = r.get_json()
        assert "request_id" in body
        assert r.headers.get("X-Request-ID") == body["request_id"]
        # The token is never echoed in the body or any header.
        assert SECRET_TOKEN_VALUE not in json.dumps(body)
        assert SECRET_TOKEN_VALUE not in json.dumps(dict(r.headers))


# ---------------------------------------------------------------------------
# Provider contract: verify_captcha unit tests (urllib seam, fail-closed)
# ---------------------------------------------------------------------------

class TestVerifyCaptchaProvider:
    @pytest.fixture(autouse=True)
    def _enable(self, app):
        """The provider contract tests run with a configured secret."""
        app.config["TURNSTILE_SECRET_KEY"] = TEST_SECRET

    def _fake_urlopen(self, monkeypatch, responder):
        """Patch urllib.request.urlopen; capture the outgoing request."""
        captured = {}

        def fake(request, timeout=None):
            captured["request"] = request
            captured["timeout"] = timeout
            return responder()

        monkeypatch.setattr("urllib.request.urlopen", fake)
        return captured

    def _call(self, app, token="tok", ip="127.0.0.1"):
        with app.app_context():
            from app.security.captcha import verify_captcha
            return verify_captcha(token, ip)

    def test_success(self, app, monkeypatch):
        self._fake_urlopen(monkeypatch, lambda: _FakeResponse(
            json.dumps({"success": True}).encode()))
        result = self._call(app)
        assert result.ok is True
        assert result.reason is None
        assert result.provider_status == 200

    def test_sends_form_encoded_secret_response_remoteip(self, app, monkeypatch):
        captured = self._fake_urlopen(monkeypatch, lambda: _FakeResponse(
            json.dumps({"success": True}).encode()))
        self._call(app, token="tok123", ip="10.0.0.9")
        req = captured["request"]
        assert captured["timeout"] == 10
        assert req.get_method() == "POST"
        assert "challenges.cloudflare.com/turnstile/v0/siteverify" in req.full_url
        form = urllib.parse.parse_qs(req.data.decode())
        assert form["response"] == ["tok123"]
        assert form["remoteip"] == ["10.0.0.9"]
        assert form["secret"] == [TEST_SECRET]

    def test_invalid_token(self, app, monkeypatch):
        self._fake_urlopen(monkeypatch, lambda: _FakeResponse(
            json.dumps({"success": False, "error-codes": ["invalid-input-response"]}).encode()))
        result = self._call(app)
        assert result.ok is False
        assert result.reason == "invalid"

    def test_network_error_fails_closed_unavailable(self, app, monkeypatch):
        def boom():
            raise urllib.error.URLError("connection refused")

        self._fake_urlopen(monkeypatch, boom)
        result = self._call(app)
        assert result.ok is False
        assert result.reason == "unavailable"

    def test_timeout_fails_closed_unavailable(self, app, monkeypatch):
        def boom():
            raise TimeoutError("timed out")

        self._fake_urlopen(monkeypatch, boom)
        result = self._call(app)
        assert result.ok is False
        assert result.reason == "unavailable"

    def test_http_error_fails_closed_unavailable(self, app, monkeypatch):
        def boom():
            raise urllib.error.HTTPError(
                "https://challenges.cloudflare.com/turnstile/v0/siteverify",
                500, "boom", hdrs=None, fp=None)

        self._fake_urlopen(monkeypatch, boom)
        result = self._call(app)
        assert result.ok is False
        assert result.reason == "unavailable"

    def test_non_json_fails_closed_unavailable(self, app, monkeypatch):
        self._fake_urlopen(monkeypatch, lambda: _FakeResponse(b"<html>oops</html>"))
        result = self._call(app)
        assert result.ok is False
        assert result.reason == "unavailable"

    def test_json_array_fails_closed_unavailable(self, app, monkeypatch):
        self._fake_urlopen(monkeypatch, lambda: _FakeResponse(b"[1,2,3]"))
        result = self._call(app)
        assert result.ok is False
        assert result.reason == "unavailable"

    def test_token_never_logged(self, app, monkeypatch, caplog):
        self._fake_urlopen(monkeypatch, lambda: _FakeResponse(
            json.dumps({"success": False}).encode()))
        with caplog.at_level("WARNING"):
            result = self._call(app, token="NEVER-LOG-ME-123")
        assert result.ok is False
        for record in caplog.records:
            assert "NEVER-LOG-ME-123" not in record.getMessage()
