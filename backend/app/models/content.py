"""Content models: Subject, Topic, Question.

Per docs/CONTRACT.md §5. Seed data is migrated from
`frontend/src/data/examData.ts` in `scripts/seed.py`.
"""
from __future__ import annotations

import datetime as _dt
from typing import Any

from sqlalchemy import (
    Index,
    ForeignKey,
    String,
    Integer,
    DateTime,
    Text,
    JSON,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..extensions import db


PACKAGED_QUESTION_ID_BASE = 3_000_000


def _utcnow() -> _dt.datetime:
    return _dt.datetime.now(_dt.timezone.utc)


class Subject(db.Model):
    __tablename__ = "subjects"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    short_desc: Mapped[str | None] = mapped_column(String(500), nullable=True)
    icon_name: Mapped[str | None] = mapped_column(String(60), nullable=True)
    created_at: Mapped[_dt.datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    topics: Mapped[list["Topic"]] = relationship(
        "Topic", back_populates="subject", cascade="all, delete-orphan"
    )
    questions: Mapped[list["Question"]] = relationship(
        "Question", back_populates="subject", cascade="all, delete-orphan"
    )


class Topic(db.Model):
    __tablename__ = "topics"

    id: Mapped[str] = mapped_column(String(40), primary_key=True)
    subject_id: Mapped[str] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    question_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    grade: Mapped[int | None] = mapped_column(Integer, nullable=True)

    subject: Mapped["Subject"] = relationship("Subject", back_populates="topics")
    questions: Mapped[list["Question"]] = relationship(
        "Question", back_populates="topic", cascade="all, delete-orphan"
    )


class Question(db.Model):
    __tablename__ = "questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    subject_id: Mapped[str] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    topic_id: Mapped[str] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"), nullable=False
    )
    text: Mapped[str] = mapped_column(Text, nullable=False)
    options_json: Mapped[list[dict[str, Any]]] = mapped_column(JSON, nullable=False)
    correct_answer: Mapped[str] = mapped_column(String(1), nullable=False)
    open_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    passage: Mapped[str | None] = mapped_column(Text, nullable=True)
    image_svg: Mapped[str | None] = mapped_column(Text, nullable=True)
    quiz: Mapped[int | None] = mapped_column(Integer, nullable=True)
    explanation_json: Mapped[dict[str, Any]] = mapped_column(JSON, nullable=False)
    difficulty: Mapped[str | None] = mapped_column(String(40), nullable=True)
    created_at: Mapped[_dt.datetime] = mapped_column(DateTime(timezone=True), default=_utcnow, nullable=False)

    subject: Mapped["Subject"] = relationship("Subject", back_populates="questions")
    topic: Mapped["Topic"] = relationship("Topic", back_populates="questions")

    __table_args__ = (
        Index("ix_questions_subject_topic", "subject_id", "topic_id"),
    )

    def to_attempt_dict(self) -> dict:
        """Shape used by POST /tests response (no answer/explanation)."""
        result = {
            "id": self.id,
            "topic": self.topic.name if self.topic else None,
            "text": self.text,
            "options": [
                {"key": o.get("key"), "text": o.get("text")} for o in (self.options_json or [])
            ],
        }
        if self.open_answer is not None:
            result["kind"] = "open"
        if self.passage:
            result["passage"] = self.passage
        if self.image_svg:
            result["image_svg"] = self.image_svg
        return result


__all__ = ["Subject", "Topic", "Question"]
