"""Regression checks for schema upgrades used in deploys."""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import inspect
from sqlalchemy import text
import logging

from app import create_app
from app.config import TestingConfig
from app.extensions import db


def test_fresh_migration_creates_all_user_model_columns(tmp_path):
    cfg = TestingConfig()
    cfg.SQLALCHEMY_DATABASE_URI = f"sqlite:///{tmp_path / 'migrated.db'}"
    app = create_app(config_object=cfg)

    with app.app_context():
        from flask_migrate import upgrade

        app.logger.disabled = False
        upgrade(directory="migrations")
        columns = {column["name"] for column in inspect(db.engine).get_columns("users")}
        assert not app.logger.disabled, "Alembic disabled application logging"
        db.session.remove()

    assert {"is_verified", "otp_hash", "pending_email", "otp_expires_at", "mfa_enabled", "totp_secret_encrypted", "mfa_last_counter"} <= columns
    assert "otp_code" not in columns


def test_upgrade_discards_legacy_plaintext_otp_and_invalidates_challenge(tmp_path):
    cfg = TestingConfig()
    cfg.SQLALCHEMY_DATABASE_URI = f"sqlite:///{tmp_path / 'legacy.db'}"
    app = create_app(config_object=cfg)
    now = datetime.now(timezone.utc)
    with app.app_context():
        from flask_migrate import upgrade

        app.logger.disabled = False
        upgrade(directory="migrations", revision="67d0ed4b11c2")
        db.session.execute(text("""
            INSERT INTO users (name, email, password_hash, is_active, created_at,
                is_verified, otp_code, otp_expires_at, pending_email)
            VALUES (:name, :email, :password_hash, 1, :created_at,
                0, :otp_code, :otp_expires_at, :pending_email)
        """), {
            "name": "Pending", "email": "pending@example.com",
            "password_hash": "argon2-hash", "created_at": now,
            "otp_code": "012345", "otp_expires_at": now,
            "pending_email": "new@example.com",
        })
        db.session.commit()
        upgrade(directory="migrations")
        row = db.session.execute(text(
            "SELECT is_verified, otp_hash, otp_expires_at, pending_email FROM users"
        )).mappings().one()
        db.session.remove()

    assert row["is_verified"] == 0
    assert row["otp_hash"] is None
    assert row["otp_expires_at"] is None
    assert row["pending_email"] is None


def test_otp_migration_handles_legacy_schema_without_pending_email(tmp_path):
    cfg = TestingConfig()
    cfg.SQLALCHEMY_DATABASE_URI = f"sqlite:///{tmp_path / 'legacy-no-pending-email.db'}"
    app = create_app(config_object=cfg)
    with app.app_context():
        from flask_migrate import upgrade

        app.logger.disabled = False
        upgrade(directory="migrations", revision="67d0ed4b11c2")
        from alembic.migration import MigrationContext
        from alembic.operations import Operations
        with db.engine.begin() as connection:
            operations = Operations(MigrationContext.configure(connection))
            with operations.batch_alter_table("users") as batch_op:
                batch_op.drop_column("pending_email")
        db.session.execute(text("""
            INSERT INTO users (name, email, password_hash, is_active, created_at,
                is_verified, otp_code, otp_expires_at)
            VALUES ('Legacy', 'legacy@example.com', 'argon2-hash', 1, :created_at,
                0, '012345', :otp_expires_at)
        """), {"created_at": datetime.now(timezone.utc), "otp_expires_at": datetime.now(timezone.utc)})
        db.session.commit()

        upgrade(directory="migrations")
        columns = {column["name"] for column in inspect(db.engine).get_columns("users")}
        row = db.session.execute(text(
            "SELECT is_verified, otp_hash, otp_expires_at FROM users"
        )).mappings().one()
        db.session.remove()

    assert "otp_code" not in columns
    assert "otp_hash" in columns
    assert row["is_verified"] == 0
    assert row["otp_hash"] is None
    assert row["otp_expires_at"] is None


def test_mfa_migration_adds_challenge_and_recovery_tables(tmp_path):
    cfg = TestingConfig()
    cfg.SQLALCHEMY_DATABASE_URI = f"sqlite:///{tmp_path / 'mfa.db'}"
    app = create_app(config_object=cfg)
    with app.app_context():
        from flask_migrate import upgrade

        app.logger.disabled = False
        upgrade(directory="migrations")
        inspector = inspect(db.engine)
        tables = set(inspector.get_table_names())
        assert {"mfa_challenges", "mfa_recovery_codes"} <= tables
        assert {"challenge_hash", "attempts", "expires_at", "consumed_at"} <= {
            c["name"] for c in inspector.get_columns("mfa_challenges")
        }
        assert {"code_hash", "used_at"} <= {
            c["name"] for c in inspector.get_columns("mfa_recovery_codes")
        }


def test_idle_session_migration_preserves_existing_absolute_deadline(tmp_path):
    cfg = TestingConfig()
    cfg.SQLALCHEMY_DATABASE_URI = f"sqlite:///{tmp_path / 'sessions.db'}"
    app = create_app(config_object=cfg)
    now = datetime.now(timezone.utc)
    old_deadline = datetime(2026, 11, 14, 20, 0, tzinfo=timezone.utc)

    with app.app_context():
        from flask_migrate import upgrade

        upgrade(directory="migrations", revision="f710ae9c2841")
        db.session.execute(text("""
            INSERT INTO users (name, email, password_hash, is_active, created_at,
                is_verified, mfa_enabled)
            VALUES ('Session User', 'session@example.com', 'argon2-hash', 1,
                :created_at, 1, 0)
        """), {"created_at": now})
        db.session.execute(text("""
            INSERT INTO sessions (user_id, token_hash, csrf_token, created_at, expires_at)
            VALUES (1, :token_hash, :csrf_token, :created_at, :expires_at)
        """), {
            "token_hash": "a" * 64,
            "csrf_token": "b" * 64,
            "created_at": now,
            "expires_at": old_deadline,
        })
        db.session.commit()

        upgrade(directory="migrations")
        row = db.session.execute(text(
            "SELECT expires_at, absolute_expires_at FROM sessions"
        )).mappings().one()
        db.session.remove()

    absolute_deadline = row["absolute_expires_at"]
    if isinstance(absolute_deadline, str):
        absolute_deadline = datetime.fromisoformat(absolute_deadline)
    if absolute_deadline.tzinfo is None:
        absolute_deadline = absolute_deadline.replace(tzinfo=timezone.utc)
    idle_deadline = row["expires_at"]
    if isinstance(idle_deadline, str):
        idle_deadline = datetime.fromisoformat(idle_deadline)
    if idle_deadline.tzinfo is None:
        idle_deadline = idle_deadline.replace(tzinfo=timezone.utc)
    assert absolute_deadline == old_deadline
    assert idle_deadline == old_deadline
