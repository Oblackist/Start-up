# Career Arena — professional backend roadmap

**State:** Phase 0 complete; Phase 1 email lifecycle implemented; Phase 2 TOTP MFA implemented in code; production/staging validation continues.  
**Last reviewed:** 2026-11-14  
**Source of truth:** this roadmap plus the current code. This is a working plan, not a claim that production readiness has been achieved.

## Goal and release bar

Deliver a production-operable Career Arena service with secure account lifecycle, optional/required second-factor authentication policy, documented versioned APIs, durable abuse controls, operational visibility, backups, and repeatable deployment. A release is not production-ready until real email delivery, shared rate limiting, production database/HTTPS configuration, migration and restore procedures, and end-to-end acceptance are demonstrated in the target environment.

## Current-state audit (evidence from source)

- Flask API is versioned under `/api/v1`; models use SQLAlchemy; migrations exist. SQLite is currently the default database.
- Registration creates an unverified account and sends a six-digit OTP through the SMTP adapter. OTP is stored as a purpose-bound HMAC in `users.otp_hash`; resend rotates it. This environment has no real SMTP credentials, so production delivery is not yet verified. Production startup now requires valid SMTP settings.
- Email OTP verifies account ownership only. Optional TOTP MFA is implemented separately for login, including encrypted secrets, one-time challenges, replay protection, and recovery codes. Administrator-enforced MFA policy is not needed until privileged roles exist.
- Login, logout, session restore, CSRF, password change, and reset-token flows exist. Reset tokens are hashed in the DB and sent through SMTP when configured; no raw OTP or reset token is logged.
- Session cookies are opaque, HttpOnly, and server-side revocable. Session inventory and targeted/all-session revocation are implemented; password changes rotate the current session and revoke others; password reset invalidates all sessions.
- Development/tests use a process-local memory limiter. Production config now requires TLS Redis with an atomic shared fixed-window backend. Client IP still comes from `request.remote_addr`; reverse-proxy trust must be configured deliberately before deployment.
- Security headers, input schemas, audit logging, ownership checks, Turnstile hook, and a backend test suite are present. Their production configuration and complete route coverage still need verification.
- Documentation is being reconciled with the SMTP adapter and OTP hashing; remaining production blockers are recorded below.

## Ordered work plan

### Phase 0 — baseline and architecture (complete)

- [x] Inspect auth service/routes, user/session/reset models, configuration, rate limiter, middleware, migration inventory, and current security/status docs.
- [x] Record actual status and production blockers here; distinguish email verification from MFA.
- [x] Build an initial route-by-route inventory and record security coverage mismatches.
- [x] Review auth test coverage against registration and session behavior; reconcile the existing test helper and auth cases with email OTP.
- [x] Review the auth schema migration chain and add a fresh-database migration regression test.
- [x] Review remaining security requirements coverage before Phase 1 provider implementation.

**Exit evidence:** route inventory and risk list committed to this roadmap; no feature is called complete based only on UI.

#### Route inventory snapshot

| Route group | Current routes | Access/control observed | Follow-up |
| --- | --- | --- | --- |
| Auth | register, verify-otp, login, logout, me, csrf, change-password, password-reset request/confirm, MFA challenge/enrollment/disable/recovery rotation, session inventory/revoke | CSRF protects state-changing routes; auth/reset/profile verification/session mutation routes have per-process throttles; OPTIONS preflight bypasses throttles | Make limiter shared across workers; review logout CSRF and trusted-proxy policy |
| User | profile update, profile email verify-otp | Session + CSRF; strict schema; current password and fresh TOTP when enabled; email OTP; revokes other sessions after email change | Verify real mail delivery; retain authorization and re-auth regression coverage |
| Tests | create, submit, get result | Create/submit require CSRF; service enforces ownership for attempts | Confirm owner-check and MFA gate coverage after MFA implementation |
| User data | attempts, progress, practice cards | Session checked and queries scoped to current user | Keep authorization regression coverage on each new resource |
| Public content | subjects list/detail/topics | Public GET; SQLAlchemy queries | Add response caching policy only after product/content freshness is defined |
| Leaderboard | list/filter/page | Public GET, bounded page size; exposes public name and aggregate stats | Decide public profile consent/display-name policy and abuse controls |
| Captcha | captcha image generate; Turnstile server validation on login | Local image generation now has an IP limit and generic error response; the route logs exception type only | Consider retiring legacy image captcha; document Turnstile as authoritative |
| Health | health, health/live | Public DB readiness + dependency-free liveness | Add metrics/alerting and verify through deployment probes |

