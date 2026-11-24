"""Tests for the public leaderboard endpoint (CONTRACT DELTA §8).

GET /api/v1/leaderboard — server-side ranking over SUBMITTED test_attempts
(submitted_at IS NOT NULL), aggregated per user, fully deterministic
tie-breaking, global 1-based ranks, optional subject filter, pagination
with clamping, and the personalized `me` row.
"""
from __future__ import annotations

import datetime as _dt
import re

import pytest
from sqlalchemy import event
from sqlalchemy.engine import Engine

from app.extensions import db
from app.models.test import TestAttempt
from app.models.user import User
from tests.conftest import register_and_login

_UTC = _dt.timezone.utc
_T0 = _dt.datetime(2026, 1, 1, 10, 0, 0, tzinfo=_UTC)

ENTRY_KEYS = {
    "rank", "user_id", "name", "tests_completed", "total_score",
    "total_questions", "accuracy", "best_score", "last_activity",
}


def _ts(minutes: int) -> _dt.datetime:
    return _T0 + _dt.timedelta(minutes=minutes)


def _seed(app, users: dict[str, list[dict]]) -> dict[str, int]:
    """Create users + attempts in one transaction.

    `users` maps user name → list of attempt specs:
    {"subject": "math", "score": 18, "total": 20,
     "started": minutes, "submitted": minutes | None}
    Returns {name: user_id}.
    """
    ids: dict[str, int] = {}
    with app.app_context():
        for name, attempts in users.items():
            u = User(name=name, email=f"{name.lower().replace(' ', '.')}@lb.test",
                     password_hash="not-a-real-hash")
            db.session.add(u)
            db.session.flush()
            ids[name] = u.id
            for a in attempts:
                db.session.add(TestAttempt(
                    user_id=u.id,
                    subject_id=a.get("subject", "math"),
                    score=a.get("score", 0),
                    total=a.get("total", 20),
                    started_at=_ts(a.get("started", 0)),
                    submitted_at=(
                        None if a.get("submitted") is None else _ts(a["submitted"])
                    ),
                ))
        db.session.commit()
    return ids


def _get(client, query: str = ""):
    return client.get(f"/api/v1/leaderboard{query}")


# ---------------------------------------------------------------------------
# 1. Empty state
# ---------------------------------------------------------------------------

class TestLeaderboardEmpty:
    def test_empty_db(self, client):
        r = _get(client)
        assert r.status_code == 200, r.get_json()
        body = r.get_json()
        assert body["entries"] == []
        assert body["total"] == 0
        assert body["me"] is None
        assert body["page"] == 1
        assert body["per_page"] == 20


# ---------------------------------------------------------------------------
# 2–3. Ordering + deterministic tie-breaking
# ---------------------------------------------------------------------------

