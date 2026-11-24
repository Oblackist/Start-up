"""Invalid database URLs must not disclose credentials in startup logs."""

import logging


def test_ignored_foreign_database_url_is_not_logged(monkeypatch, caplog):
    from app import create_app

    secret = "db-password-must-not-appear"
    monkeypatch.delenv("FLASK_DATABASE_URL", raising=False)
    monkeypatch.setenv("DATABASE_URL", "file:" + secret)

    with caplog.at_level(logging.WARNING):
        create_app()

    assert secret not in caplog.text
    assert "Unsupported database URL was ignored" in caplog.text
