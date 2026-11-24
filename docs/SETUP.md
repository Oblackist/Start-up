# Setup & Troubleshooting (Windows / PowerShell)

This guide assumes Windows 10/11 with PowerShell 7+ (Windows Terminal). The
commands also work on macOS/Linux with `python3`/`npm` and a POSIX shell —
swap the activation line accordingly.

## Requirements

- **Python** 3.10+ (3.12 recommended; the project was built and tested on 3.12.15).
- **Node.js** 20+ and **npm** 10+ (the project was built with Vite 8 /
  React 19). Bun is also fine if you prefer it.
- **Git** (optional, for cloning).
- SQLite is used for local development/tests. Production requires a TLS PostgreSQL database and the included psycopg 3 driver.

## 1. Get the project

Unzip `startup-fullstack.zip` somewhere, e.g. `C:\Projects\`:
```powershell
Expand-Archive .\startup-fullstack.zip -DestinationPath C:\Projects\
cd C:\Projects\startup-fullstack
```

## 2. Backend setup

```powershell
cd backend

# Create + activate a virtual env
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# If activation is blocked, run once:
#   Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt   # pytest etc. (optional for running the app)

# Configure environment
Copy-Item .env.example .env
# For DEV you can leave the placeholders. For PROD see "Production" below.

# Initialize the SQLite database (runs Alembic migrations + seed).
# Idempotent + non-destructive: re-running never deletes users or duplicates seed.
python scripts\init_db.py

# Start the dev server (http://localhost:5000)
python run.py

# (in another terminal) verify
curl http://localhost:5000/api/v1/health
# -> {"db":"ok","status":"ok"}

# Run the backend test suite
python -m pytest -q
# -> 244 passed
```

## Production database

Production refuses to start unless `FLASK_DATABASE_URL` (preferred) or
`DATABASE_URL` points to PostgreSQL and explicitly requests TLS through
`sslmode=require`, `sslmode=verify-ca`, or `sslmode=verify-full`. SQLite
remains the local/test default and is rejected in production. PostgreSQL URLs
using `postgres://` or `postgresql://` are normalized to the pinned
SQLAlchemy `postgresql+psycopg://` driver.

```text
FLASK_DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>?sslmode=verify-full
```

Store the actual URL in the deployment secret manager. Run
`python scripts/init_db.py` as a controlled release migration step against
the configured production database. For review-only SQL output, a clean
PostgreSQL upgrade can be rendered with `flask db upgrade --sql`; this export
assumes the full clean migration chain. Run migrations online for existing or
partially repaired databases so schema inspection can select safe operations.
PostgreSQL migration and restore drills must still be completed in staging
before release.

## Continuous integration

`.github/workflows/ci.yml` runs backend tests, clean PostgreSQL offline
migration SQL generation, frontend typecheck/build, and Python/npm dependency
audits on pushes and pull requests. Dependabot opens weekly minor/patch
dependency updates. Enable branch protection and require both test jobs and
the dependency audit checks after the workflow's first successful run in the
connected GitHub repository; staging smoke tests are still a release gate.

### Local email inbox (Mailpit)

The app does not print codes or reset links to the terminal. For local email
flows, start a local inbox and set the SMTP values in `backend/.env`:

```powershell
docker run --rm --name career-arena-mailpit -p 1025:1025 -p 8025:8025 axllent/mailpit
# SMTP_HOST=127.0.0.1, SMTP_PORT=1025, SMTP_FROM=dev@careerarena.test
# SMTP_STARTTLS=false, SMTP_USE_SSL=false
```

Open `http://localhost:8025` to read messages. These unencrypted SMTP settings
are only for loopback development. Production must use authenticated SMTP
with STARTTLS or SSL and a verified sender.

### Generating secure secrets (for production)

```powershell
# SECRET_KEY (>=32 random bytes, base64)
python -c "import secrets,base64; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())"

# PASSWORD_PEPPER (>=32 random bytes, base64)
python -c "import secrets,base64; print(base64.urlsafe_b64encode(secrets.token_bytes(32)).decode())"

# MFA_ENCRYPTION_KEY (separate 32-byte key for AES-GCM TOTP secret encryption)
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```
Paste these into `backend/.env`. Never commit that file.

## 3. Frontend setup

```powershell
cd ..\frontend

npm install
Copy-Item .env.example .env      # VITE_API_URL=http://localhost:5000

npm run dev                      # http://localhost:5173
```
Open `http://localhost:5173`, click **Qeydiyyat** (register), create an
account, and start a test. The app restores your session on refresh.

### Production build
```powershell
npm run build       # tsc --noEmit && vite build  -> dist/
npm run preview     # serve the production bundle locally
```
Deploy `dist/` to any static host / CDN. Set `VITE_API_URL` to the production
backend URL at build time (Vite bakes it into the bundle — it is **not** a
secret).

## 4. Running both at once

Open **two** terminals:
- Terminal 1 (backend): `cd backend; .\.venv\Scripts\Activate.ps1; python run.py`
- Terminal 2 (frontend): `cd frontend; npm run dev`

The backend runs on `:5000`, the frontend on `:5173`. Vite proxies `/api`
requests to the backend. Cookies flow because the backend allows
`http://localhost:5173` with credentials.

## 5. Production deployment

For the single-origin HTTPS deployment with Docker Compose, see [Deploy Career Arena](DEPLOYMENT.md).

The Flask dev server (`run.py`) is **not** a production HTTP server. Use a
real WSGI server.

