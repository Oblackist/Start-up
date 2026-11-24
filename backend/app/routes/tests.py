"""Test routes: /tests, /tests/<id>/submit, /tests/<id>."""
from __future__ import annotations

from flask import Blueprint, jsonify, request

from ..schemas.test import CreateTestSchema, SubmitTestSchema
from ..services.test_service import test_service
from ..security.csrf import require_csrf

bp = Blueprint("tests", __name__)


@bp.route("/tests", methods=["POST", "OPTIONS"])
@require_csrf
def create_test():
    if request.method == "OPTIONS":
        return ("", 204)
    payload = request.get_json(force=True, silent=True)
    if payload is None:
        from ..utils.errors import ApiError, ErrorCode
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    try:
        data = CreateTestSchema().load(payload)
    except Exception as exc:
        from ..utils.errors import ApiError, ErrorCode
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=getattr(exc, "messages", None))
    body = test_service.start_test(
        data["subject_id"], data.get("topic_id"), data.get("question_count"),
        data.get("grade"), data.get("quiz")
    )
    return jsonify(body), 201


@bp.route("/tests/<int:attempt_id>/submit", methods=["POST", "OPTIONS"])
@require_csrf
def submit_test(attempt_id: int):
    if request.method == "OPTIONS":
        return ("", 204)
    payload = request.get_json(force=True, silent=True)
    if payload is None:
        from ..utils.errors import ApiError, ErrorCode
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    try:
        data = SubmitTestSchema().load(payload)
    except Exception as exc:
        from ..utils.errors import ApiError, ErrorCode
        msg = "Daxil edilən məlumat yararsızdır"
        if isinstance(exc, ValueError):
            msg = str(exc)
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, msg)
    body = test_service.submit_test(attempt_id, data["answers"], data.get("written_answers"))
    return jsonify(body), 200


@bp.route("/tests/<int:attempt_id>", methods=["GET"])
def get_test(attempt_id: int):
    body = test_service.get_result(attempt_id)
    return jsonify(body), 200


__all__ = ["bp"]
