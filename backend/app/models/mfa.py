"""Database records for short-lived MFA login challenges and recovery codes."""
from __future__ import annotations

import datetime as _dt

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from ..extensions import db


def _utcnow() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc)


class MfaChallenge(db.Model):
    __tablename__ = "mfa_challenges"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    challenge_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[_dt.datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    expires_at: Mapped[_dt.datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[_dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class MfaRecoveryCode(db.Model):
    __tablename__ = "mfa_recovery_codes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    code_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    created_at: Mapped[_dt.datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)
    used_at: Mapped[_dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

