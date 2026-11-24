# Career Arena API Reference

**Status:** source-verified implementation reference  
**API prefix:** `/api/v1`  
**Content type:** JSON for request bodies and JSON responses unless an endpoint returns an empty preflight response.  
**Route inventory evidence:** Flask URL map built from `TestingConfig` on 2026-11-14: 35 routes under `/api/v1`. Update this file whenever routes or route security change.

This document records shipped behavior found in the current route, schema, service, middleware, and configuration code. The broader product contract and security decisions are in [CONTRACT.md](CONTRACT.md) and [SECURITY.md](SECURITY.md). A difference between this reference and a desired production policy is a tracked gap, not proof that the policy is implemented.

The machine-readable OpenAPI 3.1 contract is [openapi.json](openapi.json). Regenerate it from the live Flask URL map and explicit operation metadata with `python scripts/generate_openapi.py` from `backend/`; the contract test fails if the checked-in file and generator drift.

### Compatibility and deprecation

Adding an endpoint or optional request/response field is compatible within `/api/v1`. Removing or renaming a path or method, making a field required, changing its meaning or type, or removing/renaming a response field is breaking and requires a new versioned path plus a documented migration window. Before removing an old operation, mark it `deprecated` in OpenAPI, describe the sunset date, and announce the migration path.

## Shared request behavior

- Session authentication uses the opaque `session_token` cookie. The server stores only its SHA-256 hash. The cookie is HttpOnly; production sets Secure and SameSite=Strict. Successful authenticated activity slides the 30-minute idle deadline (`SESSION_IDLE_TTL_MINUTES`) but never extends the 12-hour absolute limit (`SESSION_TTL_HOURS`).
- State-changing authenticated requests require `X-CSRF-Token` matching the token bound to the current session. Obtain it from `GET /auth/csrf`; the frontend API client sends it automatically. `GET`, `HEAD`, and `OPTIONS` are exempt.
- CORS allows the configured single `FRONTEND_ORIGIN` with credentials. Preflight requests do not consume rate-limit budget.
- Request bodies are capped at 1 MiB. Unknown request fields are rejected by the authentication schemas and ignored by some content schemas; see endpoint notes.
- Responses include `X-Request-ID`. Error bodies include the same `request_id`.
- Standard error envelope: `{"error":{"code":"...","message":"...","fields":{...}},"request_id":"..."}`. `fields` is omitted when unavailable. A rate-limit denial is 429 and puts `retry_after` in `error.fields`; shared limiter failure is a generic 503.
- Authentication and CSRF are separate: a valid session does not waive CSRF for a state-changing authenticated request.

## Route matrix

Limit values below are defaults per 900-second window (15 minutes), except where stated. The production and development configs allow overrides. “IP + email” means the rate-limit key combines the direct remote IP and normalized request email. Proxy forwarding headers are not trusted by default.

| Method and path | Access | CSRF | Default limit | Purpose |
|---|---|---|---:|---|
| `POST /auth/register` | Public | No | 5, IP | Create unverified account; sends email code |
| `POST /auth/verify-otp` | Public | No | 5, email; 30, IP | Verify registration email and create session |
| `POST /auth/verification/resend` | Public | No | 3, email; 10, IP | Rotate and resend registration code |
| `POST /auth/login` | Public | No | 5, IP + email | Password login; may return MFA challenge |
| `POST /auth/mfa/challenge` | Public challenge token | No | 15, IP | Complete MFA using TOTP or recovery code |
| `POST /auth/logout` | Optional session | No | — | Revoke current session; idempotent |
| `GET /auth/me` | Session | No | — | Return current public user |
| `GET /auth/csrf` | Session | No | — | Return current CSRF token and set cookie |
| `POST /auth/change-password` | Session | Yes | — | Change password; rotate current session and revoke others |
| `POST /auth/password-reset/request` | Public | No | 3, IP | Send reset link; generic response |
| `POST /auth/password-reset/confirm` | Reset token | No | 5, IP | Consume one-use reset token; revoke all sessions |
| `POST /auth/mfa/enroll` | Session | Yes | — | Re-authenticate and begin TOTP enrollment |
| `POST /auth/mfa/confirm` | Session | Yes | — | Confirm TOTP; return one-time recovery codes; rotate session |
| `POST /auth/mfa/disable` | Session | Yes | — | Re-authenticate, disable MFA, revoke/rotate sessions |
| `POST /auth/mfa/recovery-codes/rotate` | Session | Yes | 5, IP | Re-authenticate and replace all recovery codes |
| `GET /auth/sessions` | Session | No | — | List active sessions for current user |
| `DELETE /auth/sessions/{session_id}` | Session | Yes | 20, IP | Revoke one owned session |
| `POST /auth/sessions/revoke-current` | Session | Yes | 20, IP | Revoke current session |
| `POST /auth/sessions/revoke-others` | Session | Yes | 20, IP | Revoke all other sessions |
| `POST /auth/sessions/revoke-all` | Session | Yes | 20, IP | Revoke every session, including current |
| `PUT /user/profile` | Session | Yes | 10, IP + email | Re-authenticated name/email update |
| `POST /user/profile/verify-otp` | Session | Yes | 5, IP + email | Verify pending profile email |
| `GET /subjects` | Public | No | — | Subject catalogue and counts |
| `GET /subjects/{subject_id}` | Public | No | — | Subject and topic list |
| `GET /subjects/{subject_id}/topics` | Public | No | — | Topic list and question counts |
| `POST /tests` | Session | Yes | — | Create attempt and return selected questions |
| `POST /tests/{attempt_id}/submit` | Session, owner | Yes | — | Submit answers once and return graded result |
| `GET /tests/{attempt_id}` | Session, owner | No | — | Fetch submitted result |
| `GET /me/attempts` | Session | No | — | Paginated submitted attempt summaries |
| `GET /me/progress` | Session | No | — | Dashboard progress aggregates |
| `GET /practice/cards` | Session | No | — | Cards derived from weak topics |
| `GET /leaderboard` | Public; optional session | No | — | Public ranking; optionally includes current user's row |
| `GET /captcha/generate` | Public | No | 10, IP | Generate legacy image CAPTCHA |
| `GET /health` | Public | No | — | Database and configured Redis readiness; 503 when either fails |
| `GET /health/live` | Public | No | — | Liveness probe; deliberately avoids dependencies |

