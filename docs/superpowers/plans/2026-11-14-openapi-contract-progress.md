# SDD ledger — plan: docs/superpowers/plans/2026-11-14-openapi-contract.md

Ruling: The supplied project snapshot has no `.git` directory or available plan-workspace scripts, so the work is tracked by this plan and ledger in the shared task workspace; no commit or branch isolation evidence can be produced — the remaining risk is that later integration will need a repository diff review.

Task 1: complete — `pytest tests/test_openapi_contract.py -q` first failed because the OpenAPI artifact did not exist; test then passed after document generation.

Task 2: complete — `scripts/generate_openapi.py` emits `docs/openapi.json` from all live routes and explicit metadata; `openapi-spec-validator` 0.9.0 passes; API compatibility/deprecation policy documented.

Task 3: complete — `pytest -q` from `backend/` → all 249 tests passed; includes OpenAPI validation, route parity, migration SQL and session migration regression.

Final review: read-only review identified and fixed TOTP enrollment response visibility, password letter+digit constraints, and profile update minimum fields. Follow-up made `ProgressDashboard` item schemas exact and strict, with regression assertions for required field names and rejection of unknown properties. Focused contract test passes; full backend suite passes with 249 tests.

Final review: complete; no remaining Critical/Important findings.
