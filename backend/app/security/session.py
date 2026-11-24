"""Session lifecycle helpers.

Sessions are opaque, server-managed. The DB stores the SHA-256 hash of
the token only (so a DB leak doesn't grant sessions). Cookies carry the
raw token.
"""
from __future__ import annotations

import datetime as _dt
import hashlib
import secrets
from typing import Optional

from flask import current_app, g, request

from ..extensions import db
from ..models.user import Session, User


def _utcnow() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc)


def _session_lifetime() -> _dt.timedelta:
    hours = int(current_app.config.get("SESSION_TTL_HOURS", 12))
    return _dt.timedelta(hours=hours)


def _idle_session_lifetime() -> _dt.timedelta:
    minutes = int(current_app.config.get("SESSION_IDLE_TTL_MINUTES", 30))
    return _dt.timedelta(minutes=max(1, minutes))


def _gen_token() -> str:
    return secrets.token_urlsafe(32)  # ~43 chars of entropy


def _gen_csrf() -> str:
    return secrets.token_urlsafe(32)


def _hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _client_ip() -> str | None:
    # Trust the socket peer by default; honour X-Forwarded-For only when
    # an explicit proxy is configured (out of scope for this MVP).
    addr = request.remote_addr if request else None
    return addr


def _client_ua() -> str | None:
    return request.headers.get("User-Agent") if request else None


def create_session(user: User) -> tuple[str, str, Session]:
    """Create a brand-new session row.

    Returns (raw_token, csrf_token, row). Caller is responsible for
    committing the transaction and setting cookies.
    """
    raw_token = _gen_token()
    csrf = _gen_csrf()
    now = _utcnow()
    sess = Session(
        user_id=user.id,
        token_hash=_hash(raw_token),
        csrf_token=csrf,
        user_agent=(_client_ua() or "")[:255] or None,
        ip=_client_ip(),
        created_at=now,
        expires_at=min(now + _idle_session_lifetime(), now + _session_lifetime()),
        absolute_expires_at=now + _session_lifetime(),
    )
    db.session.add(sess)
    db.session.flush()  # get id without committing
    return raw_token, csrf, sess


def rotate_session(user: User, old_session: Session | None = None) -> tuple[str, str, Session]:
    """Rotate the user's active session (used on login and on password change).

    Strategy: delete the old session row (if any) and create a new one.
    Returns the same shape as `create_session`.
    """
    if old_session is not None:
        try:
            db.session.delete(old_session)
            db.session.flush()
        except Exception:
            db.session.rollback()
    return create_session(user)


def invalidate_session(session: Session) -> None:
    try:
        db.session.delete(session)
        db.session.flush()
    except Exception:
        db.session.rollback()


def invalidate_all_user_sessions(user_id: int) -> int:
    rows = db.session.query(Session).filter(Session.user_id == user_id).all()
    n = len(rows)
    for s in rows:
        db.session.delete(s)
    db.session.flush()
    return n


def lookup_session(raw_token: str) -> Session | None:
    """Look up a session by raw token. Returns None if missing / expired."""
    if not raw_token:
        return None
    h = _hash(raw_token)
    sess = db.session.query(Session).filter(Session.token_hash == h).first()
    if sess is None:
        return None
    if sess.is_expired:
        try:
            db.session.delete(sess)
            db.session.commit()
        except Exception:
            db.session.rollback()
        return None
    return sess


def slide_session_expiry(session: Session) -> None:
    """Extend idle expiry for successful activity, capped at absolute expiry.

    The conditional update prevents a concurrent request from reviving an
    expired row, while the SQL CASE prevents out-of-order responses from
    shortening a later request's deadline.
    """
    now = _utcnow()
    absolute_expiry = session.absolute_expires_at
    if absolute_expiry.tzinfo is None:
        absolute_expiry = absolute_expiry.replace(tzinfo=_dt.timezone.utc)
    next_expiry = min(now + _idle_session_lifetime(), absolute_expiry)
    if next_expiry <= now:
        return

    from sqlalchemy import case, update

    statement = (
        update(Session)
        .execution_options(synchronize_session=False)
        .where(
            Session.id == session.id,
            Session.expires_at > now,
            Session.absolute_expires_at > now,
        )
        # Concurrent requests can finish out of order; keep the furthest
        # valid deadline instead of letting a slower request shorten it.
        .values(expires_at=case(
            (Session.expires_at < next_expiry, next_expiry),
            else_=Session.expires_at,
        ))
    )
    db.session.execute(statement)
    db.session.commit()


def get_current_session() -> Session | None:
    """Resolve the current session from the `session_token` cookie."""
    raw = request.cookies.get(current_app.config.get("SESSION_COOKIE_NAME", "session_token"))
    if not raw:
        return None
    if hasattr(g, "_current_session"):
        return g._current_session
    sess = lookup_session(raw)
    g._current_session = sess
    return sess


def set_session_cookies(response, raw_token: str, csrf_token: str) -> None:
    """Attach the session + csrf cookies to a response object."""
    cfg = current_app.config
    ttl_seconds = int(cfg.get("SESSION_TTL_HOURS", 12)) * 3600

    # session cookie: HttpOnly, SameSite, Secure (prod), path=/, max-age
    response.set_cookie(
        cfg.get("SESSION_COOKIE_NAME", "session_token"),
        value=raw_token,
        max_age=ttl_seconds,
        httponly=True,
        secure=bool(cfg.get("SESSION_COOKIE_SECURE", False)),
        samesite=str(cfg.get("SESSION_COOKIE_SAMESITE", "Lax")),
        path="/",
    )
    # csrf cookie: NON-HttpOnly so the SPA can read it
    response.set_cookie(
        cfg.get("CSRF_COOKIE_NAME", "csrf_token"),
        value=csrf_token,
        max_age=ttl_seconds,
        httponly=False,
        secure=bool(cfg.get("CSRF_COOKIE_SECURE", False)),
        samesite=str(cfg.get("CSRF_COOKIE_SAMESITE", "Lax")),
        path="/",
    )


def clear_session_cookies(response) -> None:
    cfg = current_app.config
    response.delete_cookie(cfg.get("SESSION_COOKIE_NAME", "session_token"), path="/")
    response.delete_cookie(cfg.get("CSRF_COOKIE_NAME", "csrf_token"), path="/")


def issue_csrf_cookie(response, csrf_token: str) -> None:
    """(Re)issue the non-HttpOnly csrf cookie. Used by GET /auth/csrf."""
    cfg = current_app.config
    ttl_seconds = int(cfg.get("SESSION_TTL_HOURS", 12)) * 3600
    response.set_cookie(
        cfg.get("CSRF_COOKIE_NAME", "csrf_token"),
        value=csrf_token,
        max_age=ttl_seconds,
        httponly=False,
        secure=bool(cfg.get("CSRF_COOKIE_SECURE", False)),
        samesite=str(cfg.get("CSRF_COOKIE_SAMESITE", "Lax")),
        path="/",
    )


__all__ = [
    "create_session",
    "rotate_session",
    "invalidate_session",
    "invalidate_all_user_sessions",
    "lookup_session",
    "slide_session_expiry",
    "get_current_session",
    "set_session_cookies",
    "clear_session_cookies",
    "issue_csrf_cookie",
]
