# Security configuration

This document describes the security controls implemented in the Flask backend
and how to operate them safely. It is the companion to `CONTRACT.md` §4.

## Threat model (what we defend against)

| Threat | Control |
| --- | --- |
| Password DB leak | Argon2id + unique salt per hash + HMAC-SHA-256 pepper (defense in depth) |
| Brute-force login / reset | Atomic fixed-window buckets; memory in dev/tests, shared TLS Redis in production (per ip+email where applicable) |
| Verification-code database leak | Email OTPs are purpose-bound HMAC-SHA-256 values keyed with `PASSWORD_PEPPER`; raw codes are never stored or logged |
| MFA database leak | TOTP secrets use AES-256-GCM with a separate `MFA_ENCRYPTION_KEY`; challenge handles and recovery codes are stored as hashes |
| MFA replay / guessing | TOTP counters are one-time per account; login challenges expire in five minutes, allow five attempts, and are IP-rate-limited |
| Account enumeration | Identical 401 on login for unknown email / wrong password; reset-request always 200 |
| Session fixation / theft | Opaque token stored as sha256 hash; HttpOnly + Secure (prod) + SameSite=Strict (prod); rotated on login & password change |
| CSRF | Synchronizer-token (stored on session row + non-HttpOnly cookie; `X-CSRF-Token` header required on state-changing requests) |
| SQL injection | SQLAlchemy ORM only; parameterized queries; no string interpolation |
| XSS | React escapes by default; no `dangerouslySetInnerHTML`; CSP restricts script sources |
| IDOR | Every `/me/*` and `/tests/<id>` endpoint authorizes ownership (403/404) |
| Open redirect | No user-controlled redirects in the API |
| Information disclosure | Centralized JSON error envelope; no tracebacks/SQL/env/hashes/tokens in responses; audit log never stores passwords/raw tokens |
| Mass assignment | Strict marshmallow schemas reject unknown fields |
| Insecure cookies | `Secure` (prod), `HttpOnly`, `SameSite` (Lax dev / Strict prod), scoped path |
| Clickjacking | `frame-ancestors 'none'` in CSP + `X-Frame-Options: DENY` |
| MIME sniffing | `X-Content-Type-Options: nosniff` |
| Insecure transport | `Strict-Transport-Security` in production only |

## Password storage

**Algorithm:** Argon2id via `argon2-cffi` `PasswordHasher`.
- Production parameters: `time_cost=2`, `memory_cost=65536` (64 MiB),
  `parallelism=2`, `hash_len=32`. Testing config uses lower cost
  (`time_cost=1`, `parallelism=1`, `memory_cost=8192`) for fast tests.
- A **unique cryptographically random salt** is generated per hash by the
  library (stored inside the encoded hash string).
- Only the **encoded hash string** is stored in `users.password_hash`.
- The pepper is applied **before** Argon2 via a versioned HMAC-SHA-256
  preprocessing step: `peppered = "v1:" + base64url(HMAC_SHA256(pepper, password))`,
  and `peppered` is what Argon2 hashes. This avoids improvised concatenation
  and supports future pepper rotation via a `v2:` prefix.

**Pepper management**
- Stored **only** in the `PASSWORD_PEPPER` environment variable (or a secret
  manager). Never in the DB, frontend, or `.env.example` (only a placeholder).
- In `FLASK_ENV=production`, a missing, placeholder, or short (<16 chars)
  pepper causes `create_app()` to **raise** — the process refuses to start
  rather than silently disabling the protection.
- Rotation: increment the version prefix (`v2:`) and add a verifier that
  accepts both `v1:` and `v2:`-prefixed hashes, rehashing on next login.

## Sessions

- **Opaque** `secrets.token_urlsafe(32)` session token in the
  `session_token` cookie. The DB stores `sha256(token).hexdigest()` in
  `sessions.token_hash` (UNIQUE, indexed) — a DB leak does not grant
  sessions.
- Cookie flags: `HttpOnly` (always), `Secure` (prod only, requires HTTPS),
  `SameSite=Lax` (dev, so the Vite dev origin works) / `SameSite=Strict`
  (prod), `Path=/`, `Max-Age=SESSION_TTL_HOURS * 3600`.
