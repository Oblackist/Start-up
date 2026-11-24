"""Security helpers (no app context needed for the KDF)."""
from __future__ import annotations

from .password import (
    hash_password,
    verify_password,
    needs_rehash,
    PEPPER_VERSION,
)
from .session import (
    create_session,
    rotate_session,
    invalidate_session,
    invalidate_all_user_sessions,
    lookup_session,
    get_current_session,
    set_session_cookies,
    clear_session_cookies,
    issue_csrf_cookie,
)
from .csrf import require_csrf, csrf_error_response
from .rate_limit import rate_limit, RateLimiter, limiter
from .headers import apply_security_headers
from .audit import audit_log
from .captcha import (
    CaptchaResult,
    is_captcha_enabled,
    verify_captcha,
    enforce_captcha,
)

__all__ = [
    "hash_password",
    "verify_password",
    "needs_rehash",
    "PEPPER_VERSION",
    "create_session",
    "rotate_session",
    "invalidate_session",
    "invalidate_all_user_sessions",
    "lookup_session",
    "get_current_session",
    "set_session_cookies",
    "clear_session_cookies",
    "issue_csrf_cookie",
    "require_csrf",
    "csrf_error_response",
    "rate_limit",
    "RateLimiter",
    "limiter",
    "apply_security_headers",
    "audit_log",
    "CaptchaResult",
    "is_captcha_enabled",
    "verify_captcha",
    "enforce_captcha",
]
