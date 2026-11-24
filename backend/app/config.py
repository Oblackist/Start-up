"""Config classes loaded from environment variables.

`Dev` / `Testing` are lenient. `Production` validates that secrets are
present and not placeholders; if validation fails `Production.validate()`
raises `RuntimeError` and `create_app()` aborts startup.
"""
from __future__ import annotations

import os
import base64
import ipaddress
import re
from typing import Any
from urllib.parse import parse_qs, urlsplit


# A short list of placeholder values seen in .env.example. If a secret
# equals any of these the production config refuses to boot.
_PLACEHOLDER_VALUES = {
    "",
    "change-me",
    "change-me-please-use-32+random-bytes",
    "change-me-32+random-bytes-please",
    "change-me-...",
    "your-secret-here",
    "replace-me",
    "secret",
    # The DevConfig default pepper (so production can never accidentally
    # ship with the dev fallback). Dev boots fine; production rejects it.
    "dev-pepper-not-for-production-please-set-a-real-one-in-.env",
}

_HOST_LABEL = re.compile(r"[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\Z")


def _is_valid_origin_host(hostname: str) -> bool:
    try:
        ipaddress.ip_address(hostname)
        return True
    except ValueError:
        labels = hostname.rstrip(".").split(".")
        return len(hostname) <= 253 and all(_HOST_LABEL.fullmatch(label) for label in labels)


def _env_bool(name: str, default: bool = False) -> bool:
    raw = os.environ.get(name, "").strip().lower()
    if not raw:
        return default
    return raw in ("1", "true", "yes", "on")


def _env_int(name: str, default: int) -> int:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def apply_environment_overrides(target: Any) -> None:
    """Resolve environment-backed settings after Flask has loaded `.env`.

    Config class attributes are evaluated at import time, before create_app
    loads dotenv. Reapply supported runtime values afterwards so production
    secrets and SMTP/MFA settings from `.env` actually reach the app.
    """
    strings = (
        "SECRET_KEY", "FRONTEND_ORIGIN", "PASSWORD_PEPPER", "MFA_ENCRYPTION_KEY",
        "SMTP_HOST", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM",
        "TURNSTILE_SECRET_KEY", "RATE_LIMIT_BACKEND", "REDIS_URL",
    )
    integers = (
        "SESSION_TTL_HOURS", "SESSION_IDLE_TTL_MINUTES", "PASSWORD_RESET_TTL_MIN", "OTP_TTL_MIN",
        "SMTP_PORT", "SMTP_TIMEOUT_SECONDS", "RATE_LIMIT_LOGIN_MAX",
        "RATE_LIMIT_REGISTER_MAX", "RATE_LIMIT_RESET_MAX",
        "RATE_LIMIT_VERIFY_RESEND_MAX", "RATE_LIMIT_VERIFY_OTP_MAX",
        "RATE_LIMIT_MFA_CHALLENGE_MAX", "RATE_LIMIT_CAPTCHA_GENERATE_MAX",
        "RATE_LIMIT_RESET_CONFIRM_MAX", "RATE_LIMIT_PROFILE_UPDATE_MAX",
        "RATE_LIMIT_PROFILE_EMAIL_VERIFY_MAX",
        "RATE_LIMIT_MFA_RECOVERY_ROTATE_MAX", "RATE_LIMIT_SESSIONS_MAX",
        "RATE_LIMIT_REDIS_SOCKET_TIMEOUT",
        "RATE_LIMIT_WINDOW",
    )
    booleans = ("SMTP_USE_SSL", "SMTP_STARTTLS")
    for key in strings:
        if key in os.environ:
            target[key] = os.environ[key]
    for key in integers:
        if key in os.environ:
            target[key] = _env_int(key, int(target.get(key, 0)))
    for key in booleans:
        if key in os.environ:
            target[key] = _env_bool(key, bool(target.get(key, False)))
    if "FORCE_HTTPS" in os.environ:
        target["PREFERRED_URL_SCHEME"] = "https" if _env_bool("FORCE_HTTPS") else "http"


