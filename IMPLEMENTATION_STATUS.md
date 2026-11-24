# Implementation Status

Actual state of the `startup-fullstack` project after the audit & fix pass
(see `CHANGELOG.md` for what changed in this pass). This reflects what is
fully implemented, what is intentionally deferred, and what is labeled as a
planned feature — **not** a generic checklist.

## Latest evidence — 2026-11-14 security follow-up

The five findings from the repository security review have code fixes and regression coverage; see [the follow-up record](docs/SECURITY_FOLLOWUP.md). All 280 backend tests passed after these changes, including 12 new regression cases. Production readiness still requires public HTTPS, real SMTP delivery, shared Redis, PostgreSQL migration/restore, runtime containers, and hosted CI acceptance in the target environment. Local browser access is unresolved: server sessions reported startup, but independent requests to ports 5000 and 5173 could not connect. Startup logs are not proof of a working preview.

## Fully implemented & verified

| Area | Status | Notes |
| --- | --- | --- |
| Registration | ✅ Fixed & verified | `POST /api/v1/auth/register` returns 201; verified via curl + pytest + DB row (Argon2id hash). Was 500ing in dev without a pepper — fixed via `DevConfig` default + `create_app` re-resolution + `_pepper()` reading `current_app.config`. |
| Login | ✅ | 200 on success; 401 (no enumeration) on failure; 429 after 5 failed attempts. |
| Logout | ✅ | Server-side session invalidation; cookies cleared; idempotent. |
| Session persistence | ✅ | `GET /auth/me` on boot restores the session — refresh keeps you logged in. |
| CSRF (synchronizer token) | ✅ | `X-CSRF-Token` header checked on every state-changing endpoint; constant-time compare. |
| Password hashing | ✅ | Argon2id + unique salt + HMAC-SHA-256 pepper (versioned `v1:`). |
| Password reset | ✅ API + UI | Generic request response, hashed single-use token, emailed fragment link, reset screen, session revocation, and per-IP confirmation throttling. |
| Email verification | ✅ SMTP adapter | Five-minute OTP stored as purpose-bound HMAC; resend rotates code and returns a generic response. Configure SMTP or local Mailpit to receive messages. |
| TOTP 2FA | ✅ Backend + frontend | Optional authenticator enrollment, AES-256-GCM secret storage, MFA-gated login, one-use five-minute challenge, TOTP replay defense including enrollment confirmation, recovery-code rotation, password+TOTP disable, and session rotation. Production requires `MFA_ENCRYPTION_KEY`. |
| Session management | ✅ Backend + frontend | User-scoped session inventory; revoke one, current, other, or all sessions; current-session cookie clearing; 30-minute sliding idle expiry capped by a 12-hour absolute lifetime. |
| Profile security | ✅ Backend + frontend | Strict profile schema; current password for changes and fresh TOTP when MFA is on; verified email changes revoke other sessions. Password changes rotate the current session and revoke other sessions. |
| Subjects / topics / questions API | ✅ | Public reads; seeded (3 subjects, 22 topics, 30 questions across the available catalog). |
| Test flow (start → submit → result) | ✅ | `POST /tests` → `POST /tests/<id>/submit` → `GET /tests/<id>`; double-submit 409; owner-checked. |
| Dashboard progress | ✅ | `GET /me/progress` aggregates real attempt data; honest empty state for new users. |
| Practice cards | ✅ | `GET /practice/cards` derived from weak topics; empty state for new users. |
| Leaderboard | ✅ Real DB integration | Server-computed ranking, global ranks, `me` row, podium UI, empty/loading/error states. |
| Login CAPTCHA | ✅ Turnstile (fail-closed) | Enabled iff `TURNSTILE_SECRET_KEY` set; server-side siteverify; no fake verification. Legacy image CAPTCHA generation is IP rate-limited and emits sanitized errors. |
| Dark mode | ✅ Fixed & verified | `@custom-variant dark` (class strategy) + localStorage persistence + OS-preference fallback + no-flash inline script. Verified: toggle works across body + cards + header; persists across refresh. |
| Light mode | ✅ | Same mechanism; no stale dark styles after switching. |
| Responsive (320–1920px) | ✅ Verified | No horizontal overflow at 320/375/1440/1920 (`scrollWidth === clientWidth`); `min-w-0` on flex/grid text children; `shrink-0` on nav actions; `<pre>` blocks scroll internally. |
| Security headers | ✅ | CSP, nosniff, referrer, `frame-ancestors 'none'`, HSTS prod-only, single-origin CORS w/ credentials. |
| Health probes | ✅ | `GET /api/v1/health/live` checks liveness without dependencies; `GET /api/v1/health` checks PostgreSQL and configured Redis, logs dependency and request ID on failure, and returns a sanitized 503. |
| Structured operational logs | ✅ | JSON app/request events include request ID, route template, HTTP status, and duration. Raw path, query, body, IP, and user-agent are excluded; email and credential patterns are redacted. Metrics, retention, dashboards, and alerts remain open. |
| Production configuration | ✅ Config + URL tests | Production startup requires TLS PostgreSQL, a single exact HTTPS frontend origin, valid secrets, TLS SMTP settings, and TLS Redis. Real provider and PostgreSQL acceptance still needs staging evidence. |
| Database URL log redaction | ✅ Regression-covered | Unsupported URL warnings no longer include URL contents or credentials. |
| Audit logging | ✅ | register/login success+fail/logout/password change/reset/rate-limit-hit; never logs passwords/raw tokens. |
| Backend tests | ✅ | 280 tests pass. Includes 12 audit regressions: IP/email rotation, stale MFA state, simultaneous TOTP/recovery submissions, attempt limits, reset-link revocation, and CAPTCHA expiry/capacity/input handling, plus the previous auth/API/configuration/logging coverage. |
| Release runtime | Authored; Linux verification pending | Docker Compose connects a public Caddy HTTPS edge to a private Gunicorn API. The CI job builds both images and checks the edge config when run. See `docs/DEPLOYMENT.md`. |
| Database restore drill | CI job authored; PostgreSQL run pending | Migrate and seed PostgreSQL, register and verify an account, enable TOTP and submit an exam, then dump and restore to a separate database. The verifier checks schema revision, MFA sign-in and exam history. The verifier passed against a local restored SQLite copy. |
| CI workflow | ✅ Authored; remote run pending | `.github/workflows/ci.yml` runs backend tests, PostgreSQL offline migration rendering, frontend build, OpenAPI validation, and runtime/dev Python plus production npm dependency audits with read-only token permissions. Clean-copy `npm ci` + `npm run build` passed locally; npm production dependency audit reports zero vulnerabilities. Local Python `pip-audit` vulnerability lookup stalls; no connected GitHub repository is available to verify a hosted run. |
| Dependency updates | ✅ Authored; remote run pending | Dependabot weekly minor/patch groups cover backend pip packages, frontend npm packages, and GitHub Actions. |
| API reference | ✅ Human + machine reviewed | `docs/API.md` catalogs 35 `/api/v1` routes; `docs/openapi.json` defines all 35 methods, security, path parameters, request schemas, response schemas (including strict nested progress-dashboard items), and v1 compatibility policy. Pinned OpenAPI 3.1 validator and pytest contract test detect schema errors and route drift. |

