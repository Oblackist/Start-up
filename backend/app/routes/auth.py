"""Auth routes: /auth/* and /user/*."""
from __future__ import annotations

import re
from flask import Blueprint, jsonify, make_response, request
from marshmallow import ValidationError

from ..models.user import User
from ..extensions import db
from ..schemas.auth import (
    ChangePasswordSchema,
    LoginSchema,
    MfaChallengeSchema,
    MfaCodeSchema,
    MfaEnrollSchema,
    MfaDisableSchema,
    MfaRecoveryRotateSchema,
    PasswordResetConfirmSchema,
    PasswordResetRequestSchema,
    ProfileEmailVerifySchema,
    ProfileUpdateSchema,
    RegisterSchema,
)
from ..security.csrf import require_csrf
from ..security.rate_limit import _client_ip, get_rate_limiter, rate_limit
from ..security.session import (
    clear_session_cookies,
    get_current_session,
    issue_csrf_cookie,
    set_session_cookies,
)
from ..services.auth_service import auth_service
from ..utils.errors import ApiError, ErrorCode
import logging
_log = logging.getLogger(__name__)
bp = Blueprint("auth", __name__)

def _rate_key_email() -> str:
    """Account budget shared across source IPs (hashed by the limiter)."""
    email = ""
    if request.is_json:
        try:
            data = request.get_json(force=True, silent=True) or {}
            email = str(data.get("email") or "").strip().lower()
        except Exception:
            email = ""
    return email


def _rate_key_ip_email() -> str:
    return f"{_client_ip()}|{_rate_key_email()}"

@bp.post("/auth/verify-otp")
@rate_limit("verify_otp_ip", max_count=30, key_fn=_client_ip)
@rate_limit("verify_otp", key_fn=_rate_key_email)
def verify_register_otp():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    
    # auth_service içindəki verify_otp funksiyasını çağırırıq
    body, cookies_kwargs, _ = auth_service.verify_otp(payload)
    resp = jsonify(body), 200
    return _attach_cookies(resp, cookies_kwargs)


@bp.post("/auth/verification/resend")
@rate_limit("verify_resend_ip", max_count=10, key_fn=_client_ip)
@rate_limit("verify_resend", key_fn=_rate_key_email)
def resend_verification():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    try:
        data = PasswordResetRequestSchema().load(payload)
    except ValidationError as exc:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=_normalize_fields(exc)) from exc
    return jsonify(auth_service.resend_verification(data["email"])), 200


@bp.route("/auth/register", methods=["POST"])
@rate_limit("register", key_fn=_client_ip)
def register():
    payload = request.get_json(silent=True)
    if payload is None:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    try:
        data = RegisterSchema().load(payload)
    except ValidationError as exc:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=_normalize_fields(exc)) from exc
    body, cookies_kwargs, _ = auth_service.register(data)
    return _attach_cookies((jsonify(body), 201), cookies_kwargs)


@bp.route("/auth/login", methods=["POST"])
@rate_limit("login", key_fn=_rate_key_ip_email)
def login():
    payload = request.get_json(force=True, silent=True)
    if payload is None:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    try:
        data = LoginSchema().load(payload)
    except Exception as exc:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=_normalize_fields(exc))
    body, cookies_kwargs, _ = auth_service.login(data)
    resp = jsonify(body), 200
    # Keep password-attempt state until MFA is completed.
    if not body.get("mfa_required"):
        get_rate_limiter().reset(_rate_key_ip_email(), "login")
    return _attach_cookies(resp, cookies_kwargs)


@bp.post("/auth/mfa/challenge")
@rate_limit("mfa_challenge", key_fn=_client_ip)
def mfa_challenge():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    try:
        data = MfaChallengeSchema().load(payload)
    except ValidationError as exc:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=_normalize_fields(exc)) from exc
    body, cookies_kwargs, _ = auth_service.mfa_challenge(data)
    get_rate_limiter().reset(f"{_client_ip()}|{body['user']['email']}", "login")
    return _attach_cookies((jsonify(body), 200), cookies_kwargs)


def _authenticated_user_id() -> int:
    session_data = _authenticated_session()
    return session_data.user_id


