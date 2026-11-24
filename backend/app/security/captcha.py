"""Cloudflare Turnstile captcha verification for authentication (docs/CONTRACT.md §7).

- Captcha is ENABLED iff `TURNSTILE_SECRET_KEY` is configured (non-empty).
- Verification uses the stdlib (`urllib.request`) against the siteverify
  endpoint — NO new dependency, 10s timeout.
- FAILS CLOSED: provider unreachable / timeout / non-JSON → the login is
  refused with 503 `captcha_unavailable` (never allowed through).
- The captcha token is NEVER logged (not even in audit details).
"""
from __future__ import annotations

import json
import logging
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from typing import Any, Optional

from flask import current_app, request

from ..utils.errors import ApiError, ErrorCode
from .audit import audit_log

_log = logging.getLogger(__name__)

VERIFY_TIMEOUT_SECONDS = 10
_MAX_RESPONSE_BODY = 65536  # provider answer is tiny; hard cap the read

REASON_MISSING = "missing"
REASON_INVALID = "invalid"
REASON_UNAVAILABLE = "unavailable"


@dataclass(frozen=True)
class CaptchaResult:
    """Outcome of a siteverify call.

    `reason` is one of 'invalid' | 'unavailable' | None (on success).
    'missing' never comes from the provider — it is produced by
    `enforce_captcha` when no token was submitted.
    `provider_status` is the HTTP status the provider answered with
    (None when it could not be reached).
    """

    ok: bool
    reason: Optional[str]
    provider_status: Optional[int]


def is_captcha_enabled() -> bool:
    """Captcha is enabled iff a Turnstile secret key is configured."""
    return bool(current_app.config.get("TURNSTILE_SECRET_KEY"))


def verify_captcha(token: str, remote_ip: str | None) -> CaptchaResult:
    """Verify a Turnstile token against the siteverify endpoint.

    Never raises. Never logs the token. Fail-closed on any provider error.
    """
    secret = current_app.config.get("TURNSTILE_SECRET_KEY") or ""
    url = current_app.config.get("TURNSTILE_VERIFY_URL") or (
        "https://challenges.cloudflare.com/turnstile/v0/siteverify"
    )
    form: dict[str, str] = {"secret": secret, "response": token}
    if remote_ip:
        form["remoteip"] = remote_ip
    data = urllib.parse.urlencode(form).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        method="POST",
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "startup-fullstack-backend/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=VERIFY_TIMEOUT_SECONDS) as resp:
            status = int(getattr(resp, "status", 200) or 200)
            raw = resp.read(_MAX_RESPONSE_BODY)
    except urllib.error.HTTPError as exc:  # provider answered with 4xx/5xx
        _log.warning("captcha siteverify HTTP error status=%s", exc.code)
        return CaptchaResult(False, REASON_UNAVAILABLE, int(exc.code))
    except (urllib.error.URLError, TimeoutError, OSError, ValueError) as exc:
        # Includes DNS failures, refused connections, timeouts.
        _log.warning("captcha siteverify unreachable: %s", type(exc).__name__)
        return CaptchaResult(False, REASON_UNAVAILABLE, None)
    except Exception as exc:  # anything else → fail closed
        _log.warning("captcha siteverify failed: %s", type(exc).__name__)
        return CaptchaResult(False, REASON_UNAVAILABLE, None)

    try:
        payload: Any = json.loads(raw.decode("utf-8"))
    except (ValueError, UnicodeDecodeError):
        _log.warning("captcha siteverify returned non-JSON (status=%s)", status)
        return CaptchaResult(False, REASON_UNAVAILABLE, status)
    if not isinstance(payload, dict) or "success" not in payload:
        # Valid JSON but not the documented siteverify shape → treat the
        # provider as unavailable (fail closed), not the token as invalid.
        _log.warning("captcha siteverify returned unexpected shape (status=%s)", status)
        return CaptchaResult(False, REASON_UNAVAILABLE, status)
    if bool(payload.get("success")):
        return CaptchaResult(True, None, status)
    # success=false → invalid/expired token (provider 'error-codes' ignored:
    # the client just needs a fresh widget; we must not leak internals).
    return CaptchaResult(False, REASON_INVALID, status)


def enforce_captcha(submitted_token: str | None) -> None:
    """Gate an authentication attempt behind Turnstile (raise ApiError on failure).

    MUST be called BEFORE credential verification. No-op when captcha is
    disabled so existing logins keep working without configuration.
    """
    if not is_captcha_enabled():
        return

    token = (submitted_token or "").strip()
    if not token:
        audit_log(action="captcha_failed", details={"reason": REASON_MISSING})
        raise ApiError(
            400, ErrorCode.CAPTCHA_REQUIRED, "Captcha tələb olunur"
        )

    remote_ip = request.remote_addr if request is not None else None
    result = verify_captcha(token, remote_ip)
    if result.ok:
        return

    # Audit the failure with the reason ONLY — never the token value.
    audit_log(action="captcha_failed", details={"reason": result.reason or "unknown"})

    if result.reason == REASON_INVALID:
        raise ApiError(
            400,
            ErrorCode.CAPTCHA_INVALID,
            "Captcha təsdiqlənmədi. Yenidən cəhd edin.",
        )
    # 'unavailable' (or anything unexpected) → fail closed with 503.
    raise ApiError(
        503,
        ErrorCode.CAPTCHA_UNAVAILABLE,
        "Captcha xidməti hazırda əlçatmazdır. Bir az sonra yenidən cəhd edin.",
    )


__all__ = [
    "CaptchaResult",
    "is_captcha_enabled",
    "verify_captcha",
    "enforce_captcha",
    "REASON_MISSING",
    "REASON_INVALID",
    "REASON_UNAVAILABLE",
]
