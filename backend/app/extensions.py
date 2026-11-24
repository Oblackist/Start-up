"""Flask extension singletons. Importable from anywhere without circular refs."""
from __future__ import annotations

from flask_cors import CORS
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()
cors = CORS()

__all__ = ["db", "migrate", "cors"]