## Intentionally deferred / labeled "Tezliklə" (coming soon)

These are visible controls that are **clearly labeled** as planned and are
**non-interactive** (no dead buttons that do nothing):

| Control | Location | Current behavior | Reason incomplete | Required to complete |
| --- | --- | --- | --- | --- |
| **Tənzimləmələr** (Settings) sidebar item | `DashboardScreen` | `aria-disabled`, `cursor-not-allowed`, "Tezliklə" badge | Profile, password, MFA, and session controls now exist at `/profile`; a separate general-preferences page and notification settings do not. | Decide the remaining general preferences and notification scope; link the sidebar or build the dedicated settings page. |
| **Interview Arena** module pill | `Navbar` + `DashboardScreen` sidebar | `cursor-not-allowed select-none`, "Tezliklə" badge | A distinct future product module, not part of Exam Arena. | Product decision + separate backend module. |

## Environment / infrastructure limitations (disclosed honestly)

| Item | Limitation | Workaround / production path |
| --- | --- | --- |
| Production email | SMTP adapter exists, but no real provider credentials are configured in this environment. | Use Mailpit locally; configure a verified SMTP provider and prove delivery in staging. |
| MFA key management | Local development derives a non-production AES-GCM key from `SECRET_KEY`; production requires its own `MFA_ENCRYPTION_KEY`. | Generate and store a strong independent key in the deployment secret manager; define rotation/recovery procedures. |
| Session management | User-scoped session inventory/revocation UI, 30-minute sliding idle expiry, 12-hour absolute cap; password and verified-email changes revoke other sessions. | Complete staging validation of session expiry and revocation. |
| Rate limiting | Redis atomic fixed-window backend is implemented and required by production config; dev/tests retain memory limiter. | Connect a real TLS Redis service and verify cross-worker behavior in staging; configure trusted proxy hops deliberately. |
| Seed questions | Only the 20 math questions from the original `examData.ts` are seeded. Azerbaijani and English topics exist (counts 5/5) but have no seeded questions yet. | Add AZ/EN questions to `backend/scripts/seed.py` or via an admin tool. |
| Frontend unit tests | No vitest suite. The production build (`tsc --noEmit && vite build`) is the verified frontend acceptance criterion; the backend carries the comprehensive suite. | Add vitest + `@testing-library/react` + jsdom if desired. |

## Demo-only controls (not unfinished, but not "real" features)

| Control | Location | Why it's a demo |
| --- | --- | --- |
| Search input ("Açar söz daxil edin...") | `DesignSystemShowcase` | The Design System Gallery is a component showcase for developers; the input demonstrates the input styling + focus state. It is not a product search feature and is not connected to any search backend. |
| Theme / mobile-frame / design-system toggles in the Navbar | `Navbar` | Developer tooling (the mobile-frame simulator is a 390×844 preview). All functional, not user-facing product features. |

## No dead buttons

A full audit (`grep` for `onClick={() => {}}`, `alert(`, `TODO` across
`frontend/src`) found **two** placeholder handlers, both fixed in this pass:
- `DashboardScreen` Settings sidebar → converted to a labeled "Tezliklə" non-interactive item.
- `LandingScreen` "Əlaqə" contact button → converted from `alert()` to a real `mailto:partner@careerarena.az` link.

No clickable button in the final project performs no action.
