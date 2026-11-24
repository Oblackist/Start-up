"""Tests for progress/dashboard: empty for new user, populated after attempt."""
from __future__ import annotations

import json

from jsonschema import Draft202012Validator

from tests.test_openapi_contract import OPENAPI_PATH
from tests.conftest import register_and_login


def _validate_dashboard_contract(payload):
    document = json.loads(OPENAPI_PATH.read_text(encoding="utf-8"))
    schema = document["components"]["schemas"]["ProgressDashboard"]
    Draft202012Validator(schema).validate(payload)


def _full_correct_attempt(client, csrf, subject="math", topic=None):
    body = {"subject_id": subject}
    if topic:
        body["topic_id"] = topic
    r = client.post("/api/v1/tests", json=body,
                    headers={"X-CSRF-Token": csrf})
    assert r.status_code == 201
    aid = r.get_json()["attempt_id"]
    from app.extensions import db
    from app.models.content import Question
    with client.application.app_context():
        qs = db.session.query(Question).filter(
            Question.subject_id == subject
        ).order_by(Question.id).limit(20).all()
        answers = {str(q.id): q.correct_answer for q in qs}
    r = client.post(f"/api/v1/tests/{aid}/submit",
                    json={"answers": answers},
                    headers={"X-CSRF-Token": csrf})
    assert r.status_code == 200
    return aid


class TestProgress:
    def test_empty_progress_for_new_user(self, client):
        csrf, _, _ = register_and_login(client)
        r = client.get("/api/v1/me/progress")
        assert r.status_code == 200, r.get_json()
        body = r.get_json()
        _validate_dashboard_contract(body)
        # Empty arrays — honest empty state
        assert body["weak_topics"] == []
        assert body["saved_mistakes"] == []
        assert body["progress_chart"] == []
        # Subjects list always present (3 seeded)
        assert len(body["subjects"]) == 3
        # All zeros
        for s in body["subjects"]:
            assert s["completed_questions"] == 0
            assert s["readiness_score"] == 0
            assert s["last_score"] is None

    def test_attempts_list_empty_for_new_user(self, client):
        csrf, _, _ = register_and_login(client)
        r = client.get("/api/v1/me/attempts")
        assert r.status_code == 200
        body = r.get_json()
        assert body["total"] == 0
        assert body["items"] == []

    def test_progress_populated_after_attempt(self, client):
        csrf, _, _ = register_and_login(client)
        _full_correct_attempt(client, csrf)
        r = client.get("/api/v1/me/progress")
        assert r.status_code == 200, r.get_json()
        body = r.get_json()
        math = next(s for s in body["subjects"] if s["id"] == "math")
        assert math["completed_questions"] > 0
        assert math["readiness_score"] > 0
        assert math["last_score"] is not None
        # Progress chart has at least one point
        assert len(body["progress_chart"]) >= 1

    def test_attempts_list_after_attempt(self, client):
        csrf, _, _ = register_and_login(client)
        _full_correct_attempt(client, csrf)
        r = client.get("/api/v1/me/attempts")
        assert r.status_code == 200
        body = r.get_json()
        assert body["total"] == 1
        assert len(body["items"]) == 1
        item = body["items"][0]
        assert item["subject_id"] == "math"
        assert item["subject_name"] == "Riyaziyyat"
        assert item["score"] >= 0
        assert item["total"] >= 1

    def test_practice_cards_empty_for_new_user(self, client):
        csrf, _, _ = register_and_login(client)
        r = client.get("/api/v1/practice/cards")
        assert r.status_code == 200
        assert r.get_json() == []

    def test_practice_cards_after_partial_attempt(self, client):
        csrf, _, _ = register_and_login(client)
        # Start + submit with all-wrong answers to create mistakes
        r = client.post("/api/v1/tests", json={"subject_id": "math"},
                        headers={"X-CSRF-Token": csrf})
        aid = r.get_json()["attempt_id"]
        from app.extensions import db
        from app.models.content import Question
        with client.application.app_context():
            qs = db.session.query(Question).filter(
                Question.subject_id == "math"
            ).order_by(Question.id).limit(20).all()
            # All answers wrong — pick a guaranteed-wrong key
            answers = {str(q.id): "Z" for q in qs}  # 'Z' is never a valid answer
        r = client.post(f"/api/v1/tests/{aid}/submit",
                        json={"answers": answers},
                        headers={"X-CSRF-Token": csrf})
        assert r.status_code == 200
        # Now weak_topics should be populated
        r = client.get("/api/v1/me/progress")
        body = r.get_json()
        assert len(body["weak_topics"]) >= 1
        assert body["saved_mistakes"]
        _validate_dashboard_contract(body)
        # Cards derived from weak topics
        r = client.get("/api/v1/practice/cards")
        assert r.status_code == 200
        cards = r.get_json()
        assert len(cards) >= 1
        c = cards[0]
        assert "id" in c
        assert "topic" in c
        assert "subject" in c
        assert "questions_count" in c
        assert "estimated_time" in c
        assert "difficulty" in c
        assert "description" in c
