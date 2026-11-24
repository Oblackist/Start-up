from __future__ import annotations

import os

from dotenv import load_dotenv
from flask import Flask

from .config import apply_environment_overrides, get_config, resolve_db_url_for_app
from .extensions import cors, db, migrate
from .security.rate_limit import configure_rate_limiter
from .middleware.security import (
    install_request_lifecycle,
    install_security_middleware,
)
from .observability import configure_app_logging
from .routes import register_blueprints
from .routes.errors import register_error_handlers
from .routes.captcha_routes import captcha_v2_bp  # Captcha blueprint-ini buradan import edirik


def create_app(config_object: object | None = None) -> Flask:
  """Create and configure the Flask application.

  Args:
      config_object: optional pre-built config object (used by tests).
        If None, the config is selected via FLASK_ENV.

  Raises:
      RuntimeError: in production if required secrets are missing.
  """
  # Load `.env` if present (does NOT override real env vars).
  here = os.path.dirname(os.path.abspath(__file__))
  project_root = os.path.dirname(here)
  load_dotenv(os.path.join(project_root, ".env"), override=False)

  app = Flask(__name__, instance_relative_config=True)
  configure_app_logging(app)

  if config_object is None:
    cfg_cls = get_config()
    cfg_cls.validate()
    app.config.from_object(cfg_cls)

    _db_uri, _ignored_db = resolve_db_url_for_app()
    app.config["SQLALCHEMY_DATABASE_URI"] = _db_uri
    if _ignored_db:
      app.logger.warning(
          "Unsupported database URL was ignored (not a SQLAlchemy URL). "
          "Set FLASK_DATABASE_URL to configure this app's database "
          "explicitly; using the default SQLite path instead."
      )

    _pepper_env = (os.environ.get("PASSWORD_PEPPER") or "").strip()
    if _pepper_env:
      app.config["PASSWORD_PEPPER"] = _pepper_env
    elif not (app.config.get("PASSWORD_PEPPER") or "").strip() and app.config.get(
        "ENV_NAME"
    ) in ("development", "testing"):
      app.config["PASSWORD_PEPPER"] = (
          "dev-pepper-not-for-production-please-set-a-real-one-in-.env"
      )

    _turnstile_env = (os.environ.get("TURNSTILE_SECRET_KEY") or "").strip()
    if _turnstile_env:
      app.config["TURNSTILE_SECRET_KEY"] = _turnstile_env
  else:
    if hasattr(config_object, "validate"):
      config_object.validate()
    app.config.from_object(config_object)

  apply_environment_overrides(app.config)
  configure_rate_limiter(app)

  # Ensure instance folder exists for SQLite default path.
  try:
    os.makedirs(app.instance_path, exist_ok=True)
  except OSError:
    pass

  # Extensions
  db.init_app(app)
  migrate.init_app(app, db)

  # CORS — single origin, credentials allowed.
  cors.init_app(
      app,
      origins=[app.config["FRONTEND_ORIGIN"]],
      supports_credentials=True,
      vary_header=True,
      methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  )

  # Security middleware (headers, request size guard, DB lifecycle, SQLite pragmas)
  install_security_middleware(app)
  install_request_lifecycle(app)

  # Routes (health included via the health blueprint)
  register_blueprints(app)
  register_error_handlers(app)
  
  # Captcha blueprint-ini url_prefix ilə qeydiyyatdan keçiririk:
  app.register_blueprint(captcha_v2_bp, url_prefix='/api/v1/captcha')

  # Ana səhifə marşrutu
  @app.route("/")
  def home():
    return {"status": "ok", "message": "Server uğurla işləyir!"}

  return app


__all__ = ["create_app"]