#### Initial risk register

1. **P0 release blocker:** real SMTP credentials and staging delivery have not been configured or verified; hold production signup until verified.
2. **P1 credential handling:** addressed in code: verification OTP uses a purpose-bound keyed HMAC, reset challenges are hashed, and raw secrets are no longer logged. Retain regression coverage.
3. **P1 missing MFA:** addressed in code with opt-in TOTP, recovery codes, replay defense, and MFA-gated login; staging/key-management validation remains.
4. **P1 abuse controls:** shared Redis limiter is implemented; staging must prove cross-worker behavior and trusted proxy IP handling remains to be configured.
5. **P1 API mismatch:** registration now returns `requires_verification` and no session cookies until OTP verification. Reconcile and keep API contract tests as routes evolve.
6. **P1 error leakage:** addressed in code: local captcha image endpoint errors are sanitized and rate-limited; retain regression coverage.
7. **P2 deployment gap:** SQLite is default and deployment notes describe a multi-worker Gunicorn command despite process-local limiter; production must use a shared limiter and managed database or restrict worker topology.
8. **P2 validation/ops:** profile writes now use strict schemas; readiness now returns only a generic unavailable status on DB failure; restore and structured secret-redacted logs need release evidence.
9. **P1 email lifecycle:** SMTP integration, reset UI, and reset/profile challenge limits are implemented; production provider credentials/delivery are not yet validated.

### Phase 1 — account lifecycle and email delivery

- [x] Add SMTP service with SSL/STARTTLS, timeout, paired credential validation, generic delivery errors, and test outbox.
- [x] Store verification challenges as purpose-bound HMACs; enforce expiry, one-time use, resend rotation, and generic existence-safe responses.
- [x] Implement verification/resend endpoints and remove OTP/reset secrets from logs; add local mail-sink setup.
- [x] Deliver password-reset email using hashed, single-use, expiring tokens; revoke sessions after reset and keep requests generic.
- [x] Deliver email-change verification to the new address.
- [x] Add migration that removes old plaintext OTP column and clears outstanding legacy challenges.
- [x] Make the OTP migration repair legacy revision-67 databases missing `pending_email` and cover that upgrade path without deleting users.
- [ ] Configure real provider credentials and verify registration/reset/email-change delivery in staging.
- [x] Add rate limits to password-reset confirmation, profile update, and profile email challenge routes; implement password-reset request/confirm UI and emailed deep link.

**Exit evidence:** registration, verify, resend, reset, and change-email flows work through the real configured provider in staging; challenge replay/expiry/abuse behavior is covered; no raw secret appears in logs.

### Phase 2 — sign-in, MFA, and session controls (in progress)

- [x] Preserve email verification as mailbox ownership; implement opt-in authenticator TOTP as a distinct factor.
- [x] Implement re-authenticated encrypted TOTP enrollment/confirmation, MFA-gated login, five-minute one-use challenges, replay protection, and one-time hashed recovery codes.
- [x] Add rate-limited MFA challenges, current-password + fresh TOTP disable, and session invalidation/rotation on enable and disable.
- [x] Add recovery-code rotation and session inventory/revoke-current/revoke-other/all endpoints and UI; cover ownership, CSRF, and replay handling.
- [x] Define absolute session expiry (12 hours by default).
- [x] Revoke other sessions after password and verified-email changes; profile edits require current password, plus fresh TOTP when MFA is enabled.
- [x] Add 30-minute sliding idle expiry, capped by the 12-hour absolute lifetime; migrate existing sessions without extending their prior deadline.
- [ ] Validate MFA end-to-end with the actual authenticator apps and production key management in staging.

