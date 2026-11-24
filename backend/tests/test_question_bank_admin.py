import json
import unittest
from pathlib import Path

from sqlalchemy import func, select

from app import create_app
from app.config import TestingConfig
from app.extensions import db
from app.models.content import Question, Subject, Topic
from app.models.user import User
from app.security.session import create_session


class QuestionBankTests(unittest.TestCase):
    def setUp(self):
        config = TestingConfig()
        config.SQLALCHEMY_DATABASE_URI = "sqlite://"
        self.app = create_app(config)
        self.client = self.app.test_client()
        with self.app.app_context():
            db.create_all()
            db.session.add(Subject(id="math", name="Math"))
            db.session.commit()

    def sign_in(self, admin=False):
        with self.app.test_request_context():
            user = User(name="Tester", email="tester@example.com", password_hash="unused",
                        is_verified=True)
            if admin:
                user.is_admin = True
            db.session.add(user)
            db.session.flush()
            token, csrf, _ = create_session(user)
            db.session.commit()
        self.client.set_cookie("session_token", token)
        return {"X-CSRF-Token": csrf}

    def test_clear_requires_admin_session_csrf_and_explicit_confirmation(self):
        route = "/api/v1/admin/question-bank"
        self.assertEqual(self.client.get(route).status_code, 401)
        headers = self.sign_in()
        self.assertEqual(self.client.get(route).status_code, 403)
        self.assertEqual(self.client.post(route + "/clear", json={"confirmation": "SİL"},
                                          headers=headers).status_code, 403)

    def test_clear_removes_questions_and_preserves_completed_results(self):
        headers = self.sign_in(admin=True)
        with self.app.app_context():
            db.session.add(Topic(id="sample", subject_id="math", name="Sample", question_count=1))
            db.session.flush()
            db.session.add(Question(subject_id="math", topic_id="sample", text="Pick one",
                                    options_json=[{"key": "A", "text": "One"}],
                                    correct_answer="A", explanation_json={}))
            db.session.commit()
        started = self.client.post("/api/v1/tests", json={"subject_id": "math"}, headers=headers)
        attempt = started.get_json()
        result = self.client.post(f"/api/v1/tests/{attempt['attempt_id']}/submit",
                                  json={"answers": {str(attempt["questions"][0]["id"]): "A"}},
                                  headers=headers)
        self.assertEqual(result.status_code, 200)
        path = "/api/v1/admin/question-bank/clear"
        self.assertEqual(self.client.post(path, json={"confirmation": "SİL"}).status_code, 403)
        self.assertEqual(self.client.post(path, json={}, headers=headers).status_code, 400)
        self.assertEqual(self.client.post(path, json={"confirmation": "SİL"},
                                          headers=headers).get_json(), {"deleted": 1})
        with self.app.app_context():
            self.assertEqual(db.session.scalar(select(func.count()).select_from(Question)), 0)
        self.assertEqual(self.client.get(f"/api/v1/tests/{attempt['attempt_id']}").get_json(),
                         result.get_json())

    def test_imported_grades_and_open_question_submission(self):
        from scripts.replace_question_bank import replace_question_bank

        directory = Path(__file__).resolve().parents[2] / "data"
        with self.app.app_context():
            replace_question_bank(directory)
            grouped = dict(db.session.execute(
                select(Topic.grade, func.count(Question.id))
                .join(Question, Question.topic_id == Topic.id).group_by(Topic.grade)
            ).all())
            self.assertEqual(grouped, {9: 3830, 10: 3830, 11: 3770})
            source = json.loads(
                (directory / "grades-9-11" / "grade9-math.json").read_text(encoding="utf-8")
            )
            first = source["topics"][0]["quizzes"][0][0]
            self.assertEqual(db.session.get(Question, 3_901_001).text, first["text"])
            open_question = db.session.scalar(
                select(Question).join(Question.topic)
                .where(Topic.grade == 9, Question.open_answer.is_not(None))
            )
            original_answer = open_question.open_answer
            self.assertTrue(original_answer)
            topic_id = open_question.topic_id
            db.session.execute(Question.__table__.delete().where(
                Question.topic_id == topic_id, Question.id != open_question.id
            ))
            db.session.commit()
        headers = self.sign_in()
        started = self.client.post("/api/v1/tests", json={
            "subject_id": "math", "topic_id": topic_id, "grade": 9,
        }, headers=headers)
        self.assertEqual(started.status_code, 201)
        question = started.get_json()["questions"][0]
        self.assertEqual(question["kind"], "open")
        self.assertNotIn("open_answer", question)
        result = self.client.post(f"/api/v1/tests/{started.get_json()['attempt_id']}/submit",
                                  json={"answers": {str(question["id"]): f" {original_answer} "}},
                                  headers=headers)
        self.assertEqual(result.status_code, 200)
        self.assertEqual(result.get_json()["score"], 1)
        next_attempt = self.client.post("/api/v1/tests", json={
            "subject_id": "math", "topic_id": topic_id, "grade": 9,
        }, headers=headers).get_json()
        written = self.client.post(f"/api/v1/tests/{next_attempt['attempt_id']}/submit",
                                   json={"answers": {}, "written_answers": {
                                       str(question["id"]): original_answer,
                                   }}, headers=headers)
        self.assertEqual(written.status_code, 200)
        self.assertEqual(written.get_json()["score"], 1)

    def test_quiz_keeps_its_reading_passage_and_returns_correct_options_after_submit(self):
        from scripts.replace_question_bank import replace_question_bank

        directory = Path(__file__).resolve().parents[2] / "data"
        with self.app.app_context():
            replace_question_bank(directory)
            expected = db.session.scalars(
                select(Question).where(Question.topic_id == "g9-eng-reading", Question.quiz == 2)
                .order_by(Question.id)
            ).all()
            expected_ids = [q.id for q in expected]
            correct = expected[0].correct_answer
            options = expected[0].options_json
        headers = self.sign_in()
        payload = {"subject_id": "eng", "topic_id": "g9-eng-reading", "grade": 9, "quiz": 2}
        attempt = self.client.post("/api/v1/tests", json=payload, headers=headers).get_json()
        self.assertEqual([q["id"] for q in attempt["questions"]], expected_ids)
        self.assertEqual(len({q["passage"] for q in attempt["questions"]}), 1)
        self.assertNotIn("correct_answer", attempt["questions"][0])
        result = self.client.post(f"/api/v1/tests/{attempt['attempt_id']}/submit",
                                  json={"answers": {str(expected_ids[0]): correct}},
                                  headers=headers).get_json()["results"][0]
        self.assertEqual(result["correct_answer"], correct)
        self.assertEqual(result["options"], options)
        self.assertEqual(result["passage"], attempt["questions"][0]["passage"])

    def test_legacy_reading_checks_paraphrases_and_rejects_changed_facts(self):
        rows = [
            (2_093_001, "Where does Lala help her aunt?", "at a stall in the town market"),
            (2_093_002, "Which fruit does Aunt Nargiz use in the autumn?", "quinces"),
            (2_093_003, "What did Lala do at first?", "She carried boxes and put jars on the table."),
        ]
        with self.app.app_context():
            db.session.add(Subject(id="eng", name="English"))
            db.session.flush()
            db.session.add(Topic(id="g9-eng-reading", subject_id="eng", name="Reading", grade=9))
            db.session.flush()
            for question_id, prompt, answer in rows:
                db.session.add(Question(
                    id=question_id, subject_id="eng", topic_id="g9-eng-reading",
                    quiz=1, text=prompt, passage="Lala helps her aunt in the town market.",
                    correct_answer="A", options_json=[{"key": "A", "text": answer}],
                    explanation_json={},
                ))
            db.session.commit()
        headers = self.sign_in()
        attempt = self.client.post("/api/v1/tests", headers=headers, json={
            "subject_id": "eng", "topic_id": "g9-eng-reading", "grade": 9, "quiz": 1,
        }).get_json()
        self.assertTrue(all(q["accepts_written_answer"] for q in attempt["questions"]))
        path = f"/api/v1/tests/{attempt['attempt_id']}"
        response = self.client.post(path + "/submit", headers=headers,
                                    json={"answers": {}, "written_answers": {
                                        "2093001": "  At her aunt’s stall in the town market.  ",
                                        "2093002": "not quinces",
                                        "2093003": "  ",
                                    }})
        self.assertEqual(response.status_code, 200)
        result = response.get_json()
        self.assertEqual(result["score"], 1)
        self.assertTrue(result["results"][0]["is_written"])
        self.assertFalse(result["results"][1]["is_correct"])
        self.assertIsNone(result["results"][2]["user_answer"])
        self.assertEqual(self.client.get(path).get_json(), result)

    def test_legacy_azerbaijani_checks_meaning_and_preserves_choice_validation(self):
        with self.app.app_context():
            db.session.add(Subject(id="aze", name="Azərbaycan dili"))
            db.session.flush()
            db.session.add(Topic(id="g9-aze-syn", subject_id="aze", name="Sinonimlər", grade=9))
            db.session.flush()
            for question_id, prompt, answer in [
                (2_091_901, "Hansı sırada yalnız sinonimlər verilib?", "şən, şad, şux"),
                (2_091_902, "«niyyət» sözünün sinonimi hansıdır?", "məqsəd"),
            ]:
                db.session.add(Question(
                    id=question_id, subject_id="aze", topic_id="g9-aze-syn",
                    quiz=1, text=prompt, correct_answer="A",
                    options_json=[{"key": "A", "text": answer}], explanation_json={},
                ))
            db.session.commit()
        headers = self.sign_in()
        attempt = self.client.post("/api/v1/tests", headers=headers, json={
            "subject_id": "aze", "topic_id": "g9-aze-syn", "grade": 9, "quiz": 1,
        }).get_json()
        choice, synonym = attempt["questions"]
        self.assertNotIn("accepts_written_answer", choice)
        self.assertTrue(synonym["accepts_written_answer"])
        path = f"/api/v1/tests/{attempt['attempt_id']}/submit"
        bad = self.client.post(path, headers=headers, json={"answers": {}, "written_answers": {
            str(choice["id"]): "şən, şad, şux",
        }})
        self.assertEqual(bad.status_code, 400)
        response = self.client.post(path, headers=headers, json={
            "answers": {str(choice["id"]): "A"}, "written_answers": {str(synonym["id"]): "MƏRAM!"},
        })
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["score"], 2)

    def test_packaged_bank_counts_and_last_reading_quiz(self):
        from scripts.replace_question_bank import read_new_questions

        data = Path(__file__).resolve().parents[2] / "data" / "grades-9-11"
        topics, questions = read_new_questions(data)
        self.assertEqual(len(questions), 11430)
        self.assertEqual(len({q["id"] for q in questions}), len(questions))
        self.assertEqual(sum(q["open_answer"] is not None for q in questions), 193)
        self.assertEqual(sum(bool(q["image_svg"]) for q in questions), 551)
        self.assertEqual(sum(bool(q["passage"]) for q in questions), 240)

        from scripts.replace_question_bank import replace_question_bank
        with self.app.app_context():
            replace_question_bank(data.parent)
        headers = self.sign_in()
        reading = self.client.post("/api/v1/tests", json={
            "subject_id": "eng", "topic_id": "g11-eng-reading", "quiz": 10,
        }, headers=headers)
        self.assertEqual(reading.status_code, 201)
        rows = reading.get_json()["questions"]
        self.assertEqual(len(rows), 8)
        self.assertEqual(len({q["passage"] for q in rows}), 1)
        self.assertTrue(all(len(q["options"]) == 5 and "accepts_written_answer" not in q for q in rows))
        language = self.client.post("/api/v1/tests", json={
            "subject_id": "aze", "topic_id": "g10-aze-sound", "quiz": 3,
        }, headers=headers)
        self.assertEqual(language.status_code, 201)
        self.assertEqual(len(language.get_json()["questions"]), 30)

        diagram = self.client.post("/api/v1/tests", json={
            "subject_id": "math", "topic_id": "g9-geo-basic", "quiz": 1,
        }, headers=headers).get_json()
        illustrated = next(question for question in diagram["questions"] if question.get("image_svg"))
        result = self.client.post(f"/api/v1/tests/{diagram['attempt_id']}/submit",
                                  json={"answers": {}}, headers=headers)
        self.assertEqual(result.status_code, 200)
        review = next(row for row in result.get_json()["results"] if row["question_id"] == illustrated["id"])
        self.assertEqual(review["image_svg"], illustrated["image_svg"])

    def test_subject_list_includes_grade_counts_from_current_questions(self):
        with self.app.app_context():
            for topic_id, grade in [("new-grade", 9), ("empty-grade", 11), ("legacy", None)]:
                db.session.add(Topic(id=topic_id, grade=grade, subject_id="math", name=topic_id,
                                     question_count=99))
            db.session.flush()
            for topic_id in ("new-grade", "legacy"):
                db.session.add(Question(subject_id="math", topic_id=topic_id, text="Pick one",
                                        options_json=[{"key": "A", "text": "One"}],
                                        correct_answer="A", explanation_json={}))
            db.session.commit()
        response = self.client.get("/api/v1/subjects")
        self.assertEqual(response.status_code, 200)
        summary = response.get_json()[0]
        self.assertEqual(summary["topic_count"], 3)
        self.assertEqual(summary["question_count"], 2)
        self.assertEqual(summary["grade_question_counts"], {"9": 2, "10": 1, "11": 1})

    def test_exact_math_equivalence(self):
        from app.services.written_answers import is_correct_written_answer

        for response, reference in [("0,50", "1/2"), ("56/6", "28/3"), ("sqrt(8) / sqrt(2)", "2"), ("2√2", "√8")]:
            self.assertTrue(is_correct_written_answer(response, (reference,), "math"), response)
        for response, reference in [("9.33", "28/3"), ("1/0", "0"), ("8**99999999", "8"), ("1 2", "12")]:
            self.assertFalse(is_correct_written_answer(response, (reference,), "math"), response)
