"""Replace the question catalog with the packaged 9th, 10th and 11th grade sources."""
from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path
import sys
from xml.etree import ElementTree

from sqlalchemy import delete, select

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from app import create_app
from app.extensions import db
from app.models.content import PACKAGED_QUESTION_ID_BASE, Question, Subject, Topic
from app.services.question_bank import remove_questions
from scripts.import_question_dump import ANSWER_KEYS
from scripts.seed import SUBJECTS

SOURCE_SUBJECTS = {"math": "math", "az": "aze", "en": "eng"}
EXPECTED_GRADES = {9: 3830, 10: 3830, 11: 3770}
SVG_TAG = "{http://www.w3.org/2000/svg}svg"


def read_new_questions(directory: Path) -> tuple[list[dict], list[dict]]:
    catalog = json.loads((directory / "topics.json").read_text(encoding="utf-8"))
    topics = []
    questions = []
    for grade in EXPECTED_GRADES:
        for source_subject, subject_id in SOURCE_SUBJECTS.items():
            path = directory / f"grade{grade}-{source_subject}.json"
            bank = json.loads(path.read_text(encoding="utf-8"))
            expected_topic_ids = {
                key for key, topic in catalog.items()
                if topic["subject_id"] == subject_id and (grade, key) != (11, "stat-avg")
            }
            seen = set()
            if (bank["grade"], bank["subject"]) != (grade, source_subject):
                raise ValueError(f"Unexpected grade or subject in {path.name}")
            for source_topic in bank["topics"]:
                key = source_topic["topicId"]
                if key not in expected_topic_ids or key in seen:
                    raise ValueError(f"Unexpected or duplicate topic {key} in {path.name}")
                seen.add(key)
                meta = catalog[key]
                topic_id = f"g{grade}-{key}"
                quizzes = source_topic["quizzes"]
                quiz_count, quiz_size = (10, 8) if key == "eng-reading" else (
                    3, 20 if subject_id == "math" else 30
                )
                if len(quizzes) != quiz_count or any(len(quiz) != quiz_size for quiz in quizzes):
                    raise ValueError(f"Unexpected quiz size for {topic_id}")
                topics.append({
                    "id": topic_id, "subject_id": subject_id, "grade": grade,
                    "name": f"{meta['name']} ({grade}-{'ci' if grade == 11 else 'cu'} sinif)",
                    "order": meta["order"], "question_count": sum(map(len, quizzes)),
                })
                for quiz_number, quiz in enumerate(quizzes, start=1):
                    for position, raw in enumerate(quiz, start=1):
                        code = f"{topic_id}-q{quiz_number}-{position:02d}"
                        if raw["id"] != code:
                            raise ValueError(f"Expected question {code} in {path.name}")
                        question_id = PACKAGED_QUESTION_ID_BASE + grade * 100_000 + meta["order"] * 1_000
                        question_id += (quiz_number - 1) * 30 + position
                        questions.append(convert_question(raw, question_id, subject_id, topic_id, quiz_number))
            if seen != expected_topic_ids:
                raise ValueError(f"Missing topics in {path.name}")
    return topics, questions


def convert_question(raw: dict, question_id: int, subject_id: str,
                     topic_id: str, quiz_number: int) -> dict:
    options = []
    letter = ""
    open_answer = None
    if raw["type"] == "open":
        open_answer = raw["answer"]
        if not isinstance(open_answer, str) or not open_answer.strip() or len(open_answer) > 200:
            raise ValueError(f"Invalid open answer: {raw['id']}")
    elif raw["type"] == "single":
        labels, index = raw["options"], raw["correctIndex"]
        if (
            len(labels) != len(ANSWER_KEYS)
            or not 0 <= index < len(ANSWER_KEYS)
            or any(not isinstance(label, str) or not label.strip() for label in labels)
        ):
            raise ValueError(f"Invalid choices: {raw['id']}")
        options = [{"key": key, "text": label} for key, label in zip(ANSWER_KEYS, labels)]
        letter = ANSWER_KEYS[index]
    else:
        raise ValueError(f"Unknown question type: {raw['id']}")
    image_svg = raw.get("image")
    if image_svg is not None and (
        subject_id != "math" or not image_svg.lstrip().startswith("<svg")
        or ElementTree.fromstring(image_svg).tag != SVG_TAG
    ):
        raise ValueError(f"Invalid question diagram: {raw['id']}")
    return {
        "id": question_id, "subject_id": subject_id, "topic_id": topic_id,
        "text": raw["text"], "options_json": options, "correct_answer": letter,
        "open_answer": open_answer, "passage": raw.get("passage"), "quiz": quiz_number,
        "image_svg": image_svg,
        "explanation_json": {"summary": raw["explanation"], "steps": []},
        "difficulty": raw["difficulty"],
    }


def replace_question_bank(directory: Path) -> dict[int, int]:
    topics, questions = read_new_questions(directory / "grades-9-11")
    grades_by_topic = {topic["id"]: topic["grade"] for topic in topics}
    totals = Counter(grades_by_topic[question["topic_id"]] for question in questions)
    ids = {question["id"] for question in questions}
    if totals != EXPECTED_GRADES or len(ids) != len(questions):
        raise ValueError(f"Invalid source counts or IDs: {dict(totals)}")

    remove_questions(Question.id.not_in(ids))
    db.session.execute(delete(Topic).where(Topic.id.not_in(grades_by_topic)))
    for subject in SUBJECTS:
        db.session.merge(Subject(**subject))
    db.session.flush()
    for topic in topics:
        db.session.merge(Topic(**topic))
    db.session.flush()

    # Existing IDs stay stable for tests and stored answers on retained questions.
    stored_topics = dict(db.session.execute(select(Question.id, Question.topic_id)).all())
    for question in questions:
        stored_topic = stored_topics.get(question["id"])
        if stored_topic is not None and stored_topic != question["topic_id"]:
            raise ValueError(f"Question ID collision: {question['id']}")
        db.session.merge(Question(**question))
    db.session.commit()
    return dict(sorted(totals.items()))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--replace", action="store_true", required=True,
                        help="confirm replacement of the configured database's active questions")
    parser.add_argument("--data-dir", type=Path, default=BACKEND.parent / "data")
    args = parser.parse_args()
    app = create_app()
    with app.app_context():
        for grade, count in replace_question_bank(args.data_dir).items():
            print(f"Grade {grade}: {count}")
