# Changelog

## 2026-11-14 — Operational logging follow-up

- Added JSON application and HTTP request logs with UTC timestamps, request IDs,
  route templates, status codes, and request durations.
- Kept raw URL/path, query, request body, IP address, and user-agent out of
  access logs; common email and credential patterns are redacted. Added tests
  for structured fields and redaction.
- Full backend suite: **268 tests passed**. Updated the deployment notes and
  production roadmap; metrics, log retention, dashboards, alerts, and real
  staging/deployment validation remain open.

## [Unreleased] — Audit, bug-fix & optimization pass

Applied the master-prompt audit to the existing `startup-fullstack` project.
Root-cause fixes only — no redesign, no architectural changes, no new
dependencies. All changes verified by tests + browser checks.

### Fixed

#### Registration failure (critical)
- **Root cause:** `DevConfig` provided no `PASSWORD_PEPPER` default and
  performed no pepper validation (only `ProductionConfig` validates). A
  developer who started the backend without copying `.env` (or with an empty
  `PASSWORD_PEPPER`) got a server that booted cleanly but **500ed on every
  register/login** inside `_apply_pepper()` with
  `RuntimeError: PASSWORD_PEPPER is not configured`.
- **Fix (root cause, not a patch):**
  - `app/config.py` — `DevConfig` now ships a non-empty default pepper.
  - `app/__init__.py` — `create_app()` re-resolves `PASSWORD_PEPPER` from the
    environment **after** `load_dotenv()` (class attributes are evaluated at
    import time, before `.env` is loaded, so a real pepper in `.env` would
    otherwise be ignored). Falls back to the dev default when `.env` is
    missing. Production still refuses to boot without a strong pepper.
  - `app/security/password.py` — `_pepper()` now reads from
    `current_app.config` (call-time, honors `.env` + the dev default) and
    only falls back to the raw env var outside an app context.
  - The dev default pepper string is added to `_PLACEHOLDER_VALUES` so
    `ProductionConfig.validate()` can never accidentally ship it.
- **Regression tests:** `backend/tests/test_dev_pepper_default.py` (8 tests)
  cover: dev default non-empty; env override honored; dev default rejected in
  production; empty pepper rejected in production; `hash_password` works in
  dev without env; `POST /auth/register` returns 201 with session + csrf
  cookies even with no `.env`; duplicate email returns 409 (not 500).
- **Verified end-to-end:** `curl POST /auth/register` → 201; login → 200;
  duplicate → 409; DB row stores an `$argon2id$…` hash (not plaintext).
- Full backend suite: **117 passed** (109 original + 8 new).

#### Dark / light mode inconsistency (critical)
- **Root cause:** `frontend/src/index.css` had no `@custom-variant dark`. In
  Tailwind CSS v4, `dark:` utilities default to the OS
  `prefers-color-scheme` media query, **not** the `.dark` class the toggle
  sets. Result: the toggle only flipped the `body` background (via the
  literal `.dark body` rule) while every component's `dark:` utilities
  followed the OS preference → mismatched cards/inputs/text on top of a dark
  page (the visual "overlap"/inconsistency users reported).
- **Fix:**
  - `frontend/src/index.css` — added
    `@custom-variant dark (&:where(.dark, .dark *));` so **all** `dark:`
    utilities respond to the `.dark` class, consistent with the base `body`
    rule and the toggle.
  - `frontend/src/App.tsx` — theme state now initializes from
    `localStorage('ca-theme')` → OS `prefers-color-scheme` (matching the
    no-flash script). The toggle persists the **explicit** user choice only
    (not on mount), so an unchosen theme keeps following the OS preference.
    An OS-preference listener updates the theme when no explicit choice
    exists. `localStorage` access is wrapped in `try/catch` for
    private-mode / disabled storage.
  - `frontend/index.html` — added a synchronous inline script in `<head>`
    that applies the saved/system theme to `<html>` **before** React mounts
    (no flash of the wrong theme). Also added `theme-color` metas.
- **Verified via Agent Browser:** toggle on → `<html.dark>` + body
  `rgb(7,13,24)` + stored `dark`; refresh → persists; toggle back → light;
  header `dark:` utility bg is dark in dark mode (confirms the custom-variant
  applies to component utilities, not just the body).

