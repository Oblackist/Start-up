# Security review follow-up — 2026-11-14

The original source-only review reported three medium and two low severity findings. This record describes subsequent code changes; it does not alter the original report or claim a second full security scan.

| Finding | Change | Evidence |
| --- | --- | --- |
| Distributed registration OTP guessing | Registration verification now has a normalized-email budget independent of source IP, plus a separate IP budget. Resending also has independent email and IP budgets and does not clear verification attempts. Production uses the existing atomic shared Redis backend. | Five guesses from different IPs exhaust the account budget; the correct code from a sixth IP is rejected without issuing a session. |
| Concurrent MFA attempts/proof reuse | Serialize credential consumption on the user record, refresh stale state, reserve attempts with a conditional DB update, and atomically consume the TOTP counter or recovery code with challenge/session state in one transaction. Reset follows the same user-first lock order. | Stale consumed/locked/counter snapshots are rejected. Eight simultaneous TOTP or recovery submissions issue exactly one session; eight invalid submissions leave exactly five attempts and no session. |
| Rotating emails bypass registration limit | Registration is limited by source IP before password hashing, account insertion, or delivery. | With a limit of two, a third distinct address is rejected; only two accounts and two messages exist. |
| Unbounded legacy CAPTCHA store | Five-minute monotonic TTL, 1,024-entry cap with oldest-entry eviction, locked one-use consumption, and cryptographic random code generation. | Expired/evicted/reused keys fail; current keys succeed; non-ASCII input fails without throwing. |
| Sibling password reset links remain valid | A reset transaction invalidates every unused link and pending password-accepted MFA challenge for the account, alongside its sessions. Account locking and refreshed token state serialize competing confirmations. | Two different delivered links are created; after one succeeds, the other fails and pending MFA is revoked. |

## Verification

- Initial regression run: eight failures reproduced the reported gaps before fixes.
- After fixes: all 280 backend tests passed, including 12 new cases in `backend/tests/test_audit_regressions.py`.
- Command: from `backend`, `.venv/Scripts/python.exe -m pytest -q --tb=short --show-capture=no` (exit 0).
- Frontend acceptance: `npm.cmd run build` passed (TypeScript check and Vite production build, exit 0).
- Concurrency tests use independent Flask clients and database sessions against a temporary SQLite database. Repeat the concurrency checks against PostgreSQL in staging; no live PostgreSQL or Redis provider was available for this run.
- No schema migration or user database modification is needed for these fixes. No real email was sent by the regression suite.

## Remaining release evidence

Public HTTPS and browser acceptance, actual SMTP/Turnstile delivery, cross-worker Redis limits, PostgreSQL online migration and restore, container runtime, hosted CI/dependency audits, and operational metrics/alerts remain release gates in `DEPLOYMENT.md` and the roadmap.

The owner confirmed there is no existing server. Hosting/domain selection and service accounts must be established before staging and public deployment. A local preview does not require a hosting purchase.

Local startup is also unresolved in the agent execution environment: Flask and Vite sessions printed their listen URLs, but a separate HTTP client could not reach ports 5000/5173. A hidden background launch required unavailable sandbox approval, and the desktop PowerShell app was blocked by product policy. No firewall or security settings were changed. Use the root README's two-terminal startup steps on the host; do not report the preview as accessible until an independent browser request succeeds.