def _authenticated_session():
    session_data = get_current_session()
    if not session_data or not getattr(session_data, "user_id", None):
        raise ApiError(401, ErrorCode.UNAUTHORIZED, "Giriş tələb olunur")
    return session_data


@bp.post("/auth/mfa/enroll")
@require_csrf
def mfa_enroll():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    try:
        data = MfaEnrollSchema().load(payload)
    except ValidationError as exc:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=_normalize_fields(exc)) from exc
    return jsonify(auth_service.mfa_enroll(_authenticated_user_id(), data["current_password"])), 200


@bp.post("/auth/mfa/confirm")
@require_csrf
def mfa_confirm():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    try:
        data = MfaCodeSchema().load(payload)
    except ValidationError as exc:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=_normalize_fields(exc)) from exc
    body, cookies_kwargs = auth_service.mfa_confirm(_authenticated_user_id(), data["code"])
    return _attach_cookies((jsonify(body), 200), cookies_kwargs)


@bp.post("/auth/mfa/disable")
@require_csrf
def mfa_disable():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    try:
        data = MfaDisableSchema().load(payload)
    except ValidationError as exc:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=_normalize_fields(exc)) from exc
    body, cookies_kwargs = auth_service.mfa_disable(_authenticated_user_id(), data)
    response = make_response(jsonify(body), 200)
    set_session_cookies(response, cookies_kwargs["raw_token"], cookies_kwargs["csrf"])
    return response


@bp.post("/auth/mfa/recovery-codes/rotate")
@require_csrf
@rate_limit("mfa_recovery_rotate", key_fn=_client_ip)
def mfa_recovery_codes_rotate():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    try:
        data = MfaRecoveryRotateSchema().load(payload)
    except ValidationError as exc:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=_normalize_fields(exc)) from exc
    return jsonify(auth_service.mfa_recovery_codes_rotate(_authenticated_user_id(), data)), 200


@bp.get("/auth/sessions")
def list_sessions():
    session_data = _authenticated_session()
    return jsonify(auth_service.list_sessions(session_data.user_id, session_data.id)), 200


@bp.delete("/auth/sessions/<int:session_id>")
@require_csrf
@rate_limit("sessions", key_fn=_client_ip)
def revoke_session(session_id: int):
    session_data = _authenticated_session()
    was_current = auth_service.revoke_session(session_data.user_id, session_id)
    response = make_response(jsonify({"ok": True}), 200)
    if was_current:
        clear_session_cookies(response)
    return response


@bp.post("/auth/sessions/revoke-current")
@require_csrf
@rate_limit("sessions", key_fn=_client_ip)
def revoke_current_session():
    session_data = _authenticated_session()
    auth_service.revoke_session(session_data.user_id, session_data.id)
    response = make_response(jsonify({"ok": True}), 200)
    clear_session_cookies(response)
    return response


@bp.post("/auth/sessions/revoke-others")
@require_csrf
@rate_limit("sessions", key_fn=_client_ip)
def revoke_other_sessions():
    session_data = _authenticated_session()
    count = auth_service.revoke_other_sessions(session_data.user_id, session_data.id)
    return jsonify({"ok": True, "revoked_count": count}), 200


@bp.post("/auth/sessions/revoke-all")
@require_csrf
@rate_limit("sessions", key_fn=_client_ip)
def revoke_all_sessions():
    session_data = _authenticated_session()
    count = auth_service.revoke_all_sessions(session_data.user_id)
    response = make_response(jsonify({"ok": True, "revoked_count": count}), 200)
    clear_session_cookies(response)
    return response


@bp.route("/auth/logout", methods=["POST", "OPTIONS"])
def logout():
    if request.method == "OPTIONS":
        return ("", 204)
    body = auth_service.logout()
    resp = make_response(jsonify(body), 200)
    clear_session_cookies(resp)
    return resp


@bp.route("/auth/me", methods=["GET"])
def me():
    body = auth_service.me()
    return jsonify(body), 200


