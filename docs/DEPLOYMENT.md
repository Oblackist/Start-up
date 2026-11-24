# Deploy Career Arena

The Compose reference deployment targets a Linux host with Docker Compose v2. Caddy publishes ports 80 and 443, serves the compiled frontend, and proxies `/api/*` to Gunicorn on the private Compose network. Use a DNS hostname pointing directly at this host. If another proxy or CDN is introduced, review client IP handling and the rate limit topology before accepting traffic.

## Configure the host and providers

Set these values in the deployment shell. Use the same Compose project name on subsequent releases and a distinct name for each environment.

```sh
export COMPOSE_PROJECT_NAME=career-arena-staging
export SITE_HOST=staging.example.com
export RELEASE_TAG=release-001
export BACKEND_ENV_FILE=/secure/career-arena-staging.env
```

Use an absolute path to the runtime environment file. Create it through the host's secret manager or restrict it to the deployment account. The image never needs it at build time. `FLASK_ENV=production` and `FRONTEND_ORIGIN=https://$SITE_HOST` are supplied by Compose. Populate:

| Setting | Value |
| --- | --- |
| `SECRET_KEY`, `PASSWORD_PEPPER` | Two independently generated persistent secrets. Preserve the existing pepper on upgrades to retain password verification. |
| `MFA_ENCRYPTION_KEY` | URL-safe base64 of 32 random bytes. Back it up securely with the other runtime keys. Existing MFA enrollments depend on it. |
| `FLASK_DATABASE_URL` | PostgreSQL migration/runtime endpoint and credentials. Prefer `sslmode=verify-full` with the provider CA available to the container. |
| `REDIS_URL`, `RATE_LIMIT_BACKEND` | Verified TLS `rediss://` endpoint and `redis` backend. Use separate instances or data sets per environment. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_USERNAME`, `SMTP_PASSWORD` | Provider settings and an authorized sender. Set `SMTP_STARTTLS=true` and `SMTP_USE_SSL=false` for STARTTLS, or reverse the flags for implicit TLS. |
| `TURNSTILE_SECRET_KEY` | Optional secret, paired with public build variable `VITE_TURNSTILE_SITE_KEY` for the same widget and allowed hostname. |

## Build and release

```sh
docker compose config --quiet
docker compose build --pull

# Apply once per release. Use a separately managed migration role if available.
docker compose run --rm --no-deps api python -m flask --app wsgi:application db upgrade

# Fresh environment only. Load the bundled question bank after schema creation.
# docker compose run --rm --no-deps api python scripts/init_db.py

docker compose up -d --wait --wait-timeout 120
python3 scripts/check_release.py "https://$SITE_HOST"
```

Retain the release directory and tagged images for rollback. Before migrating an existing database, take a backup and check migration compatibility with the previous release. If a migration is incompatible, schedule downtime and stop writes before taking the backup. Review the restored schema and data before reopening traffic.

## Staging acceptance

Run the same release check from an external network. It validates TLS, SPA entry points and the theme script, API routing and PostgreSQL and Redis readiness. A failed check exits with a nonzero status and names the affected path. Use the readiness request ID and application logs to investigate database or Redis failures. When login uses Turnstile, check the browser console and complete a challenge too.

The Flask service writes one JSON record per application event and HTTP response to its console stream. Request records include the UTC timestamp, request ID, method, Flask route template, status code, and duration in milliseconds. The logger omits raw URLs/paths, query strings, bodies, IP addresses, and user agents; email and common credential patterns in messages are redacted, and exception text/tracebacks are not serialized. Ship these records to the host's protected log service and set access controls and retention there. Metrics, dashboards, and alert rules still need to be configured for the chosen hosting provider.

Run the GitHub Actions `PostgreSQL migration and restore drill` first. It uses disposable PostgreSQL databases on the runner and verifies the release revision, sign-in with TOTP and the sample exam after restore. Repeat the drill against a representative staging backup with the matching password pepper and MFA key. Keep the backup encrypted and record the restore time, schema revision and the amount of data that would be lost.

- From a browser on another network, verify HTTPS, loading `/login` directly, and the password reset deep link. Confirm an unknown `/api/` path returns the API error response.
- Register using a staging mailbox, receive and confirm the verification code, and sign in again. Check password reset and verified email change via the real provider.
- Enroll a real TOTP authenticator from the profile, sign in with TOTP, use one recovery code, rotate the remaining codes and revoke a second browser session.
- Verify login rate limits across both Gunicorn workers and generic failure when staging Redis is unavailable. Check that different client addresses have separate IP buckets.
- Migrate a representative database copy and restore a backup into an isolated PostgreSQL database. Verify current revision, user and content counts, and sign-in with the matching secrets.

For an application-only rollback, switch back to the previous release directory and `RELEASE_TAG`, then run `docker compose up -d --no-build --wait` and repeat the probes. Use schema-compatible releases for this procedure. For an incompatible migration, restore a verified backup or follow a tested database recovery procedure before switching traffic. Record when the backup was taken and the writes that would be lost.
