"""Public content routes: /subjects, /subjects/<id>, /subjects/<id>/topics."""
from __future__ import annotations

from collections import defaultdict
from flask import Blueprint, jsonify
from sqlalchemy import select, func

from ..extensions import db
from ..models.content import Subject, Topic, Question
from ..utils.errors import ApiError, ErrorCode

bp = Blueprint("subjects", __name__)


def _subject_summary(s: Subject, topic_count: int, question_count: int) -> dict:
    return {
        "id": s.id,
        "name": s.name,
        "short_desc": s.short_desc,
        "icon_name": s.icon_name,
        "topic_count": topic_count,
        "question_count": question_count,
    }


@bp.route("/subjects", methods=["GET"])
def list_subjects():
    topics = select(Topic.subject_id, func.count().label("total")).group_by(Topic.subject_id).subquery()
    counts_by_subject = defaultdict(dict)
    for subject_id, grade, count in db.session.execute(
        select(Question.subject_id, Topic.grade, func.count())
        .join(Topic, Topic.id == Question.topic_id)
        .group_by(Question.subject_id, Topic.grade)
    ):
        counts_by_subject[subject_id][grade] = count

    rows = db.session.execute(
        select(Subject, topics.c.total)
        .outerjoin(topics, topics.c.subject_id == Subject.id)
        .order_by(Subject.id)
    )
    summaries = []
    for subject, topic_count in rows:
        grade_counts = counts_by_subject[subject.id]
        legacy_count = grade_counts.get(None, 0)
        summary = _subject_summary(subject, topic_count or 0, sum(grade_counts.values()))
        summary["grade_question_counts"] = {
            str(grade): grade_counts.get(grade, 0) + legacy_count for grade in (9, 10, 11)
        }
        summaries.append(summary)
    return jsonify(summaries), 200


def _topics(subject_id: str) -> list[dict]:
    counts = defaultdict(int)
    quizzes = defaultdict(list)
    rows = db.session.execute(
        select(Question.topic_id, Question.quiz, func.count())
        .where(Question.subject_id == subject_id)
        .group_by(Question.topic_id, Question.quiz).order_by(Question.quiz)
    )
    for topic_id, quiz, count in rows:
        counts[topic_id] += count
        if quiz is not None:
            quizzes[topic_id].append({"number": quiz, "question_count": count})
    topics = db.session.scalars(
        select(Topic).where(Topic.subject_id == subject_id).order_by(Topic.order, Topic.id)
    )
    return [
        {"id": topic.id, "name": topic.name, "question_count": counts[topic.id],
         "grade": topic.grade, "quizzes": quizzes[topic.id]}
        for topic in topics
    ]


@bp.route("/subjects/<subject_id>", methods=["GET"])
def get_subject(subject_id: str):
    s = db.session.get(Subject, subject_id)
    if s is None:
        raise ApiError(404, ErrorCode.NOT_FOUND, "Mövzu tapılmadı")
    return jsonify({
        "id": s.id,
        "name": s.name,
        "short_desc": s.short_desc,
        "icon_name": s.icon_name,
        "topics": _topics(subject_id),
    }), 200


@bp.route("/subjects/<subject_id>/topics", methods=["GET"])
def list_subject_topics(subject_id: str):
    s = db.session.get(Subject, subject_id)
    if s is None:
        raise ApiError(404, ErrorCode.NOT_FOUND, "Mövzu tapılmadı")
    return jsonify(_topics(subject_id)), 200


__all__ = ["bp"]