@bp.route("/auth/csrf", methods=["GET"])
def csrf():
    body, csrf_token = auth_service.csrf()
    resp = make_response(jsonify(body), 200)
    issue_csrf_cookie(resp, csrf_token)
    return resp


@bp.route("/auth/change-password", methods=["POST", "OPTIONS"])
@require_csrf
def change_password():
    if request.method == "OPTIONS":
        return ("", 204)
    payload = request.get_json(force=True, silent=True)
    if payload is None:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    try:
        data = ChangePasswordSchema().load(payload)
    except Exception as exc:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=_normalize_fields(exc))
    body, cookies_kwargs, _ = auth_service.change_password(data)
    resp = make_response(jsonify(body), 200)
    if cookies_kwargs:
        set_session_cookies(resp, cookies_kwargs["raw_token"], cookies_kwargs["csrf"])
    return resp


@bp.route("/auth/password-reset/request", methods=["POST", "OPTIONS"])
@rate_limit("reset", key_fn=_client_ip)
def password_reset_request():
    if request.method == "OPTIONS":
        return ("", 204)
    payload = request.get_json(force=True, silent=True)
    if payload is None:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    try:
        data = PasswordResetRequestSchema().load(payload)
    except Exception as exc:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=_normalize_fields(exc))
    body = auth_service.password_reset_request(data["email"])
    return jsonify(body), 200


@bp.route("/auth/password-reset/confirm", methods=["POST", "OPTIONS"])
@rate_limit("reset_confirm", key_fn=_client_ip)
def password_reset_confirm():
    if request.method == "OPTIONS":
        return ("", 204)
    payload = request.get_json(force=True, silent=True)
    if payload is None:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Gözlənilən JSON bodu yoxdur")
    try:
        data = PasswordResetConfirmSchema().load(payload)
    except Exception as exc:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=_normalize_fields(exc))
    body = auth_service.password_reset_confirm(data["token"], data["new_password"])
    return jsonify(body), 200


@bp.route("/user/profile", methods=["PUT", "OPTIONS"])
@require_csrf
@rate_limit("profile_update", key_fn=_rate_key_ip_email)
def update_profile():
    if request.method == "OPTIONS":
        return ("", 204)

    session_data = get_current_session()
    user_id = getattr(session_data, "user_id", None) if session_data else None

    if not session_data or not user_id:
        raise ApiError(401, ErrorCode.UNAUTHORIZED, "Giriş tələb olunur")

    payload = request.get_json(force=True, silent=True) or {}
    try:
        data = ProfileUpdateSchema().load(payload)
    except ValidationError as exc:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=_normalize_fields(exc)) from exc

    body = auth_service.update_profile_request(user_id, data)
    return jsonify(body), 200


@bp.route("/user/profile/verify-otp", methods=["POST", "OPTIONS"])
@require_csrf
@rate_limit("profile_email_verify", key_fn=_rate_key_ip_email)
def verify_profile_otp():
    if request.method == "OPTIONS":
        return ("", 204)

    session_data = get_current_session()
    user_id = getattr(session_data, "user_id", None) if session_data else None

    if not session_data or not user_id:
        raise ApiError(401, ErrorCode.UNAUTHORIZED, "Giriş tələb olunur")

    payload = request.get_json(force=True, silent=True) or {}
    try:
        data = ProfileEmailVerifySchema().load(payload)
    except ValidationError as exc:
        raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Daxil edilən məlumat yararsızdır",
                       fields=_normalize_fields(exc)) from exc
    body = auth_service.verify_profile_otp(user_id, data)
    return jsonify(body), 200


def _normalize_fields(exc) -> dict | None:
    """Convert marshmallow ValidationError messages to a plain dict."""
    if isinstance(exc, dict):
        return exc
    msgs = getattr(exc, "messages", None)
    if isinstance(msgs, dict):
        return msgs
    return None


def _attach_cookies(resp, cookies_kwargs):
    """resp is a (Response, status) tuple. Set cookies on the Response."""
    response_obj, status = resp
    if cookies_kwargs:
        set_session_cookies(response_obj, cookies_kwargs["raw_token"], cookies_kwargs["csrf"])
    return response_obj, status


__all__ = ["bp"]
