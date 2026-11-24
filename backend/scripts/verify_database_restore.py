"""Exercise a seeded disposable database before and after a CI backup."""

import argparse
import os
import time

from alembic.script import ScriptDirectory
from sqlalchemy import text
from sqlalchemy.engine import make_url

from app import create_app
from app.config import TestingConfig, resolve_db_url_for_app
from app.extensions import db
from app.security.totp import totp_code
from tests.conftest import register_and_login


EMAIL = "restore-drill@example.com"
PASSWORD = "RestoreDrill123"
RESTORE_DATABASES = {"prepare": "career_source", "verify": "career_restored"}


def prepare(client):
    csrf, _, _ = register_and_login(client, email=EMAIL, password=PASSWORD)
    enrollment = client.post(
        "/api/v1/auth/mfa/enroll",
        json={"current_password": PASSWORD},
        headers={"X-CSRF-Token": csrf},
    )
    assert enrollment.status_code == 200, "Could not start MFA enrollment"
    secret = enrollment.get_json()["secret"]
    confirmed = client.post(
        "/api/v1/auth/mfa/confirm",
        json={"code": totp_code(secret, int(time.time()) - 30)},
        headers={"X-CSRF-Token": csrf},
    )
    assert confirmed.status_code == 200, "Could not confirm MFA enrollment"
    csrf = client.get_cookie("csrf_token").value
    headers = {"X-CSRF-Token": csrf}
    attempt = client.post(
        "/api/v1/tests", json={"subject_id": "math", "question_count": 1}, headers=headers
    )
    assert attempt.status_code == 201, "Could not start an exam with seeded questions"
    body = attempt.get_json()
    result = client.post(
        f"/api/v1/tests/{body['attempt_id']}/submit",
        json={"answers": {str(body["questions"][0]["id"]): "A"}},
        headers=headers,
    )
    assert result.status_code == 200, "Could not submit the exam in the source database"


def verify(client):
    ready = client.get("/api/v1/health")
    assert ready.status_code == 200, "Database readiness failed"
    with client.application.app_context():
        config = client.application.extensions["migrate"].migrate.get_config()
        assert db.session.scalar(text("SELECT version_num FROM alembic_version")) == (
            ScriptDirectory.from_config(config).get_current_head()
        ), "Database schema is not at the release head"

    result = client.post("/api/v1/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert result.status_code == 200 and result.get_json()["mfa_required"] is True
    assert client.get("/api/v1/auth/me").status_code == 401
    with client.application.app_context():
        from app.models.user import User
        from app.security.totp import decrypt_totp_secret

        user = db.session.query(User).filter_by(email=EMAIL).one()
        secret = decrypt_totp_secret(user.totp_secret_encrypted)
    verified = client.post(
        "/api/v1/auth/mfa/challenge",
        json={"challenge_token": result.get_json()["challenge_token"], "code": totp_code(secret)},
    )
    assert verified.status_code == 200, "TOTP sign-in failed after restore"
    assert verified.get_json()["user"]["email"] == EMAIL
    history = client.get("/api/v1/me/attempts")
    assert history.status_code == 200
    attempts = history.get_json()
    assert attempts["total"] == 1 and attempts["items"][0]["subject_id"] == "math"
    assert attempts["items"][0]["total"] == 1


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("step", choices=("prepare", "verify"))
    args = parser.parse_args()
    uri, ignored = resolve_db_url_for_app()
    url = make_url(uri)
    if (
        not os.environ.get("FLASK_DATABASE_URL")
        or ignored
        or url.drivername != "postgresql+psycopg"
        or url.host != "127.0.0.1"
        or url.database != RESTORE_DATABASES[args.step]
        or url.username != "career_ci"
    ):
        parser.error("Set FLASK_DATABASE_URL to the corresponding disposable CI database")
    config = TestingConfig()
    config.SQLALCHEMY_DATABASE_URI = uri
    with create_app(config).test_client() as client:
        action = prepare if args.step == "prepare" else verify
        action(client)
    print(f"Database restore drill: {args.step} passed")


if __name__ == "__main__":
    main()
