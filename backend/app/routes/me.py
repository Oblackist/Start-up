"""Per-user routes: /me/attempts, /me/progress."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..services.progress_service import progress_service
from ..security.session import get_current_session
from ..utils.errors import ApiError, ErrorCode
from ..utils.pagination import paginate_items
from ..models.user import User
from ..extensions import db

bp = Blueprint("me", __name__)


def _current_user() -> User:
    sess = get_current_session()
    if sess is None:
        raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")
    user = db.session.get(User, sess.user_id)
    if user is None:
        raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")
    return user


@bp.route("/me/attempts", methods=["GET"])
def list_attempts():
    user = _current_user()
    try:
        page = max(1, int(request.args.get("page", "1")))
    except ValueError:
        page = 1
    try:
        per_page = max(1, min(100, int(request.args.get("per_page", "10"))))
    except ValueError:
        per_page = 10
    body = progress_service.list_attempts(user.id, page, per_page)
    return jsonify(body), 200


@bp.route("/me/progress", methods=["GET"])
def progress():
    user = _current_user()
    body = progress_service.dashboard(user.id)
    return jsonify(body), 200


__all__ = ["bp"]
