---
phase: 11-github-auth-foundation
plan: "02"
subsystem: auth
tags: [oauth, github, tdd, crypto, vitest]
dependency_graph:
  requires: []
  provides:
    - src/lib/githubAuth.ts
    - src/lib/githubAuth.test.ts
    - src/vite-env.d.ts
  affects:
    - src/hooks/useGitHubAuth.ts  # plan 11-03 will consume these helpers
tech_stack:
  added: []
  patterns:
    - "vi.stubGlobal('fetch', ...) for mocking global fetch in node test env"
    - "crypto.getRandomValues(new Uint8Array(16)) for CSRF state nonce"
    - "URLSearchParams for URL construction and search string parsing"
key_files:
  created:
    - src/lib/githubAuth.ts
    - src/lib/githubAuth.test.ts
  modified:
    - src/vite-env.d.ts
decisions:
  - "OAuth scope is repo (D-11) — enables read/write on private + public repos for Phase 12 commits"
  - "exchangeCodeForToken accepts endpoint as arg (not hardcoded) — caller provides import.meta.env.VITE_AUTH_ENDPOINT"
  - "fetchGitHubUser throws on non-ok response to enable silent token-clear in hook (D-06)"
metrics:
  duration: "~1 minute"
  completed_date: "2026-07-05"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 1
---

# Phase 11 Plan 02: OAuth Helper Lib with Tests Summary

**One-liner:** GitHub OAuth web-flow helpers (URL build, CSRF state, callback parse, token exchange, user fetch) implemented TDD with 11 passing vitest tests in node env.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | OAuth helper lib with tests (RED -> GREEN) | 2d89660 | src/lib/githubAuth.ts, src/lib/githubAuth.test.ts |
| 2 | Type auth env vars in vite-env.d.ts | 2feb5cc | src/vite-env.d.ts |

## What Was Built

### Task 1: OAuth Helper Lib (TDD)

**RED phase:** Written `src/lib/githubAuth.test.ts` covering 11 cases — module import failed confirming RED state.

**GREEN phase:** Implemented `src/lib/githubAuth.ts` with exact exports per plan:

- `buildAuthorizeUrl(clientId, state, redirectUri)` — constructs GitHub authorize URL with `scope=repo`, CSRF state, and redirect URI via URLSearchParams
- `generateState()` — 32-char hex CSRF nonce via `crypto.getRandomValues(new Uint8Array(16))`
- `parseCallbackParams(search)` — parses URLSearchParams to `{ code, state, error }` with null defaults
- `exchangeCodeForToken(code, endpoint)` — POSTs code as JSON, throws on non-ok or error-in-json
- `fetchGitHubUser(token)` — GETs api.github.com/user with Authorization Bearer, throws on non-ok

All 11 tests pass using `vi.stubGlobal('fetch', ...)` — no real network calls.

### Task 2: Env Var Typing

Replaced single-line `src/vite-env.d.ts` with full `ImportMetaEnv` + `ImportMeta` interfaces, typing `VITE_AUTH_ENDPOINT` and `VITE_GITHUB_CLIENT_ID` for TypeScript-safe access in plan 11-03.

## TDD Gate Compliance

- RED gate: Test file written, module-not-found error confirmed failure before implementation
- GREEN gate: All 11 tests pass after implementation
- REFACTOR gate: Not needed — implementation is clean as written

## Deviations from Plan

None - plan executed exactly as written.

## Threat Surface Scan

No new network endpoints, auth paths, or trust boundaries introduced beyond what is documented in the plan's threat model (T-11-06, T-11-07, T-11-08).

## Self-Check: PASSED

- src/lib/githubAuth.ts: FOUND
- src/lib/githubAuth.test.ts: FOUND
- src/vite-env.d.ts: FOUND (updated)
- Commit 2d89660: FOUND (feat(11-02))
- Commit 2feb5cc: FOUND (chore(11-02))
- All 11 tests: PASSED
