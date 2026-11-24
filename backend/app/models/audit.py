"""AuditLog model. Append-only security event log.

NEVER store passwords, raw session tokens, or raw reset tokens here.
If you must reference a token, store its sha256 hash only.
"""
from __future__ import annotations

import datetime as _dt
from typing import Any

from sqlalchemy import Index, ForeignKey, String, Integer, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column

from ..extensions import db


def _utcnow() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc)


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(60), nullable=False, index=True)
    ip: Mapped[str | None] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    details_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[_dt.datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False, index=True
    )

    __table_args__ = (
        Index("ix_audit_user_action", "user_id", "action"),
    )


__all__ = ["AuditLog"]
