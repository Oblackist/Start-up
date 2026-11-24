"""Liveness and readiness probes for the API service."""
from __future__ import annotations

from flask import Blueprint, current_app, jsonify
from sqlalchemy import text

from ..extensions import db
from ..middleware.security import current_request_id
from ..security.rate_limit import RedisRateLimiter, get_rate_limiter

bp = Blueprint("health", __name__)


@bp.route("/health", methods=["GET"])
def health():
    """Check the database and the shared limiter when Redis is configured."""
    dependency = "database"
    result = {"status": "ok", "db": "ok"}
    try:
        db.session.execute(text("SELECT 1")).first()
        limiter = get_rate_limiter()
        if isinstance(limiter, RedisRateLimiter):
            dependency = "redis"
            if not limiter.client.ping():
                raise RuntimeError("Redis ping failed")
            result["redis"] = "ok"
    except Exception:
        current_app.logger.warning(
            "Readiness check failed dependency=%s request_id=%s",
            dependency, current_request_id(),
        )
        return jsonify({"status": "not_ready"}), 503
    return jsonify(result), 200


@bp.route("/health/live", methods=["GET"])
def liveness():
    """Liveness probe intentionally avoids dependencies such as the database."""
    return jsonify({"status": "ok"}), 200


__all__ = ["bp"]
