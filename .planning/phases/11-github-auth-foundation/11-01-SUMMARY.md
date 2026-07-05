---
phase: 11-github-auth-foundation
plan: "01"
subsystem: auth
tags: [oauth, serverless, env-config, security]
dependency_graph:
  requires: []
  provides: [api/github-auth.ts, .env.example]
  affects: []
tech_stack:
  added: [Vercel serverless function (Node 20), GitHub OAuth code->token exchange]
  patterns: [server-side secret isolation, CORS preflight handling, structured env-var contract]
key_files:
  created:
    - api/github-auth.ts
    - .env.example
  modified:
    - .gitignore
decisions:
  - "D-10 (from CONTEXT.md): api/ uses zero external npm imports; Node 20 global fetch only"
  - "D-13 (from CONTEXT.md): serverless function does only code->token exchange; identity fetch happens client-side"
  - "GITHUB_CLIENT_SECRET is strictly server-side — never VITE-prefixed, never returned in response body"
  - "CORS wildcard * accepted for this personal single-user tool (T-11-04 accepted risk)"
metrics:
  duration: "~1 minute"
  completed: "2026-07-05"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 1
---

# Phase 11 Plan 01: Environment Config and OAuth Token Exchange Summary

**One-liner:** Vercel serverless function for server-side GitHub OAuth code-to-token exchange with strict secret isolation via process.env and env-var contract in .env.example.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add .env.example and git-ignore real env files | f2ed31f | `.env.example`, `.gitignore` |
| 2 | Create serverless code->token exchange function | b123935 | `api/github-auth.ts` |

---

## What Was Built

**`api/github-auth.ts`** — A self-contained Vercel Node 20 serverless function with zero external imports. Accepts a POST with `{ code }` in the request body, exchanges it for a GitHub `access_token` via server-to-server call to `https://github.com/login/oauth/access_token`, and returns only `{ access_token }` to the caller. The `GITHUB_CLIENT_SECRET` is read exclusively from `process.env` and is never returned in any response body or log. CORS preflight (OPTIONS) returns 204; non-POST methods return 405.

**`.env.example`** — Documents all four environment variables with correct scoping: `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are unprefixed (server-only), while `VITE_GITHUB_CLIENT_ID` and `VITE_AUTH_ENDPOINT` are VITE-prefixed (browser-safe). The `VITE_AUTH_ENDPOINT` var satisfies AUTH-02 — the token-exchange host is configurable without editing source.

**`.gitignore` update** — Added an explicit block to ignore `.env` and `.env.*` while keeping `.env.example` tracked, preventing accidental secret commits.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Threat Model Coverage

| Threat | Status |
|--------|--------|
| T-11-01: GITHUB_CLIENT_SECRET disclosure | Mitigated — server-only process.env; never returned or VITE-prefixed |
| T-11-02: .env files in git | Mitigated — .gitignore blocks .env/.env.* |
| T-11-03: request body code injection | Mitigated — code passed as JSON field, not string-concatenated |
| T-11-04: Open CORS * | Accepted — personal tool, single user |
| T-11-05: repo scope breadth | Accepted — required for Phase 12 private-repo commits (D-11) |

---

## Known Stubs

None.

## Self-Check: PASSED

- `api/github-auth.ts` exists: FOUND
- `.env.example` exists: FOUND
- `.gitignore` updated: FOUND
- Task 1 commit f2ed31f: FOUND
- Task 2 commit b123935: FOUND
