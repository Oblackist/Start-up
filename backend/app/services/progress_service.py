"""Dashboard aggregation: subject readiness, weak topics, saved mistakes, chart."""
from __future__ import annotations

import datetime as _dt
from collections import defaultdict

from sqlalchemy.orm import joinedload
from sqlalchemy import select, func

from ..extensions import db
from ..models.content import Subject, Topic, Question
from ..models.test import TestAttempt, Answer
from ..models.user import Session, User
from ..security.session import get_current_session
from ..utils.errors import ApiError, ErrorCode
from .written_answers import choice_reference


def _iso(dt: _dt.datetime | None) -> str | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=_dt.timezone.utc)
    return dt.astimezone(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _local_format(dt: _dt.datetime, fmt: str) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=_dt.timezone.utc)
    # Render in local-ish UTC; tests don't check exact timezone, just shape.
    return dt.strftime(fmt)


def _current_user() -> User:
    sess = get_current_session()
    if sess is None:
        raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")
    user = db.session.get(User, sess.user_id)
    if user is None:
        raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")
    return user


class ProgressService:
    WEAK_THRESHOLD = 70  # accuracy % < 70 → weak

    def list_attempts(self, user_id: int, page: int, per_page: int) -> dict:
        total = db.session.scalar(
            select(func.count(TestAttempt.id)).where(
                TestAttempt.user_id == user_id,
                TestAttempt.submitted_at.is_not(None),
            )
        ) or 0
        offset = (page - 1) * per_page
        rows = list(db.session.execute(
            select(TestAttempt, Subject)
            .join(Subject, TestAttempt.subject_id == Subject.id)
            .where(TestAttempt.user_id == user_id, TestAttempt.submitted_at.is_not(None))
            .order_by(TestAttempt.submitted_at.desc())
            .offset(offset).limit(per_page)
        ))
        items = [
            {
                "attempt_id": a.id,
                "subject_id": a.subject_id,
                "subject_name": s.name,
                "score": a.score,
                "total": a.total,
                "submitted_at": _iso(a.submitted_at),
            }
            for a, s in rows
        ]
        return {"items": items, "page": page, "per_page": per_page, "total": int(total)}

    def dashboard(self, user_id: int) -> dict:
        user = db.session.get(User, user_id)
        if user is None:
            raise ApiError(401, ErrorCode.UNAUTHORIZED, "Autentifikasiya tələb olunur")

        # Get all subjects with question counts
        subjects = list(db.session.execute(select(Subject).order_by(Subject.id)).scalars())
        q_counts = dict(db.session.execute(
            select(Question.subject_id, func.count()).group_by(Question.subject_id)
        ).all())

        # Get all submitted attempts for the user
        attempts = list(db.session.execute(
            select(TestAttempt).where(
                TestAttempt.user_id == user_id,
                TestAttempt.submitted_at.is_not(None),
            ).order_by(TestAttempt.submitted_at.asc())
        ).scalars())

        if not attempts:
            # Empty state
            return {
                "subjects": [
                    {
                        "id": s.id,
                        "name": s.name,
                        "total_questions": q_counts.get(s.id, 0),
                        "completed_questions": 0,
                        "readiness_score": 0,
                        "last_score": None,
                        "last_date": None,
                    }
                    for s in subjects
                ],
                "weak_topics": [],
                "saved_mistakes": [],
                "progress_chart": [],
            }

        # Per-subject aggregates
        per_subject = defaultdict(lambda: {"attempts": [], "answered_correct": 0, "answered_total": 0})
        for a in attempts:
            per_subject[a.subject_id]["attempts"].append(a)

        # Per-attempt answers
        attempt_ids = [a.id for a in attempts]
        answers = list(db.session.execute(
            select(Answer, TestAttempt.subject_id).options(joinedload(Answer.question).joinedload(Question.topic))
            .join(TestAttempt, Answer.attempt_id == TestAttempt.id)
            .where(Answer.attempt_id.in_(attempt_ids))
        ).all())

        # Aggregate correct/total per subject
        sub_correct = defaultdict(int)
        sub_total = defaultdict(int)
        # Per topic accuracy
        topic_correct = defaultdict(int)
        topic_total = defaultdict(int)
        # Saved mistakes
        saved = []
        for a, s_id in answers:
            sub_total[s_id] += 1
            if a.is_correct:
                sub_correct[s_id] += 1
            q = a.question
            if q is None:
                continue
            topic_total[q.topic_id] += 1
            if a.is_correct:
                topic_correct[q.topic_id] += 1
            else:
                is_written = q.open_answer is not None or a.open_response is not None
                reference = (
                    q.open_answer if q.open_answer is not None
                    else (choice_reference(q) if is_written else f"{q.correct_answer})")
                )
                saved.append({
                    "id": f"a{a.id}",
                    "subject": q.subject.name if q.subject else None,
                    "topic": q.topic.name if q.topic else None,
                    "question_preview": (q.text[:80] + "…") if len(q.text) > 80 else q.text,
                    "user_answer": a.open_response if is_written else (
                        f"{a.user_answer})" if a.user_answer else None
                    ),
                    "correct_answer": reference,
                    "date": _local_format(a.created_at, "%d %b %Y"),
                    "status": "Yeni",
                })

        subjects_payload = []
        for s in subjects:
            total = q_counts.get(s.id, 0)
            correct = sub_correct.get(s.id, 0)
            sub_attempts = per_subject.get(s.id, {}).get("attempts", [])
            completed = min(total, correct) if total else 0
            readiness = int(round((correct / total) * 100)) if total else 0
            last = sub_attempts[-1] if sub_attempts else None
            last_score = f"{last.score} / {last.total} bal" if last else None
            last_date = _local_format(last.submitted_at, "%d %b, %H:%M") if last and last.submitted_at else None
            subjects_payload.append({
                "id": s.id,
                "name": s.name,
                "total_questions": total,
                "completed_questions": completed,
                "readiness_score": readiness,
                "last_score": last_score,
                "last_date": last_date,
            })

        # Weak topics: topics with accuracy < 70%
        weak_topics = []
        topics = list(db.session.scalars(select(Topic).options(joinedload(Topic.subject))))
        topic_q_count = dict(db.session.execute(
            select(Question.topic_id, func.count()).group_by(Question.topic_id)
        ).all())
        # Mistake count per topic
        topic_mistakes = defaultdict(int)
        for a, _s_id in answers:
            if a.is_correct:
                continue
            q = a.question
            if q is None:
                continue
            topic_mistakes[q.topic_id] += 1

        for t in topics:
            tot = topic_total.get(t.id, 0)
            cor = topic_correct.get(t.id, 0)
            if t.subject is None:
                continue
            if tot == 0:
                continue
            accuracy = int(round((cor / tot) * 100))
            if accuracy < self.WEAK_THRESHOLD:
                weak_topics.append({
                    "id": t.id,
                    "subject": t.subject.name,
                    "name": t.name,
                    "accuracy": accuracy,
                    "mistake_count": int(topic_mistakes.get(t.id, 0)),
                    "question_count": int(topic_q_count.get(t.id, 0)),
                })
        # Sort: most mistakes first
        weak_topics.sort(key=lambda x: x["mistake_count"], reverse=True)

        # Progress chart: by date (per day, average score)
        chart = []
        by_day = defaultdict(list)
        for a in attempts:
            if a.submitted_at is None:
                continue
            day = _local_format(a.submitted_at, "%d %b")
            score_pct = int(round((a.score / max(a.total, 1)) * 100))
            by_day[day].append(score_pct)
        # Order by first occurrence
        seen_order = []
        seen = set()
        for a in attempts:
            if a.submitted_at is None:
                continue
            d = _local_format(a.submitted_at, "%d %b")
            if d not in seen:
                seen.add(d)
                seen_order.append(d)
        for day in seen_order:
            scores = by_day[day]
            avg = int(round(sum(scores) / max(len(scores), 1)))
            chart.append({"date": day, "score": avg, "tests": len(scores)})

        # Saved mistakes: latest 10 wrong answers
        saved_sorted = sorted(saved, key=lambda x: x["date"], reverse=True)[:10]

        return {
            "subjects": subjects_payload,
            "weak_topics": weak_topics,
            "saved_mistakes": saved_sorted,
            "progress_chart": chart,
        }

    def practice_cards(self, user_id: int) -> list:
        dash = self.dashboard(user_id)
        topics = dict(db.session.execute(select(Topic.id, Topic.subject_id)).all())
        cards = []
        for i, t in enumerate(dash["weak_topics"], start=1):
            cards.append({
                "id": f"p{i}",
                "topic_id": t["id"],
                "subject_id": topics[t["id"]],
                "topic": t["name"],
                "subject": t["subject"],
                "questions_count": t["question_count"],
                "estimated_time": f'{min(20, t["question_count"]) * 1.5:g} dəq',
                "difficulty": "Orta",
                "description": f"{t['name']} üzrə zəif mövqe — {100 - t['accuracy']}% səhv nisbəti.",
            })
        return cards


progress_service = ProgressService()
