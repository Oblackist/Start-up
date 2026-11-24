"""Dev entry point.

    python3 run.py

Production must use a real WSGI server, e.g.::

    gunicorn -w 4 -b 0.0.0.0:5000 wsgi:application
"""
from __future__ import annotations

import os

from app import create_app

app = create_app()


if __name__ == "__main__":
    # Debug is OFF by spec; use FLASK_ENV for behavior switching.
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", 5000)), debug=False)