**Exit evidence:** end-to-end MFA enrollment/login/recovery/disable and session revocation behave correctly, including replay, lost-device, and rate-limit cases.

### Phase 3 — API and data-layer production readiness

- [x] Publish a human-readable endpoint inventory with observed request/response behavior, status/error conventions, pagination, auth/CSRF requirements, and default rate limits in `docs/API.md`.
- [x] Generate and validate an OpenAPI 3.1 document against the actual routes; define compatibility/deprecation policy and keep it in sync automatically with a pinned spec validator and live-route drift test.
- Validate schemas on every write; review object-level authorization for every resource; add transactional boundaries and database constraints for invariants.
- [x] Require a TLS PostgreSQL URL in production; reject missing/SQLite/cleartext URLs and normalize supported URLs to the pinned psycopg 3 SQLAlchemy driver. SQLite remains the local/test default.
- [ ] Run Alembic migrations, seed, auth/test flows, pooling limits, backups, restore drills, and retention against a real PostgreSQL staging service.
- [x] Separate liveness from DB readiness; readiness returns sanitized HTTP 503 when DB is unavailable. Request IDs are echoed and errors carry the same ID; logs omit secret values.
- [x] Emit privacy-conscious JSON application and HTTP request logs with request IDs, route templates, status codes, and durations; omit raw paths, query strings, bodies, IPs, and user agents, redact email/credential patterns, and verify the output with regression tests.
- [ ] Add health/availability metrics, dashboards, retention policy, and alerts for auth abuse, email delivery, database health, latency, and backup completion.
- Define data minimization, retention/deletion, export, and audit-log access rules for account data.

**Exit evidence:** documented API contract matches routes, migration from a clean DB and a representative existing DB succeeds, authorization cases are covered, restore is demonstrated.

### Phase 4 — abuse, attack defense, and operational security

- [x] Add an atomic Redis fixed-window backend shared across workers; production requires a TLS URL, startup ping, and fail-closed behavior. Add IP/account/endpoint buckets and keep proxy IP trust disabled until known hops are configured.
- [ ] Validate Redis-backed rate limits across multiple workers and outage behavior in staging.
- Review CORS, CSRF, cookie flags, CSP, HTTPS/HSTS, request limits, dependency pins, error behavior, SQL access, XSS surfaces, SSRF/file upload risks (if introduced), and secret handling.
- Keep CAPTCHA adaptive and server-verified; never trust client-side claims. Add alerting for credential stuffing, OTP abuse, unusual reset bursts, and provider failures without logging secrets.
- Establish secret-manager use and rotation procedures; production must fail startup for missing mail, database, origin, key, and shared-limiter configuration.
- Define incident response, security contact, audit log retention, backup encryption, least-privilege service/database credentials, and dependency update cadence.

**Exit evidence:** threat-to-control matrix updated; shared limiter works across instances; security configuration is validated in staging; no unresolved high-severity findings.

### Phase 5 — quality gates, release, and deployment

- Run existing backend tests and add targeted tests only alongside the relevant implementation; add frontend auth-flow coverage and API integration coverage.
- [x] Add GitHub Actions jobs for backend tests, clean PostgreSQL offline migration SQL, frontend typecheck/build, and Python/npm dependency audits using read-only workflow permissions.
- [x] Add weekly Dependabot updates for pip, npm, and GitHub Actions; group only minor/patch changes.
- [ ] Run the workflow on the actual GitHub repository, enable branch protection, resolve audit findings, and add staging smoke tests.
- [x] Define the Compose runtime with a private Gunicorn API, Caddy HTTPS/static hosting, separate migration step and release runbook in `docs/DEPLOYMENT.md`.
- [ ] Build the release images and validate the Caddy/Compose configuration with Docker. CI steps are authored and await an actual run.
- Add metrics and alerts for availability, latency, auth failures, rate-limit events, email delivery, DB health, and backup completion.
- Perform staging acceptance, rollback rehearsal, backup restore drill, then deploy with a documented rollback and post-deploy verification checklist.

