"""Reference answers for questions that also accept a written response."""
from __future__ import annotations

from functools import lru_cache
import json
from pathlib import Path
import re
from typing import TYPE_CHECKING
import unicodedata

from ..models.content import PACKAGED_QUESTION_ID_BASE
from .math_answers import exact_math_value

if TYPE_CHECKING:
    from ..models.content import Question

_AZ_CASE = str.maketrans({"I": "ı", "İ": "i"})
_TYPOGRAPHY = str.maketrans({"’": "'", "‘": "'", "–": "-", "—": "-", "−": "-"})
_WORD_RELATION = re.compile(r"«(.+?)» sözünün (?:sinonimi|antonimi) hansıdır\?")


@lru_cache(maxsize=1)
def _rubrics() -> dict[str, dict[str, list[str]]]:
    with Path(__file__).with_suffix(".json").open(encoding="utf-8") as source:
        return json.load(source)


def _normalize(text: str, subject: str) -> str:
    value = unicodedata.normalize("NFKC", text).translate(_TYPOGRAPHY).strip()
    if subject == "math":
        return "".join(value.split()).replace(",", ".").casefold()
    if subject == "aze":
        value = value.translate(_AZ_CASE)
    return " ".join(value.casefold().strip(" .!?…«»\"“”").split())


def choice_reference(question: Question) -> str:
    return next(
        (option["text"] for option in (question.options_json or [])
         if option.get("key") == question.correct_answer and option.get("text")),
        "",
    )


def written_references(question: Question) -> tuple[str, ...]:
    if question.open_answer is not None:
        return (question.open_answer,)

    if question.id >= PACKAGED_QUESTION_ID_BASE:
        return ()

    reference = choice_reference(question)
    if not reference:
        return ()
    if question.subject_id == "eng" and question.passage:
        return (reference, *_rubrics()["reading"].get(str(question.id), []))
    if question.subject_id != "aze":
        return ()

    if question.topic_id.endswith("-aze-syn"):
        match = _WORD_RELATION.fullmatch(question.text)
        if match:
            alternatives = _rubrics()["az_words"].get(_normalize(reference, "aze"), [])
            prompt_word = _normalize(match[1], "aze")
            return tuple(
                answer for answer in (reference, *alternatives)
                if _normalize(answer, "aze") != prompt_word
            )
    if question.topic_id.endswith("-aze-idiom"):
        if question.text.endswith("frazeoloji birləşmənin mənası hansıdır?"):
            return (reference, *_rubrics()["az_meanings"].get(_normalize(reference, "aze"), []))
        if question.text.endswith("mənasını bildirir?"):
            return (reference, *_rubrics()["az_idioms"].get(_normalize(reference, "aze"), []))
    return ()


def is_correct_written_answer(
    response: str, references: tuple[str, ...], subject: str,
) -> bool:
    if subject == "math":
        value = exact_math_value(response)
        for reference in references:
            expected = exact_math_value(reference)
            if expected is not None:
                if value == expected:
                    return True
            elif response.strip() and _normalize(response, subject) == _normalize(reference, subject):
                return True
        return False
    answer = _normalize(response, subject)
    return bool(answer) and any(answer == _normalize(reference, subject) for reference in references)
