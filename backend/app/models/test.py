from __future__ import annotations
import datetime as _dt

from sqlalchemy import (
    Index,
    JSON,
    ForeignKey,
    String,
    Integer,
    DateTime,
    Boolean,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db


def _utcnow() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc)


class TestAttempt(db.Model):
    __tablename__ = "test_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    subject_id: Mapped[str] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    started_at: Mapped[_dt.datetime] = mapped_column(
        DateTime(timezone=True), default=_utcnow, nullable=False
    )
    submitted_at: Mapped[_dt.datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    score: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    question_ids: Mapped[list[int] | None] = mapped_column(JSON, nullable=True)
    archived_results: Mapped[list[dict] | None] = mapped_column(JSON, nullable=True)

    user: Mapped["User"] = relationship("User")  # noqa: F821
    subject: Mapped["Subject"] = relationship("Subject")  # noqa: F821
    answers: Mapped[list["Answer"]] = relationship(
        "Answer", back_populates="attempt", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_attempts_user_subject", "user_id", "subject_id"),
        # Leaderboard aggregate (docs/CONTRACT.md §8): submitted attempts
        # filtered by optional subject_id. Covers the WHERE clause of the
        # aggregate query; user grouping happens on top of it.
        Index("ix_attempts_subject_submitted", "subject_id", "submitted_at"),
    )

    @property
    def is_submitted(self) -> bool:
        return self.submitted_at is not None


class Answer(db.Model):
    __tablename__ = "answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    attempt_id: Mapped[int] = mapped_column(
        ForeignKey("test_attempts.id", ondelete="CASCADE"), nullable=False
    )
    question_id: Mapped[int] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), nullable=False
    )
    user_answer: Mapped[str | None] = mapped_column(String(1), nullable=True)
    open_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    created_at: Mapped[_dt.datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    attempt: Mapped["TestAttempt"] = relationship("TestAttempt", back_populates="answers")
    question: Mapped["Question"] = relationship("Question")  # noqa: F821

    __table_args__ = (
        UniqueConstraint("attempt_id", "question_id", name="uq_attempt_question"),
    )

    def to_result_dict(self) -> dict:
        question = self.question
        is_open = question.open_answer is not None
        result = {
            "question_id": question.id,
            "topic": question.topic.name if question.topic else None,
            "text": question.text,
            "user_answer": self.open_response if is_open or self.open_response is not None else self.user_answer,
            "correct_answer": question.open_answer if is_open else question.correct_answer,
            "is_correct": bool(self.is_correct),
            "explanation": question.explanation_json,
        }
        if not is_open and self.open_response is not None:
            result["is_written"] = True
        if question.options_json:
            result["options"] = question.options_json
        if question.passage:
            result["passage"] = question.passage
        if question.image_svg:
            result["image_svg"] = question.image_svg
        return result


__all__ = ["TestAttempt", "Answer"]