**Exit evidence:** release checklist signed off by actual staging/prod outputs; rollback and restore demonstrated; public site and API reachable over HTTPS.

## Decisions to preserve

- Email confirmation and MFA are separate controls.
- TOTP is the planned second factor; recovery codes are mandatory if MFA is enabled. Exact enforcement policy can be refined before Phase 2 implementation.
- Production rate limits must use shared Redis across workers/instances; memory backend is development/test-only.
- Development may use a local mail sink, never raw secrets in logs. Production account registration/reset stays unavailable until the real delivery provider is configured and verified.
- Do not represent the site as deployed or production-ready until a real target environment and its secrets/provider configuration have been verified.

## Progress log

### 2026-11-14 — Phase 0 source audit

- Inspected `backend/app/routes/auth.py`, `services/auth_service.py`, `models/user.py`, `security/rate_limit.py`, `middleware/security.py`, `config.py`, schemas, migration inventory, and security/setup/status docs.
- Confirmed the current “OTP” is email verification, not login MFA; OTP is stored in plaintext. Confirmed production registration is intentionally unavailable and reset delivery is not configured. Confirmed limiter is process-local.
- Built an initial route inventory and risk register; found missing rate limits, a CSRF gap on logout, raw captcha errors, and API documentation that does not match registration behavior.
- Added captcha-generation rate limiting (10/IP/15 min by default), replaced raw exception printing/response with sanitized internal error handling, and added focused regression checks.
- Reconciled tests to pending registration: tests now confirm OTP before authenticating; tests no longer extract reset secrets from logs; registration accepts custom email domains and frontend validation matches. Added explicit OTP session issuance/replay coverage.
- Added a fresh database migration test; it confirms revision `67d0ed4b11c2` creates all current user OTP fields. Installed test/runtime dependencies in a local backend virtual environment.
- The migration test first exposed Alembic `fileConfig()` disabling the shared Flask logger. Updated Alembic logging to preserve existing loggers and changed unhandled 500 logging to record request id + exception class without traceback or exception text. Added regression coverage for both behaviors.
- Added JSON-formatted application and HTTP access events with correlation IDs, route templates, status and request duration. Log formatting uses a field allowlist, omits raw request data, redacts email and credential patterns, and is covered by regression tests. Metrics, retention and alerts remain open.
- Added an SMTP service with STARTTLS/SSL, timeout, paired credential validation, sanitized failures, and an in-memory testing outbox. Added ProductionConfig checks for SMTP delivery settings.
- Registration, verification resend, email-change verification, and password-reset delivery now use the email service. Verification codes are purpose-bound HMACs; the migration removes legacy plaintext OTPs and clears pending challenges. No verification or reset token is logged.
- Added resend throttling and UI feedback; local verification codes are available through Mailpit rather than terminal logs. Documentation updated with local and production SMTP setup.
- Added RFC 6238 TOTP generation/verification, AES-256-GCM secret encryption, database migration for MFA/challenges/recovery codes, five-attempt challenge lockout, one-time challenge/recovery use, session-gated enrollment/disable, and login UI challenge handling. Profile settings now support enrollment and disable with one-time recovery code display.
- Production config now requires a separate 32-byte base64 `MFA_ENCRYPTION_KEY`. A regression test exposed that `.env` values were loaded after config classes had captured environment values; `create_app` now reapplies supported env settings after dotenv loads, fixing SMTP and MFA runtime config.
- Fixed the legacy OTP migration failure when a database marked at revision 67 lacks `pending_email`; the migration restores the nullable column, invalidates pending OTPs, and drops plaintext OTP storage. Added a regression test that upgrades a database containing a user through this exact schema variant.
- Recovery-code rotation uses current password and a fresh TOTP with atomic replay checks; old codes are invalidated immediately. MFA setup consumes its confirmation counter too, preventing reuse just after enrollment.
- Added a session-management API/UI for revoking one, current, other, or all sessions. Session inventory is user-scoped and does not expose token material; absolute lifetime defaults to 12 hours.
- Profile changes now require the current password and, when MFA is enabled, an unused TOTP. Verified email changes and password changes revoke other sessions; password changes rotate the current session. Added regressions for re-authentication and the revocation behavior.
- Added atomic Redis rate limiting, hashed bucket identities, startup ping, TLS-only production config, and generic fail-closed 503 behavior. Development/tests remain in-memory. Live Redis cross-worker testing remains a staging gate.
- Added `docs/API.md` after inspecting the Flask URL map and route/schema/service code; it records 35 versioned API routes and documents current controls plus known health, schema, proxy, and staging gaps.
- Split health semantics: `/api/v1/health/live` is a dependency-free liveness check; `/api/v1/health` is readiness and returns a sanitized 503 when the DB probe fails. Three regression tests cover healthy readiness, DB failure, and liveness independence.
- Made production database selection fail closed: `ProductionConfig` now requires PostgreSQL with `sslmode=require|verify-ca|verify-full`; accepted postgres URL aliases normalize to `postgresql+psycopg://`. Added a pinned psycopg 3 binary driver and production URL tests.
- Offline Alembic SQL generation now works for a clean full PostgreSQL migration chain. Two legacy repair migrations use deterministic operations only in offline mode; online mode still inspects actual columns to preserve existing/partial database state. A real PostgreSQL endpoint is not present, so online staging migration remains required.
- Removed raw unsupported `DATABASE_URL` content from startup warnings after a regression test demonstrated credential leakage. Test verifies a password-like URL component never reaches captured logs.
- Current full suite: **249 tests pass**; frontend build includes password-reset, MFA recovery-code rotation, session management, and re-authenticated profile settings.
- Added server-enforced 30-minute sliding session idle expiry with a 12-hour absolute cap, atomic monotonic refresh for concurrent requests, configurable `SESSION_IDLE_TTL_MINUTES`, and a migration that preserves current sessions' existing absolute deadlines. Regression coverage verifies activity refresh, absolute cap, migration backfill, and offline PostgreSQL SQL generation.
- Added `docs/openapi.json` and `backend/scripts/generate_openapi.py` for all 35 live API operations, with documented cookie/CSRF security, request schemas, key response schemas, and v1 compatibility/deprecation policy. Pinned `openapi-spec-validator==0.9.0` in test dependencies; a contract test validates OAS 3.1, checks exact live path/method and path-parameter parity, security classifications, and generated-file sync.
- Added `.github/workflows/ci.yml` with backend tests, offline PostgreSQL migration rendering, frontend build, OpenAPI contract validation, `pip-audit`, and `npm audit`; it grants only `contents: read`. The Python audit covers runtime and dev requirement files. Added weekly minor/patch Dependabot updates. No connected GitHub repository is available to execute the hosted workflow. In an isolated clean copy, `npm ci` and `npm run build` both passed; the existing Windows install tree initially refused a locked binary unlink, was repaired from the clean copy, and its build then passed too. `npm audit --omit=dev --audit-level=high` reported zero vulnerabilities. Python `pip-audit==2.10.1` is configured in CI; local vulnerability service lookup has stalled on two attempts. The package lockfile was unchanged.
- Fresh OpenAPI contract review corrected mismatches in TOTP enrollment visibility, password letter+digit rules, and profile update requirements. Follow-up made every nested `ProgressDashboard` item schema exact and strict: field names, types, nullability, required properties, and rejection of unknown fields are regression-tested. Full backend suite passes.
- Remaining: configure real SMTP and TLS Redis and verify both in staging; finish account/API hardening and production deploy/restore evidence. No live providers or production target are configured in this workspace.

