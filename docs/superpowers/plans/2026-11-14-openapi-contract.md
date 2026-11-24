# OpenAPI Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish a reviewable OpenAPI 3.1 contract for all Flask API operations and fail backend CI when its path/method inventory drifts from the live URL map.

**Architecture:** Keep the OpenAPI document as a checked-in JSON artifact under `docs/`, with request/response schemas and cookie/CSRF security definitions. A pytest contract test loads the live Flask app and verifies exact path/method coverage, path parameters, operation IDs, and document version; no runtime API behavior or dependency changes are needed.

**Tech Stack:** Flask URL map, OpenAPI 3.1.0, JSON Schema 2020-12, Python standard-library `json`, pytest.

**Spec:** `docs/API.md`, current Flask route map, and the auth/content Marshmallow schemas.

## Global Constraints

- Include every non-framework `/api/v1/*` route; exclude `/static/*` and the development root route.
- Preserve actual methods and Flask path parameter names/types.
- Use `sessionCookie` and `csrfHeader` security schemes only where the implementation requires them; public endpoints remain public.
- Do not describe generated/known behavior as stronger than the current implementation.
- Keep route compatibility/deprecation policy explicit: additive optional fields and endpoints are minor-compatible; removing/renaming paths, methods, required fields, or response fields is breaking and requires a versioned API migration.

## Review Focus

- Route removed or added without an OpenAPI edit: exact method/path test must fail.
- Flask `<int:...>` vs string path parameter: test schema type must match the converter.
- Public vs session-authenticated route: manually review each operation security entry against `docs/API.md`.
- CSRF-protected mutation: require both session cookie and CSRF header in OpenAPI.
- Sensitive auth material in examples: examples must use synthetic values and never contain real tokens, recovery codes, or credentials.

---

### Task 1: Pin live route inventory with a failing contract test

**Files:**
- Create: `backend/tests/test_openapi_contract.py`
- Test: `backend/tests/test_openapi_contract.py`

- [x] Write test asserting document version, exact live path/method coverage, Flask path parameter names and types, and non-empty unique operation IDs.
- [x] Run the focused test and confirm it fails because `docs/openapi.json` does not exist.

### Task 2: Author the OpenAPI document

**Files:**
- Create: `docs/openapi.json`
- Create: `backend/scripts/generate_openapi.py`
- Modify: `backend/requirements-dev.txt`
- Modify: `backend/tests/test_openapi_contract.py`
- Modify: `.github/workflows/ci.yml`
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/API.md`
- Modify: `docs/CONTRACT.md`

- [x] Add all current operations, summaries, tags, path/query parameters, request bodies for write operations, response/error envelopes, and cookie/CSRF security definitions. Generate the JSON artifact from the Flask URL map plus explicit operation metadata.
- [x] Add core auth, pagination, health, and error schemas; use truthful descriptions and synthetic examples.
- [x] Pin the official OpenAPI 3.1 validator as a development dependency and validate the document in pytest/CI.
- [x] Document API compatibility/deprecation policy and link the machine-readable contract from the API reference.
- [x] Run the focused contract test and confirm it passes.

### Task 3: Verify CI enforcement and record progress

**Files:**
- Modify: `PROFESSIONAL_BACKEND_ROADMAP.md`
- Modify: `IMPLEMENTATION_STATUS.md`

- [x] Run the full backend suite; pytest already runs in the backend CI job.
- [x] Confirm the PostgreSQL offline migration regression remains green and that no runtime dependency changed.
- [x] Update roadmap, status, and progress count with the actual test output.
