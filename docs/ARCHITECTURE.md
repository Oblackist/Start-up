# Architecture

## High-level

```
┌─────────────────────────────┐         cookies (session_token, csrf_token)
│  Browser (React 19 + Vite)  │  ───────────────────────────────────────────►
│  http://localhost:5173       │ ◄───────────────────────────────────────────
└─────────────────────────────┘   JSON responses + Set-Cookie (HttpOnly session)
        │  fetch(..., { credentials:'include' })
        ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Flask backend  http://localhost:5000  (gunicorn/waitress in prod)   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │  Security middleware  (CORS, security headers, request size)    │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │  Blueprints under /api/v1                                       │  │
│  │   auth · subjects · tests · me · practice · health · errors     │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │  CSRF decorator (synchronizer token) on every state-changing EP │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │  Services  (auth_service · test_service · progress_service)     │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │  Security  (password · session · csrf · rate_limit · audit)    │  │
│  ├─────────────────────────────────────────────────────────────────┤  │
│  │  SQLAlchemy ORM  →  SQLite (dev/tests) / TLS PostgreSQL (prod) │  │
│  └─────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Frontend component tree

```
App  (wraps everything in <AuthProvider>)
└── AppShell
    ├── Navbar                (auth-aware: user chip + logout, or login/register)
    ├── renderScreen()  ──┐
    │                     ├── LandingScreen       (public)
    │                     ├── LoginScreen         (public)
    │                     ├── RegisterScreen      (public)
    │                     ├── ProtectedScreen
    │                     │     ├── SubjectsScreen      (getSubjects / getSubject)
    │                     │     ├── TestScreen         (startTest → submitTest)
    │                     │     ├── ResultScreen       (cache or getTest(id))
    │                     │     ├── PracticeScreen     (getPracticeCards)
    │                     │     └── DashboardScreen    (getMyProgress)
    ├── MobileTabBar        (real mobile, <768px)
    └── DesignSystemShowcase (modal)
```

Navigation stays on the original `setCurrentScreen` state pattern (no
react-router) and is simply extended with auth gating: `navigate(screen)`
redirects to `login` if the screen is protected and the user is anonymous.

`AuthProvider` boots by calling `GET /api/v1/auth/me` to restore the session
(so refresh keeps you logged in) and then `GET /api/v1/auth/csrf` to prime the
non-HttpOnly `csrf_token` cookie. Any `401` from the API dispatches a
window `auth:unauthorized` event that `AuthProvider` listens for, marking
the session expired (only if there was a user, to avoid popping on anonymous
browsing).

## Backend request lifecycle

1. **CORS preflight / origin check** — single allowed origin (`FRONTEND_ORIGIN`),
   credentials allowed.
2. **Security headers** applied (CSP, nosniff, referrer, frame-ancestors, HSTS
   prod-only).
3. **Request size limit** enforced.
4. **Rate limiter** (decorator) for auth + sensitive endpoints.
5. **Blueprint route** under `/api/v1`:
   - validates input via marshmallow (rejects unknown fields, enforces
     lengths, normalizes email);
   - calls a **service** that owns business logic and DB transactions;
   - every state-changing endpoint is wrapped in `@require_csrf`, which
     compares `X-CSRF-Token` to the session's stored CSRF token
     (`hmac.compare_digest`, constant-time);
   - every `/me/*` and `/tests/<id>` endpoint authorizes ownership
     (403 for owner mismatch, 404 for non-existent).
6. **Centralized error handlers** return `{ error: { code, message, fields? } }`
   with the right HTTP status and never leak tracebacks, SQL, env, hashes, or
   tokens.
7. **DB session lifecycle** — SQLAlchemy sessions are removed at request end;
   SQLite connections receive local FK/WAL/busy-timeout pragmas, while production
   uses a TLS PostgreSQL pool with pre-ping.
8. **Audit log** writes security events (register/login success+fail/logout/
   password change/reset request+confirm/rate-limit hit). Never stores
   passwords, raw session tokens, or raw reset tokens.

## Data model (see CONTRACT.md §5 for the full schema)

- `users` (id, name, email UNIQUE, password_hash, is_active, created_at, last_login_at)
- `sessions` (id, user_id FK CASCADE, token_hash UNIQUE INDEX, csrf_token,
  user_agent, ip, created_at, expires_at) — the cookie carries the raw token;
  the DB stores its sha256 hash so a DB leak doesn't grant sessions.
- `password_reset_tokens` (id, user_id FK CASCADE, token_hash UNIQUE INDEX,
  created_at, expires_at, used_at nullable) — single-use, expiring.
- `subjects` (slug PK: math/aze/eng, name, short_desc, icon_name)
- `topics` (slug PK, subject_id FK CASCADE, name, question_count, order)
- `questions` (id, subject_id FK, topic_id FK, text, options_json, correct_answer,
  explanation_json, difficulty, created_at) — INDEX (subject_id, topic_id)
- `test_attempts` (id, user_id FK CASCADE, subject_id FK, started_at,
  submitted_at nullable, score, total) — INDEX (user_id, subject_id)
- `answers` (id, attempt_id FK CASCADE, question_id FK, user_answer nullable,
  is_correct nullable, created_at) — UNIQUE (attempt_id, question_id)
- `audit_logs` (id, user_id FK SET NULL, action, ip, user_agent, created_at,
  details_json) — INDEX (user_id), (action), (created_at)

## Test-taking flow (the golden path)

1. `POST /api/v1/tests { subject_id, topic_id? }` (CSRF) → creates a
   `test_attempts` row (`submitted_at=NULL`), returns `attempt_id` + up to 20
   questions **without** `correct_answer` or `explanation`.
2. User answers; `POST /api/v1/tests/<id>/submit { answers }` (CSRF, owner)
   → records each `answers` row (UNIQUE constraint blocks double-answers),
   computes score, sets `submitted_at`, returns the full result with
   `correct_answer` + `explanation` per question. A second submit returns
   `409 already_submitted`.
3. `GET /api/v1/tests/<id>` (owner) re-fetches the same result.
4. `GET /api/v1/me/progress` aggregates subject readiness, weak topics
   (accuracy < 70%), saved mistakes (incorrect answers), and a progress chart
   from the user's attempts. A new user gets empty arrays (honest empty state).
5. `GET /api/v1/practice/cards` derives practice cards from the user's weak
   topics.

## Separation of concerns

- **Routes** only parse/validate input and format output — no business logic.
- **Services** own transactions, orchestration, and authorization checks.
- **Security** modules are pure helpers (no Flask coupling beyond `request`/`g`)
  so they are unit-testable.
- **Models** declare schema and relationships only — no query logic.
- **Schemas** (marshmallow) are the single validation surface; the ORM never
  trusts unvalidated input.

## Why this stack

- **Flask + SQLAlchemy + SQLite locally / PostgreSQL in production** provide
  a simple local setup and shared durable production storage.
  spec, with no external DB server or Redis dependency.
- **Opaque server-managed sessions** (not JWT) are the OWASP-recommended
  choice for a first-party React frontend — they avoid token leakage in
  browser storage and make revocation trivial (delete the row).
- **Argon2id + pepper** is the modern password-storage baseline; the pepper
  adds defense-in-depth so a DB-only leak still doesn't allow offline cracking.
- **Synchronizer-token CSRF** fits cookie auth and is simple to verify.
