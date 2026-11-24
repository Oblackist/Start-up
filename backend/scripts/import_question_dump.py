"""Import the Career Arena PostgreSQL question dump into the app database."""

from __future__ import annotations

import argparse
from collections import Counter
import json
from pathlib import Path
import re
import sys

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))

from app import create_app
from app.extensions import db
from app.models.content import Question, Subject, Topic
from scripts.seed import SUBJECTS

SUBJECT_IDS = {
    "Riyaziyyat": "math",
    "Azərbaycan dili": "aze",
    "İngilis dili": "eng",
}
QUESTION_ID_BASE = 1_000_000
ANSWER_KEYS = "ABCDE"
TOPIC_LABELS = {
    "Sinonim və antonym": "Sinonimlər və antonimlər",
    "Tenses": "Feil zamanları",
    "Conditionals": "Şərt cümlələri",
    "Passive voice": "Məchul növ",
    "Word formatting": "Söz düzəltmə",
    "Phrasal verbs": "Frazeoloji feillər",
    "Main idea": "Əsas fikir",
    "Inference": "Mətndən nəticə çıxarma",
}
# These ranges have NULL topic_id in the supplied dump. The prompts and
# answer choices identify their topics, but the source gives no grade.
UNASSIGNED_TOPICS = (
    (117, 148, "eng", "Söz düzəltmə (Word Formation)"),
    (793, 820, "aze", "Sinonimlər və antonimlər"),
)

# Read plain pg_dump VALUES as data. Never execute commands from the dump.
INSERT = re.compile(
    r"^INSERT INTO public\.(subjects|sections|topics|questions) VALUES \(",
    re.MULTILINE,
)
VALUE = re.compile(r"\s*(?:'((?:[^']|'')*)'|(-?[0-9]+)|(NULL))\s*([,)])")
COLUMN_COUNTS = {"subjects": 2, "sections": 3, "topics": 4, "questions": 6}


def read_rows(path: Path) -> dict[str, dict[int, list]]:
    dump = path.read_text(encoding="utf-8-sig")
    rows: dict[str, dict[int, list]] = {name: {} for name in COLUMN_COUNTS}
    for insert in INSERT.finditer(dump):
        table = insert[1]
        position = insert.end()
        fields = []
        for column in range(COLUMN_COUNTS[table]):
            value = VALUE.match(dump, position)
            final = column == COLUMN_COUNTS[table] - 1
            if value is None or value[4] != (")" if final else ","):
                raise ValueError(f"Unsupported row in {table} at offset {insert.start()}")
            string, number, _, _ = value.groups()
            fields.append(string.replace("''", "'") if string is not None else
                          int(number) if number is not None else None)
            position = value.end()
        row_id, *data = fields
        if dump[position:position + 1] != ";" or not isinstance(row_id, int):
            raise ValueError(f"Invalid row in {table} at offset {insert.start()}")
        if row_id in rows[table]:
            raise ValueError(f"Duplicate ID {row_id} in {table}")
        rows[table][row_id] = data

    for table, data in rows.items():
        declared = re.findall(rf"^INSERT INTO public\.{table}\b", dump, re.MULTILINE)
        if not data or len(data) != len(declared):
            raise ValueError(f"Missing or unsupported INSERT rows in {table}")
    return rows


def import_catalog(path: Path) -> None:
    rows = read_rows(path)
    subject_ids = {
        source_id: SUBJECT_IDS[name]
        for source_id, (name,) in rows["subjects"].items()
    }
    if sorted(subject_ids.values()) != sorted(SUBJECT_IDS.values()):
        raise ValueError("The dump must contain each of the three subjects once.")

    topics = {}
    for topic_id, (section_id, name, grade) in sorted(rows["topics"].items()):
        subject_id, _ = rows["sections"][section_id]
        if grade not in (9, 11):
            raise ValueError(f"Unexpected grade for topic {topic_id}: {grade}")
        topics[topic_id] = {
            "id": f"backup-topic-{topic_id}",
            "subject_id": subject_ids[subject_id],
            "name": f"{TOPIC_LABELS.get(name, name)} ({grade}-{'cu' if grade == 9 else 'ci'} sinif)",
            "order": topic_id,
            "question_count": 0,
            "grade": grade,
        }

    fallback_topics = {}
    for first, last, subject_id, name in UNASSIGNED_TOPICS:
        topic = {
            "id": f"backup-topic-unassigned-{subject_id}",
            "subject_id": subject_id,
            "name": name,
            "order": 100,
            "question_count": 0,
        }
        fallback_topics.update(dict.fromkeys(range(first, last + 1), topic))

    questions = []
    for source_id, (topic_id, text, options_json, answer, explanation) in rows["questions"].items():
        if not 0 < source_id < QUESTION_ID_BASE:
            raise ValueError(f"Unexpected source question ID: {source_id}")
        topic = fallback_topics.get(source_id) if topic_id is None else topics[topic_id]
        if topic is None:
            raise ValueError(f"No topic mapping for source question {source_id}")
        options = json.loads(options_json)
        if (
            not isinstance(options, dict)
            or not isinstance(text, str)
            or not text.strip()
            or len(options) < 2
            or any(key not in ANSWER_KEYS or len(key) != 1 for key in options)
            or any(not isinstance(label, str) or not label.strip() for label in options.values())
            or answer not in options
        ):
            raise ValueError(f"Invalid question or options in source question {source_id}")
        questions.append({
            "id": QUESTION_ID_BASE + source_id,
            "subject_id": topic["subject_id"],
            "topic_id": topic["id"],
            "text": text,
            "options_json": [{"key": key, "text": label} for key, label in sorted(options.items())],
            "correct_answer": answer,
            "explanation_json": {"summary": explanation} if explanation else {},
        })
        topic["question_count"] += 1

    catalog_topics = list(topics.values()) + [
        fallback_topics[first] for first, *_ in UNASSIGNED_TOPICS
        if fallback_topics[first]["question_count"]
    ]
    app = create_app()
    with app.app_context():
        for subject in SUBJECTS:
            db.session.merge(Subject(**subject))
        db.session.flush()

        for topic in catalog_topics:
            stored = db.session.get(Topic, topic["id"])
            if stored is not None and stored.subject_id != topic["subject_id"]:
                raise ValueError(f"Topic ID collision: {stored.id}")
            db.session.merge(Topic(**topic))
        db.session.flush()

        for question in questions:
            stored = db.session.get(Question, question["id"])
            if stored is not None and stored.topic_id != question["topic_id"]:
                raise ValueError(f"Question ID collision: {stored.id}")
            db.session.merge(Question(**question))
        db.session.commit()

    question_counts = Counter(question["subject_id"] for question in questions)
    topic_counts = Counter(topic["subject_id"] for topic in catalog_topics)
    for subject_id in SUBJECT_IDS.values():
        print(f"{subject_id}: {topic_counts[subject_id]} topics, {question_counts[subject_id]} questions")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("dump", type=Path, help="path to the original SQL backup")
    import_catalog(parser.parse_args().dump)
