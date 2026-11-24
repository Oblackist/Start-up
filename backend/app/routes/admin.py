from flask import Blueprint, jsonify, request
from sqlalchemy import func, select

from ..extensions import db
from ..models.audit import AuditLog
from ..models.content import Question
from ..models.user import User
from ..security.csrf import require_csrf
from ..security.session import get_current_session
from ..services.question_bank import remove_questions
from ..utils.errors import ApiError, ErrorCode

bp = Blueprint("admin", __name__)


def _require_admin() -> User:
    session = get_current_session()
    if session is None:
        raise ApiError(401, ErrorCode.UNAUTHORIZED, "Giriş tələb olunur")
    user = db.session.get(User, session.user_id)
    if user is None or not (user.is_active and user.is_verified and user.is_admin):
        raise ApiError(403, ErrorCode.FORBIDDEN, "Bu səhifəyə yalnız admin hesabı ilə giriş mümkündür")
    return user


@bp.get("/admin/question-bank")
def question_bank():
    _require_admin()
    response = jsonify({"question_count": db.session.scalar(select(func.count()).select_from(Question))})
    response.headers["Cache-Control"] = "no-store"
    return response


@bp.post("/admin/question-bank/clear")
@require_csrf
def clear_question_bank():
    user = _require_admin()
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or payload.get("confirmation") != "SİL":
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Silməni SİL yazaraq təsdiqləyin")
    deleted = remove_questions()
    db.session.add(AuditLog(
        user_id=user.id,
        action="admin_question_bank_cleared",
        details_json={"deleted": deleted},
        ip=(request.remote_addr or "")[:45] or None,
        user_agent=(request.user_agent.string or "")[:255] or None,
    ))
    db.session.commit()
    return jsonify({"deleted": deleted})