Rate limiting is memory-backed in development/tests and TLS Redis-backed in production. Redis uses an atomic fixed-window script and hashed bucket identities. Redis failures fail closed; startup aborts if the configured shared service cannot be reached. Login's budget remains charged until login or MFA succeeds. Registration/reset/email delivery still requires a correctly configured SMTP provider in production.

## Authentication and account lifecycle

### Registration and email ownership

`POST /auth/register`

Request:

```json
{"name":"Aysel Məmmədova","email":"aysel@example.com","password":"Example123","confirm":"Example123"}
```

The auth schema requires a 1–80 character name, normalized email, and 8–72 character password containing a letter and digit; confirmation must match. Unknown fields are rejected. Success returns 201 with `{"user":{...},"requires_verification":true}` and does not create a session. The password hash uses Argon2id with the configured pepper. Registration is unavailable with a generic 503 if mail delivery is not configured. Duplicate email currently returns 409 `email_exists` (this permits account-existence inference at registration and remains a product/security policy decision).

`POST /auth/verify-otp`

Request: `{"email":"aysel@example.com","code":"123456"}`. A valid five-minute, one-use code confirms mailbox ownership and creates a session. Email OTP is not MFA. Invalid/expired codes return a validation error.

`POST /auth/verification/resend`

Request: `{"email":"aysel@example.com"}`. Returns `{"ok":true}` for existing, missing, verified, or mail-unavailable addresses to reduce enumeration. Codes are HMAC-protected at rest and are not logged.

### Login and MFA

`POST /auth/login`

Request: `{"email":"aysel@example.com","password":"Example123","captcha_token":"optional"}`. When Turnstile is configured, a valid token is required and verified server-side before password verification. Without configured Turnstile, the token is optional.

- Password-only account: 200 with `{"user":{...}}` and session/CSRF cookies.
- MFA account: 200 with `{"mfa_required":true,"challenge_token":"...","expires_in":300}`, no authenticated session cookie.
- Invalid email/password: generic 401 `invalid_credentials`.
- Configured Turnstile missing/invalid token: 400; provider failure: 503.

`POST /auth/mfa/challenge`

Request: `{"challenge_token":"...","code":"123456"}`. The code can be a TOTP or unused recovery code. A valid challenge is one-use and expires after five minutes. Success returns the public user and creates a session. TOTP replay, failed-attempt limits, and challenge expiry are enforced in the service.

### Password reset

- `POST /auth/password-reset/request`: `{"email":"..."}`; always returns `{"ok":true}` for unknown addresses or unavailable delivery.
- `POST /auth/password-reset/confirm`: `{"token":"...","new_password":"..."}`; atomically changes the password and revokes every outstanding reset link, pending MFA login challenge, and active session for the account. Invalid/expired/used tokens return 400 `invalid_or_expired_token`.

Reset links carry the token in a URL fragment so it is not sent in HTTP referrer headers. The frontend removes it from browser history after reading it.

### Profile and MFA settings

