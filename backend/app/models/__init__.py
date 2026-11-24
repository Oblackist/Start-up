"""SQLAlchemy models for the Career Arena · Exam Arena backend.

Tables (per docs/CONTRACT.md §5):
- users, sessions, password_reset_tokens
- subjects, topics, questions
- test_attempts, answers
- audit_logs
"""
from __future__ import annotations

from .user import User, Session, PasswordResetToken  # noqa: F401
from .content import Subject, Topic, Question  # noqa: F401
from .test import TestAttempt, Answer  # noqa: F401
from .audit import AuditLog  # noqa: F401
from .mfa import MfaChallenge, MfaRecoveryCode  # noqa: F401

__all__ = [
    "User",
    "Session",
    "PasswordResetToken",
    "Subject",
    "Topic",
    "Question",
    "TestAttempt",
    "Answer",
    "AuditLog",
    "MfaChallenge",
    "MfaRecoveryCode",
]
