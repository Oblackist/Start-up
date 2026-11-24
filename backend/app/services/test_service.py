"""Test orchestration: start / submit / fetch result.

Idempotency: a second submit returns 409 already_submitted (does NOT
overwrite the first submission).
"""
from __future__ import annotations

import datetime as _dt
from typing import Any

from sqlalchemy import func, select, update
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models.content import Subject, Topic, Question
from ..models.test import TestAttempt, Answer
from ..models.user import User
from ..security.session import get_current_session
from ..utils.errors import ApiError, ErrorCode
from .question_bank import lock_sqlite_question_writes
from .written_answers import is_correct_written_answer, written_references


def _utcnow() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc)


def _iso(dt: _dt.datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=_dt.timezone.utc)
    return dt.astimezone(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _current_user() -> User:
    sess = get_current_session()
    if sess is None:
        raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")
    user = db.session.get(User, sess.user_id)
    if user is None:
        raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")
    return user


class TestService:
    MAX_QUESTIONS = 20

    def start_test(
        self, subject_id: str, topic_id: str | None,
        question_count: int | None = None, grade: int | None = None, quiz: int | None = None,
    ) -> dict:
        user = _current_user()
        subject = db.session.get(Subject, subject_id)
        if subject is None:
            raise ApiError(404, ErrorCode.NOT_FOUND, "Fənn tapılmadı")
        q = select(Question).where(Question.subject_id == subject_id)
        if topic_id:
            topic = db.session.get(Topic, topic_id)
            if topic is None or topic.subject_id != subject_id:
                raise ApiError(404, ErrorCode.NOT_FOUND, "Mövzu tapılmadı")
            q = q.where(Question.topic_id == topic_id)
        if grade is not None:
            q = q.where(Question.topic.has(Topic.grade == grade))
        if quiz is not None:
            if not topic_id:
                raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Quiz üçün mövzu seçilməlidir")
            q = q.where(Question.quiz == quiz).order_by(Question.id)
        else:
            q = q.order_by(func.random())
        q = q.options(joinedload(Question.topic))
        limit = question_count if quiz is not None else question_count or self.MAX_QUESTIONS
        questions = list(db.session.scalars(q.limit(limit)))
        if not questions:
            raise ApiError(404, ErrorCode.NOT_FOUND, "Bu mövzu üçün sual yoxdur")
        previous_ids = None
        if quiz is None:
            previous_ids = db.session.scalar(
                select(TestAttempt.question_ids)
                .where(TestAttempt.user_id == user.id, TestAttempt.subject_id == subject_id)
                .order_by(TestAttempt.id.desc())
                .limit(1)
            )
        question_ids = [question.id for question in questions]
        if previous_ids and set(previous_ids) == set(question_ids):
            replacement = db.session.scalar(q.where(Question.id.not_in(question_ids)).limit(1))
            if replacement is not None:
                questions[-1] = replacement
            elif len(questions) > 1 and question_ids == previous_ids:
                questions = questions[1:] + questions[:1]
            question_ids = [question.id for question in questions]
        question_payload = []
        for question in questions:
            payload = question.to_attempt_dict()
            if question.open_answer is None and written_references(question):
                payload["accepts_written_answer"] = True
            question_payload.append(payload)

        attempt = TestAttempt(
            user_id=user.id,
            subject_id=subject.id,
            started_at=_utcnow(),
            score=0,
            total=len(questions),
            question_ids=question_ids,
        )
        db.session.add(attempt)
        db.session.flush()
        result = {"attempt_id": attempt.id, "questions": question_payload}
        db.session.commit()
        return result

    def submit_test(
        self, attempt_id: int, answers: dict[str, str | None],
        written_answers: dict[str, str | None] | None = None,
    ) -> dict:
        user = _current_user()
        lock_sqlite_question_writes()
        attempt = db.session.get(TestAttempt, attempt_id)
        if attempt is None:
            # Avoid leaking existence — use 404 (consistent with GET).
            raise ApiError(404, ErrorCode.NOT_FOUND, "Sınaq tapılmadı")
        if attempt.user_id != user.id:
            # 404 is also acceptable per contract; we pick 403 for owner-only
            # as a clearer signal and to match the GET /tests/<id> path.
            raise ApiError(403, ErrorCode.FORBIDDEN, "Bu sınağa giriş yoxdur")
        if attempt.is_submitted:
            raise ApiError(409, ErrorCode.ALREADY_SUBMITTED, "Bu sınaq artıq təsdiqlənib")

        statement = select(Question).options(joinedload(Question.topic))
        if attempt.question_ids is None:
            # Follow the historical ordering for attempts from before this migration.
            statement = statement.where(Question.subject_id == attempt.subject_id)
        else:
            statement = statement.where(Question.id.in_(attempt.question_ids))
        questions = list(db.session.scalars(
            statement.order_by(Question.id).limit(attempt.total)
            .with_for_update(read=True, of=Question)
        ))
        if len(questions) != attempt.total:
            raise ApiError(409, ErrorCode.VALIDATION_FAILED, "Sınağın sual bankı dəyişib. Yeni sınaq başladın.")
        if attempt.question_ids is not None:
            by_id = {question.id: question for question in questions}
            questions = [by_id[question_id] for question_id in attempt.question_ids]

        submitted_at = _utcnow()
        claimed = db.session.execute(
            update(TestAttempt)
            .where(TestAttempt.id == attempt.id, TestAttempt.submitted_at.is_(None))
            .values(submitted_at=submitted_at)
        )
        if claimed.rowcount != 1:
            db.session.rollback()
            raise ApiError(409, ErrorCode.ALREADY_SUBMITTED, "Bu sınaq artıq təsdiqlənib")

        # Create answer rows for each question in the attempt
        written_answers = written_answers or {}
        results = []
        correct = 0
        for q in questions:
            question_id = str(q.id)
            user_ans = answers.get(question_id)
            written = (written_answers.get(question_id) or "").strip() or None
            is_open = q.open_answer is not None
            if written is not None:
                references = written_references(q)
                if not references or (user_ans and user_ans.strip()):
                    raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Bu sual üçün bir cavab göndər")
                is_correct = is_correct_written_answer(written, references, q.subject_id)
            elif is_open:
                written = (user_ans or "").strip() or None
                is_correct = written is not None and is_correct_written_answer(
                    written, (q.open_answer,), q.subject_id,
                )
            else:
                if user_ans and len(user_ans) != 1:
                    raise ApiError(400, ErrorCode.VALIDATION_FAILED, "Variant cavabı bir hərf olmalıdır")
                is_correct = user_ans is not None and user_ans == q.correct_answer
            if is_correct:
                correct += 1
            a = Answer(
                attempt_id=attempt.id,
                question=q,
                user_answer=None if is_open or written is not None else user_ans,
                open_response=written,
                is_correct=is_correct,
                created_at=submitted_at,
            )
            db.session.add(a)
            results.append(a.to_result_dict())
        attempt.score = correct
        subject_name = attempt.subject.name
        db.session.commit()
        return {
            "attempt_id": attempt.id,
            "subject_id": attempt.subject_id,
            "subject_name": subject_name,
            "score": correct,
            "total": attempt.total,
            "started_at": _iso(attempt.started_at),
            "submitted_at": _iso(attempt.submitted_at),
            "results": results,
        }

    def get_result(self, attempt_id: int) -> dict:
        user = _current_user()
        attempt = db.session.get(TestAttempt, attempt_id)
        if attempt is None:
            raise ApiError(404, ErrorCode.NOT_FOUND, "Sınaq tapılmadı")
        if attempt.user_id != user.id:
            raise ApiError(403, ErrorCode.FORBIDDEN, "Bu sınağa giriş yoxdur")
        if not attempt.is_submitted:
            # Treat an unsubmitted attempt as "not found" for GET purposes.
            raise ApiError(404, ErrorCode.NOT_FOUND, "Sınaq tapılmadı")
        results = attempt.archived_results
        if results is None:
            answers_rows = db.session.scalars(
                select(Answer).options(joinedload(Answer.question).joinedload(Question.topic))
                .where(Answer.attempt_id == attempt.id).order_by(Answer.id)
            )
            results = [answer.to_result_dict() for answer in answers_rows]
        return {
            "attempt_id": attempt.id,
            "subject_id": attempt.subject_id,
            "subject_name": attempt.subject.name,
            "score": attempt.score,
            "total": attempt.total,
            "started_at": _iso(attempt.started_at),
            "submitted_at": _iso(attempt.submitted_at),
            "results": results,
        }


test_service = TestService()