# --- Database URL resolution ------------------------------------------------
# NOTE: this app reads FLASK_DATABASE_URL first, then DATABASE_URL. A bare
# `DATABASE_URL` is a very generic name that OTHER tools also set (Prisma sets
# `file:./dev.db`, some CI images / PaaS templates set postgres URLs, ...). A
# foreign value is not parseable by SQLAlchemy and crashed the app at boot
# with "Could not parse SQLAlchemy URL from given URL string". We therefore
# VALIDATE the scheme and fall back to the default SQLite path for foreign
# values in development. ProductionConfig rejects a missing/foreign DB URL.
_SQLALCHEMY_SCHEMES = (
    "sqlite://", "postgresql+psycopg://", "postgresql://", "postgres://", "mysql+pymysql://",
    "mysql://", "mariadb://", "mssql://", "oracle://",
)


def _raw_db_url() -> str:
    raw = os.environ.get("FLASK_DATABASE_URL", "").strip()
    if not raw:
        raw = os.environ.get("DATABASE_URL", "").strip()
    return raw


def _default_db_url() -> str:
    return "sqlite:///" + os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "instance", "app.db",
    )


def _resolve_db_url() -> str:
    """Resolve + validate. Returns the default SQLite path when the env value
    is missing or is a foreign (non-SQLAlchemy) URL. Relative SQLite paths are
    made absolute against the backend root."""
    raw = _raw_db_url()
    if not raw:
        return _default_db_url()
    if not raw.startswith(_SQLALCHEMY_SCHEMES):
        # Foreign URL (e.g. Prisma's `file:...`) — NOT ours to use.
        # create_app warns; the default keeps the app booting.
        return ""
    if raw.startswith("postgres://"):
        raw = "postgresql+psycopg://" + raw[len("postgres://"):]
    elif raw.startswith("postgresql://"):
        raw = "postgresql+psycopg://" + raw[len("postgresql://"):]
    if raw.startswith("sqlite:///") and not raw.startswith("sqlite:////"):
        base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        rel = raw[len("sqlite:///"):]
        raw = "sqlite:///" + os.path.normpath(os.path.join(base, rel))
    return raw


def resolve_db_url_for_app() -> tuple[str, str | None]:
    """Post-load_dotenv resolution used by create_app.

    Returns (uri, ignored_value). `ignored_value` is set when a foreign
    DATABASE_URL was present and ignored (so create_app can warn).
    """
    raw = _raw_db_url()
    resolved = _resolve_db_url()
    if resolved:
        return resolved, None
    if raw:
        return _default_db_url(), raw
    return _default_db_url(), None