### Linux (gunicorn)
```bash
cd backend
source .venv/bin/activate
pip install gunicorn
export FLASK_ENV=production
export SECRET_KEY="<32+ random bytes>"
export PASSWORD_PEPPER="<32+ random bytes>"
export MFA_ENCRYPTION_KEY="<URL-safe base64 encoding of 32 random bytes>"
export FRONTEND_ORIGIN="https://your-frontend.example.com"
export SMTP_HOST="smtp.your-provider.example"
export SMTP_PORT="587"
export SMTP_USERNAME="<provider username>"
export SMTP_PASSWORD="<provider password>"
export SMTP_FROM="no-reply@your-domain.example"
export SMTP_STARTTLS="true"
export SMTP_USE_SSL="false"
export RATE_LIMIT_BACKEND="redis"
export REDIS_URL="rediss://default:<password>@your-redis.example.com:6379/0"
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:application
```
Production startup pings the TLS Redis endpoint and fails if it is unavailable;
requests also fail closed with a generic `503` if Redis drops later. Cookie
sessions and rate-limit buckets are shared across workers.

### Windows (waitress)
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pip install waitress
$env:FLASK_ENV = "production"
$env:SECRET_KEY = "<32+ random bytes>"
$env:PASSWORD_PEPPER = "<32+ random bytes>"
$env:MFA_ENCRYPTION_KEY = "<URL-safe base64 encoding of 32 random bytes>"
$env:FRONTEND_ORIGIN = "https://your-frontend.example.com"
$env:SMTP_HOST = "smtp.your-provider.example"
$env:SMTP_PORT = "587"
$env:SMTP_USERNAME = "<provider username>"
$env:SMTP_PASSWORD = "<provider password>"
$env:SMTP_FROM = "no-reply@your-domain.example"
$env:RATE_LIMIT_BACKEND = "redis"
$env:REDIS_URL = "rediss://default:<password>@your-redis.example.com:6379/0"
$env:SMTP_STARTTLS = "true"
$env:SMTP_USE_SSL = "false"
waitress-serve --port=5000 wsgi:application
```

### HTTPS
Terminate TLS at a reverse proxy (nginx / Caddy / Cloudflare). The backend
sets `Secure` cookies, `SameSite=Strict`, and HSTS **only** when
`FLASK_ENV=production`. In dev, cookies are `SameSite=Lax` and not `Secure`
so the Vite origin works.

### Re-initializing the DB on the server
```bash
python scripts/init_db.py        # idempotent: migrate + seed, non-destructive
```
This never deletes existing users or duplicates seed rows.

## 6. Database notes

- The DB lives at `backend/instance/app.db` (configurable via `DATABASE_URL`).
  Do **not** put it in a public static directory.
- SQLite pragmas applied on every connection: `foreign_keys=ON`,
  `journal_mode=WAL`, `busy_timeout=5000`. WAL mode is ideal for the
  read-heavy, single-writer exam workload.
- Backup: simply copy `instance/app.db` (and the `-wal`/`-shm` sidecars if a
  write is in flight; otherwise checkpoint first with
  `sqlite3 instance/app.db "PRAGMA wal_checkpoint(FULL);"`).
- Migrations: managed by Alembic (Flask-Migrate). The initial migration is
  `migrations/versions/27cf5891ddb9_initial_schema.py`. Future schema changes
  use `flask db migrate -m "..."` then `flask db upgrade`.

## 7. Troubleshooting

| Symptom | Likely cause / fix |
| --- | --- |
| `curl /health` → connection refused | Backend not running. `cd backend; python run.py`. |
| Frontend shows "Serverə qoşulmaq mümkün olmadı" | `VITE_API_URL` wrong, or backend down. Check `frontend/.env` and that the backend is on `:5000`. |
| Register/login → 403 "CSRF token missing" | The `csrf_token` cookie isn't set. The app calls `GET /auth/csrf` on boot + after login; if you blocked cookies, allow them for `localhost:5000`. |
| Login → 429 `rate_limited` | 5+ failed attempts in 15 min. Wait, or restart the backend (dev only — clears the in-memory limiter). |
| `flask db upgrade` → "Target database is not up to date" | Run `python scripts/init_db.py` from scratch on a fresh DB, or `flask db stamp head` then `flask db upgrade`. |
| `pip install` fails on `argon2-cffi` | Install build tools (`pip install --upgrade pip setuptools wheel`) or use a Python 3.10+ wheel. |
| PowerShell activation blocked | `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`. |
| Production boot refuses to start | `FLASK_ENV=production` requires real `SECRET_KEY`, `PASSWORD_PEPPER` (≥16 chars, not placeholder), exact `FRONTEND_ORIGIN`, and SMTP host/sender/TLS configuration. Set them in a secret manager or environment. |
| Password reset email never arrives | Check `SMTP_HOST`, `SMTP_FROM`, TLS mode, provider credentials, and backend delivery logs. For local use, start Mailpit and inspect `http://localhost:8025`; reset tokens are never logged. |
| `npm run build` TS errors | Re-run `npm install` to ensure the lockfile is in sync; the build is verified green in the shipped state. |

## 8. What's intentionally NOT here

- No Redis, no JWT, no Prisma — by design (see ARCHITECTURE.md).
- No admin UI — administrative access is via the DB / audit log.
- Only the math questions from the original `examData.ts` are seeded (20).
  Add Azerbaijani / English questions via `scripts/seed.py` or an admin tool.
- No frontend unit tests (vitest) — the production build is the verified
  frontend acceptance criterion; the backend has the comprehensive suite.
