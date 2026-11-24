# Integration Contract — startup-fullstack

This document is the **single source of truth** for the API, data model, and
security behavior. Both the Flask backend and the Vite/React frontend MUST
implement exactly what is described here.

- Backend base URL (dev): `http://localhost:5000`
- API version prefix: `/api/v1`
- Auth model: **opaque, server-managed session cookies** (no JWT).
- CSRF model: **synchronizer token** stored on the session row, exposed via a
  non-`HttpOnly` cookie + echoed in an `X-CSRF-Token` request header.

The machine-readable OpenAPI 3.1 contract is [openapi.json](openapi.json),
generated from the Flask URL map plus explicit operation metadata. Within v1,
new endpoints and optional fields are additive. Removing/renaming an endpoint,
method, or response field, making a field required, or changing a field's type
or meaning is breaking and requires a new versioned route plus a documented
migration window. Mark an operation deprecated with a sunset date before its
removal.

---

## 1. Authentication & session endpoints

All responses are JSON. `user` object shape:

```json
{ "id": 1, "name": "Ülvi", "email": "user@example.com", "created_at": "2026-10-25T10:16:00Z", "last_login_at": "2026-10-25T10:16:00Z" }
```

Never return `password_hash`, `pepper`, tokens, or internal IDs beyond `id`.

### `POST /api/v1/auth/register`
Body: `{ "name": string, "email": string, "password": string, "confirm": string }`
- Validates name (1–80 chars), email (RFC-ish, normalized lowercased + stripped),
  password (>= 8 chars, <= 72 chars, must contain a letter and a digit), and
  `confirm === password`.
- Enforces unique email at the DB level. Concurrent duplicates must not both
  succeed (UNIQUE constraint + caught IntegrityError).
- Hashes password with Argon2id + unique salt + HMAC-SHA-256 pepper preprocessing.
- Creates a pending, unverified account; sends a six-digit email code and
  returns `201 { user, requires_verification: true }` without session cookies.
  Codes are purpose-bound HMACs at rest and expire after five minutes.
- Errors: `400 { error: { code, message, fields } }`. Duplicate email returns
  `409` with a generic message that does NOT reveal whether the email exists
  to anonymous callers — BUT the registration duplicate-email test expects a
  clear rejection; for the REGISTER endpoint a `409 Conflict` with
  "Bu e-poçt artıq qeydiyyatlıdır" is acceptable (enumeration concern applies
  to login/password-reset, not registration).

### `POST /api/v1/auth/verify-otp` and `/api/v1/auth/verification/resend`
- Verification accepts `{ "email": string, "code": string }`; success confirms
  email ownership and starts a session. It is not login MFA.
- Resend accepts `{ "email": string }`, rotates the pending code, and returns
  the same generic success for unknown, verified, or unavailable addresses.
- Verification attempts and resend requests are rate-limited per IP/email.
  Delivery is through SMTP; local development uses Mailpit. Raw codes are
  never logged.

### `POST /api/v1/auth/login`
Body: `{ "email": string, "password": string }`
- Normalizes email before lookup.
- On success without MFA: rotates/creates a session, sets cookies, returns
  `200 { user }`. MFA-enabled users instead get
  `200 { mfa_required: true, challenge_token, expires_in: 300 }` with no new
  session cookies. Password success alone does not authenticate them.
- On failure: returns `401 { error: { code: "invalid_credentials", message: "E-poçt və ya parol yanlışdır" } }`.
  Identical response whether the email does not exist OR the password is wrong
  (no account enumeration).
- Login throttling: max 5 failed attempts per (ip+email) per 15 min window;
  6th attempt within window returns `429 { error: { code: "rate_limited", message, retry_after } }`.
  Successful login resets the failure counter.

### TOTP MFA
- MFA is optional per account and separate from email ownership verification.
- `POST /api/v1/auth/mfa/enroll` requires session, CSRF, and current password;
  it returns a pending secret and authenticator `otpauth_uri`.
- `POST /api/v1/auth/mfa/confirm` requires session + CSRF and a current TOTP;
  it enables MFA, returns ten one-time recovery codes, rotates the current
  session, and revokes the user's other sessions. The TOTP counter used for
  confirmation is consumed and cannot be replayed.