class BaseConfig:
    """Common to every environment."""

    # Flask
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-not-for-production")
    PREFERRED_URL_SCHEME = "https" if _env_bool("FORCE_HTTPS") else "http"
    MAX_CONTENT_LENGTH = 1_000_000  # 1 MiB request size hard cap

    SQLALCHEMY_DATABASE_URI = _resolve_db_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        # SQLite pragmas set via event listener in middleware/security.py.
        "pool_pre_ping": True,
    }

    # CORS — single origin, credentials allowed.
    FRONTEND_ORIGIN = os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173")

    # Sessions
    SESSION_COOKIE_NAME = "session_token"
    SESSION_TTL_HOURS = _env_int("SESSION_TTL_HOURS", 12)
    SESSION_IDLE_TTL_MINUTES = _env_int("SESSION_IDLE_TTL_MINUTES", 30)
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_SECURE = False
    SESSION_COOKIE_PATH = "/"

    # CSRF
    CSRF_COOKIE_NAME = "csrf_token"
    CSRF_COOKIE_HTTPONLY = False  # frontend reads it
    CSRF_COOKIE_SAMESITE = "Lax"
    CSRF_COOKIE_SECURE = False
    CSRF_COOKIE_PATH = "/"

    # Password pepper
    PASSWORD_PEPPER = os.environ.get("PASSWORD_PEPPER", "")
    MFA_ENCRYPTION_KEY = os.environ.get("MFA_ENCRYPTION_KEY", "")

    # Argon2 parameters (production-grade defaults).
    ARGON2_TIME_COST = 2
    ARGON2_MEMORY_COST = 65536  # 64 MiB
    ARGON2_PARALLELISM = 2
    ARGON2_HASH_LEN = 32
    ARGON2_SALT_LEN = 16

    # Password reset
    PASSWORD_RESET_TTL_MIN = _env_int("PASSWORD_RESET_TTL_MIN", 30)
    OTP_TTL_MIN = _env_int("OTP_TTL_MIN", 5)

    # SMTP transport. Delivery is deliberately unavailable until configured;
    # test apps use an in-memory outbox instead of a real provider.
    SMTP_HOST = os.environ.get("SMTP_HOST", "")
    SMTP_PORT = _env_int("SMTP_PORT", 587)
    SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "")
    SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
    SMTP_FROM = os.environ.get("SMTP_FROM", "")
    SMTP_USE_SSL = _env_bool("SMTP_USE_SSL", False)
    SMTP_STARTTLS = _env_bool("SMTP_STARTTLS", True)
    SMTP_TIMEOUT_SECONDS = _env_int("SMTP_TIMEOUT_SECONDS", 10)

    # Cloudflare Turnstile captcha on LOGIN (docs/CONTRACT.md §7).
    # Captcha is ENABLED iff TURNSTILE_SECRET_KEY is non-empty. When empty,
    # login proceeds without any captcha step (no fake verification).
    # The SITE key is frontend-only (VITE_TURNSTILE_SITE_KEY).
    TURNSTILE_SECRET_KEY = os.environ.get("TURNSTILE_SECRET_KEY", "")
    TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify"

    # Rate limit: memory for development/tests; production requires Redis.
    RATE_LIMIT_BACKEND = os.environ.get("RATE_LIMIT_BACKEND", "memory")
    REDIS_URL = os.environ.get("REDIS_URL", "")
    RATE_LIMIT_REDIS_SOCKET_TIMEOUT = _env_int("RATE_LIMIT_REDIS_SOCKET_TIMEOUT", 1)
    RATE_LIMIT_LOGIN_MAX = _env_int("RATE_LIMIT_LOGIN_MAX", 5)
    RATE_LIMIT_REGISTER_MAX = _env_int("RATE_LIMIT_REGISTER_MAX", 5)
    RATE_LIMIT_RESET_MAX = _env_int("RATE_LIMIT_RESET_MAX", 3)
    RATE_LIMIT_VERIFY_RESEND_MAX = _env_int("RATE_LIMIT_VERIFY_RESEND_MAX", 3)
    RATE_LIMIT_VERIFY_OTP_MAX = _env_int("RATE_LIMIT_VERIFY_OTP_MAX", 5)
    RATE_LIMIT_MFA_CHALLENGE_MAX = _env_int("RATE_LIMIT_MFA_CHALLENGE_MAX", 15)
    RATE_LIMIT_RESET_CONFIRM_MAX = _env_int("RATE_LIMIT_RESET_CONFIRM_MAX", 5)
    RATE_LIMIT_PROFILE_UPDATE_MAX = _env_int("RATE_LIMIT_PROFILE_UPDATE_MAX", 10)
    RATE_LIMIT_PROFILE_EMAIL_VERIFY_MAX = _env_int("RATE_LIMIT_PROFILE_EMAIL_VERIFY_MAX", 5)
    RATE_LIMIT_MFA_RECOVERY_ROTATE_MAX = _env_int("RATE_LIMIT_MFA_RECOVERY_ROTATE_MAX", 5)
    RATE_LIMIT_SESSIONS_MAX = _env_int("RATE_LIMIT_SESSIONS_MAX", 20)
    RATE_LIMIT_CAPTCHA_GENERATE_MAX = _env_int("RATE_LIMIT_CAPTCHA_GENERATE_MAX", 10)
    RATE_LIMIT_WINDOW = _env_int("RATE_LIMIT_WINDOW", 900)  # seconds

    @classmethod
    def validate(cls) -> None:
        """Hook for subclasses. Production raises on misconfiguration."""
        return None


