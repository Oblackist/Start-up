"""Argon2id password hashing with HMAC-SHA-256 pepper preprocessing.

Pipeline (per docs/CONTRACT.md §4):
    raw_password
        ──HMAC-SHA-256(PASSWORD_PEPPER)──>  base64url digest
        ──prepend "v1:"────────────────>  "v1:<b64>"
        ──argon2id──>                    encoded hash string

The version tag lets us evolve the pepper pipeline later without
invalidating existing hashes.

Verify reads the version tag, recomputes the pepper digest, and asks
Argon2 to verify against the stored encoded string.
"""
from __future__ import annotations

import base64
import hashlib
import hmac
import os

from argon2 import PasswordHasher as _Argon2Hasher
from argon2.exceptions import InvalidHashError, VerificationError

PEPPER_VERSION = "v1"


def _pepper() -> bytes:
    """Fetch the pepper.

    Prefer the active Flask config object (which carries the DevConfig
    non-empty default AND the production-validated value), so a developer
    who forgot to copy `.env` can still register in dev. Fall back to the raw
    env var only when there is no app context (e.g., a CLI script run outside
    the app).

    Caller validates presence in prod via ProductionConfig.validate().
    """
    pepper = ""
    try:
        from flask import current_app  # local import to avoid cycles
        pepper = (current_app.config.get("PASSWORD_PEPPER") or "").strip()
    except Exception:
        pepper = (os.environ.get("PASSWORD_PEPPER", "") or "").strip()
    return pepper.encode("utf-8")


def _apply_pepper(password: str) -> str:
    """HMAC-SHA-256 the password with the pepper, base64url-encode, version-tag."""
    pepper = _pepper()
    if not pepper:
        # If we got here in production, create_app should have already refused
        # to start. We treat missing pepper as a hard error.
        raise RuntimeError("PASSWORD_PEPPER is not configured")
    mac = hmac.new(pepper, password.encode("utf-8"), hashlib.sha256).digest()
    b64 = base64.urlsafe_b64encode(mac).rstrip(b"=").decode("ascii")
    return f"{PEPPER_VERSION}:{b64}"


def _hasher() -> _Argon2Hasher:
    """Build an Argon2 PasswordHasher with params from the active Flask config.

    If we are outside an app context (rare), fall back to conservative
    production params.
    """
    try:
        from flask import current_app  # local import to avoid cycles
        cfg = current_app.config
        return _Argon2Hasher(
            time_cost=int(cfg.get("ARGON2_TIME_COST", 2)),
            memory_cost=int(cfg.get("ARGON2_MEMORY_COST", 65536)),
            parallelism=int(cfg.get("ARGON2_PARALLELISM", 2)),
            hash_len=int(cfg.get("ARGON2_HASH_LEN", 32)),
            salt_len=int(cfg.get("ARGON2_SALT_LEN", 16)),
        )
    except Exception:
        return _Argon2Hasher()


def hash_password(password: str) -> str:
    """Hash a plaintext password with pepper preprocessing + Argon2id.

    Returns the Argon2 encoded hash string (suitable for storing in
    `users.password_hash`).
    """
    peppered = _apply_pepper(password)
    return _hasher().hash(peppered)


def verify_password(password: str, encoded: str) -> bool:
    """Verify a password against a stored Argon2id encoded hash.

    Returns True on match, False otherwise. Never raises on bad input.
    """
    if not encoded:
        return False
    peppered = _apply_pepper(password)
    try:
        return _hasher().verify(encoded, peppered)
    except VerificationError:
        return False
    except InvalidHashError:
        return False
    except Exception:
        return False


def needs_rehash(encoded: str) -> bool:
    """True if the encoded hash should be re-hashed (params changed)."""
    try:
        return _hasher().check_needs_rehash(encoded)
    except Exception:
        return False


__all__ = [
    "PEPPER_VERSION",
    "hash_password",
    "verify_password",
    "needs_rehash",
]