- `POST /auth/mfa/enroll`: `{"current_password":"..."}`; returns a pending authenticator secret and `otpauth_uri`. Treat this response as secret material.
- `POST /auth/mfa/confirm`: `{"code":"123456"}`; enables MFA, returns recovery codes once, rotates current session and revokes other sessions.
- `POST /auth/mfa/disable`: `{"current_password":"...","code":"123456"}`; requires both factors and rotates the session.
- `POST /auth/mfa/recovery-codes/rotate`: same current-password + TOTP request; old codes are revoked when replacement codes are issued.
- `PUT /user/profile`: accepts at least one of `name` or `email`, requires `current_password`, and requires a fresh `mfa_code` when MFA is active. A new email stays pending until verified.
- `POST /user/profile/verify-otp`: `{"email":"new@example.com","code":"123456"}`; on success confirms the address and revokes other sessions.

### Session management

`GET /auth/sessions` returns active session records with `id`, `current`, `user_agent`, `ip`, `created_at`, and `expires_at`. It never returns session tokens. Revoke endpoints return `{"ok":true}` and, for bulk revocation, `revoked_count`. Revoking the current session clears cookies. Sessions expire after 30 minutes of inactivity by default (`SESSION_IDLE_TTL_MINUTES`) and always expire after 12 hours (`SESSION_TTL_HOURS`). Successful authenticated responses refresh the idle deadline, capped at the absolute expiry.

## Learning endpoints

### Subjects

- `GET /subjects`: JSON array with `id`, `name`, `short_desc`, `icon_name`, `topic_count`, `question_count`.
- `GET /subjects/{subject_id}`: same subject fields plus `topics`.
- `GET /subjects/{subject_id}/topics`: array of `id`, `name`, `question_count`.
- Unknown subject IDs return 404.

### Test attempts

`POST /tests` accepts `{"subject_id":"math","topic_id":"m1","question_count":20}`; `topic_id` and `question_count` are optional and count is bounded 1–20. It creates an attempt for the authenticated user and returns `attempt_id` and questions. Live-attempt questions omit correct answers and explanations.

`POST /tests/{attempt_id}/submit` accepts `{"answers":{"1":"A","2":null}}`. Answers are mapped to questions in that attempt. A second submission returns 409 `already_submitted`. Non-owner access returns 403; a missing attempt returns 404. Correct answers and explanations are returned only after submission.

`GET /tests/{attempt_id}` returns the submitted result to its owner; unfinished or missing attempts return 404, non-owner access returns 403.

### Progress and practice

- `GET /me/attempts?page=1&per_page=10`: submitted attempts only; page minimum 1, page size clamped to 1–100 (defaults 1 and 10).
- `GET /me/progress`: subject aggregates, weak topics, up to ten recent saved mistakes, and progress chart. New users receive empty activity arrays and zero progress.
- `GET /practice/cards`: cards for weak topics (<70% accuracy); new users receive an empty array.

### Leaderboard

`GET /leaderboard?subject_id=math&page=1&per_page=20` returns `entries`, `page`, `per_page`, `total`, and `me`. It ranks submitted attempts by total score, exact accuracy ratio, earliest activity, then user ID. Page is clamped to at least 1; page size defaults to 20 and clamps to 1–50. Unknown subject returns 404. The optional `me` row is the caller's global rank for that filter, including when outside the current page. No email is exposed.

## Operational endpoints

- `GET /health` executes `SELECT 1` and pings Redis when the shared limiter is configured. HTTP 200 returns `{"status":"ok","db":"ok"}` and adds `"redis":"ok"` when Redis is in use. HTTP 503 returns only `{"status":"not_ready"}`. The API logs the failing dependency and request ID for operators.
- `GET /health/live` is the liveness probe; it returns `{"status":"ok"}` with HTTP 200 without querying dependencies.
- `GET /captcha/generate` returns an image data URI and challenge key for legacy image CAPTCHA. The process-local store expires challenges after five minutes and holds at most 1,024 entries, evicting oldest entries at capacity. Login uses Turnstile when configured; the image challenge is not the login factor.
- `GET /` is a development/root convenience route outside the versioned API. Flask's `/static/*` route is framework-managed.

## Known contract and production gaps

1. Route-specific response schemas are not enforced uniformly; auth schemas reject unknown fields, while test schemas currently use Marshmallow `EXCLUDE`.
2. No real SMTP provider, TLS Redis endpoint, PostgreSQL server, staging deployment, or restore drill is configured in this workspace. Production configuration now requires a TLS PostgreSQL URL, but runtime/migration integration remains unverified here.
3. Trusting reverse-proxy client IPs is intentionally not enabled; production ingress must configure known proxy hops before IP-based abuse limits are considered effective.
4. Rate limits do not apply to every public read endpoint; expensive public query protection and caching need product-informed limits.