- `POST /api/v1/auth/mfa/challenge` accepts the short-lived challenge token and
  either a TOTP or unused recovery code. Successful completion consumes the
  challenge and issues a session. Challenges expire after five minutes and
  lock after five invalid attempts; TOTP counters cannot be replayed.
- `POST /api/v1/auth/mfa/disable` requires session + CSRF, current password,
  and a fresh TOTP. It removes the encrypted secret and recovery codes, then
  revokes old sessions and rotates the current one.
- `POST /api/v1/auth/mfa/recovery-codes/rotate` requires session + CSRF, current
  password, and an unused TOTP counter. It atomically replaces the full set;
  old codes stop working and ten new codes are returned once.

### Session management
- `GET /api/v1/auth/sessions` returns only the caller's active sessions and
  marks the current session. Raw tokens and token hashes are never returned.
- `DELETE /api/v1/auth/sessions/{id}` revokes one owned session; revoking the
  current session clears its cookies.
- `POST /api/v1/auth/sessions/revoke-others` preserves the current session and
  returns `revoked_count`.
- `POST /api/v1/auth/sessions/revoke-current` ends the current session;
  `POST /api/v1/auth/sessions/revoke-all` ends all of the caller's sessions.
  Both clear current cookies.
- Sessions expire after 30 minutes of inactivity by default
  (`SESSION_IDLE_TTL_MINUTES`) and always expire after 12 hours
  (`SESSION_TTL_HOURS`). Successful authenticated activity slides the idle
  deadline, capped at the absolute expiry.

### `POST /api/v1/auth/logout`
- Requires a valid session. Invalidates the session row, clears cookies.
- Returns `200 { ok: true }`. If no session, still returns `200` (idempotent).

### `GET /api/v1/auth/me`
- Requires a valid session. Returns `200 { user }` or `401`.

### `GET /api/v1/auth/csrf`
- Returns the CSRF token for the current session in the body and sets the
  non-HttpOnly `csrf_token` cookie. `200 { csrf_token: string }`.
- Safe (GET). Frontend calls this once on app boot after login.

### `POST /api/v1/auth/change-password`
Body: `{ "current_password": string, "new_password": string }`
- Requires session + valid CSRF header.
- Verifies current password, validates new password rules, updates hash,
  rotates the current session, revokes all other sessions, returns `200 { ok: true }`.
- Wrong current password → `400 { error: { code: "invalid_current_password" } }`.

### `PUT /api/v1/user/profile`
- Requires session + valid CSRF header, strict body schema, and current password.
- If MFA is enabled, also requires a fresh, unused TOTP counter.
- Name changes apply after re-authentication. Email changes require mailbox OTP;
  accepting that OTP revokes all other sessions while preserving the current one.

### `POST /api/v1/auth/password-reset/request`
Body: `{ "email": string }`
- Always returns `200 { ok: true }` (no enumeration). If the email exists,
  creates a single-use, expiring (30 min) reset token (stored as hash) and
  emails a `/reset-password#token=...` link when SMTP is configured. The token
  is never logged or returned in the API response.
- Rate-limited: 3 requests per (ip) per 15 min.

### `POST /api/v1/auth/password-reset/confirm`
Body: `{ "token": string, "new_password": string }`
- Validates token (hash lookup, not expired, not used). On success: sets new
  password hash, marks token `used_at`, invalidates ALL of the user's sessions,
  returns `200 { ok: true }`. Invalid/expired/used → `400 { error: { code: "invalid_or_expired_token" } }`.
- Rate-limited to 5 requests per IP per 15 min. The frontend removes the token
  fragment from browser history after reading it.

---

## 2. Application endpoints

### `GET /api/v1/subjects`
Public. Returns `[ SubjectSummary ]`:
```json
{ "id": "math", "name": "Riyaziyyat", "short_desc": "...", "icon_name": "Calculator", "topic_count": 8, "question_count": 20, "grade_question_counts": { "9": 8, "10": 6, "11": 6 } }
```
(Note: readiness/completed/lastScore are per-user and absent here.)

