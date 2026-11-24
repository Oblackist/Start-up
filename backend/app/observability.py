"""Privacy-conscious JSON logs for operational events."""
from __future__ import annotations

import json
import logging
import math
import re
from datetime import datetime, timezone

from flask import g, has_request_context
from flask.logging import default_handler


_EMAIL = re.compile(
    r"\b[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?"
    r"(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+\b",
    re.IGNORECASE,
)
_CREDENTIAL = re.compile(
    r"\b(password|passwd|token|secret|authorization|api[_-]?key|otp|"
    r"one[_-]?time[_-]?code|recovery[_-]?code)\b(\s*[:=]\s*)"
    r"(?:\"[^\"]*\"|'[^']*'|[^\s,;]+)",
    re.IGNORECASE,
)
_BEARER = re.compile(r"\bBearer\s+[A-Za-z0-9._~+/=-]+", re.IGNORECASE)
_JWT = re.compile(r"\b[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b")
_SAFE_REQUEST_ID = re.compile(r"[^A-Za-z0-9_-]")


def _redact_message(message: str) -> str:
    """Redact common identity and credential forms before they reach a sink."""
    message = _BEARER.sub("Bearer [REDACTED]", message)
    message = _JWT.sub("[REDACTED_TOKEN]", message)
    message = _CREDENTIAL.sub(lambda m: f"{m.group(1)}{m.group(2)}[REDACTED]", message)
    return _EMAIL.sub("[REDACTED_EMAIL]", message)


class JsonLogFormatter(logging.Formatter):
    """Serialize a strict allowlist of structured fields as one JSON line."""

    _HTTP_FIELDS = (
        ("http_method", "http_method"),
        ("http_route", "http_route"),
        ("http_status_code", "http_status_code"),
        ("duration_ms", "duration_ms"),
    )

    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.fromtimestamp(record.created, timezone.utc)
        payload: dict[str, object] = {
            "timestamp": timestamp.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
            "level": record.levelname,
            "logger": record.name,
            "message": _redact_message(record.getMessage()),
        }

        event_name = getattr(record, "event_name", None)
        if isinstance(event_name, str) and re.fullmatch(r"[a-z][a-z0-9_]{0,63}", event_name):
            payload["event"] = event_name

        request_id = getattr(record, "request_id", None)
        if not request_id and has_request_context():
            request_id = getattr(g, "request_id", None)
        if isinstance(request_id, str):
            request_id = _SAFE_REQUEST_ID.sub("", request_id)[:64]
            if request_id:
                payload["request_id"] = request_id

        for field, output_name in self._HTTP_FIELDS:
            value = getattr(record, field, None)
            if field == "http_method" and isinstance(value, str):
                if re.fullmatch(r"[A-Z]{1,16}", value):
                    payload[output_name] = value
            elif field == "http_route" and isinstance(value, str) and value.startswith("/"):
                payload[output_name] = value
            elif field == "http_status_code" and isinstance(value, int) and 100 <= value <= 599:
                payload[output_name] = value
            elif field == "duration_ms" and isinstance(value, (int, float)):
                if math.isfinite(value) and value >= 0:
                    payload[output_name] = round(value, 3)

        return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def configure_app_logging(app) -> None:
    """Install one JSON console handler without duplicating it across app factories."""
    logger = app.logger
    logger.setLevel(logging.INFO)
    for handler in tuple(logger.handlers):
        if handler is default_handler:
            logger.removeHandler(handler)

    handler = next(
        (item for item in logger.handlers if getattr(item, "_career_arena_json_handler", False)),
        None,
    )
    if handler is None:
        handler = logging.StreamHandler()
        handler._career_arena_json_handler = True
        logger.addHandler(handler)
    handler.setFormatter(JsonLogFormatter())


__all__ = ["JsonLogFormatter", "configure_app_logging"]