### 2026-11-14 — Release preflight

- Added Dockerfiles, one public Caddy HTTPS edge, a private Gunicorn API, a separate database migration step, and a CI job to build both images. The [deployment runbook](docs/DEPLOYMENT.md) records staging, rollback and restore checks.
- Corrected the OpenAPI subject and topic identifiers from integers to strings. Empty and populated dashboard responses are now checked against the published schema.
- Scoped SQLite connection initialization to the app's SQLite engine to keep SQLite SQL away from PostgreSQL connections. Moved the browser theme initializer to a static script so it runs under the edge's Content Security Policy.
- Verified locally: 250 backend tests passed, the frontend production bundle built, and Compose and CI YAML parsed. Docker image builds, Caddy runtime validation, external providers and public HTTPS still need a Linux runner or staging host.
- Corrected the Caddy CI commands and added a PostgreSQL 17 release job that applies real online migrations, seeds data, registers and verifies a test account, enrolls TOTP and submits an exam. The job uses `pg_dump` and `pg_restore` with different databases and checks revision, MFA sign-in and exam history after restore. The verifier passed locally against a separate restored SQLite fixture. The PostgreSQL job and staging backup/restore remain unverified.
- Readiness now pings the shared Redis limiter and returns sanitized 503 when PostgreSQL or Redis is unavailable. Added a release probe for HTTPS, HSTS, frontend SPA routes, API errors, PostgreSQL readiness, and Redis readiness. Its success and dependency failure behavior are covered by automated tests. Expanded edge CSP to permit Turnstile connections.
- Verified the current backend suite has 254 passing tests. Public HTTPS staging, Redis/SMTP provider delivery, Caddy container validation, and PostgreSQL restore CI still need a Linux runner and configured environment.
- Tightened production `FRONTEND_ORIGIN` validation after tests showed HTTP, empty hosts, URL paths/queries, credentials, and invalid ports could pass. The validator now accepts one HTTPS origin only. Full backend suite passes with **263 tests**.
- Extended origin validation for invalid DNS/IP host syntax, whitespace, port zero, and explicit default HTTPS port. The final suite passes with **266 tests**.
- Added privacy-conscious JSON app and HTTP request logs with request IDs, route templates, status codes, and durations; raw request content and network identifiers are omitted, and common email/credential patterns are redacted. All **268 backend tests pass**. Updated the package and deployment notes; metrics/alerts, Docker/Linux CI, PostgreSQL restore, external providers, staging, and deploy remain open.

