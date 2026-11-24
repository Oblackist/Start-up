"""Centralized error model.

`ApiError` is the single exception type the route/services layer raises.
The error handlers convert it (and any other exception) into the
`{ "error": { code, message, fields? }, "request_id": "..." }` JSON envelope
per docs/CONTRACT.md §3 + §9.
"""
from __future__ import annotations

import secrets
from dataclasses import dataclass, field
from typing import Any

from flask import g, has_request_context


@dataclass
class ApiError(Exception):
    status: int
    code: str
    message: str
    fields: dict[str, Any] | None = field(default=None)

    def __init__(
        self,
        status: int = 400,
        code: str = "bad_request",
        message: str = "Sorğuda xəta var",
        fields: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.status = status
        self.code = code
        self.message = message
        self.fields = fields


class ErrorCode:
    # Validation / generic
    BAD_REQUEST = "bad_request"
    VALIDATION_FAILED = "validation_failed"
    UNKNOWN_FIELDS = "unknown_fields"
    # Auth
    UNAUTHORIZED = "unauthorized"
    INVALID_CREDENTIALS = "invalid_credentials"
    CSRF_FAILED = "csrf_failed"
    # Captcha (Cloudflare Turnstile) — docs/CONTRACT.md §7
    CAPTCHA_REQUIRED = "captcha_required"
    CAPTCHA_INVALID = "captcha_invalid"
    CAPTCHA_UNAVAILABLE = "captcha_unavailable"
    # Forbidden / not found
    FORBIDDEN = "forbidden"
    NOT_FOUND = "not_found"
    SUBJECT_NOT_FOUND = "subject_not_found"
    # Conflicts
    EMAIL_EXISTS = "email_exists"
    ALREADY_SUBMITTED = "already_submitted"
    # Rate limit
    RATE_LIMITED = "rate_limited"
    # Password
    INVALID_CURRENT_PASSWORD = "invalid_current_password"
    INVALID_OR_EXPIRED_TOKEN = "invalid_or_expired_token"
    # Server
    INTERNAL = "internal_error"


def _request_id_for_body() -> str:
    """Resolve the correlation id for an error body (contract §9).

    Reads the id assigned by the request-id middleware. If an error escaped
    before `before_request` ran, generate + stash one so the body and the
    echoed `X-Request-ID` response header always match.
    """
    if not has_request_context():
        return ""
    rid = getattr(g, "request_id", "")
    if not rid:
        rid = secrets.token_hex(8)
        g.request_id = rid
    return rid


def error_response(
    status: int,
    code: str,
    message: str,
    fields: dict[str, Any] | None = None,
) -> tuple[dict, int]:
    body: dict[str, Any] = {"error": {"code": code, "message": message}}
    if fields:
        body["error"]["fields"] = fields
    rid = _request_id_for_body()
    if rid:
        body["request_id"] = rid
    return body, status


__all__ = ["ApiError", "ErrorCode", "error_response"]
