"""Public leaderboard: GET /api/v1/leaderboard (docs/CONTRACT.md §8).

Ranking is computed SERVER-SIDE over SUBMITTED test_attempts
(`submitted_at IS NOT NULL`) aggregated per user:

- total_score      = SUM(score)          (primary sort, DESC)
- accuracy         = total_score/total_questions*100, 1 decimal
                                          (tie-break 1, DESC — exact ratio)
- tie-break 2      = earliest activity ASC (MIN(started_at))
- tie-break 3      = user_id ASC (fully deterministic)
- tests_completed  = COUNT(*)
- best_score       = MAX(score)
- last_activity    = MAX(submitted_at)

The global 1-based `rank` is computed with ROW_NUMBER() OVER (same ORDER BY)
inside the same aggregate query (SQLite 3.25+ window functions; Python 3.12
bundles 3.5x) — one efficient statement per need: total count, page window,
and (only when a session exists) the current user's row at ANY rank.
No N+1: a single aggregate CTE feeds both the page and the `me` lookup.
No private data: only user_id, name, and the aggregates are returned.
"""
from __future__ import annotations

import datetime as _dt

from flask import Blueprint, jsonify, request
from sqlalchemy import text

from ..extensions import db
from ..models.content import Subject
from ..models.user import User
from ..security.session import get_current_session
from ..utils.errors import ApiError, ErrorCode

bp = Blueprint("leaderboard", __name__)

DEFAULT_PER_PAGE = 20
MAX_PER_PAGE = 50
MIN_PAGE = 1

# The deterministic ranking order (shared by the window function, the page
# window and the `me` row so ranks are consistent everywhere).
_RANK_ORDER = (
    "SUM(a.score) DESC, "
    "SUM(CAST(a.score AS REAL)) / NULLIF(SUM(a.total), 0) DESC, "
    "MIN(a.started_at) ASC, "
    "a.user_id ASC"
)


def _parse_int(raw: str | None, default: int) -> int:
    try:
        return int(str(raw).strip())
    except (TypeError, ValueError):
        return default


def _clamp_page(raw: str | None) -> int:
    return max(MIN_PAGE, _parse_int(raw, MIN_PAGE))


def _clamp_per_page(raw: str | None) -> int:
    value = _parse_int(raw, DEFAULT_PER_PAGE)
    if value < 1:
        return DEFAULT_PER_PAGE
    if value > MAX_PER_PAGE:
        return MAX_PER_PAGE
    return value


def _aggregate_sql(subject_id: str | None) -> str:
    """Single aggregate + window-function query (bound params only)."""
    where = "a.submitted_at IS NOT NULL"
    if subject_id is not None:
        where += " AND a.subject_id = :subject_id"
    return f"""
        SELECT a.user_id                          AS user_id,
               u.name                             AS name,
               SUM(a.score)                       AS total_score,
               SUM(a.total)                       AS total_questions,
               COUNT(*)                           AS tests_completed,
               MAX(a.score)                       AS best_score,
               MAX(a.submitted_at)                AS last_activity,
               ROW_NUMBER() OVER (ORDER BY {_RANK_ORDER}) AS rank
        FROM test_attempts a
        JOIN users u ON u.id = a.user_id
        WHERE {where}
        GROUP BY a.user_id, u.name
    """


def _count_sql(subject_id: str | None) -> str:
    where = "a.submitted_at IS NOT NULL"
    if subject_id is not None:
        where += " AND a.subject_id = :subject_id"
    return f"""
        SELECT COUNT(DISTINCT a.user_id) AS total
        FROM test_attempts a
        WHERE {where}
    """


def _aware(dt: _dt.datetime) -> _dt.datetime:
    """SQLite drops tzinfo on read; stored values are UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=_dt.timezone.utc)
    return dt


def _iso(dt: _dt.datetime | None) -> str | None:
    if dt is None:
        return None
    return _aware(dt).astimezone(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _parse_db_dt(value) -> _dt.datetime | None:
    if value is None or value == "":
        return None
    if isinstance(value, _dt.datetime):
        return value
    try:
        return _dt.datetime.fromisoformat(str(value))
    except ValueError:
        return None


def _entry(row) -> dict:
    total_score = int(row["total_score"] or 0)
    total_questions = int(row["total_questions"] or 0)
    accuracy = round(total_score / total_questions * 100, 1) if total_questions else 0.0
    return {
        "rank": int(row["rank"]),
        "user_id": int(row["user_id"]),
        "name": row["name"],
        "tests_completed": int(row["tests_completed"] or 0),
        "total_score": total_score,
        "total_questions": total_questions,
        "accuracy": accuracy,
        "best_score": int(row["best_score"] or 0),
        "last_activity": _iso(_parse_db_dt(row["last_activity"])),
    }


@bp.route("/leaderboard", methods=["GET"])
def leaderboard():
    # --- query params: subject_id / page / per_page -------------------------
    raw_subject = (request.args.get("subject_id") or "").strip()
    subject_id: str | None = None
    if raw_subject:
        subject_id = raw_subject
        if db.session.get(Subject, subject_id) is None:
            raise ApiError(
                404, ErrorCode.SUBJECT_NOT_FOUND, "Fənn tapılmadı"
            )

    page = _clamp_page(request.args.get("page"))
    per_page = _clamp_per_page(request.args.get("per_page"))
    offset = (page - 1) * per_page

    params: dict = {}
    if subject_id is not None:
        params["subject_id"] = subject_id

    total = int(
        db.session.execute(text(_count_sql(subject_id)), params).scalar() or 0
    )

    rows = db.session.execute(
        text(_aggregate_sql(subject_id) + " ORDER BY rank LIMIT :limit OFFSET :offset"),
        {**params, "limit": per_page, "offset": offset},
    ).mappings().all()
    entries = [_entry(r) for r in rows]

    # --- personalized `me` row (any rank, even outside the page window) -----
    me = None
    sess = get_current_session()
    if sess is not None:
        user = db.session.get(User, sess.user_id)
        if user is not None:
            me_row = db.session.execute(
                text("SELECT * FROM (" + _aggregate_sql(subject_id) + ") WHERE user_id = :me_user_id"),
                {**params, "me_user_id": user.id},
            ).mappings().first()
            if me_row is not None:
                me = _entry(me_row)

    return jsonify({
        "entries": entries,
        "page": page,
        "per_page": per_page,
        "total": total,
        "me": me,
    }), 200


__all__ = ["bp"]