### 2026-11-14 — Security findings remediated

- Implemented fixes for all five findings from the source review: account-scoped OTP/resend budgets plus IP limits; an IP-wide registration budget; transactional MFA attempt/proof consumption; bounded expiring legacy CAPTCHA storage; and account-wide reset-link/pending-MFA revocation after password reset.
- Eight initial regression failures reproduced the gaps. After the fixes, the full backend suite passed with **280 tests**, including 12 new audit regression cases and eight-client concurrent MFA checks. See [the follow-up record](docs/SECURITY_FOLLOWUP.md) for scope and limitations.
- No database migration is required for this pass. Concurrency behavior has local SQLite evidence; PostgreSQL and cross-worker Redis acceptance remain required.
- Local browser startup remains unproven: server tool sessions print listen addresses, but independent HTTP requests to `127.0.0.1:5000` and `127.0.0.1:5173` fail. Background process approval and desktop PowerShell launch are restricted in the agent environment. Do not repeat startup claims based only on logs or cached browser content. The frontend README's incorrect port 5000 was corrected to 5173.
- Next required external inputs: hosting/server and domain selection, staging PostgreSQL/Redis/SMTP configuration, and a repository/runner to execute the authored release gates. Continue with staging acceptance, migration/restore, real email/MFA browser flows, monitoring, and deployment once those are available. The overall goal remains active.
- Owner confirmed there is no existing server. Select hosting and obtain the required service accounts before live deployment; local startup requires no hosting purchase. The frontend production build also passed after this security pass.
