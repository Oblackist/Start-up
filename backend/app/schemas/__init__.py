"""Marshmallow schemas (strict: rejects unknown fields)."""
from __future__ import annotations

from .auth import (  # noqa: F401
    RegisterSchema,
    LoginSchema,
    ChangePasswordSchema,
    PasswordResetRequestSchema,
    PasswordResetConfirmSchema,
)
from .test import (  # noqa: F401
    CreateTestSchema,
    SubmitTestSchema,
)

__all__ = [
    "RegisterSchema",
    "LoginSchema",
    "ChangePasswordSchema",
    "PasswordResetRequestSchema",
    "PasswordResetConfirmSchema",
    "CreateTestSchema",
    "SubmitTestSchema",
]