class DevConfig(BaseConfig):
    DEBUG = False  # spec: debug off even in dev
    TESTING = False
    ENV_NAME = "development"

    # Dev-friendly default so registration/login work even if the developer
    # forgot to `copy .env.example .env` or left PASSWORD_PEPPER empty.
    # Without this, the dev server boots fine (no validation) but every
    # register/login 500s inside `_apply_pepper()` with
    # `RuntimeError: PASSWORD_PEPPER is not configured`.
    # Production STILL validates and refuses to boot without a strong pepper
    # (see ProductionConfig.validate + _PLACEHOLDER_VALUES), so this default
    # never weakens a production deployment.
    PASSWORD_PEPPER = os.environ.get(
        "PASSWORD_PEPPER",
        "dev-pepper-not-for-production-please-set-a-real-one-in-.env",
    )


class TestingConfig(BaseConfig):
    DEBUG = False
    TESTING = True
    # Fast Argon2 for tests; password security tests still verify the
    # pepper pipeline and salt uniqueness, not the KDF difficulty.
    ARGON2_TIME_COST = 1
    ARGON2_MEMORY_COST = 8
    ARGON2_PARALLELISM = 1
    ARGON2_HASH_LEN = 16
    ARGON2_SALT_LEN = 8
    SECRET_KEY = "test-secret-not-for-production"
    PASSWORD_PEPPER = "test-pepper-not-for-production-but-nonempty"
    SESSION_COOKIE_SECURE = False
    # Tests must NOT depend on a real .env: captcha disabled unless a test
    # explicitly sets app.config["TURNSTILE_SECRET_KEY"].
    TURNSTILE_SECRET_KEY = ""
    # In-memory rate limiter; tests reset between runs.
    ENV_NAME = "testing"

    @classmethod
    def from_temp_db(cls, sqlite_uri: str) -> "TestingConfig":
        cfg = cls()
        cfg.SQLALCHEMY_DATABASE_URI = sqlite_uri
        return cfg


