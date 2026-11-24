"""Atomic fixed-window limiters for local and multi-worker deployments."""
from __future__ import annotations

import hashlib
import time
from collections import defaultdict
from threading import Lock
from functools import wraps
from typing import Callable

from flask import current_app, has_app_context, request

from ..utils.errors import ApiError


class RateLimiterUnavailable(RuntimeError):
    """Shared abuse controls cannot make a reliable allow/deny decision."""


class _Window:
    __slots__ = ("count", "reset_at")

    def __init__(self, count: int, reset_at: float) -> None:
        self.count = count
        self.reset_at = reset_at


class RateLimiter:
    """Fixed-window limiter. Keyed by any string (ip+email, ip alone, etc.)."""

    def __init__(self) -> None:
        self._buckets: dict[tuple[str, str], _Window] = defaultdict()
        self._lock = Lock()

    def hit(self, key: str, action: str, max_count: int, window_seconds: int) -> tuple[bool, int]:
        """Register a hit. Returns (allowed, retry_after_seconds)."""
        now = time.monotonic()
        with self._lock:
            k = (action, key)
            w = self._buckets.get(k)
            if w is None or now >= w.reset_at:
                # New window
                w = _Window(count=1, reset_at=now + window_seconds)
                self._buckets[k] = w
                return True, 0
            if w.count >= max_count:
                retry = max(1, int(round(w.reset_at - now)))
                return False, retry
            w.count += 1
            return True, 0

    def reset(self, key: str, action: str) -> None:
        """Clear the window for a key (e.g. after a successful login)."""
        with self._lock:
            self._buckets.pop((action, key), None)

    def clear_all(self) -> None:
        """Drop every window (used by tests)."""
        with self._lock:
            self._buckets.clear()


_REDIS_FIXED_WINDOW_SCRIPT = """
local count = redis.call('INCR', KEYS[1])
if count == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
if count <= tonumber(ARGV[2]) then
  return {1, 0}
end
return {0, math.max(1, ttl)}
"""


class RedisRateLimiter:
    """Redis-backed fixed-window limiter shared by every application worker."""

    def __init__(self, client) -> None:
        self.client = client

    @staticmethod
    def _bucket_key(key: str, action: str) -> str:
        digest = hashlib.sha256(key.encode("utf-8")).hexdigest()
        return f"careerarena:rl:v1:{action}:{digest}"

    def hit(self, key: str, action: str, max_count: int, window_seconds: int) -> tuple[bool, int]:
        bucket = self._bucket_key(key, action)
        try:
            result = self.client.eval(
                _REDIS_FIXED_WINDOW_SCRIPT, 1, bucket, int(window_seconds), int(max_count)
            )
            if not isinstance(result, (list, tuple)) or len(result) != 2:
                raise ValueError("Unexpected Redis limiter response")
            return bool(int(result[0])), max(0, int(result[1]))
        except Exception as exc:
            raise RateLimiterUnavailable("Shared rate-limit storage is unavailable") from exc

    def reset(self, key: str, action: str) -> None:
        try:
            self.client.delete(self._bucket_key(key, action))
        except Exception as exc:
            raise RateLimiterUnavailable("Shared rate-limit storage is unavailable") from exc

    def clear_all(self) -> None:
        raise RuntimeError("Global Redis cleanup is disabled; remove test-owned keys explicitly")


# Process-singleton.
limiter = RateLimiter()


def configure_rate_limiter(app) -> None:
    """Attach the configured backend; Redis must pass a startup health check."""
    backend = str(app.config.get("RATE_LIMIT_BACKEND", "memory")).strip().lower()
    if backend == "memory":
        if app.config.get("ENV_NAME") == "production":
            raise RuntimeError("Production requires RATE_LIMIT_BACKEND=redis")
        app.extensions["rate_limiter"] = limiter
        return
    if backend != "redis":
        raise RuntimeError("RATE_LIMIT_BACKEND must be either memory or redis")

    redis_url = str(app.config.get("REDIS_URL") or "").strip()
    if not redis_url.startswith(("redis://", "rediss://")):
        raise RuntimeError("REDIS_URL must use redis:// or rediss://")
    try:
        from redis import Redis

        client = Redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=int(app.config.get("RATE_LIMIT_REDIS_SOCKET_TIMEOUT", 1)),
            socket_timeout=int(app.config.get("RATE_LIMIT_REDIS_SOCKET_TIMEOUT", 1)),
        )
        client.ping()
    except Exception:
        try:
            client.close()
        except Exception:
            pass
        raise RuntimeError("Shared rate-limit Redis is unavailable; startup aborted") from None
    app.extensions["rate_limiter"] = RedisRateLimiter(client)


def get_rate_limiter():
    if has_app_context():
        return current_app.extensions.get("rate_limiter", limiter)
    return limiter


def _client_ip() -> str:
    return request.remote_addr or "0.0.0.0"


def rate_limit(
    action: str,
    *,
    max_count: int | None = None,
    window_seconds: int | None = None,
    key_fn: Callable[[], str] | None = None,
    code_on_exceeded: str = "rate_limited",
    msg_on_exceeded: str = "Çoxsaylı cəhdlər. Bir az sonra təkrarlayın.",
):
    """Decorator. Reads limits from app.config if max_count/window not set.

    `key_fn` lets you compose the bucket key (e.g. ip+email).
    """
    def deco(fn):
        @wraps(fn)
        def wrapped(*args, **kwargs):
            # CORS preflights do not perform the protected action and must not
            # consume a client's request budget.
            if request.method == "OPTIONS":
                return fn(*args, **kwargs)
            from flask import current_app  # local import
            cfg = current_app.config
            mc = max_count if max_count is not None else cfg.get(f"RATE_LIMIT_{action.upper()}_MAX", 5)
            ws = window_seconds if window_seconds is not None else cfg.get("RATE_LIMIT_WINDOW", 900)
            kfn = key_fn or _client_ip
            key = kfn()
            try:
                allowed, retry = get_rate_limiter().hit(key, action, int(mc), int(ws))
                if not allowed:
                    from .audit import audit_log
                    audit_log(action="rate_limit_hit", details={"bucket": action, "retry_after": retry})
                    raise ApiError(
                        429, code_on_exceeded, msg_on_exceeded, fields={"retry_after": retry}
                    )
                return fn(*args, **kwargs)
            except RateLimiterUnavailable:
                raise ApiError(
                    503, "rate_limit_unavailable",
                    "Sorğuları qoruma xidməti müvəqqəti əlçatan deyil",
                ) from None

        return wrapped

    return deco


__all__ = [
    "RateLimiter", "RedisRateLimiter", "RateLimiterUnavailable", "limiter",
    "get_rate_limiter", "configure_rate_limiter", "rate_limit",
]