- **Rotation:** on login a new session row is created. Password change rotates
  the current session and revokes all others. Verified email changes revoke
  all other sessions after mailbox ownership is confirmed.
- Profile edits require the current password; MFA-enabled accounts also need a
  fresh TOTP counter. Successful authenticated responses slide the 30-minute
  idle deadline (`SESSION_IDLE_TTL_MINUTES`); the absolute expiry stays at 12
  hours by default (`SESSION_TTL_HOURS`).
- **Logout** deletes the session row and clears the cookie. Idempotent.
- **Password reset confirm** invalidates **all** of the user's sessions.
- The `/auth/me` endpoint restores the session on refresh, so legitimate
  users stay logged in.

## Multi-factor authentication

- Email confirmation proves mailbox ownership at registration; it is not
  login MFA. Users can opt in to authenticator-app TOTP from profile settings.
- TOTP uses RFC 6238 (SHA-1, six digits, 30-second step, one-step clock
  tolerance). A successfully used time counter cannot be replayed.
- The secret is encrypted with AES-256-GCM and associated data that binds the
  ciphertext to this TOTP-secret format. Production requires a separate
  URL-safe base64 `MFA_ENCRYPTION_KEY` encoding exactly 32 random bytes.
- Each enabled account receives ten high-entropy recovery codes once. Only
  SHA-256 hashes are stored; each code is consumed on use.
- Recovery-code rotation requires the current password and an unused TOTP
  counter. Replacement is atomic; the old set is invalidated before new codes
  are returned.
- Session inventory is scoped to the authenticated user and excludes expired
  sessions. Token hashes and raw cookies are never returned. Individual,
  other-session, current-session, and all-session revocation are supported.
- Password success alone creates no new session for MFA-enabled accounts. A
  five-minute, one-use challenge must be completed first. Disable requires
  current password plus a fresh TOTP code, then clears recovery material and
  rotates/revokes sessions.

## CSRF

- **Synchronizer-token pattern.** Each session row stores a 32-byte
  `csrf_token`. The same value is also set in a non-HttpOnly `csrf_token`
  cookie so the frontend can read it.
- The `@require_csrf` decorator (applied to every POST/PUT/PATCH/DELETE
  auth + test + me endpoint) compares `request.headers['X-CSRF-Token']` to
  the session's stored token using `hmac.compare_digest` (constant-time).
- GET/HEAD/OPTIONS are exempt.
- `GET /api/v1/auth/csrf` is the endpoint the frontend calls on boot (and
  after login) to prime the cookie.

## CORS

- Single allowed origin: `FRONTEND_ORIGIN` env (default
  `http://localhost:5173` for dev).
- `supports_credentials=True`, so cookies flow. **No wildcard origin.**
- Preflight `OPTIONS` handled.

## Rate limiting

- Fixed-window: memory backend for development/tests; production requires the
  shared Redis backend and TLS URL. Startup pings Redis; requests fail closed
  with a generic 503 on backend failure instead of disabling abuse controls.
- Login/register: 5 per (ip+email) per 900 s.
- Email verification OTP: 5 per (ip+email) per 900 s.
- Verification resend: 3 per (ip+email) per 900 s.
- Password-reset-request: 3 per ip per 900 s.
- Password-reset-confirm: 5 per IP per 900 s.
- Profile update: 10 per IP/email; profile email OTP: 5 per IP/email per 900 s.
- Captcha image generation: 10 per ip per 900 s.
- MFA recovery-code rotation: 5 per IP per 900 s; session management: 20 per IP per 900 s.
- Redis bucket keys include SHA-256 of the client/account key so email and IP
  values are not stored in Redis key names. Lua performs increment+expiry
  atomically across workers. The live Redis service still needs staging testing.
- Returns `429` with `{ error: { code: "rate_limited", message, retry_after } }`.
- Successful login resets the failure counter.
- Proxy IP trust is not enabled by default; use the socket peer until known
  proxy hops are explicitly configured.

