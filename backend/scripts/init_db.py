"""Apply DB migrations. Load exam content with import_question_dump.py.

Non-destructive: NEVER drops tables or deletes users. Re-runnable.
"""
from __future__ import annotations

import os
import sys

# Allow `python3 scripts/init_db.py` from the backend root without install.
HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND_ROOT = os.path.dirname(HERE)
if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

from app import create_app  # noqa: E402


def run() -> None:
    app = create_app()
    with app.app_context():
        from flask_migrate import upgrade
        upgrade(directory=os.path.join(BACKEND_ROOT, "migrations"))
    print("[init_db] done.")


if __name__ == "__main__":
    run()
