from collections import defaultdict

from sqlalchemy import delete, false, func, select, update
from sqlalchemy.orm import joinedload

from ..extensions import db
from ..models.content import Question, Topic
from ..models.test import Answer, TestAttempt


def lock_sqlite_question_writes() -> None:
    if db.session.get_bind().dialect.name == "sqlite":
        # Acquire the SQLite writer lock before reading questions used by a write.
        db.session.execute(update(Question).where(false()).values(id=Question.id))


def remove_questions(*filters) -> int:
    """Remove questions and preserve completed results in the same transaction."""
    lock_sqlite_question_writes()
    # On PostgreSQL, wait for any submission currently reading affected rows.
    db.session.execute(
        select(Question.id).where(*filters).order_by(Question.id).with_for_update()
    ).all()
    affected = (
        select(Answer.attempt_id)
        .join(Question, Answer.question_id == Question.id)
        .where(*filters)
    )
    rows = db.session.scalars(
        select(Answer)
        .join(TestAttempt, Answer.attempt_id == TestAttempt.id)
        .options(joinedload(Answer.question).joinedload(Question.topic), joinedload(Answer.attempt))
        .where(
            Answer.attempt_id.in_(affected),
            TestAttempt.submitted_at.is_not(None),
            TestAttempt.archived_results.is_(None),
        )
        .order_by(Answer.id)
    )
    snapshots = defaultdict(list)
    for answer in rows:
        snapshots[answer.attempt].append(answer.to_result_dict())
    for attempt, results in snapshots.items():
        attempt.archived_results = results
    db.session.flush()

    count = db.session.execute(delete(Question).where(*filters)).rowcount
    if count:
        db.session.execute(update(TestAttempt).where(
            TestAttempt.submitted_at.is_(None), TestAttempt.question_ids.is_(None)
        ).values(question_ids=[]))
    db.session.execute(update(Topic).values(question_count=(
        select(func.count(Question.id)).where(Question.topic_id == Topic.id).scalar_subquery()
    )))
    return count
