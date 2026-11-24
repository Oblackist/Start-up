"""Test schemas."""
from __future__ import annotations

from marshmallow import Schema, fields, validate, validates_schema, ValidationError, EXCLUDE


class CreateTestSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    subject_id = fields.String(required=True, validate=validate.Length(min=1, max=40))
    question_count = fields.Integer(strict=True, validate=validate.Range(min=1, max=30))
    topic_id = fields.String(required=False, validate=validate.Length(min=1, max=40))
    grade = fields.Integer(strict=True, validate=validate.OneOf((9, 10, 11)))
    quiz = fields.Integer(strict=True, validate=validate.Range(min=1, max=10))

    @validates_schema
    def validate_random_count(self, data, **kwargs):
        if "quiz" not in data and data.get("question_count", 0) > 20:
            raise ValidationError({"question_count": ["Sınaqda ən çox 20 təsadüfi sual seçilə bilər."]})


class SubmitTestSchema(Schema):
    class Meta:
        unknown = EXCLUDE
        ordered = True

    answers = fields.Dict(
        keys=fields.String(),  # question_id (string in JSON)
        values=fields.String(allow_none=True, validate=validate.Length(min=1, max=200)),
        required=True,
    )
    written_answers = fields.Dict(
        keys=fields.String(),
        values=fields.String(allow_none=True, validate=validate.Length(min=1, max=200)),
    )

    def load(self, *args, **kwargs):  # type: ignore[override]
        data = super().load(*args, **kwargs)
        for field in ("answers", "written_answers"):
            for key in data.get(field, {}):
                try:
                    if int(key) < 1:
                        raise ValueError
                except (TypeError, ValueError):
                    raise ValueError("answer keys must be question ids") from None
        return data


__all__ = ["CreateTestSchema", "SubmitTestSchema"]
