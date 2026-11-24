"""Operational liveness and readiness responses."""

from sqlalchemy import create_engine
from types import SimpleNamespace

from app.security.rate_limit import RedisRateLimiter


def test_sqlite_pragmas_are_scoped_to_app_engine(app):
    from app.extensions import db

    with app.app_context(), db.engine.connect() as connection:
        assert connection.exec_driver_sql("PRAGMA foreign_keys").scalar_one() == 1

    unrelated_engine = create_engine("sqlite://")
    try:
        with unrelated_engine.connect() as connection:
            assert connection.exec_driver_sql("PRAGMA foreign_keys").scalar_one() == 0
    finally:
        unrelated_engine.dispose()


def test_liveness_does_not_depend_on_database(client, monkeypatch):
    from app.routes import health as health_routes

    def fail_if_called(*_args, **_kwargs):
        raise AssertionError("liveness must not query the database")

    monkeypatch.setattr(health_routes.db.session, "execute", fail_if_called)
    response = client.get("/api/v1/health/live")

    assert response.status_code == 200
    assert response.get_json() == {"status": "ok"}


def test_readiness_returns_service_unavailable_when_database_is_down(client, monkeypatch):
    from app.routes import health as health_routes

    def database_unavailable(*_args, **_kwargs):
        raise RuntimeError("private database connection details")

    monkeypatch.setattr(health_routes.db.session, "execute", database_unavailable)
    response = client.get("/api/v1/health")

    assert response.status_code == 503
    assert response.get_json() == {"status": "not_ready"}
    assert "private database connection details" not in response.get_data(as_text=True)


def test_readiness_reports_ready_when_database_query_succeeds(client):
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.get_json() == {"status": "ok", "db": "ok"}


def test_readiness_checks_the_configured_redis_backend(client, app):
    calls = []

    def ping():
        calls.append("ping")
        return True

    app.extensions["rate_limiter"] = RedisRateLimiter(SimpleNamespace(ping=ping))
    assert client.get("/api/v1/health/live").status_code == 200
    assert calls == []
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.get_json() == {"status": "ok", "db": "ok", "redis": "ok"}
    assert calls == ["ping"]


def test_redis_unavailability_makes_readiness_fail_without_leaking_details(client, app):
    def ping():
        raise OSError("private redis credential")

    app.extensions["rate_limiter"] = RedisRateLimiter(SimpleNamespace(ping=ping))
    response = client.get("/api/v1/health")
    assert response.status_code == 503
    assert response.get_json() == {"status": "not_ready"}
