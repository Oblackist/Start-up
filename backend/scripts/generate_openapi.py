"""Generate the checked-in OpenAPI contract from Flask routes and metadata.

Run from backend/: python scripts/generate_openapi.py
The route inventory is taken from the live app. Operation metadata is explicit
so adding a route without documenting its purpose/security/request remains an
error instead of silently producing a vague API contract.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
import sys
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app
from app.config import TestingConfig


# summary, tag, security kind, request schema name, success status
OPERATIONS: dict[str, tuple[str, str, str, str | None, str]] = {
    "admin.question_bank": ("Count active questions (admin only)", "operations", "session", None, "200"),
    "admin.clear_question_bank": ("Delete all active questions (admin only)", "operations", "session_csrf", "ClearQuestionBankRequest", "200"),
    "auth.change_password": ("Change password", "auth", "session_csrf", "ChangePasswordRequest", "200"),
    "auth.csrf": ("Issue the current CSRF token", "auth", "session", None, "200"),
    "auth.login": ("Sign in and optionally start an MFA challenge", "auth", "public", "LoginRequest", "200"),
    "auth.logout": ("Log out and revoke the current session when present", "auth", "public", None, "200"),
    "auth.me": ("Return the authenticated user", "auth", "session", None, "200"),
    "auth.mfa_challenge": ("Complete sign-in with TOTP or a recovery code", "auth", "public", "MfaChallengeRequest", "200"),
    "auth.mfa_confirm": ("Confirm authenticator enrollment and return recovery codes", "auth", "session_csrf", "MfaCodeRequest", "200"),
    "auth.mfa_disable": ("Disable MFA after password and TOTP re-authentication", "auth", "session_csrf", "MfaPasswordCodeRequest", "200"),
    "auth.mfa_enroll": ("Begin authenticator enrollment", "auth", "session_csrf", "MfaEnrollRequest", "200"),
    "auth.mfa_recovery_codes_rotate": ("Replace the account recovery codes", "auth", "session_csrf", "MfaPasswordCodeRequest", "200"),
    "auth.password_reset_confirm": ("Consume a password reset token", "auth", "public", "PasswordResetConfirmRequest", "200"),
    "auth.password_reset_request": ("Request a password reset email", "auth", "public", "EmailRequest", "200"),
    "auth.register": ("Create an unverified account and send an email verification code", "auth", "public", "RegisterRequest", "201"),
    "auth.list_sessions": ("List the current user's sessions", "auth", "session", None, "200"),
    "auth.revoke_session": ("Revoke one session owned by the current user", "auth", "session_csrf", None, "200"),
    "auth.revoke_all_sessions": ("Revoke all sessions for the current user", "auth", "session_csrf", None, "200"),
    "auth.revoke_current_session": ("Revoke the current session", "auth", "session_csrf", None, "200"),
    "auth.revoke_other_sessions": ("Revoke all other sessions for the current user", "auth", "session_csrf", None, "200"),
    "auth.resend_verification": ("Resend a registration verification code", "auth", "public", "EmailRequest", "200"),
    "auth.verify_register_otp": ("Verify the registration email and create a session", "auth", "public", "EmailCodeRequest", "200"),
    "captcha_v2_unique.get_captcha": ("Generate a legacy image CAPTCHA challenge", "security", "public", None, "200"),
    "health.health": ("Check database and configured Redis readiness", "operations", "public", None, "200"),
    "health.liveness": ("Check process liveness without dependencies", "operations", "public", None, "200"),
    "leaderboard.leaderboard": ("List ranked users and the optional current-user rank", "learning", "optional_session", None, "200"),
    "me.list_attempts": ("List the current user's submitted test attempts", "learning", "session", None, "200"),
    "me.progress": ("Return dashboard progress aggregates", "learning", "session", None, "200"),
    "practice.list_cards": ("List practice cards derived from weak topics", "learning", "session", None, "200"),
    "subjects.list_subjects": ("List subjects and question counts", "learning", "public", None, "200"),
    "subjects.get_subject": ("Get a subject and its topics", "learning", "public", None, "200"),
    "subjects.list_subject_topics": ("List topics for a subject", "learning", "public", None, "200"),
    "tests.create_test": ("Start a test attempt", "learning", "session_csrf", "CreateTestRequest", "201"),
    "tests.get_test": ("Get the current user's test result", "learning", "session", None, "200"),
    "tests.submit_test": ("Submit answers for a test attempt", "learning", "session_csrf", "SubmitTestRequest", "200"),
    "auth.update_profile": ("Update the current user's profile", "auth", "session_csrf", "ProfileUpdateRequest", "200"),
    "auth.verify_profile_otp": ("Verify the current user's pending email change", "auth", "session_csrf", "EmailCodeRequest", "200"),
}


def _schema_ref(name: str) -> dict[str, str]:
    return {"$ref": f"#/components/schemas/{name}"}


PASSWORD_PATTERN = r"^(?=.*[A-Za-z\u0400-\u04FFÀ-ÿİıŞĞ])(?=.*[0-9]).+$"


SCHEMAS: dict[str, dict[str, Any]] = {
    "ClearQuestionBankRequest": {"type": "object", "required": ["confirmation"], "properties": {"confirmation": {"const": "SİL"}}},
    "Error": {"type": "object", "required": ["code", "message"], "properties": {"code": {"type": "string"}, "message": {"type": "string"}, "fields": {"type": "object", "additionalProperties": True}}},
    "ErrorEnvelope": {"type": "object", "required": ["error", "request_id"], "properties": {"error": {"$ref": "#/components/schemas/Error"}, "request_id": {"type": "string"}}},
    "User": {"type": "object", "required": ["id", "name", "email", "is_verified", "mfa_enabled"], "properties": {"id": {"type": "integer"}, "name": {"type": "string"}, "email": {"type": "string", "format": "email"}, "is_verified": {"type": "boolean"}, "mfa_enabled": {"type": "boolean"}, "created_at": {"type": ["string", "null"], "format": "date-time"}, "last_login_at": {"type": ["string", "null"], "format": "date-time"}}},
    "RegisterRequest": {"type": "object", "additionalProperties": False, "required": ["name", "email", "password", "confirm"], "properties": {"name": {"type": "string", "minLength": 1, "maxLength": 80}, "email": {"type": "string", "format": "email", "maxLength": 254}, "password": {"type": "string", "minLength": 8, "maxLength": 72, "pattern": PASSWORD_PATTERN, "description": "Must contain at least one letter and one digit."}, "confirm": {"type": "string"}, "captcha_key": {"type": ["string", "null"]}, "captcha_text": {"type": ["string", "null"]}}},
    "LoginRequest": {"type": "object", "additionalProperties": False, "required": ["email", "password"], "properties": {"email": {"type": "string", "format": "email"}, "password": {"type": "string"}, "captcha_token": {"type": ["string", "null"], "maxLength": 2048}}},
    "EmailRequest": {"type": "object", "additionalProperties": False, "required": ["email"], "properties": {"email": {"type": "string", "format": "email"}}},
    "EmailCodeRequest": {"type": "object", "additionalProperties": False, "required": ["email", "code"], "properties": {"email": {"type": "string", "format": "email"}, "code": {"type": "string", "pattern": "^[0-9]{6}$"}}},
    "ChangePasswordRequest": {"type": "object", "additionalProperties": False, "required": ["current_password", "new_password"], "properties": {"current_password": {"type": "string"}, "new_password": {"type": "string", "minLength": 8, "maxLength": 72, "pattern": PASSWORD_PATTERN, "description": "Must contain at least one letter and one digit."}}},
    "PasswordResetConfirmRequest": {"type": "object", "additionalProperties": False, "required": ["token", "new_password"], "properties": {"token": {"type": "string", "minLength": 10, "maxLength": 200}, "new_password": {"type": "string", "minLength": 8, "maxLength": 72, "pattern": PASSWORD_PATTERN, "description": "Must contain at least one letter and one digit."}}},
    "MfaCodeRequest": {"type": "object", "additionalProperties": False, "required": ["code"], "properties": {"code": {"type": "string", "minLength": 6, "maxLength": 64}}},
    "MfaEnrollRequest": {"type": "object", "additionalProperties": False, "required": ["current_password"], "properties": {"current_password": {"type": "string", "minLength": 8, "maxLength": 72}}},
    "MfaPasswordCodeRequest": {"type": "object", "additionalProperties": False, "required": ["current_password", "code"], "properties": {"current_password": {"type": "string", "minLength": 8, "maxLength": 72}, "code": {"type": "string", "minLength": 6, "maxLength": 64}}},
    "MfaChallengeRequest": {"type": "object", "additionalProperties": False, "required": ["challenge_token", "code"], "properties": {"challenge_token": {"type": "string", "minLength": 20, "maxLength": 128}, "code": {"type": "string", "minLength": 6, "maxLength": 64}}},
    "ProfileUpdateRequest": {"type": "object", "additionalProperties": False, "required": ["current_password"], "anyOf": [{"required": ["name"]}, {"required": ["email"]}], "properties": {"name": {"type": "string", "minLength": 1, "maxLength": 80}, "email": {"type": "string", "format": "email", "maxLength": 254}, "current_password": {"type": "string", "minLength": 8, "maxLength": 72}, "mfa_code": {"type": "string", "pattern": "^[0-9]{6}$"}}},
    "CreateTestRequest": {"type": "object", "required": ["subject_id"], "properties": {"subject_id": {"type": "string", "minLength": 1, "maxLength": 40}, "topic_id": {"type": "string", "minLength": 1, "maxLength": 40}, "grade": {"type": "integer", "enum": [9, 10, 11]}, "quiz": {"type": "integer", "minimum": 1, "maximum": 10}, "question_count": {"type": "integer", "minimum": 1, "maximum": 30, "description": "Up to 20 for a random test, 30 for a numbered quiz."}}},
    "SubmitTestRequest": {"type": "object", "required": ["answers"], "properties": {
        "answers": {"type": "object", "additionalProperties": {"oneOf": [
            {"type": "string", "minLength": 1, "maxLength": 200, "description": "One choice key, or the legacy text format for open questions."},
            {"type": "null"},
        ]}},
        "written_answers": {"type": "object", "additionalProperties": {"oneOf": [
            {"type": "string", "minLength": 1, "maxLength": 200},
            {"type": "null"},
        ]}, "description": "Written responses by question ID for open questions or questions marked accepts_written_answer."},
    }},
    "Subject": {"type": "object", "properties": {"id": {"type": "string"}, "name": {"type": "string"}, "short_desc": {"type": ["string", "null"]}, "icon_name": {"type": ["string", "null"]}, "topic_count": {"type": "integer"}, "question_count": {"type": "integer"}}},
    "Topic": {"type": "object", "properties": {"id": {"type": "string"}, "name": {"type": "string"}, "grade": {"enum": [9, 10, 11, None]}, "question_count": {"type": "integer"}, "quizzes": {"type": "array", "items": {"type": "object", "properties": {"number": {"type": "integer"}, "question_count": {"type": "integer"}}}}}},
    "SessionInfo": {"type": "object", "required": ["id", "current", "created_at", "expires_at"], "properties": {"id": {"type": "integer"}, "current": {"type": "boolean"}, "user_agent": {"type": ["string", "null"]}, "ip": {"type": ["string", "null"]}, "created_at": {"type": "string", "format": "date-time"}, "expires_at": {"type": "string", "format": "date-time"}}},
    "AttemptSummary": {"type": "object", "required": ["attempt_id", "subject_id", "subject_name", "score", "total", "submitted_at"], "properties": {"attempt_id": {"type": "integer"}, "subject_id": {"type": "string"}, "subject_name": {"type": "string"}, "score": {"type": "integer"}, "total": {"type": "integer"}, "submitted_at": {"type": "string", "format": "date-time"}}},
    "AttemptList": {"type": "object", "required": ["items", "page", "per_page", "total"], "properties": {"items": {"type": "array", "items": _schema_ref("AttemptSummary")}, "page": {"type": "integer"}, "per_page": {"type": "integer"}, "total": {"type": "integer"}}},
    "PracticeCard": {"type": "object", "required": ["id", "topic_id", "subject_id", "topic", "subject", "questions_count", "estimated_time", "difficulty", "description"], "properties": {"id": {"type": "string"}, "topic_id": {"type": "string"}, "subject_id": {"type": "string"}, "topic": {"type": "string"}, "subject": {"type": "string"}, "questions_count": {"type": "integer"}, "estimated_time": {"type": "string"}, "difficulty": {"type": "string"}, "description": {"type": "string"}}},
    "LeaderboardEntry": {"type": "object", "required": ["rank", "user_id", "name", "tests_completed", "total_score", "total_questions", "accuracy", "best_score", "last_activity"], "properties": {"rank": {"type": "integer"}, "user_id": {"type": "integer"}, "name": {"type": "string"}, "tests_completed": {"type": "integer"}, "total_score": {"type": "integer"}, "total_questions": {"type": "integer"}, "accuracy": {"type": "number"}, "best_score": {"type": "integer"}, "last_activity": {"type": ["string", "null"], "format": "date-time"}}},
    "TestQuestion": {"type": "object", "required": ["id", "topic", "text", "options"], "properties": {"id": {"type": "integer"}, "topic": {"type": ["string", "null"]}, "text": {"type": "string"}, "kind": {"const": "open"}, "accepts_written_answer": {"const": True}, "passage": {"type": "string"}, "image_svg": {"type": "string"}, "options": {"type": "array", "items": {"type": "object", "properties": {"key": {"type": ["string", "null"]}, "text": {"type": ["string", "null"]}}}}}},
    "TestAnswerResult": {"type": "object", "required": ["question_id", "text", "user_answer", "correct_answer", "is_correct"], "properties": {"question_id": {"type": "integer"}, "topic": {"type": ["string", "null"]}, "text": {"type": "string"}, "options": {"type": "array", "items": {"type": "object", "properties": {"key": {"type": "string"}, "text": {"type": "string"}}}}, "passage": {"type": "string"}, "user_answer": {"type": ["string", "null"]}, "is_written": {"const": True, "description": "The user_answer is written text for a question that also had options."}, "correct_answer": {"type": "string"}, "is_correct": {"type": "boolean"}, "explanation": {"type": ["object", "null"], "additionalProperties": True}}},
    "TestAttemptResult": {"type": "object", "required": ["attempt_id", "subject_id", "subject_name", "score", "total", "started_at", "submitted_at", "results"], "properties": {"attempt_id": {"type": "integer"}, "subject_id": {"type": "string"}, "subject_name": {"type": "string"}, "score": {"type": "integer"}, "total": {"type": "integer"}, "started_at": {"type": "string", "format": "date-time"}, "submitted_at": {"type": "string", "format": "date-time"}, "results": {"type": "array", "items": _schema_ref("TestAnswerResult")}}},
    "ProgressDashboard": {"type": "object", "additionalProperties": False, "required": ["subjects", "weak_topics", "saved_mistakes", "progress_chart"], "properties": {
        "subjects": {"type": "array", "items": {"type": "object", "additionalProperties": False, "required": ["id", "name", "total_questions", "completed_questions", "readiness_score", "last_score", "last_date"], "properties": {"id": {"type": "string"}, "name": {"type": "string"}, "total_questions": {"type": "integer"}, "completed_questions": {"type": "integer"}, "readiness_score": {"type": "integer"}, "last_score": {"type": ["string", "null"]}, "last_date": {"type": ["string", "null"]}}}},
        "weak_topics": {"type": "array", "items": {"type": "object", "additionalProperties": False, "required": ["id", "subject", "name", "accuracy", "mistake_count", "question_count"], "properties": {"id": {"type": "string"}, "subject": {"type": "string"}, "name": {"type": "string"}, "accuracy": {"type": "integer"}, "mistake_count": {"type": "integer"}, "question_count": {"type": "integer"}}}},
        "saved_mistakes": {"type": "array", "items": {"type": "object", "additionalProperties": False, "required": ["id", "subject", "topic", "question_preview", "user_answer", "correct_answer", "date", "status"], "properties": {"id": {"type": "string"}, "subject": {"type": ["string", "null"]}, "topic": {"type": ["string", "null"]}, "question_preview": {"type": "string"}, "user_answer": {"type": ["string", "null"]}, "correct_answer": {"type": "string"}, "date": {"type": "string"}, "status": {"type": "string"}}}},
        "progress_chart": {"type": "array", "items": {"type": "object", "additionalProperties": False, "required": ["date", "score", "tests"], "properties": {"date": {"type": "string"}, "score": {"type": "integer"}, "tests": {"type": "integer"}}}},
    }},
    "MfaEnrollResponse": {"type": "object", "required": ["secret", "otpauth_uri", "issuer"], "properties": {"secret": {"type": "string", "readOnly": True, "description": "Sensitive TOTP secret shown only while setting up the authenticator."}, "otpauth_uri": {"type": "string", "format": "uri", "readOnly": True, "description": "Sensitive enrollment URI containing the TOTP secret."}, "issuer": {"type": "string", "readOnly": True}}},
}


PATH_PARAMETER = re.compile(r"<(?:(?P<converter>[^:<>]+):)?(?P<name>[^<>]+)>")


def _success_schema(endpoint: str) -> dict[str, Any]:
    if endpoint == "admin.question_bank":
        return {"type": "object", "required": ["question_count"], "properties": {"question_count": {"type": "integer", "minimum": 0}}}
    if endpoint == "admin.clear_question_bank":
        return {"type": "object", "required": ["deleted"], "properties": {"deleted": {"type": "integer", "minimum": 0}}}
    if endpoint == "auth.login":
        return {"oneOf": [{"type": "object", "required": ["user"], "properties": {"user": _schema_ref("User")}}, {"type": "object", "required": ["mfa_required", "challenge_token", "expires_in"], "properties": {"mfa_required": {"const": True}, "challenge_token": {"type": "string"}, "expires_in": {"type": "integer"}}}]}
    if endpoint == "auth.me":
        return {"type": "object", "properties": {"user": _schema_ref("User")}}
    if endpoint == "auth.register":
        return {"type": "object", "properties": {"user": _schema_ref("User"), "requires_verification": {"const": True}}}
    if endpoint == "auth.csrf":
        return {"type": "object", "properties": {"csrf_token": {"type": "string"}}}
    if endpoint == "auth.list_sessions":
        return {"type": "object", "properties": {"sessions": {"type": "array", "items": _schema_ref("SessionInfo")}}}
    if endpoint == "me.list_attempts":
        return _schema_ref("AttemptList")
    if endpoint == "practice.list_cards":
        return {"type": "array", "items": _schema_ref("PracticeCard")}
    if endpoint == "leaderboard.leaderboard":
        return {"type": "object", "required": ["entries", "page", "per_page", "total", "me"], "properties": {"entries": {"type": "array", "items": _schema_ref("LeaderboardEntry")}, "page": {"type": "integer"}, "per_page": {"type": "integer"}, "total": {"type": "integer"}, "me": {"oneOf": [_schema_ref("LeaderboardEntry"), {"type": "null"}]}}}
    if endpoint == "me.progress":
        return _schema_ref("ProgressDashboard")
    if endpoint == "tests.create_test":
        return {"type": "object", "required": ["attempt_id", "questions"], "properties": {"attempt_id": {"type": "integer"}, "questions": {"type": "array", "items": _schema_ref("TestQuestion")}}}
    if endpoint in {"tests.submit_test", "tests.get_test"}:
        return _schema_ref("TestAttemptResult")
    if endpoint == "auth.mfa_challenge":
        return {"type": "object", "required": ["user"], "properties": {"user": _schema_ref("User")}}
    if endpoint == "auth.mfa_confirm":
        return {"type": "object", "required": ["ok", "user", "recovery_codes"], "properties": {"ok": {"const": True}, "user": _schema_ref("User"), "recovery_codes": {"type": "array", "items": {"type": "string"}}}}
    if endpoint == "auth.mfa_disable":
        return {"type": "object", "required": ["ok", "user"], "properties": {"ok": {"const": True}, "user": _schema_ref("User")}}
    if endpoint == "auth.mfa_recovery_codes_rotate":
        return {"type": "object", "required": ["ok", "recovery_codes"], "properties": {"ok": {"const": True}, "recovery_codes": {"type": "array", "items": {"type": "string"}}}}
    if endpoint == "auth.mfa_enroll":
        return _schema_ref("MfaEnrollResponse")
    if endpoint == "health.health":
        return {"type": "object", "required": ["status", "db"], "properties": {"status": {"const": "ok"}, "db": {"const": "ok"}, "redis": {"const": "ok", "description": "Present when the configured shared Redis limiter is reachable."}}}
    if endpoint == "health.liveness":
        return {"type": "object", "properties": {"status": {"const": "ok"}}}
    if endpoint == "captcha_v2_unique.get_captcha":
        return {"type": "object", "required": ["key", "image"], "properties": {"key": {"type": "string"}, "image": {"type": "string", "format": "uri", "description": "PNG data URI."}}}
    if endpoint == "subjects.list_subjects":
        grade_counts = {
            "type": "object",
            "required": ["9", "10", "11"],
            "properties": {str(grade): {"type": "integer", "minimum": 0} for grade in (9, 10, 11)},
        }
        return {"type": "array", "items": {"allOf": [
            _schema_ref("Subject"),
            {"type": "object", "required": ["grade_question_counts"],
             "properties": {"grade_question_counts": grade_counts}},
        ]}}
    if endpoint == "subjects.get_subject":
        return {"allOf": [_schema_ref("Subject"), {"type": "object", "properties": {"topics": {"type": "array", "items": _schema_ref("Topic")}}}]}
    if endpoint == "subjects.list_subject_topics":
        return {"type": "array", "items": _schema_ref("Topic")}
    return {"type": "object", "additionalProperties": True}


def build_openapi_document(app=None) -> dict[str, Any]:
    if app is None:
        app = create_app(TestingConfig())
    paths: dict[str, dict[str, Any]] = {}
    seen: set[str] = set()
    for rule in sorted(app.url_map.iter_rules(), key=lambda item: str(item)):
        if not rule.rule.startswith("/api/v1/"):
            continue
        endpoint = rule.endpoint
        if endpoint not in OPERATIONS:
            raise ValueError(f"OpenAPI metadata missing for Flask endpoint: {endpoint}")
        seen.add(endpoint)
        summary, tag, security_kind, request_schema, success_status = OPERATIONS[endpoint]
        path = PATH_PARAMETER.sub(lambda match: "{" + match.group("name") + "}", rule.rule)
        path_item = paths.setdefault(path, {})
        for method in sorted(rule.methods - {"HEAD", "OPTIONS"}):
            security = {
                "session": [{"sessionCookie": []}],
                "session_csrf": [{"sessionCookie": [], "csrfHeader": []}],
                "optional_session": [{}, {"sessionCookie": []}],
                "public": [],
            }[security_kind]
            operation: dict[str, Any] = {
                "operationId": endpoint.replace(".", "_"),
                "summary": summary,
                "tags": [tag],
                "security": security,
                "responses": {
                    success_status: {"description": "Successful response.", "content": {"application/json": {"schema": _success_schema(endpoint)}}},
                    "default": {"description": "Error response with a stable error code and request ID.", "content": {"application/json": {"schema": _schema_ref("ErrorEnvelope")}}},
                },
                "x-flask-endpoint": endpoint,
            }
            if endpoint == "health.health":
                operation["responses"]["503"] = {
                    "description": "A required dependency failed its readiness check.",
                    "content": {"application/json": {"schema": {"type": "object", "required": ["status"], "properties": {"status": {"const": "not_ready"}}}}},
                }
            if request_schema:
                operation["requestBody"] = {"required": True, "content": {"application/json": {"schema": _schema_ref(request_schema)}}}
            parameters = [
                {"name": match.group("name"), "in": "path", "required": True,
                 "schema": {"type": "integer" if match.group("converter") in {"int", "float"} else "string"}}
                for match in PATH_PARAMETER.finditer(rule.rule)
            ]
            if endpoint in {"leaderboard.leaderboard", "me.list_attempts"}:
                names = ["subject_id", "page", "per_page"] if endpoint == "leaderboard.leaderboard" else ["page", "per_page"]
                for name in names:
                    maximum = 50 if endpoint == "leaderboard.leaderboard" else 100
                    parameter = {"name": name, "in": "query", "required": False,
                                 "schema": {"type": "string" if name == "subject_id" else "integer", **({"minimum": 1} if name == "per_page" or name == "page" else {})}}
                    if name == "per_page":
                        parameter["description"] = f"Values above {maximum} are clamped to {maximum}."
                    parameters.append(parameter)
            if parameters:
                operation["parameters"] = parameters
            path_item[method.lower()] = operation
    missing = set(OPERATIONS) - seen
    if missing:
        raise ValueError(f"OpenAPI metadata references missing Flask endpoints: {sorted(missing)}")
    return {
        "openapi": "3.1.0",
        "jsonSchemaDialect": "https://json-schema.org/draft/2020-12/schema",
        "info": {
            "title": "Career Arena API",
            "version": "1.0.0",
            "description": (
                "Career Arena Exam Arena API. This checked-in contract covers implemented `/api/v1` routes. "
                "Compatibility policy: adding an optional request/response field or endpoint is backward compatible within v1. "
                "Removing/renaming an endpoint or method, making a field required, changing a field's meaning/type, or removing/renaming a response field is breaking; introduce a new versioned route for breaking changes and keep the old contract during a documented migration window. "
                "Announce deprecations with the OpenAPI `deprecated` flag and a sunset date in the operation description before removal."
            ),
        },
        "servers": [{"url": "/", "description": "Configured API origin; paths include the `/api/v1` prefix."}],
        "tags": [
            {"name": "auth", "description": "Registration, authentication, MFA, profile, and session controls."},
            {"name": "learning", "description": "Subjects, tests, progress, practice, and leaderboard."},
            {"name": "security", "description": "Abuse-defense utility endpoints."},
            {"name": "operations", "description": "Liveness and readiness checks."},
        ],
        "paths": paths,
        "components": {
            "securitySchemes": {
                "sessionCookie": {"type": "apiKey", "in": "cookie", "name": "session_token", "description": "Opaque server-managed session cookie; production sets Secure, HttpOnly, and SameSite=Strict."},
                "csrfHeader": {"type": "apiKey", "in": "header", "name": "X-CSRF-Token", "description": "Required with the session cookie for state-changing authenticated operations."},
            },
            "schemas": SCHEMAS,
        },
        "security": [],
    }


def main() -> None:
    output = Path(__file__).resolve().parents[2] / "docs" / "openapi.json"
    output.write_text(json.dumps(build_openapi_document(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {output}")


if __name__ == "__main__":
    main()