class TestLeaderboardOrdering:
    def test_order_by_total_score_desc_and_global_ranks(self, client, app):
        _seed(app, {
            "Ann":   [{"score": 10, "total": 20, "submitted": 30}],
            "Beniz": [{"score": 40, "total": 40, "submitted": 20}],
            "Cemil": [{"score": 25, "total": 40, "submitted": 10}],
            "Dilara": [{"score": 25, "total": 25, "submitted": 40}],
        })
        r = _get(client)
        body = r.get_json()
        assert body["total"] == 4
        got = [(e["rank"], e["name"], e["total_score"], e["accuracy"]) for e in body["entries"]]
        # total_score DESC: Beniz 40, Dilara 25 (100% acc), Cemil 25 (62.5% acc), Ann 10
        assert got == [
            (1, "Beniz", 40, 100.0),
            (2, "Dilara", 25, 100.0),
            (3, "Cemil", 25, 62.5),
            (4, "Ann", 10, 50.0),
        ]

    def test_accuracy_breaks_total_score_tie(self, client, app):
        _seed(app, {
            "Lowacc":  [{"score": 15, "total": 20, "submitted": 5},
                        {"score": 15, "total": 20, "submitted": 6}],  # 30/40 = 75%
            "Highacc": [{"score": 30, "total": 30, "submitted": 7}],    # 30/30 = 100%
        })
        body = _get(client).get_json()
        assert [e["name"] for e in body["entries"]] == ["Highacc", "Lowacc"]
        assert body["entries"][0]["accuracy"] == 100.0
        assert body["entries"][1]["accuracy"] == 75.0

    def test_earliest_activity_breaks_full_tie(self, client, app):
        # Same total_score (20), same accuracy (50%), different earliest start.
        _seed(app, {
            "Late":  [{"score": 10, "total": 20, "started": 500, "submitted": 510}],
            "Early": [{"score": 10, "total": 20, "started": 100, "submitted": 520}],
        })
        body = _get(client).get_json()
        assert [e["name"] for e in body["entries"]] == ["Early", "Late"]

    def test_user_id_breaks_remaining_tie(self, client, app):
        # Same totals, same accuracy, same started_at → deterministic by user_id.
        ids = _seed(app, {
            "ZUser": [{"score": 10, "total": 20, "started": 100, "submitted": 110}],
            "AUser": [{"score": 10, "total": 20, "started": 100, "submitted": 110}],
        })
        body = _get(client).get_json()
        assert [e["user_id"] for e in body["entries"]] == sorted(ids.values())
        assert [e["rank"] for e in body["entries"]] == [1, 2]

    def test_multi_attempt_aggregation(self, client, app):
        _seed(app, {
            "Multi": [
                {"score": 20, "total": 20, "submitted": 10},
                {"score": 10, "total": 20, "submitted": 20},
                {"score": 5,  "total": 20, "submitted": 30},
            ],
        })
        body = _get(client).get_json()
        e = body["entries"][0]
        assert e["tests_completed"] == 3
        assert e["total_score"] == 35
        assert e["total_questions"] == 60
        assert e["best_score"] == 20
        assert e["accuracy"] == round(35 / 60 * 100, 1)  # 58.3
        assert e["last_activity"] == "2026-01-01T10:30:00Z"
        assert re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$", e["last_activity"])


# ---------------------------------------------------------------------------
# 4. Unsubmitted attempts are excluded
# ---------------------------------------------------------------------------

class TestLeaderboardUnsubmitted:
    def test_unsubmitted_attempt_not_counted(self, client, app):
        _seed(app, {
            "Ghost": [{"score": 20, "total": 20, "submitted": None}],   # only draft
            "Real":  [{"score": 5,  "total": 20, "submitted": 15}],
        })
        body = _get(client).get_json()
        names = [e["name"] for e in body["entries"]]
        assert "Ghost" not in names
        assert body["total"] == 1
        assert names == ["Real"]

    def test_mixed_user_counts_only_submitted(self, client, app):
        _seed(app, {
            "Mixer": [
                {"score": 20, "total": 20, "submitted": 10},   # counted
                {"score": 20, "total": 20, "submitted": None},  # ignored
            ],
        })
        body = _get(client).get_json()
        e = body["entries"][0]
        assert e["tests_completed"] == 1
        assert e["total_score"] == 20
        assert body["total"] == 1


# ---------------------------------------------------------------------------
# 5. subject_id filter
# ---------------------------------------------------------------------------

class TestLeaderboardSubjectFilter:
    def test_subject_filter(self, client, app):
        _seed(app, {
            "Mathfan":  [{"subject": "math", "score": 20, "total": 20, "submitted": 5},
                         {"subject": "aze",  "score": 2,  "total": 20, "submitted": 6}],
            "Azefan":   [{"subject": "aze",  "score": 18, "total": 20, "submitted": 7}],
        })
        body = _get(client, "?subject_id=aze").get_json()
        assert body["total"] == 2
        # Only aze attempts aggregated: Azefan 18 > Mathfan 2.
        assert [(e["name"], e["total_score"]) for e in body["entries"]] == [
            ("Azefan", 18), ("Mathfan", 2)]
        # Mathfan's rank is global WITHIN the aze-filtered ranking.
        assert [e["rank"] for e in body["entries"]] == [1, 2]

        body_all = _get(client).get_json()
        assert body_all["total"] == 2
        assert [(e["name"], e["total_score"]) for e in body_all["entries"]] == [
            ("Mathfan", 22), ("Azefan", 18)]

    def test_invalid_subject_404(self, client):
        r = _get(client, "?subject_id=history")
        assert r.status_code == 404
        body = r.get_json()
        assert body["error"]["code"] == "subject_not_found"
        assert "request_id" in body

    def test_empty_subject_param_treated_as_absent(self, client, app):
        _seed(app, {"Solo": [{"score": 10, "total": 20, "submitted": 5}]})
        body = _get(client, "?subject_id=").get_json()
        assert body["total"] == 1


