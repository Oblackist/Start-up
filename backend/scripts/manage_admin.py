"""Grant or revoke admin access for an existing account."""
import argparse
from pathlib import Path
import sys

from sqlalchemy import delete, select

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app
from app.extensions import db
from app.models.user import Session, User


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", choices=("grant", "revoke"))
    parser.add_argument("email")
    args = parser.parse_args()
    grant = args.action == "grant"
    with create_app().app_context():
        user = db.session.scalar(select(User).where(User.email == args.email.strip().lower()))
        if user is None:
            parser.error("Account not found.")
        if grant and not (user.is_active and user.is_verified):
            parser.error("The account must be active and email-verified.")
        if user.is_admin != grant:
            user.is_admin = grant
            db.session.execute(delete(Session).where(Session.user_id == user.id))
            db.session.commit()
        print("Admin access enabled." if grant else "Admin access removed.")


if __name__ == "__main__":
    main()
