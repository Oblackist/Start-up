"""Centralized error handlers. Never leaks internals.

Every JSON error body carries `request_id` (docs/CONTRACT.md §9) so a
user-reported failure can be correlated with the server log. Log lines
include the request id but NEVER tokens/passwords/request bodies.
"""
from __future__ import annotations

from flask import Flask, current_app, jsonify
from werkzeug.exceptions import HTTPException

from ..utils.errors import ApiError, ErrorCode, error_response, _request_id_for_body


def register_error_handlers(app: Flask) -> None:
    @app.errorhandler(ApiError)
    def handle_api_error(err: ApiError):
        body, status = error_response(err.status, err.code, err.message, err.fields)
        if status >= 500:
            # Server-side fault surfaced as a typed ApiError — log with the
            # correlation id (no tokens/passwords are ever passed here).
            current_app.logger.error(
                "API error request_id=%s status=%s code=%s",
                body.get("request_id", ""), status, err.code,
            )
        return jsonify(body), status

    @app.errorhandler(HTTPException)
    def handle_http_error(err: HTTPException):
        status = err.code or 400
        if status == 400:
            code, msg = ErrorCode.BAD_REQUEST, "Sorğuda xəta var"
        elif status == 401:
            code, msg = ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur"
        elif status == 403:
            code, msg = ErrorCode.FORBIDDEN, "Bu əməliyyata icazə yoxdur"
        elif status == 404:
            code, msg = ErrorCode.NOT_FOUND, "Mənbə tapılmadı"
        elif status == 405:
            code, msg = ErrorCode.BAD_REQUEST, "Metod icazəli deyil"
        else:
            code, msg = ErrorCode.BAD_REQUEST, "Sorğuda xəta var"
        body, _ = error_response(status, code, msg)
        return jsonify(body), status

    @app.errorhandler(413)
    def handle_413(err):  # noqa: ARG001
        body, _ = error_response(400, ErrorCode.BAD_REQUEST, "Sorğu çox böyükdür")
        return jsonify(body), 400

    @app.errorhandler(Exception)
    def handle_any(err):
        # Exception messages and tracebacks can contain credentials or user
        # data. Keep correlation and the exception class, but omit exc_info.
        rid = _request_id_for_body()
        current_app.logger.error(
            "Unhandled error request_id=%s error_type=%s", rid, type(err).__name__
        )
        body, _ = error_response(500, ErrorCode.INTERNAL, "Daxili server xətası")
        return jsonify(body), 500


__all__ = ["register_error_handlers"]