#### Unfinished buttons
- `DashboardScreen` — the "Tənzimləmələr" (Settings) sidebar button used
  `alert('Tənzimləmələr bölməsi')` as a placeholder. Converted to a clearly
  labeled, `aria-disabled`, `cursor-not-allowed` "Tezliklə" item with a
  tooltip (consistent with the "Interview Arena" planned-module treatment).
- `LandingScreen` — the "Əlaqə" contact button used `alert(...)`. Converted
  to a real `mailto:partner@careerarena.az` link.

### Audited & left unchanged (intentional)
- **Responsive layout (1920×1200):** verified no horizontal overflow on the
  landing, login, register, and subjects screens at 1920×1200 and 1366×768
  (`scrollWidth === clientWidth`). The Navbar's right-side cluster already
  uses `shrink-0` + responsive `hidden sm:/xl:` toggles; `<pre>` blocks
  scroll internally via `min-w-0 w-full overflow-x-auto`. No CSS patches
  were needed beyond the existing structure.
- **API contract, DB schema, security controls, migrations, seed:** no
  changes — they were already correct (the registration bug was a config
  gap, not an API/DB defect).

### Documentation
- Added `IMPLEMENTATION_STATUS.md` — the actual state of every feature and
  every intentionally-labeled "Tezliklə" control.
- Updated `README.md` test counts (117 backend tests; 8 new regression).
- Updated `docs/SETUP.md` note: dev now works without copying `.env` (the
  pepper default covers it), but copying `.env.example` is still recommended.

### Test results (this pass)
| Suite | Command | Result |
| --- | --- | --- |
| Backend (pytest) | `python -m pytest -q` | **117 passed** |
| Frontend (build) | `bun run build` (`tsc --noEmit && vite build`) | **green** (1677 modules) |
| Register e2e (curl) | `POST /api/v1/auth/register` | **201** + session/csrf cookies |
| Login e2e (curl) | `POST /api/v1/auth/login` | **200** |
| Duplicate register (curl) | same email twice | **409** (not 500) |
| Dark mode toggle (browser) | Agent Browser | toggle/persist/refresh all ✓ |
| Responsive (browser) | 320 / 375 / 1366 / 1920 | no overflow at any width |

---

## [Unreleased] — Audit pass 3 (screenshot-reported bugs + captcha + leaderboard)

### Fixed

#### Registration "unexpected error" — the REAL user-facing root cause
- **Symptom (user screenshot):** "Qeydiyyat zamanı gözlənilməz xəta baş verdi."
- **Root cause 1 (frontend):** `src/lib/api.ts` threw the *return value* of
  `wrapUnknownError()` — a **plain object**, not an `ApiErrorClass` instance —
  whenever `fetch` itself failed (backend down / CORS / network). The UI's
  `err instanceof ApiErrorClass` check then fell to the generic catch-all,
  masking the real cause ("Backend-ə qoşulmaq mümkün olmadı") behind
  "gözlənilməz xəta". **Fix:** always rethrow as `new ApiErrorClass(...)`;
  the network message is now actionable (tells the user to start the
  backend on port 5000), and the register screen renders a concrete
  self-diagnosis checklist under that message.