# ---------------------------------------------------------------------------
# 6. Pagination + global ranks
# ---------------------------------------------------------------------------

class TestLeaderboardPagination:
    def _seed_five(self, app):
        _seed(app, {
            f"User{i}": [{"score": 50 - i * 5, "total": 50, "submitted": 10 + i}]
            for i in range(5)
        })

    def test_page_window_and_global_ranks(self, client, app):
        self._seed_five(app)
        body = _get(client, "?page=2&per_page=2").get_json()
        assert body["page"] == 2
        assert body["per_page"] == 2
        assert body["total"] == 5
        assert [e["rank"] for e in body["entries"]] == [3, 4]  # global, not per-page
        assert [e["total_score"] for e in body["entries"]] == [40, 35]

    def test_page_beyond_total_is_empty(self, client, app):
        self._seed_five(app)
        body = _get(client, "?page=9").get_json()
        assert body["entries"] == []
        assert body["total"] == 5

    def test_ranks_are_1_based_and_dense(self, client, app):
        self._seed_five(app)
        body = _get(client, "?per_page=50").get_json()
        assert [e["rank"] for e in body["entries"]] == [1, 2, 3, 4, 5]


# ---------------------------------------------------------------------------
# 7. `me` — personalized row
# ---------------------------------------------------------------------------

class TestLeaderboardMe:
    def test_anonymous_me_null(self, client, app):
        _seed(app, {"Someone": [{"score": 10, "total": 20, "submitted": 5}]})
        assert _get(client).get_json()["me"] is None

    def test_me_outside_page_window_has_global_rank(self, client, app):
        _seed(app, {
            "Top1": [{"score": 40, "total": 40, "submitted": 5}],
            "Top2": [{"score": 35, "total": 40, "submitted": 6}],
            "Top3": [{"score": 30, "total": 40, "submitted": 7}],
        })
        register_and_login(client, email="lowrank@lb.test", name="LowRank")
        with app.app_context():
            me_id = db.session.query(User).filter(User.email == "lowrank@lb.test").one().id
            db.session.add(TestAttempt(user_id=me_id, subject_id="math",
                                       score=10, total=40,
                                       started_at=_ts(1), submitted_at=_ts(9)))
            db.session.commit()

        body = _get(client, "?per_page=1").get_json()
        assert body["page"] == 1
        assert body["entries"][0]["name"] == "Top1"
        assert body["me"] is not None
        assert body["me"]["user_id"] == me_id
        assert body["me"]["rank"] == 4  # global rank, outside the window
        assert body["me"]["total_score"] == 10
        assert ENTRY_KEYS <= set(body["me"].keys())

    def test_me_respects_subject_filter(self, client, app):
        _seed(app, {"Other": [{"subject": "math", "score": 40, "total": 40, "submitted": 5}]})
        register_and_login(client, email="azesolo@lb.test", name="AzeSolo")
        with app.app_context():
            me_id = db.session.query(User).filter(User.email == "azesolo@lb.test").one().id
            db.session.add(TestAttempt(user_id=me_id, subject_id="aze",
                                       score=15, total=20,
                                       started_at=_ts(1), submitted_at=_ts(2)))
            db.session.commit()

        # aze filter: only me counts.
        body = _get(client, "?subject_id=aze").get_json()
        assert body["me"]["rank"] == 1
        assert body["me"]["total_score"] == 15
        # math filter: me has no math attempts → null.
        body = _get(client, "?subject_id=math").get_json()
        assert body["me"] is None

    def test_authenticated_user_without_attempts_me_null(self, client):
        register_and_login(client, email="fresh@lb.test", name="Fresh")
        body = _get(client).get_json()
        assert body["me"] is None

    def test_me_inside_window_duplicates_entry(self, client, app):
        register_and_login(client, email="solo@lb.test", name="Solo")
        with app.app_context():
            me_id = db.session.query(User).filter(User.email == "solo@lb.test").one().id
            db.session.add(TestAttempt(user_id=me_id, subject_id="math",
                                       score=10, total=20,
                                       started_at=_ts(1), submitted_at=_ts(5)))
            db.session.commit()
        body = _get(client).get_json()
        assert body["me"]["rank"] == 1
        assert body["entries"][0]["rank"] == 1
        assert body["me"]["user_id"] == body["entries"][0]["user_id"]


