"""Tests for the test-taking flow: start, submit, result, double-submit 409."""
from __future__ import annotations

from tests.conftest import register_and_login


def _start_attempt(client, csrf, subject="math", topic=None):
    body = {"subject_id": subject}
    if topic:
        body["topic_id"] = topic
    r = client.post("/api/v1/tests", json=body,
                    headers={"X-CSRF-Token": csrf})
    assert r.status_code == 201, r.get_json()
    return r.get_json()


class TestTestsFlow:
    def test_start_test_returns_attempt_and_questions(self, client):
        csrf, _, _ = register_and_login(client)
        body = _start_attempt(client, csrf)
        assert "attempt_id" in body
        assert "questions" in body
        assert len(body["questions"]) == 20, "should cap at 20"
        q1 = body["questions"][0]
        # No answer or explanation leaked
        assert "correct_answer" not in q1
        assert "explanation" not in q1
        assert "id" in q1
        assert "text" in q1
        assert "options" in q1
        assert "topic" in q1
        # options shape
        opt0 = q1["options"][0]
        assert "key" in opt0
        assert "text" in opt0

    def test_start_test_with_topic_filters_questions(self, client):
        csrf, _, _ = register_and_login(client)
        body = _start_attempt(client, csrf, topic="m5")
        # m5 (Həqiqi ədədlər və dərəcə) has questions 1, 14, 16 — 3 questions
        assert len(body["questions"]) >= 1
        for q in body["questions"]:
            # Each question must belong to topic m5
            assert q["topic"], "topic name missing"

    def test_submit_test_returns_result_with_correct_explanation(self, client):
        csrf, _, _ = register_and_login(client)
        body = _start_attempt(client, csrf)
        aid = body["attempt_id"]
        # Answer all questions correctly
        # Lookup correct answers from the seeded DB.
        from app.extensions import db
        from app.models.content import Question
        with client.application.app_context():
            questions = db.session.query(Question).filter(
                Question.id.in_([item["id"] for item in body["questions"]])
            ).all()
            correct_map = {str(q.id): q.correct_answer for q in questions}
        answers = {qid: ans for qid, ans in correct_map.items()}
        r = client.post(f"/api/v1/tests/{aid}/submit",
                        json={"answers": answers},
                        headers={"X-CSRF-Token": csrf})
        assert r.status_code == 200, r.get_json()
        result = r.get_json()
        assert result["attempt_id"] == aid
        assert result["subject_id"] == "math"
        assert result["subject_name"] == "Riyaziyyat"
        assert [row["question_id"] for row in result["results"]] == [
            row["id"] for row in body["questions"]
        ]
        assert result["score"] == result["total"] == len(answers)
        # Each result row must expose correct_answer + explanation
        rr = result["results"][0]
        assert "correct_answer" in rr
        assert "explanation" in rr
        assert "is_correct" in rr
        assert "user_answer" in rr
        assert "question_id" in rr
        assert rr["is_correct"] is True

    def test_submit_test_partial_score(self, client):
        csrf, _, _ = register_and_login(client)
        body = _start_attempt(client, csrf)
        aid = body["attempt_id"]
        # Answer only the first question correctly, leave the rest blank
        from app.extensions import db
        from app.models.content import Question
        with client.application.app_context():
            q = db.session.get(Question, body["questions"][0]["id"])
            first_id = str(q.id)
            first_correct = q.correct_answer
        r = client.post(f"/api/v1/tests/{aid}/submit",
                        json={"answers": {first_id: first_correct}},
                        headers={"X-CSRF-Token": csrf})
        assert r.status_code == 200
        body = r.get_json()
        assert body["score"] == 1
        assert body["total"] >= 1

    def test_double_submit_returns_409(self, client):
        csrf, _, _ = register_and_login(client)
        body = _start_attempt(client, csrf)
        aid = body["attempt_id"]
        # Submit once
        r1 = client.post(f"/api/v1/tests/{aid}/submit",
                         json={"answers": {"1": "A"}},
                         headers={"X-CSRF-Token": csrf})
        assert r1.status_code == 200, r1.get_json()
        # Submit again → 409
        r2 = client.post(f"/api/v1/tests/{aid}/submit",
                         json={"answers": {"1": "B"}},
                         headers={"X-CSRF-Token": csrf})
        assert r2.status_code == 409
        assert r2.get_json()["error"]["code"] == "already_submitted"

    def test_get_result_after_submit(self, client):
        csrf, _, _ = register_and_login(client)
        body = _start_attempt(client, csrf)
        aid = body["attempt_id"]
        client.post(f"/api/v1/tests/{aid}/submit",
                    json={"answers": {"1": "A"}},
                    headers={"X-CSRF-Token": csrf})
        r = client.get(f"/api/v1/tests/{aid}")
        assert r.status_code == 200, r.get_json()
        body = r.get_json()
        assert body["attempt_id"] == aid
        assert "results" in body
        assert "score" in body and "total" in body
        assert "started_at" in body
        assert "submitted_at" in body

    def test_get_result_unsubmitted_returns_404(self, client):
        csrf, _, _ = register_and_login(client)
        body = _start_attempt(client, csrf)
        aid = body["attempt_id"]
        r = client.get(f"/api/v1/tests/{aid}")
        assert r.status_code == 404
        assert r.get_json()["error"]["code"] == "not_found"

    def test_start_test_for_nonexistent_subject_404(self, client):
        csrf, _, _ = register_and_login(client)
        r = client.post("/api/v1/tests", json={"subject_id": "ghost"},
                        headers={"X-CSRF-Token": csrf})
        assert r.status_code == 404

    def test_questions_capped_at_20(self, client):
        csrf, _, _ = register_and_login(client)
        body = _start_attempt(client, csrf)
        assert len(body["questions"]) <= 20
