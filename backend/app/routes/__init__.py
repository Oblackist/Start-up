"""Blueprint registration. All under /api/v1."""
from __future__ import annotations

from flask import Flask


def register_blueprints(app: Flask) -> None:
    from .auth import bp as auth_bp
    from .admin import bp as admin_bp
    from .subjects import bp as subjects_bp
    from .tests import bp as tests_bp
    from .me import bp as me_bp
    from .practice import bp as practice_bp
    from .health import bp as health_bp
    from .leaderboard import bp as leaderboard_bp

    api_prefix = "/api/v1"
    app.register_blueprint(auth_bp, url_prefix=api_prefix)
    app.register_blueprint(admin_bp, url_prefix=api_prefix)
    app.register_blueprint(subjects_bp, url_prefix=api_prefix)
    app.register_blueprint(tests_bp, url_prefix=api_prefix)
    app.register_blueprint(me_bp, url_prefix=api_prefix)
    app.register_blueprint(practice_bp, url_prefix=api_prefix)
    app.register_blueprint(health_bp, url_prefix=api_prefix)
    app.register_blueprint(leaderboard_bp, url_prefix=api_prefix)


__all__ = ["register_blueprints"]
