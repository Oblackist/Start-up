"""Keep the checked-in OpenAPI contract aligned with Flask's live URL map."""
from __future__ import annotations

import json
import re
from pathlib import Path

from openapi_spec_validator import validate

from app import create_app
from app.config import TestingConfig
from scripts.generate_openapi import build_openapi_document


OPENAPI_PATH = Path(__file__).parents[2] / "docs" / "openapi.json"
FLASK_PARAMETER = re.compile(r"<(?:([^:<>]+):)?([^<>]+)>")


def _openapi_path(rule: str) -> str:
    return FLASK_PARAMETER.sub(lambda match: "{" + match.group(2) + "}", rule)


def _openapi_type(converter: str | None) -> str:
    return "integer" if converter in {"int", "float"} else "string"


def test_openapi_31_contract_covers_live_api_paths_methods_and_parameters():
    document = json.loads(OPENAPI_PATH.read_text(encoding="utf-8"))
    app = create_app(TestingConfig())

    assert document["openapi"] == "3.1.0"
    assert document["jsonSchemaDialect"] == "https://json-schema.org/draft/2020-12/schema"
    assert document["servers"][0]["url"] == "/"
    validate(document)
    assert document == build_openapi_document(app)

    documented = {
        (path, method.lower())
        for path, path_item in document["paths"].items()
        for method in path_item
        if method.lower() in {"get", "post", "put", "patch", "delete", "options", "head", "trace"}
    }
    live = set()
    live_parameters: dict[str, dict[str, str]] = {}
    for rule in app.url_map.iter_rules():
        if not rule.rule.startswith("/api/v1/"):
            continue
        path = _openapi_path(rule.rule)
        for method in rule.methods - {"HEAD", "OPTIONS"}:
            live.add((path, method.lower()))
        live_parameters[path] = {
            match.group(2): _openapi_type(match.group(1))
            for match in FLASK_PARAMETER.finditer(rule.rule)
        }

    assert documented == live

    operation_ids: list[str] = []
    for path, path_item in document["paths"].items():
        expected_parameters = live_parameters.get(path, {})
        for method, operation in path_item.items():
            if method.lower() not in {"get", "post", "put", "patch", "delete", "options", "head", "trace"}:
                continue
            operation_ids.append(operation["operationId"])
            declared_parameters = {
                parameter["name"]: parameter
                for parameter in operation.get("parameters", [])
                if parameter["in"] == "path"
            }
            assert set(declared_parameters) == set(expected_parameters)
            for name, schema_type in expected_parameters.items():
                parameter = declared_parameters[name]
                assert parameter["required"] is True
                assert parameter["schema"]["type"] == schema_type

    assert len(operation_ids) == len(set(operation_ids))
    assert all(operation_ids)

    assert document["paths"]["/api/v1/auth/register"]["post"]["security"] == []
    assert document["paths"]["/api/v1/user/profile"]["put"]["security"] == [
        {"sessionCookie": [], "csrfHeader": []}
    ]
    assert document["paths"]["/api/v1/leaderboard"]["get"]["security"] == [
        {}, {"sessionCookie": []}
    ]
    assert document["paths"]["/api/v1/auth/logout"]["post"]["security"] == []

    schemas = document["components"]["schemas"]
    password_pattern = schemas["RegisterRequest"]["properties"]["password"]["pattern"]
    for schema_name in ("ChangePasswordRequest", "PasswordResetConfirmRequest"):
        password = schemas[schema_name]["properties"]["new_password"]
        assert password["pattern"] == password_pattern
        assert "letter" in password["description"] and "digit" in password["description"]

    profile = schemas["ProfileUpdateRequest"]
    assert profile["required"] == ["current_password"]
    assert {tuple(branch["required"]) for branch in profile["anyOf"]} == {
        ("name",), ("email",)
    }

    enrollment_secret = schemas["MfaEnrollResponse"]["properties"]["secret"]
    assert enrollment_secret["readOnly"] is True
    assert "sensitive" in enrollment_secret["description"].lower()

    dashboard = schemas["ProgressDashboard"]["properties"]
    expected_fields = {
        "subjects": {"id", "name", "total_questions", "completed_questions", "readiness_score", "last_score", "last_date"},
        "weak_topics": {"id", "subject", "name", "accuracy", "mistake_count", "question_count"},
        "saved_mistakes": {"id", "subject", "topic", "question_preview", "user_answer", "correct_answer", "date", "status"},
        "progress_chart": {"date", "score", "tests"},
    }
    for collection, properties in expected_fields.items():
        item_schema = dashboard[collection]["items"]
        assert item_schema["additionalProperties"] is False
        assert set(item_schema["properties"]) == properties
        assert set(item_schema["required"]) == properties
