"""Integration smoke test for the Flask contract used by the React app."""
import sys
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import create_app
from app.config import TestingConfig
from app.extensions import db
from app.models.user import User
from scripts.seed import run as seed


def main():
    app = create_app(TestingConfig.from_temp_db("sqlite:///:memory:"))
    with app.app_context():
        db.create_all()
        assert seed()["questions"] == 30
    client = app.test_client()
    api = "/api/v1"
    email = "integration-smoke@gmail.com"
    password = "Example-12345"
    response = client.post(api + "/auth/register", json={
        "name": "Integration Smoke", "email": email,
        "password": password, "confirm": password,
    })
    assert response.status_code == 201, response.get_json()
    assert response.get_json()["requires_verification"]
    assert client.get(api + "/auth/me").status_code == 401

    def otp():
        message = app.extensions["test_mail_outbox"][-1]
        return re.search(r"\b\d{6}\b", message.get_content()).group(0)

    response = client.post(api + "/auth/verify-otp", json={"email": email, "code": otp()})
    assert response.status_code == 200
    assert client.get(api + "/auth/me").get_json()["user"]["email"] == email
    subject = client.get(api + "/subjects/math").get_json()
    assert sum(topic["question_count"] for topic in subject["topics"]) == 30

    def write(path, body, method="POST"):
        headers = {"X-CSRF-Token": client.get_cookie("csrf_token").value}
        return client.open(api + path, method=method, json=body, headers=headers)

    response = write("/tests", {"subject_id": "math", "topic_id": "m-stat", "question_count": 1})
    assert response.status_code == 201, response.get_json()
    started = response.get_json()
    assert len(started["questions"]) == 1
    assert "correct_answer" not in started["questions"][0]
    attempt = started["attempt_id"]
    response = write(f"/tests/{attempt}/submit", {"answers": {}})
    assert response.status_code == 200, response.get_json()
    assert [q["id"] for q in started["questions"]] == [
        q["question_id"] for q in response.get_json()["results"]
    ]
    assert write(f"/tests/{attempt}/submit", {"answers": {}}).status_code == 409
    assert client.get(api + f"/tests/{attempt}").get_json()["total"] == 1
    assert client.get(api + "/me/progress").status_code == 200
    cards = client.get(api + "/practice/cards").get_json()
    assert any(card["subject_id"] == "math" and card["topic_id"] == "m-stat" for card in cards)
    assert client.get(api + "/leaderboard").status_code == 200

    assert not write("/user/profile", {"name": "Updated Name", "current_password": password}, "PUT").get_json()["requires_otp"]
    new_email = "integration-updated@gmail.com"
    assert write("/user/profile", {"email": new_email, "current_password": password}, "PUT").get_json()["requires_otp"]
    code = otp()
    response = write("/user/profile/verify-otp", {"email": new_email, "code": code})
    assert response.status_code == 200, response.get_json()
    assert response.get_json()["user"]["email"] == new_email
    assert write("/auth/logout", {}).status_code == 200
    assert client.post(api + "/auth/login", json={"email": new_email, "password": password}).status_code == 200
    print("Career Arena API integration smoke test passed")


if __name__ == "__main__":
    main()
