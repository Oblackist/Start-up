"""CSRF synchronizer-token middleware.

GET / HEAD / OPTIONS are exempt. State-changing requests must include
`X-CSRF-Token: <csrf_token>` matching the value stored on the current
session row. Comparison is constant-time (`hmac.compare_digest`).
"""
from __future__ import annotations

import hmac
from functools import wraps

from flask import jsonify, request

from .session import get_current_session
from ..utils.errors import ApiError


def require_csrf(fn):
    @wraps(fn)
    def _wrapped(*args, **kwargs):
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return fn(*args, **kwargs)
        sess = get_current_session()
        if sess is None:
            # No session: not authenticated. Let the route's @require_auth
            # raise the 401. But if there is no @require_auth at all we
            # still want to reject this — raise 401 here.
            raise ApiError(401, "unauthorized", "Autentifikasiya tələb olunur")
        expected = sess.csrf_token or ""
        received = request.headers.get("X-CSRF-Token", "") or ""
        if not expected or not received or not hmac.compare_digest(expected, received):
            raise ApiError(403, "csrf_failed", "CSRF yoxlaması uğursuzdur")
        return fn(*args, **kwargs)

    return _wrapped


def csrf_error_response() -> "tuple[dict, int]":  # pragma: no cover
    body = {"error": {"code": "csrf_failed", "message": "CSRF yoxlaması uğursuzdur"}}
    return body, 403


__all__ = ["require_csrf", "csrf_error_response"]
