"""Structured HTTP log records contain operational fields and no request data."""
from __future__ import annotations

import json
import logging

from app.observability import JsonLogFormatter


class RecordHandler(logging.Handler):
    def __init__(self):
        super().__init__()
        self.records: list[logging.LogRecord] = []

    def emit(self, record):
        self.records.append(record)


def test_request_log_uses_route_template_and_excludes_sensitive_request_data(app, client):
    handler = RecordHandler()
    app.logger.addHandler(handler)
    try:
        response = client.get(
            "/api/v1/subjects/private-subject-identifier"
            "?access_token=private-query-token&email=private@example.com",
            headers={"X-Request-ID": "safe-correlation-42", "User-Agent": "private-agent"},
        )
    finally:
        app.logger.removeHandler(handler)

    assert response.status_code == 404
    record = next(r for r in handler.records if getattr(r, "event_name", None) == "http_request")
    formatter = next(
        h.formatter for h in app.logger.handlers if isinstance(h.formatter, JsonLogFormatter)
    )
    payload = json.loads(formatter.format(record))

    assert payload["event"] == "http_request"
    assert payload["request_id"] == "safe-correlation-42"
    assert payload["http_method"] == "GET"
    assert payload["http_route"] == "/api/v1/subjects/<subject_id>"
    assert payload["http_status_code"] == 404
    assert isinstance(payload["duration_ms"], (int, float))
    assert payload["duration_ms"] >= 0
    assert payload["timestamp"].endswith("Z")

    serialized = formatter.format(record)
    for private_value in (
        "private-subject-identifier",
        "private-query-token",
        "private@example.com",
        "private-agent",
    ):
        assert private_value not in serialized
    assert "127.0.0.1" not in serialized


def test_json_formatter_redacts_email_credentials_and_ignores_unapproved_fields():
    formatter = JsonLogFormatter()
    record = logging.LogRecord(
        "app", logging.WARNING, __file__, 1,
        "provider error email=student@example.com password=hunter2 Authorization: Bearer abc.def.ghi",
        (), None,
    )
    record.user_email = "student@example.com"
    record.ip_address = "203.0.113.8"
    record.query_string = "access_token=abc"

    serialized = formatter.format(record)
    payload = json.loads(serialized)

    assert payload["level"] == "WARNING"
    assert "student@example.com" not in serialized
    assert "hunter2" not in serialized
    assert "abc.def.ghi" not in serialized
    assert "203.0.113.8" not in serialized
    assert "access_token=abc" not in serialized
    assert "user_email" not in payload
    assert "ip_address" not in payload
    assert "query_string" not in payload
    assert "[REDACTED" in payload["message"]