# ---------------------------------------------------------------------------
# 8. Parameter validation + clamping
# ---------------------------------------------------------------------------

class TestLeaderboardParams:
    def test_per_page_clamped_high(self, client, app):
        _seed(app, {"One": [{"score": 1, "total": 2, "submitted": 1}]})
        assert _get(client, "?per_page=500").get_json()["per_page"] == 50

    def test_per_page_negative_uses_default(self, client):
        assert _get(client, "?per_page=-5").get_json()["per_page"] == 20

    def test_per_page_zero_uses_default(self, client):
        assert _get(client, "?per_page=0").get_json()["per_page"] == 20

    def test_per_page_garbage_uses_default(self, client):
        assert _get(client, "?per_page=abc").get_json()["per_page"] == 20

    def test_per_page_bounds_respected(self, client):
        assert _get(client, "?per_page=1").get_json()["per_page"] == 1
        assert _get(client, "?per_page=50").get_json()["per_page"] == 50

    def test_page_clamped_to_one(self, client):
        body = _get(client, "?page=0").get_json()
        assert body["page"] == 1
        body = _get(client, "?page=-3").get_json()
        assert body["page"] == 1
        body = _get(client, "?page=xyz").get_json()
        assert body["page"] == 1


# ---------------------------------------------------------------------------
# 9. No private data + performance sanity
# ---------------------------------------------------------------------------

class TestLeaderboardSafetyAndPerformance:
    def test_no_private_data_in_entries(self, client, app):
        _seed(app, {"Private": [{"score": 10, "total": 20, "submitted": 5}]})
        body = _get(client).get_json()
        dumped = str(body).lower()
        for e in body["entries"]:
            assert set(e.keys()) == ENTRY_KEYS
        assert "email" not in dumped
        assert "password" not in dumped
        assert "hash" not in dumped
        assert "token" not in dumped

    def test_no_private_data_in_me(self, client, app):
        _seed(app, {"Seeduser": [{"score": 10, "total": 20, "submitted": 5}]})
        register_and_login(client, email="me@lb.test", name="MeUser")
        with app.app_context():
            me_id = db.session.query(User).filter(User.email == "me@lb.test").one().id
            db.session.add(TestAttempt(user_id=me_id, subject_id="math",
                                       score=3, total=20,
                                       started_at=_ts(1), submitted_at=_ts(2)))
            db.session.commit()
        body = _get(client).get_json()
        assert set(body["me"].keys()) == ENTRY_KEYS
        assert "me@lb.test" not in str(body).lower()

    def test_single_aggregate_no_n1(self, client, app):
        """Even with many users, a request runs a small, bounded number of SQL
        statements (subject check + total + page window [+ me row]) — no N+1."""
        _seed(app, {
            f"Bulk{i}": [{"score": 100 - i, "total": 120, "submitted": 1 + i}]
            for i in range(20)
        })
        register_and_login(client, email="bulkme@lb.test", name="BulkMe")
        with app.app_context():
            me_id = db.session.query(User).filter(User.email == "bulkme@lb.test").one().id
            db.session.add(TestAttempt(user_id=me_id, subject_id="math",
                                       score=1, total=20,
                                       started_at=_ts(1), submitted_at=_ts(2)))
            db.session.commit()

        statements: list[str] = []

        def _count(conn, cursor, statement, parameters, context, executemany):
            statements.append(statement)

        event.listen(Engine, "before_cursor_execute", _count)
        try:
            body = _get(client, "?subject_id=math&per_page=5").get_json()
        finally:
            event.remove(Engine, "before_cursor_execute", _count)

        assert body["total"] == 21
        # subject lookup + session lookup + user lookup + COUNT + page + me
        # → bounded, far below a per-entry fan-out (would be 21+ with N+1).
        assert len(statements) <= 8, statements
