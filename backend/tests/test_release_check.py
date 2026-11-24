"""Public release check rejects incomplete HTTPS deployments."""

from __future__ import annotations

from email.message import Message
import importlib.util
import io
from pathlib import Path
from unittest.mock import patch
from urllib.error import HTTPError


CHECK_PATH = Path(__file__).parents[2] / "scripts" / "check_release.py"
SPEC = importlib.util.spec_from_file_location("check_release", CHECK_PATH)
check_release = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(check_release)


class Response(io.BytesIO):
    def __init__(self, body: bytes, status: int, media_type: str):
        super().__init__(body)
        self.code = status
        self.headers = Message()
        self.headers["Content-Type"] = media_type
        self.headers["Strict-Transport-Security"] = "max-age=31536000"


class ReleaseOrigin:
    readiness_status = 200

    def open(self, request, timeout):
        path = request.selector
        if path in {"/", "/login", "/reset-password"}:
            return Response(b'<div id="root"></div>', 200, "text/html")
        if path == "/theme-init.js":
            return Response(b"console.log('theme');", 200, "text/javascript")
        if path == "/api/v1/health/live":
            return Response(b'{"status":"ok"}', 200, "application/json")
        if path == "/api/v1/health":
            if self.readiness_status != 200:
                raise HTTPError(request.full_url, 503, "", Response(b'{"status":"not_ready"}', 503, "application/json").headers, io.BytesIO(b'{"status":"not_ready"}'))
            return Response(b'{"status":"ok","db":"ok","redis":"ok"}', 200, "application/json")
        if path == "/api/v1/__release_probe_missing__":
            raise HTTPError(request.full_url, 404, "", Response(b'', 404, "application/json").headers, io.BytesIO(b'{"error":{"code":"not_found"},"request_id":"test"}'))
        raise AssertionError(f"Unexpected release-check path {path}")


def test_release_check_accepts_healthy_frontend_api_database_and_redis():
    origin = ReleaseOrigin()
    with patch.object(check_release, "build_opener", return_value=origin):
        check_release.check_release("https://career.example.test")


def test_release_check_rejects_an_unready_database_or_redis():
    origin = ReleaseOrigin()
    origin.readiness_status = 503
    with patch.object(check_release, "build_opener", return_value=origin):
        try:
            check_release.check_release("https://career.example.test")
        except check_release.CheckFailed as exc:
            assert str(exc) == "/api/v1/health: expected HTTP 200, got 503"
        else:
            raise AssertionError("Release check accepted a failed dependency")