### `GET /api/v1/subjects/<id>`
Public. Returns the subject plus its topics:
```json
{ "id": "math", "name": "...", "short_desc": "...", "icon_name": "...", "topics": [ { "id": "m1", "name": "...", "question_count": 42 } ] }
```

### `GET /api/v1/subjects/<id>/topics`
Public. Returns `[ { id, name, question_count } ]`.

### `POST /api/v1/tests`
Requires session + CSRF. Body: `{ "subject_id": "math", "topic_id": "m1" (optional) }`
- Picks up to 20 questions for the subject (filtered by topic if given).
- Creates a `TestAttempt` row (submitted_at = NULL), returns:
```json
{ "attempt_id": 12, "questions": [ { "id": 1, "topic": "Həqiqi ədədlər", "text": "...", "options": [ { "key": "A", "text": "..." } ] } ] }
```
- **Never** returns `correct_answer` or `explanation` in the live attempt.
- `kind: "open"` identifies questions that require a written response. Questions with `accepts_written_answer: true` allow either a choice or a written response. Reading questions may also include `passage`.

### `POST /api/v1/tests/<attempt_id>/submit`
Requires session + CSRF. Owner-only (403 otherwise). Body:
`{ "answers": { "1": "A" }, "written_answers": { "2": "The park opens at noon." } }`.
- `written_answers` is optional. Send one response per question. Omit unanswered questions or send `null`. Open questions also accept the existing text format in `answers`.
- For a question that offers choices, a stored written response is returned in `user_answer` with `is_written: true`. The result retains the original choices and their correct key.
- If the attempt was already submitted → `409 { error: { code: "already_submitted" } }`.
- Records each Answer, computes score, sets `submitted_at`, returns:
```json
{
  "attempt_id": 12,
  "subject_id": "math",
  "score": 18,
  "total": 20,
  "started_at": "...",
  "submitted_at": "...",
  "results": [ {
    "question_id": 1, "topic": "...", "text": "...",
    "user_answer": "A", "correct_answer": "A", "is_correct": true,
    "explanation": { "summary": "...", "steps": ["..."], "rule": "..." }
  } ]
}
```

### `GET /api/v1/tests/<attempt_id>`
Requires session, owner-only. Returns the full result object above (or `404`/`403`).

### `GET /api/v1/me/attempts?page=&per_page=`
Requires session. Returns paginated attempt summaries for the current user:
```json
{ "items": [ { "attempt_id": 12, "subject_id": "math", "subject_name": "Riyaziyyat", "score": 18, "total": 20, "submitted_at": "..." } ], "page": 1, "per_page": 10, "total": 1 }
```

### `GET /api/v1/me/progress`
Requires session. Returns dashboard aggregate:
```json
{
  "subjects": [ { "id": "math", "name": "Riyaziyyat", "total_questions": 20, "completed_questions": 18, "readiness_score": 90, "last_score": "18 / 20 bal", "last_date": "2026-10-25 18:40" } ],
  "weak_topics": [ { "id": "m1", "subject": "Riyaziyyat", "name": "...", "accuracy": 54, "mistake_count": 5, "question_count": 8 } ],
  "saved_mistakes": [ { "id": "a1", "subject": "Riyaziyyat", "topic": "...", "question_preview": "...", "user_answer": "B) 12", "correct_answer": "C) 15", "date": "2026-10-25", "status": "Yeni" } ],
  "progress_chart": [ { "date": "25 Okt", "score": 90, "tests": 1 } ]
}
```
For a user with no attempts, returns empty arrays (honest empty state).

### `GET /api/v1/practice/cards`
Requires session. Returns `[ PracticeCard ]` derived from the user's weak topics
(topics with accuracy < 70%). Empty array for new users:
```json
[ { "id": "p1", "topic": "...", "subject": "Riyaziyyat", "questions_count": 8, "estimated_time": "12 dəq", "difficulty": "Orta", "description": "..." } ]
```

### Health probes

- `GET /api/v1/health` is readiness: public, executes `SELECT 1`, returns `{ "status": "ok", "db": "ok" }` with 200 when ready and sanitized `{ "status": "not_ready" }` with 503 when DB is unavailable.
- `GET /api/v1/health/live` is liveness: public, does not query dependencies, returns `{ "status": "ok" }` with 200.

