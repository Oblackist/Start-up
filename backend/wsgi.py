"""Production WSGI entry point.

    gunicorn -w 4 -b 0.0.0.0:5000 wsgi:application

FLASK_ENV must be `production` and required secrets must be set in the
environment; `create_app()` raises on misconfiguration.
"""
from __future__ import annotations

from app import create_app

application = create_app()