class ProductionConfig(BaseConfig):
    DEBUG = False
    TESTING = False
    ENV_NAME = "production"
    SESSION_COOKIE_SAMESITE = "Strict"
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SAMESITE = "Strict"
    CSRF_COOKIE_SECURE = True
    PREFERRED_URL_SCHEME = "https"

    @classmethod
    def validate(cls) -> None:
        errs: list[str] = []
        pepper = os.environ.get("PASSWORD_PEPPER", "").strip()
        if pepper in _PLACEHOLDER_VALUES or len(pepper) < 16:
            errs.append("PASSWORD_PEPPER must be a strong (>=16 char) secret")
        sk = os.environ.get("SECRET_KEY", "").strip()
        if sk in _PLACEHOLDER_VALUES or len(sk) < 16:
            errs.append("SECRET_KEY must be a strong (>=16 char) secret")
        origin = os.environ.get("FRONTEND_ORIGIN", "").strip()
        try:
            parsed_origin = urlsplit(origin)
            port = parsed_origin.port
            hostname = parsed_origin.hostname or ""
            valid_origin = (
                parsed_origin.scheme == "https"
                and _is_valid_origin_host(hostname)
                and (port is None or 0 < port < 65536 and port != 443)
                and parsed_origin.username is None
                and parsed_origin.password is None
                and not parsed_origin.path
                and not parsed_origin.query
                and not parsed_origin.fragment
                and "*" not in parsed_origin.netloc
            )
        except ValueError:
            valid_origin = False
        if not valid_origin:
            errs.append(
                "FRONTEND_ORIGIN must be one exact HTTPS origin without a path, credentials, or wildcard"
            )
        database_url = _raw_db_url()
        if not database_url.startswith((
            "postgresql://", "postgres://", "postgresql+psycopg://",
        )):
            errs.append("A PostgreSQL FLASK_DATABASE_URL or DATABASE_URL is required in production")
        else:
            sslmodes = parse_qs(urlsplit(database_url).query).get("sslmode", [])
            if not sslmodes or sslmodes[-1].lower() not in {
                "require", "verify-ca", "verify-full",
            }:
                errs.append("Production PostgreSQL URL must require TLS via sslmode")
        smtp_host = os.environ.get("SMTP_HOST", "").strip()
        smtp_from = os.environ.get("SMTP_FROM", "").strip()
        smtp_user = os.environ.get("SMTP_USERNAME", "").strip()
        smtp_password = os.environ.get("SMTP_PASSWORD", "").strip()
        if not smtp_host or not smtp_from:
            errs.append("SMTP_HOST and SMTP_FROM are required for account email")
        mfa_key = os.environ.get("MFA_ENCRYPTION_KEY", "").strip()
        try:
            decoded_mfa_key = base64.urlsafe_b64decode(mfa_key.encode("ascii"))
        except Exception:
            decoded_mfa_key = b""
        if len(decoded_mfa_key) != 32:
            errs.append("MFA_ENCRYPTION_KEY must be a URL-safe base64 32-byte key")
        if not (_env_bool("SMTP_USE_SSL") or _env_bool("SMTP_STARTTLS", True)):
            errs.append("SMTP must use SSL or STARTTLS")
        if bool(smtp_user) != bool(smtp_password):
            errs.append("SMTP_USERNAME and SMTP_PASSWORD must be set together")
        rate_limit_backend = os.environ.get("RATE_LIMIT_BACKEND", "").strip().lower()
        redis_url = os.environ.get("REDIS_URL", "").strip()
        if rate_limit_backend != "redis":
            errs.append("RATE_LIMIT_BACKEND=redis is required in production")
        if not redis_url.startswith("rediss://"):
            errs.append("REDIS_URL must use rediss:// for production shared rate limits")
        limiter_settings = {
            "RATE_LIMIT_LOGIN_MAX": 5,
            "RATE_LIMIT_REGISTER_MAX": 5,
            "RATE_LIMIT_RESET_MAX": 3,
            "RATE_LIMIT_VERIFY_RESEND_MAX": 3,
            "RATE_LIMIT_VERIFY_OTP_MAX": 5,
            "RATE_LIMIT_MFA_CHALLENGE_MAX": 15,
            "RATE_LIMIT_RESET_CONFIRM_MAX": 5,
            "RATE_LIMIT_PROFILE_UPDATE_MAX": 10,
            "RATE_LIMIT_PROFILE_EMAIL_VERIFY_MAX": 5,
            "RATE_LIMIT_MFA_RECOVERY_ROTATE_MAX": 5,
            "RATE_LIMIT_SESSIONS_MAX": 20,
            "RATE_LIMIT_CAPTCHA_GENERATE_MAX": 10,
            "RATE_LIMIT_WINDOW": 900,
            "RATE_LIMIT_REDIS_SOCKET_TIMEOUT": 1,
        }
        invalid_limits = [name for name, default in limiter_settings.items()
                          if _env_int(name, default) < 1]
        if invalid_limits:
            errs.append("Rate limit counts, window, and Redis timeout must be positive")
        if errs:
            raise RuntimeError("Production config invalid: " + "; ".join(errs))


_CONFIGS = {
    "development": DevConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
}


def get_config(name: str | None = None) -> type[BaseConfig]:
    if name is None:
        name = os.environ.get("FLASK_ENV", "development").strip().lower() or "development"
    cfg = _CONFIGS.get(name)
    if cfg is None:
        raise RuntimeError(f"Unknown FLASK_ENV={name!r}; use one of {sorted(_CONFIGS)}")
    return cfg


__all__ = ["BaseConfig", "DevConfig", "TestingConfig", "ProductionConfig", "get_config"]