---

## 3. Response & error conventions

Success: `{ ...payload }` (or `{ ok: true }`).
Error: `{ "error": { "code": "snake_case_code", "message": "Human readable (az)", "fields": { ... } (optional) } }`.
HTTP status codes: 200/201/204/400/401/403/404/409/429/500.
Never leak tracebacks, SQL, file paths, env vars, hashes, or pepper.

---

## 4. Security behavior (backend MUST implement)

- **Argon2id** via `argon2-cffi` (`PasswordHasher`), unique salt per hash
  (library default), encoded hash stored in `users.password_hash`.
- **Pepper**: HMAC-SHA-256 keyed hash of the password with a server-side
  `PASSWORD_PEPPER` env secret BEFORE passing to Argon2. Preprocessing is
  versioned (`v1`). Missing pepper in `FLASK_ENV=production` → startup fails.
  `.env.example` ships a placeholder only.
- **Sessions**: 32-byte `secrets.token_urlsafe` id; store **SHA-256 hash** of the
  token in `sessions.token_hash` (so DB leak doesn't grant sessions). Cookie:
  `session_token`, HttpOnly, SameSite=Lax (Strict in prod for first-party),
  Secure in prod, path=/, max-age=session lifetime. Rotate on login & on
  privilege change.
- **CSRF**: synchronizer token. `csrf_token` (32-byte) stored on the session
  row + a non-HttpOnly `csrf_token` cookie (SameSite=Lax). State-changing
  requests (POST/PUT/PATCH/DELETE) require `X-CSRF-Token` header matching the
  session's stored token. GET/HEAD/OPTIONS exempt.
- **CORS**: allow `FRONTEND_ORIGIN` only (env). Credentials allowed for that
  single origin. `OPTIONS` preflight handled.
- **Rate limiting**: fixed-window per IP (+email for auth). Development/tests
  use in-memory storage; production requires TLS Redis with an atomic script
  shared across workers. Redis startup/outage failures fail closed (startup
  abort or generic 503), never silently disable limits.
- **Headers**: CSP (allow self + fonts.googleapis.com/fonts.gstatic.com +
  unsafe-inline only if needed for Vite dev; tighten in prod),
  X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin,
  frame-ancestors 'none' via CSP, HSTS only when `FLASK_ENV=production`.
- **Input validation**: marshmallow/pydantic-style schemas; strict max lengths;
  reject unknown fields.
- **SQLi**: SQLAlchemy ORM only, parameterized.
- **Authorization**: every `/me/*` and `/tests/<id>` endpoint checks the
  resource belongs to `current_user`. IDOR tests must pass.
- **Audit log**: log security events (register, login success, login fail,
  logout, password change, password reset, rate-limit hit) into
  `audit_logs`. Never log passwords/tokens/session ids (log token HASH only).
- **DB**: SQLite with `PRAGMA foreign_keys=ON`, WAL mode, and busy_timeout
  for development/tests; production requires TLS PostgreSQL via
  `FLASK_DATABASE_URL` or `DATABASE_URL`, normalized to the psycopg 3
  SQLAlchemy driver. Migrations use Flask-Migrate (Alembic). `init_db`
  applies migrations and idempotent seed data; never drop user data on startup.

---

## 5. DB schema (SQLAlchemy models)

- **users**: id PK, name (1-80), email UNIQUE (normalized lowercased),
  password_hash (encoded Argon2id), is_active (bool default True),
  is_verified, mfa_enabled, encrypted TOTP secret, last accepted TOTP counter,
  created_at, last_login_at (nullable).
- **sessions**: id PK, user_id FK->users.id (ON DELETE CASCADE),
  token_hash UNIQUE (sha256 hex, index), csrf_token (32-byte),
  user_agent (str, nullable), ip (str, nullable), created_at, expires_at.
  Index on (user_id), index on token_hash.
- **password_reset_tokens**: id PK, user_id FK->users.id CASCADE,
  token_hash UNIQUE index, created_at, expires_at, used_at (nullable).
- **mfa_challenges**: user_id FK, hashed one-use challenge, attempts,
  created_at, expires_at, consumed_at.
- **mfa_recovery_codes**: user_id FK, unique SHA-256 code hash, created_at,
  used_at. Raw recovery codes are returned only at MFA activation.
- **subjects**: id PK (string slug: math/aze/eng), name, short_desc,
  icon_name, created_at. UNIQUE on id (it's PK).
- **topics**: id PK (string slug: m1,a1,...), subject_id FK->subjects.id
  CASCADE, name, question_count, "order" int. Index on subject_id.
- **questions**: id PK int autoincrement, subject_id FK->subjects.id,
  topic_id FK->topics.id, text, options_json (JSON: [{key,text}]),
  correct_answer (char 1), explanation_json (JSON: {summary,steps[],rule}),
  difficulty (nullable str), created_at. Index on (subject_id, topic_id).
- **test_attempts**: id PK int, user_id FK->users.id CASCADE, subject_id
  FK->subjects.id, started_at, submitted_at (nullable), score int, total int.
  Index on (user_id, subject_id). Unique? no — a user may have many attempts.
- **answers**: id PK, attempt_id FK->test_attempts.id CASCADE, question_id
  FK->questions.id, user_answer (char nullable), is_correct (bool nullable),
  created_at. Unique(attempt_id, question_id) to block double-answers.
- **audit_logs**: id PK, user_id FK->users.id (nullable, ON DELETE SET NULL),
  action (str), ip (nullable), user_agent (nullable), created_at, details_json
  (JSON). Index on (user_id), (action), (created_at).

Seed data source: the 3 subjects + 17 topics + 20 math questions from
`/home/z/my-project/build-output/startup-fullstack/frontend/src/data/examData.ts`
MUST be migrated into the seed script so the app keeps its educational content.

---

## 6. Frontend integration requirements

- `VITE_API_URL` env var (e.g. `http://localhost:5000`) configures backend base.
- Centralized API client (`src/lib/api.ts`) using `fetch` with `credentials: 'include'`,
  JSON parsing, timeout (AbortController), and automatic `X-CSRF-Token` header
  injection on state-changing requests (token read from the `csrf_token` cookie).
- Auth context (`src/lib/auth.tsx`) exposing `{ user, login, register, logout,
  refresh, loading }`; on boot calls `GET /api/v1/auth/me` to restore session
  (so refresh does not log you out). On 401 during a request, surface a
  "session expired" state and redirect to login.
- `ScreenType` extended with `'login' | 'register'`. New screens:
  `LoginScreen.tsx`, `RegisterScreen.tsx` matching the existing design system
  (bg-canvas, bg-brand, text-navy, shadow-calm, Manrope). Show/hide password,
  client validation, loading state, server-error display.
- Protected screens: `subjects`, `test`, `result`, `practice`, `dashboard`.
  If not authenticated → redirect to `login`. Landing + login + register are
  public. (Navbar "Daxil ol" → login; "Pulsuz başla" → register or test depending
  on auth state.)
- Wire flows: subjects (GET subjects), test (POST tests → render questions →
  POST submit → navigate to result with the returned object), result (display
  the passed-in result or fetch by attempt_id), dashboard (GET /me/progress),
  practice (GET /practice/cards).
- Preserve all existing visual design, colors, tokens, the mobile-frame
  simulator, dark mode, and the Navbar/MobileTabBar structure. Only add/change
  what's needed for the above.
- Audit & fix responsive issues across 320–1920px (no horizontal overflow,
  min-width:0 on flex children, box-sizing border-box, no fixed vw widths).

---

# CONTRACT DELTA — audit pass 2 (CAPTCHA, Leaderboard, Request-ID)

## 7. CAPTCHA (Cloudflare Turnstile) on LOGIN

Config:
- `TURNSTILE_SECRET_KEY` (backend env) + `VITE_TURNSTILE_SITE_KEY` (frontend env).
- Captcha is ENABLED **iff** the backend has `TURNSTILE_SECRET_KEY` set.
  When it is NOT set, login works without a captcha (documented in
  .env.example + README) — there is NO fake verification anywhere.

Login request body gains an optional field:
- `captcha_token` (string, optional) — the Turnstile widget token.

Backend behavior on `POST /api/v1/auth/login` (after schema validation,
BEFORE credential verification):
- If `TURNSTILE_SECRET_KEY` is NOT configured → captcha step skipped.
- If configured:
  - Missing/empty `captcha_token` → `400 { error: { code: "captcha_required", ... } }`.
  - Verify via `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`
    (form-encoded: `secret`, `response`=token, `remoteip`=client ip) using the
    Python stdlib (`urllib.request`, 10s timeout) — NO new dependency.
  - Provider responds `success: false` (invalid/expired token) →
    `400 { error: { code: "captcha_invalid", message } }`.
  - Provider unreachable / timeout / non-JSON → FAIL CLOSED:
    `503 { error: { code: "captcha_unavailable", message } }` (never allow login).
  - On success → continue to credential verification.
- Failure audit events: `captcha_failed` (with reason, NO token value logged).
- Registration is NOT captcha-gated in this pass (login is the brute-force
  surface; register already has rate limiting + can be added later).

Frontend behavior:
- If `import.meta.env.VITE_TURNSTILE_SITE_KEY` is set → LoginScreen loads
  `https://challenges.cloudflare.com/turnstile/v0/api.js` (async, defer),
  renders the widget, obtains the token, and sends it as `captcha_token`.
  Widget reset on failed login (token single-use). If not set → no widget,
  no token sent.

## 8. Leaderboard

`GET /api/v1/leaderboard?subject_id=<slug>&page=1&per_page=20`
- PUBLIC read (leaderboards are public; no private data returned).
- Personalized: when a valid session cookie is present, the response also
  includes `me` (the current user's row at ANY rank, even outside the page
  window); `me` is `null` for anonymous users or users with no submitted
  attempts.

Ranking rule (computed SERVER-SIDE over SUBMITTED test_attempts only —
`submitted_at IS NOT NULL`):
- `total_score` = SUM(score) DESC (primary).
- Tie-break 1: accuracy = SUM(score)/SUM(total) DESC (higher is better).
- Tie-break 2: earliest activity ASC (MIN(started_at)).
- Tie-break 3: user_id ASC (fully deterministic).
- `tests_completed` = COUNT(attempts). `best_score` = MAX(score).
- `last_activity` = MAX(submitted_at) ISO-8601 UTC or null.
- Optional `subject_id` filter (must be a valid subject slug; invalid → 404
  subject_not_found).
- Pagination: page >= 1, per_page in [1..50] (default 20). Response:
```json
{
  "entries": [ { "rank": 1, "user_id": 3, "name": "Aysel", "tests_completed": 12,
                 "total_score": 210, "total_questions": 240, "accuracy": 87.5,
                 "best_score": 20, "last_activity": "2026-10-26T18:00:00Z" } ],
  "page": 1, "per_page": 20, "total": 57,
  "me": { "rank": 14, "user_id": 7, "...": "same entry shape" }
}
```
- `rank` is the GLOBAL rank (1-based) even for entries on page > 1.
- Names longer than 80 chars cannot exist (schema). No emails returned.
- Implementation notes: single aggregate query
  (JOIN users, GROUP BY user_id, ORDER BY total_score DESC, accuracy DESC,
  min_started ASC, user_id ASC) — avoid N+1; global rank via
  COUNT of users with strictly better totals (or window function on SQLite
  3.25+, which Python 3.12 bundles). Add index if needed for the filter.

## 9. Request ID / correlation ID

- Middleware reads incoming `X-Request-ID` (max 64 chars, sanitized) or
  generates `secrets.token_hex(8)`; stores on `g`; echoes it on EVERY
  response header `X-Request-ID`.
- Every JSON error response body gains a `request_id` field:
  `{ "error": { "code", "message", "fields"? }, "request_id": "..." }`.
- Server-side error logs include the request id so a user-reported failure
  can be correlated with the server log. Never log tokens/passwords.

---

## Backend implementation notes — delta pass 2 (Task B2, authoritative details)

These notes pin down every detail the frontend team needs; where the delta
text above and these notes could be read differently, the notes describe the
SHIPPED behavior.

### §9 Request-ID — shipped details
- Sanitizer: incoming header is filtered to `[A-Za-z0-9_-]` FIRST, then
  truncated to 64 chars; if nothing survives, a fresh `token_hex(8)` id
  (16 lowercase hex chars) is generated and used for both the echoed
  `X-Request-ID` response header and any error body.
- The id is echoed on EVERY response (success and error, all endpoints).
- Success JSON bodies do NOT contain `request_id` — the header is the
  correlation channel for success; the body field exists only on errors.
- Error bodies: `request_id` is added by the central error handlers, so it
  appears on 400/401/403/404/409/429/500/503 — including validation errors
  and captcha errors. The `request_id` in the body always equals the
  `X-Request-ID` header of that response.
- The 500 handler logs `Unhandled error request_id=<id> error_type=<class>`
  via `app.logger.error` without exception text or traceback; ApiErrors with
  status >= 500 are also logged with the id. Alembic logging configuration
  preserves existing application loggers.

### §7 CAPTCHA — shipped details
- `LoginSchema.captcha_token`: optional string, `allow_none`, max 2048 chars
  (schema-level). A non-string value → normal `400 validation_failed`
  envelope. Empty/whitespace-only/None/missing are all treated as "missing"
  by the service (→ `400 captcha_required` when captcha is enabled).
- Verification order on `POST /auth/login`: schema validation → **captcha
  check → credential check** (a wrong password with a bad captcha returns
  the captcha error, not `invalid_credentials`).
- `verify_captcha` posts form-encoded `secret`, `response`, `remoteip`
  (remoteip omitted when the client IP is unknown) with a 10s timeout.
  Fail-closed mapping: network error / timeout / HTTP 4xx-5xx from provider /
  non-JSON or unexpected-shape JSON → reason `unavailable` → HTTP 503
  `captcha_unavailable`. Provider `success:false` → reason `invalid` → HTTP
  400 `captcha_invalid`.
- Audit: `captcha_failed` rows store `{"reason": "missing"|"invalid"|"unavailable"}`
  ONLY — the token value is never stored, logged, or echoed back.
- Login rate limiting (5 per ip+email / 15 min) still wraps the whole login
  endpoint and is unchanged; captcha failures count toward it.

### §8 Leaderboard — shipped details
- `GET /api/v1/leaderboard` is public; optional session cookie only
  personalizes `me` (an invalid/expired session behaves like anonymous).
- Pagination clamping: `page` non-integer or < 1 → 1; `per_page` non-integer
  or < 1 → 20 (default); `per_page` > 50 → 50. There is no 400 for
  out-of-range numeric pagination — values are clamped.
- `subject_id`: unknown slug → `404 subject_not_found`. An EMPTY
  `subject_id` query param (`?subject_id=`) is treated as absent (no filter).
- Ranking SQL: single aggregate query
  (`GROUP BY user_id`) over `test_attempts` joined to `users`, restricted to
  `submitted_at IS NOT NULL` (+ optional `subject_id = ?`), with the global
  rank computed by `ROW_NUMBER() OVER (ORDER BY SUM(score) DESC, exact
  accuracy ratio DESC, MIN(started_at) ASC, user_id ASC)` in the same
  statement. The accuracy TIE-BREAK uses the exact ratio
  `SUM(score)/SUM(total)` (SQLite REAL division), while the DISPLAYED
  `accuracy` field is rounded to 1 decimal — two users can share a displayed
  accuracy but still be ordered deterministically by the exact ratio.
- `me` is computed with the same aggregate (same subject filter, same tie
  ordering), so `me.rank` is the user's true global rank within the current
  filter even when they are outside the returned page window. `me` is null
  for anonymous users, users with an invalid session, and authenticated
  users with zero submitted attempts for the current filter.
- `last_activity` is ISO-8601 UTC `YYYY-MM-DDTHH:MM:SSZ` (null cannot occur
  for submitted attempts but the field tolerates it).
- Response fields per entry/me: exactly
  `rank, user_id, name, tests_completed, total_score, total_questions,
  accuracy, best_score, last_activity`. No emails, no password hashes.
- New Alembic migration `d04335046b00_leaderboard_index` adds the additive
  index `ix_attempts_subject_submitted (subject_id, submitted_at)` on
  `test_attempts`. No tables/columns were altered or dropped.
