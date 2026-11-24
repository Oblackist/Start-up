"""Audit log helper. NEVER pass raw secrets/tokens; hash first.

`audit_log(action, ...)` is a thin wrapper that flushes to the DB. It
must be safe to call inside an exception handler — failures here
should never leak out as 500s to the user.
"""
from __future__ import annotations

from typing import Any

from flask import current_app, has_app_context, request

from ..extensions import db
from ..models.audit import AuditLog


def audit_log(
    *,
    action: str,
    user_id: int | None = None,
    details: dict[str, Any] | None = None,
    ip: str | None = None,
    user_agent: str | None = None,
) -> None:
    """Insert an audit row. Best-effort: never raises to the caller."""
    if not has_app_context():
        return
    try:
        if ip is None and request is not None:
            ip = request.remote_addr
        if user_agent is None and request is not None:
            user_agent = request.headers.get("User-Agent")
        ua = (user_agent or "")[:255] or None
        ip = (ip or "")[:45] or None
        row = AuditLog(
            user_id=user_id,
            action=action[:60],
            ip=ip,
            user_agent=ua,
            details_json=details,
        )
        db.session.add(row)
        db.session.commit()
    except Exception:
        try:
            db.session.rollback()
        except Exception:
            pass
        current_app.logger.warning("audit_log failed for action=%s", action)


__all__ = ["audit_log"]