The image captcha is a legacy/local flow. Its generation endpoint now returns
a generic error and logs only the exception type; it is rate-limited. The
login's Cloudflare Turnstile remains the authoritative server-verified login
challenge when configured.

## Security headers (applied on every response)

| Header | Value |
| --- | --- |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; base-uri 'self'; frame-ancestors 'none'` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `X-Frame-Options` | `DENY` (defense in depth alongside CSP `frame-ancestors`) |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` — **production only** |

## Input validation

- All request bodies validated by **marshmallow** schemas.
- Unknown fields are **rejected** (strict `RAISE`), not silently dropped.
- Enforced max lengths (name 80, email 320, password 72, etc.).
- Email is normalized (lowercased, stripped) before lookup and storage.
- Password rules: 8–72 chars, ≥1 letter, ≥1 digit.

## Authorization

- Every `/me/*` endpoint scopes queries to `current_user`.
- `GET /tests/<id>` and `POST /tests/<id>/submit` check
  `attempt.user_id == current_user.id`. Owner mismatch → 403; non-existent →
  404 (consistent; either is acceptable per the contract).
- There is no endpoint that accepts an arbitrary user id and returns private
  records.

## Error handling

- Centralized handlers for 400/401/403/404/409/429/500.
- Always `{ error: { code, message, fields? } }`.
- 500 = generic `"Daxili server xətası"`; server logs include request id and
  exception class only, without exception text or traceback (which may carry
  credentials or personal data).
- Never exposes SQL, file paths, env vars, password hashes, the pepper, or
  token values.

## Audit logging

- `audit_logs` rows are inserted for: `register`, `login_success`,
  `login_failure`, `logout`, `password_change`, `password_reset_request`,
  `password_reset_confirm`, `mfa_enabled`, `mfa_disabled`, `login_mfa_required`,
  `mfa_challenge_locked`, `rate_limit_hit`.
- Columns: `user_id` (nullable, ON DELETE SET NULL), `action`, `ip`,
  `user_agent`, `created_at`, `details_json`.
- **Never** stores passwords, raw session tokens, or raw reset tokens. Reset
  tokens are referenced by their sha256 hash; only the hash prefix may appear
  in log details.

## Production hardening checklist

- [ ] Set `FLASK_ENV=production`.
- [ ] Generate a real `SECRET_KEY` (≥32 random bytes).
- [ ] Generate a real `PASSWORD_PEPPER` (≥32 random bytes).
- [ ] Generate a separate 32-byte `MFA_ENCRYPTION_KEY` and store it in the
      secret manager; back up its rotation/recovery procedure securely.
- [ ] Set `FRONTEND_ORIGIN` to the exact production frontend origin (no wildcard).
- [ ] Serve over HTTPS (the backend sets `Secure` + HSTS only in prod).
- [ ] Run under a real WSGI server (`gunicorn`/`waitress`), NOT `run.py`.
- [ ] Configure a TLS Redis endpoint, confirm shared limits across workers,
      and verify failure handling in staging.
- [ ] Configure and verify real SMTP for registration, email change, and
      password-reset delivery; raw codes and tokens are never logged.
- [x] Require a TLS PostgreSQL connection URL in production; reject SQLite and
      cleartext DB URLs at startup.
- [ ] Configure least-privilege PostgreSQL credentials and verify network
      policy, retention, encrypted backups, and point-in-time recovery.

## Secrets at a glance

| Secret | Where | Rotatable | Required in prod |
| --- | --- | --- | --- |
| `SECRET_KEY` | env | yes (re-signs cookies → all sessions invalidated) | yes |
| `PASSWORD_PEPPER` | env | yes (versioned `v1:`/`v2:` prefix) | yes |
| `FRONTEND_ORIGIN` | env | yes | yes |
| `FLASK_DATABASE_URL` or `DATABASE_URL` | secret manager | yes (managed PostgreSQL connection URL) | yes |
| session token | cookie + sha256 hash in DB | rotated on login | n/a |
| csrf token | session row + non-HttpOnly cookie | rotated on session rotation | n/a |
| reset token | sha256 hash in DB | single-use | n/a |
