"""Tests for the X-Request-ID / correlation-id middleware (CONTRACT DELTA §9).

- Incoming `X-Request-ID` is sanitized ([A-Za-z0-9_-], max 64 chars) and
  echoed on EVERY response.
- A fresh `secrets.token_hex(8)` id is generated when the header is absent
  (or sanitizes to empty).
- Every JSON error body gains `request_id` matching the echoed header.
- The 500 log line includes the request id (correlatable), never secrets.
"""
from __future__ import annotations

import re

import pytest

_HEX16 = re.compile(r"^[0-9a-f]{16}$")
_SAFE = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


class TestRequestIdEcho:
    def test_incoming_header_is_echoed(self, client):
        r = client.get("/api/v1/health", headers={"X-Request-ID": "my-correlation-id_01"})
        assert r.status_code == 200
        assert r.headers.get("X-Request-ID") == "my-correlation-id_01"

    def test_incoming_header_echoed_on_error_too(self, client):
        r = client.get("/api/v1/subjects/does-not-exist",
                       headers={"X-Request-ID": "err-case-42"})
        assert r.status_code == 404
        assert r.headers.get("X-Request-ID") == "err-case-42"
        assert r.get_json()["request_id"] == "err-case-42"

    def test_missing_header_generates_hex16(self, client):
        r = client.get("/api/v1/health")
        rid = r.headers.get("X-Request-ID")
        assert rid is not None
        assert _HEX16.match(rid), rid

    def test_blank_header_generates_hex16(self, client):
        r = client.get("/api/v1/health", headers={"X-Request-ID": ""})
        assert _HEX16.match(r.headers.get("X-Request-ID", ""))

    def test_ids_are_unique_per_request(self, client):
        seen = set()
        for _ in range(5):
            r = client.get("/api/v1/health")
            seen.add(r.headers.get("X-Request-ID"))
        assert len(seen) == 5


class TestRequestIdSanitization:
    def test_invalid_chars_stripped(self, client):
        r = client.get("/api/v1/health",
                       headers={"X-Request-ID": "abc!@#$%^&*()123"})
        assert r.headers.get("X-Request-ID") == "abc123"

    def test_truncated_to_64_chars(self, client):
        long_id = "x" * 100
        r = client.get("/api/v1/health", headers={"X-Request-ID": long_id})
        rid = r.headers.get("X-Request-ID")
        assert len(rid) == 64
        assert rid == "x" * 64

    def test_unicode_stripped_to_empty_generates_new(self, client):
        r = client.get("/api/v1/health", headers={"X-Request-ID": "مرحبا-🎉"})
        # Only the '-' survives sanitization... which is a valid id.
        assert r.headers.get("X-Request-ID") == "-"

    def test_fully_invalid_header_generates_fresh_id(self, client):
        r = client.get("/api/v1/health", headers={"X-Request-ID": "!!!@@@###"})
        assert _HEX16.match(r.headers.get("X-Request-ID", ""))

    def test_sanitized_id_is_always_safe_charset(self, client):
        weird = "a b|;&<>=+%'\"\\/" + "Z" * 90
        r = client.get("/api/v1/health", headers={"X-Request-ID": weird})
        rid = r.headers.get("X-Request-ID", "")
        assert _SAFE.match(rid)
        assert rid == "ab" + "Z" * 62


class TestRequestIdInErrorBodies:
    @pytest.mark.parametrize("method,path,status", [
        ("get", "/api/v1/auth/me", 401),
        ("get", "/api/v1/subjects/nope", 404),
        ("post", "/api/v1/auth/login", 400),          # missing body → validation
        ("get", "/api/v1/leaderboard?subject_id=nope", 404),
    ])
    def test_every_error_body_has_request_id(self, client, method, path, status):
        r = getattr(client, method)(path, json={} if method == "post" else None)
        assert r.status_code == status, r.get_json()
        body = r.get_json()
        assert "request_id" in body
        assert body["request_id"] == r.headers.get("X-Request-ID")
        assert _SAFE.match(body["request_id"])

    def test_error_body_and_header_share_id(self, client):
        r = client.get("/api/v1/auth/me", headers={"X-Request-ID": "share-me-77"})
        assert r.get_json()["request_id"] == "share-me-77"

    def test_success_bodies_do_not_require_request_id(self, client):
        """Contract: success responses do NOT need request_id (they may not
        have one; the header echo is what carries correlation)."""
        r = client.get("/api/v1/health")
        assert r.status_code == 200
        assert "request_id" not in r.get_json()


class TestRequestId500Correlation:
    def test_500_log_includes_request_id(self, app, client):
        import logging

        endpoint = "subjects.list_subjects"
        original = app.view_functions.get(endpoint)
        records = []

        class RecordHandler(logging.Handler):
            def emit(self, record):
                records.append(record)

        handler = RecordHandler()
        app.logger.addHandler(handler)

        def boom():
            raise RuntimeError("internal detail password=hunter2 token=xyz")

        app.view_functions[endpoint] = boom
        try:
            r = client.get("/api/v1/subjects", headers={"X-Request-ID": "log-correlate-9"})
            assert r.status_code == 500
            body = r.get_json()
            assert body["request_id"] == "log-correlate-9"
        finally:
            app.logger.removeHandler(handler)
            if original is not None:
                app.view_functions[endpoint] = original

        # The server-side log line correlates with the user-visible id...
        joined = "\n".join(rec.getMessage() for rec in records)
        assert "request_id=log-correlate-9" in joined
        # ...and no secrets from the failing request are logged.
        assert "hunter2" not in joined
        assert "token=xyz" not in joined
        assert all(rec.exc_info is None for rec in records)
