"""Security middleware: request-id, response headers + DB lifecycle + pragmas."""
from __future__ import annotations

import re
import secrets
import time

from flask import g, request, current_app, has_request_context

from ..extensions import db
from ..security.headers import apply_security_headers


# --- Request-ID / correlation ID (docs/CONTRACT.md §9) -----------------------

REQUEST_ID_HEADER = "X-Request-ID"
_REQUEST_ID_MAX_LEN = 64
_REQUEST_ID_FORBIDDEN = re.compile(r"[^A-Za-z0-9_-]")


def sanitize_request_id(raw: str | None) -> str:
    """Keep only [A-Za-z0-9-_], cap at 64 chars (contract §9)."""
    if not raw:
        return ""
    return _REQUEST_ID_FORBIDDEN.sub("", raw)[:_REQUEST_ID_MAX_LEN]


def generate_request_id() -> str:
    return secrets.token_hex(8)


def current_request_id() -> str:
    """Request id for the current request (generates one if missing)."""
    if not has_request_context():
        return ""
    rid = getattr(g, "request_id", "")
    if not rid:
        rid = generate_request_id()
        g.request_id = rid
    return rid


def install_security_middleware(app) -> None:
    """Attach `before_request` request-id + `after_request` headers."""

    @app.before_request
    def _assign_request_id():
        # Sanitized incoming X-Request-ID, or a fresh 16-hex-char id.
        g.request_id = sanitize_request_id(request.headers.get(REQUEST_ID_HEADER)) \
            or generate_request_id()
        g.request_started_at = time.perf_counter()

    @app.after_request
    def _log_request(response):
        started_at = getattr(g, "request_started_at", None)
        duration_ms = max(0.0, (time.perf_counter() - started_at) * 1000) \
            if started_at is not None else 0.0
        current_app.logger.info(
            "HTTP request completed",
            extra={
                "event_name": "http_request",
                "request_id": current_request_id(),
                "http_method": request.method.upper(),
                # Log only Flask's declared route template. Never log a raw URL,
                # path parameter, query string, request body, IP, or user agent.
                "http_route": request.url_rule.rule if request.url_rule else None,
                "http_status_code": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        return response

    @app.after_request
    def _headers(response):
        apply_security_headers(response)
        # Echo the request id on EVERY response (success and error alike).
        rid = current_request_id()
        if rid:
            response.headers[REQUEST_ID_HEADER] = rid
        return response


def install_request_lifecycle(app) -> None:
    """Set SQLite pragmas per connection, ensure db session cleanup."""

    # SQLite pragmas — applied per-connection by SQLAlchemy's "connect" event.
    from sqlalchemy import event
    with app.app_context():
        engine = db.engine

    if engine.dialect.name == "sqlite":
        @event.listens_for(engine, "connect")
        def _set_sqlite_pragmas(dbapi_conn, _record):
            cur = dbapi_conn.cursor()
            try:
                cur.execute("PRAGMA busy_timeout=5000")
                cur.execute("PRAGMA foreign_keys=ON")
                cur.execute("PRAGMA journal_mode=WAL")
            finally:
                cur.close()

    @app.teardown_request
    def _teardown(_exc):
        try:
            db.session.remove()
        except Exception:
            pass

    @app.after_request
    def _slide_authenticated_session(response):
        # Refresh only a session actually resolved during this request and
        # only after a successful response. Logout/revocation deletes the row,
        # so its conditional update naturally becomes a no-op.
        session_data = getattr(g, "_current_session", None)
        if session_data is not None and response.status_code < 400:
            try:
                from ..security.session import slide_session_expiry

                slide_session_expiry(session_data)
            except Exception as exc:
                # A refresh failure must not turn an otherwise successful
                # request into a 500; the existing idle expiry remains safe.
                db.session.rollback()
                app.logger.warning(
                    "Session idle-expiry refresh failed (%s)", type(exc).__name__
                )
        return response


__all__ = [
    "install_security_middleware",
    "install_request_lifecycle",
    "REQUEST_ID_HEADER",
    "sanitize_request_id",
    "generate_request_id",
    "current_request_id",
]