- **Root cause 2 (backend, this environment):** the sandbox sets a foreign
  `DATABASE_URL=file:...` (the Next.js/Prisma scaffold's database). The Flask
  config trusted any `DATABASE_URL`, and SQLAlchemy cannot parse `file:` URLs
  → **the app crashed at boot** with "Could not parse SQLAlchemy URL", so the
  backend was simply never reachable. **Fix:** the app now reads
  `FLASK_DATABASE_URL` first, then `DATABASE_URL`, **validates the scheme**,
  ignores foreign values with a clear startup warning, and honors a valid
  `.env` value. Verified: the app boots cleanly with the hostile value present.
- **Root cause 3 (found during the fix, data-loss class):** an earlier
  refactor re-resolved the DB URL for ALL `create_app` calls, including tests
  that pass explicit temp-DB URIs — pointing the whole suite at the real
  `instance/app.db`, whose tables were then dropped by test teardown
  (leaving only Alembic's `alembic_version`). **Fix:** env re-resolution now
  happens ONLY for env-driven boots; explicit config objects (tests) are
  respected verbatim. Verified: `md5sum instance/app.db` is unchanged across
  the full suite run (hermetic ✓).
- **Verified in the browser with the user's exact input** (Ülvi Əliyev /
  ulvialiyev112@gmail.com / strong password): registration succeeds
  (`error: null`), the user lands on the dashboard, and the row exists in
  SQLite with an `$argon2id$` hash.

#### Navbar overlap (user screenshot)
- **Root cause:** the labeled 6-button screen-switcher (~460px) + the full
  nav link row + the action cluster needed ~1390px, but only ~1230px exists
  at 1280–1439 → "İnkişaf paneli" was overlapped/cut.
- **Fix:** the switcher is now a **compact numbered strip visible only at
  2xl (≥1536px)** (~210px, tooltips included); nav links are tiered
  (core at lg+, landing anchors at xl+, the "Tezliklə" pill at 2xl+); the
  design-system toggle moved to 2xl+; a "Reytinq" (leaderboard) link was
  added. **Verified no horizontal overflow at 1280 / 1366 / 1440 / 1920**
  (`scrollWidth === clientWidth` on the real rendered app).

#### Protected navigation (Fənnlər/Sınaq/Məşq bouncing to login)
- Anonymous clicks on protected screens now **preserve the intended
  destination**; after login/register the user is returned to that screen
  (verified: anonymous → Fənnlər → login → lands on Subjects).
- During the boot session-restore window the click is no longer bounced to
  login; the protected-screen gate decides after the session is known.
  No redirect loops.

### Added

#### Cloudflare Turnstile CAPTCHA on login (real integration, fail-closed)
- Backend: `TURNSTILE_SECRET_KEY` gates the flow — token verified server-side
  via the official siteverify API (stdlib `urllib`, 10s timeout) BEFORE
  credential checks; missing → 400 `captcha_required`; invalid → 400
  `captcha_invalid`; provider unreachable → **503 `captcha_unavailable`
  (login never allowed)**; audit events store the reason, never the token.
  No new dependencies.
- Frontend: widget rendered only when `VITE_TURNSTILE_SITE_KEY` is set;
  single-use token; widget resets after every failed login.
- When keys are not configured, login works without captcha — documented in
  `.env.example` + README (no fake verification anywhere).
- 22 new backend tests cover the enabled/disabled/invalid/unavailable paths.

#### Leaderboard — real database integration
- `GET /api/v1/leaderboard` (public, personalized): server-computed ranking
  over SUBMITTED test attempts only; deterministic tie-breaking (total score
  → accuracy → earliest activity → user id); **global 1-based ranks correct
  on every page**; optional subject filter; pagination (1..50, default 20);
  the current user's row at ANY rank via `me` (null when anonymous/no
  attempts); single aggregate query (no N+1); additive index migration;
  no private data returned.
- New `LeaderboardScreen`: top-3 podium (restrained gold/silver/bronze
  accents, crown on 1st), initials avatars with deterministic soft colors,
  accuracy-colored stats, the current user's row highlighted and pinned when
  outside the page window, skeleton loading, empty state with CTA, error
  state with retry, prev/next pagination, subject filter tabs — fully
  responsive and dark-mode consistent. Reached from the navbar ("Reytinq"),
  the mobile tab bar (5th tab, Trophy icon) and the dev switcher.

#### Request correlation IDs
- Every response echoes `X-Request-ID`; every JSON error body carries
  `request_id`; the 500 handler logs it server-side — user-reported failures
  are now correlatable with server logs.

### Quality
- `prefers-reduced-motion` respected globally (WCAG 2.2).
- Backend suite: **184 passed** (117 → +67 new: captcha 22, leaderboard 28,
  request-id 17). Hermetic re-verified (default DB untouched by tests).
- Frontend build green (`tsc --noEmit && vite build`, 1679 modules).
- Dark mode verified on the new leaderboard screen too (`rgb(7,13,24)`).
