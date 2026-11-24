"""Practice routes: /practice/cards."""
from __future__ import annotations

from flask import Blueprint, jsonify

from ..services.progress_service import progress_service
from ..security.session import get_current_session
from ..utils.errors import ApiError, ErrorCode
from ..models.user import User
from ..extensions import db

bp = Blueprint("practice", __name__)


def _current_user() -> User:
    sess = get_current_session()
    if sess is None:
        raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")
    user = db.session.get(User, sess.user_id)
    if user is None:
        raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")
    return user


@bp.route("/practice/cards", methods=["GET"])
def list_cards():
    user = _current_user()
    body = progress_service.practice_cards(user.id)
    return jsonify(body), 200


__all__ = ["bp"]
