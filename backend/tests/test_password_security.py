"""Tests for password security (Argon2id + pepper + salt uniqueness)."""
from __future__ import annotations

import os

import pytest

from app.security.password import (
    hash_password,
    verify_password,
    needs_rehash,
    PEPPER_VERSION,
)


class TestPasswordSecurity:
    def test_hash_is_argon2id_encoded_string(self, app):
        h = hash_password("Parol1ab")
        assert isinstance(h, str)
        assert h.startswith("$argon2id$"), "expected argon2id encoded hash"

    def test_verify_password_correct(self, app):
        h = hash_password("Parol1ab")
        assert verify_password("Parol1ab", h) is True

    def test_verify_password_wrong(self, app):
        h = hash_password("Parol1ab")
        assert verify_password("WrongPass1", h) is False

    def test_verify_password_empty_hash_returns_false(self, app):
        assert verify_password("Parol1ab", "") is False

    def test_verify_password_garbage_hash_returns_false(self, app):
        assert verify_password("Parol1ab", "not-a-hash") is False

    def test_unique_salts_two_hashes_differ(self, app):
        h1 = hash_password("Parol1ab")
        h2 = hash_password("Parol1ab")
        # Even though passwords are identical, the salts differ.
        assert h1 != h2, "argon2 must use a unique salt per hash"

    def test_no_plaintext_password_in_hash(self, app):
        h = hash_password("Parol1ab")
        assert "Parol1ab" not in h
        assert "Parol" not in h

    def test_pepper_is_applied_versioned(self, app):
        # The peppered input is never passed raw to argon2 — verify the
        # pipeline indirectly: hashing the same password twice gives
        # different hashes (salt) but both verify against the SAME pepper.
        h1 = hash_password("Parol1ab")
        # If pepper were NOT applied, hashing "Parol1ab" with a fresh argon2
        # would also pass verify_password. The version tag is on the
        # peppered input, not stored — but verify_password checks the
        # peppered variant against the encoded hash, so:
        assert verify_password("Parol1ab", h1) is True
        # If pepper were different (or absent), verify_password would fail.
        # Mutate pepper and confirm verification fails.
        original = os.environ.get("PASSWORD_PEPPER")
        try:
            os.environ["PASSWORD_PEPPER"] = "different-pepper-value-xyz"
            assert verify_password("Parol1ab", h1) is False, (
                "verify_password must depend on the pepper"
            )
        finally:
            if original is None:
                os.environ.pop("PASSWORD_PEPPER", None)
            else:
                os.environ["PASSWORD_PEPPER"] = original

    def test_missing_pepper_in_production_fails_startup(self, monkeypatch):
        # Simulate production with NO pepper set.
        for k in ("PASSWORD_PEPPER", "FRONTEND_ORIGIN", "SECRET_KEY"):
            monkeypatch.delenv(k, raising=False)
        monkeypatch.setenv("FLASK_ENV", "production")
        from app.config import ProductionConfig
        with pytest.raises(RuntimeError):
            ProductionConfig.validate()

    def test_placeholder_pepper_in_production_fails_startup(self, monkeypatch):
        monkeypatch.setenv("FLASK_ENV", "production")
        monkeypatch.setenv("PASSWORD_PEPPER", "change-me-32+random-bytes-please")
        monkeypatch.setenv("SECRET_KEY", "real-secret-of-at-least-16-chars")
        monkeypatch.setenv("FRONTEND_ORIGIN", "https://example.com")
        monkeypatch.setenv("MFA_ENCRYPTION_KEY", "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=")
        from app.config import ProductionConfig
        with pytest.raises(RuntimeError):
            ProductionConfig.validate()

    def test_short_pepper_in_production_fails_startup(self, monkeypatch):
        monkeypatch.setenv("FLASK_ENV", "production")
        monkeypatch.setenv("PASSWORD_PEPPER", "short")
        monkeypatch.setenv("SECRET_KEY", "real-secret-of-at-least-16-chars")
        monkeypatch.setenv("FRONTEND_ORIGIN", "https://example.com")
        monkeypatch.setenv("MFA_ENCRYPTION_KEY", "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=")
        from app.config import ProductionConfig
        with pytest.raises(RuntimeError):
            ProductionConfig.validate()

    def test_valid_production_config_passes_validation(self, monkeypatch):
        monkeypatch.setenv("FLASK_ENV", "production")
        monkeypatch.setenv(
            "FLASK_DATABASE_URL",
            "postgresql://dbuser:dbpassword@db.example.test:5432/career?sslmode=require",
        )
        monkeypatch.setenv("PASSWORD_PEPPER", "real-strong-pepper-of-at-least-32-bytes!!")
        monkeypatch.setenv("SECRET_KEY", "real-strong-secret-of-at-least-32-bytes!!")
        monkeypatch.setenv("FRONTEND_ORIGIN", "https://example.com")
        monkeypatch.setenv("MFA_ENCRYPTION_KEY", "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=")
        monkeypatch.setenv("SMTP_HOST", "smtp.example.com")
        monkeypatch.setenv("SMTP_FROM", "no-reply@example.com")
        monkeypatch.setenv("SMTP_STARTTLS", "true")
        monkeypatch.setenv("SMTP_USE_SSL", "false")
        monkeypatch.setenv("RATE_LIMIT_BACKEND", "redis")
        monkeypatch.setenv("REDIS_URL", "rediss://cache.example.test:6379/0")
        from app.config import ProductionConfig
        ProductionConfig.validate()  # must NOT raise
