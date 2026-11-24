# Career Arena · Exam Arena — Flask backend

## Run the dev server
```bash
python3 run.py          # http://0.0.0.0:5000
```

## Run production (gunicorn on Linux / waitress on Windows)
```bash
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:application      # Linux
waitress-serve --port=5000 wsgi:application           # Windows
```

## Run the tests
```bash
python3 -m pytest -q       # 268 tests
```

## Initialize the database and load the question bank
```bash
python3 scripts/init_db.py
python3 scripts/replace_question_bank.py --replace
```

The second command replaces the active question bank. See the root README for
the `/admin` page and for granting or revoking admin access.

## Env
Copy `.env.example` to `.env` and edit. In production
(`FLASK_ENV=production`) `PASSWORD_PEPPER`, `SECRET_KEY`, `FRONTEND_ORIGIN`,
SMTP delivery, `MFA_ENCRYPTION_KEY`, and a TLS Redis URL for shared rate limits
MUST be configured. Production also requires a TLS PostgreSQL
`FLASK_DATABASE_URL` or `DATABASE_URL`; SQLite or a missing URL causes config
validation to fail before startup.

For production, set `RATE_LIMIT_BACKEND=redis` and `REDIS_URL=rediss://...`.
Startup pings Redis and aborts if the shared limiter is unavailable. Development
and tests use the process-local memory limiter.

### Email delivery (SMTP)

For local development, run Mailpit:
`docker run --rm --name career-arena-mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit`.
Set `SMTP_HOST=127.0.0.1`, `SMTP_PORT=1025`, `SMTP_FROM=dev@careerarena.test`,
`SMTP_STARTTLS=false`, and `SMTP_USE_SSL=false` in `.env`, then read mail at
`http://localhost:8025`. The app never prints verification codes or reset
tokens to logs. Production must use SMTP with STARTTLS or SSL and a verified
sender domain.

### Captcha (Cloudflare Turnstile) — optional
`POST /auth/login` is captcha-gated **only when** `TURNSTILE_SECRET_KEY` is
set in this backend's env. With the key unset (default), login needs just
email+password. When enabled:
- the frontend must load the Turnstile widget with its `VITE_TURNSTILE_SITE_KEY`
  and send the token as `captcha_token` in the login body;
- verification calls Cloudflare's `siteverify` endpoint (10s timeout) and
  **fails closed**: an unreachable/timeout/broken provider answer returns
  `503 captcha_unavailable` and the login is refused;
- failures are audited as `captcha_failed` with the reason only — the token
  is never stored or logged.

### Correlation IDs
Every response carries an `X-Request-ID` header (incoming header sanitized
to `[A-Za-z0-9_-]`, max 64 chars, or a fresh random id). Every JSON error
body repeats it as `request_id`, and 500 log lines include it so a
user-reported failure can be matched to the server log.

For the full API contract, DB schema, and security spec see
`../docs/CONTRACT.md` and `../docs/SETUP.md`.

## Honest limitations
- **A real email provider is not configured** in this environment. The SMTP
  adapter is implemented, but signup and email-change delivery need SMTP
  settings; production refuses to start without them. Local development can
  use Mailpit. Reset requests remain generic when delivery is unavailable;
  raw tokens are never returned or logged.
- **Rate limiting:** memory backend in development/tests; production uses an
  atomic Redis fixed-window script shared across workers. A live Redis endpoint
  still needs staging validation. Proxy IP trust is intentionally not enabled;
  configure trusted proxy hops before relying on client IP buckets.
- The `audit_logs` table stores `ip + user_agent + action + details` JSON.
  It NEVER stores passwords, the raw session token, or the raw reset token;
  reset tokens are referenced by sha256 hash only.
