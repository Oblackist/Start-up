"""Offline Alembic SQL generation for a clean PostgreSQL database."""

import os
import subprocess
import sys
from pathlib import Path


def test_clean_postgresql_upgrade_can_generate_offline_sql():
    backend = Path(__file__).resolve().parents[1]
    env = os.environ.copy()
    env["FLASK_DATABASE_URL"] = (
        "postgresql://migration:migration@localhost:5432/career"
        "?sslmode=require"
    )
    env["FLASK_ENV"] = "development"

    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "flask",
            "--app",
            "wsgi:application",
            "db",
            "upgrade",
            "--sql",
        ],
        cwd=backend,
        env=env,
        capture_output=True,
        text=True,
        timeout=60,
        check=False,
    )

    assert result.returncode == 0, result.stderr
    sql = result.stdout
    assert "CREATE TABLE users" in sql
    assert "ALTER TABLE users ADD COLUMN otp_hash" in sql
    assert "DROP COLUMN otp_code" in sql
    assert "INSERT INTO alembic_version" in sql
