"""Check a deployed Career Arena HTTPS origin without creating accounts."""

import argparse
from http import HTTPStatus
import json
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener


class CheckFailed(RuntimeError):
    pass


class NoRedirects(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def check_release(origin):
    opener = build_opener(NoRedirects())

    def get(path, expected_status, media_type):
        try:
            response = opener.open(
                Request(origin + path, headers={"User-Agent": "CareerArenaReleaseCheck/1"}),
                timeout=10,
            )
        except HTTPError as exc:
            response = exc
        except (OSError, URLError) as exc:
            raise CheckFailed(f"{path}: HTTPS request failed ({type(exc).__name__})") from exc

        with response:
            if response.code != expected_status:
                raise CheckFailed(f"{path}: expected HTTP {expected_status}, got {response.code}")
            if response.headers.get_content_type() not in media_type:
                raise CheckFailed(f"{path}: unexpected Content-Type")
            if not response.headers.get("Strict-Transport-Security"):
                raise CheckFailed(f"{path}: HSTS header is missing")
            try:
                body = response.read(128 * 1024 + 1)
            except OSError as exc:
                raise CheckFailed(f"{path}: reading the response failed ({type(exc).__name__})") from exc

        if len(body) > 128 * 1024:
            raise CheckFailed(f"{path}: response too large for this check")
        return body

    def get_json(path, status=HTTPStatus.OK):
        try:
            body = json.loads(get(path, status, {"application/json"}))
        except (ValueError, UnicodeError) as exc:
            raise CheckFailed(f"{path}: invalid JSON response") from exc
        if not isinstance(body, dict):
            raise CheckFailed(f"{path}: expected a JSON object")
        return body

    for path in ("/", "/login", "/reset-password"):
        if b'<div id="root">' not in get(path, HTTPStatus.OK, {"text/html"}):
            raise CheckFailed(f"{path}: the frontend entry point is missing")
    theme = get("/theme-init.js", HTTPStatus.OK, {"text/javascript", "application/javascript"})
    if not theme.strip():
        raise CheckFailed("/theme-init.js: the script is empty")
    if get_json("/api/v1/health/live").get("status") != "ok":
        raise CheckFailed("/api/v1/health/live: liveness failed")
    ready = get_json("/api/v1/health")
    if any(ready.get(field) != "ok" for field in ("status", "db", "redis")):
        raise CheckFailed("/api/v1/health: database and Redis readiness required")
    missing = get_json("/api/v1/__release_probe_missing__", HTTPStatus.NOT_FOUND)
    if not isinstance(missing.get("error"), dict) or not missing.get("request_id"):
        raise CheckFailed("Unknown API route did not return the expected error envelope")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("origin", help="Public HTTPS origin, such as https://staging.example.com")
    args = parser.parse_args()
    origin = urlsplit(args.origin)
    if (
        origin.scheme != "https" or not origin.hostname or origin.username is not None
        or origin.path not in ("", "/") or origin.query or origin.fragment
    ):
        parser.error("Provide an HTTPS origin without credentials, path, query or fragment")
    try:
        check_release(origin.geturl().rstrip("/"))
    except CheckFailed as exc:
        parser.exit(1, f"Release check failed: {exc}\n")
    print("Release check passed: HTTPS, frontend routes, API routing, PostgreSQL and Redis readiness.")


if __name__ == "__main__":
    main()
