# Production release implementation plan

The release uses Docker Compose on a Linux host, Caddy for public HTTPS and static frontend files, and Gunicorn for the private Flask API. PostgreSQL, Redis and SMTP are external TLS services. The production roadmap defines the release gates.

- [x] Author the frontend and backend Dockerfiles using existing dependency manifests and allowlist their build inputs.
- [x] Configure a single Caddy HTTPS origin and private Gunicorn API. Trust the direct Caddy hop only in the Compose entry point.
- [x] Document versioned builds, a separately executed migration, readiness checks, and rollback and restore decisions in `docs/DEPLOYMENT.md`.
- [x] Add CI steps to render Compose, build the release images and validate the Caddy configuration.
- [ ] Obtain a successful CI run with Docker or execute the CI commands on the target host.
- [x] Make readiness fail when configured Redis is unavailable while keeping liveness independent. Add regression checks and a public HTTPS release probe for frontend entry points, API error routing and dependency health.
- [x] Require production `FRONTEND_ORIGIN` to be one valid HTTPS DNS or IP origin, without credentials, paths, queries, fragments, wildcards, invalid ports or non-canonical default port 443.
- [ ] Exercise the release probe against the real Compose+Caddy deployment on Linux.
- [x] Add a CI job to migrate and seed PostgreSQL, create a verified account with TOTP and a submitted exam, dump the database, restore into a fresh database, and verify the restored account and history.
- [ ] Run the PostgreSQL migration and restore CI job against temporary source and restore databases. Verify a test user's sign-in and seeded content after restore.
- [ ] On staging, capture evidence for PostgreSQL migration and restore, shared Redis operation, SMTP delivery, browser registration and sign-in, TOTP and recovery, and externally reachable HTTPS.
- [ ] Rehearse rollback and deploy the verified release to the production target.

Preflight also corrected an OpenAPI dashboard type mismatch using live Flask response tests and restricted SQLite connection hooks to the app's SQLite engine. This Windows workspace has no Docker or WSL runtime and no configured staging providers.

Local verification recorded 250 passing backend tests, a successful frontend production build with the external theme script, and successful parsing of the Compose and workflow YAML. Docker validation remains an open step.

Release follow-up corrected malformed Caddy validation commands. The restore verifier passed locally using a migrated SQLite database and a separate restored copy. PostgreSQL migration, dump and restore execution still requires a Linux CI run, and staging still requires its configured external services.
