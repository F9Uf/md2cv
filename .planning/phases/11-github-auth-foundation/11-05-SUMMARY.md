---
phase: 11-github-auth-foundation
plan: 05
subsystem: auth
tags: [github-oauth, vercel, serverless]

requires: []
provides:
  - End-to-end GitHub OAuth flow verified against real GitHub OAuth App
  - All Phase 11 success criteria confirmed by human testing
affects: [phase-12-repo-sync]

tech-stack:
  added: []
  patterns: []

key-files:
  created: []
  modified: []

key-decisions:
  - "Post sign-out re-auth bypasses consent screen if GitHub app still authorized — accepted behavior for personal tool"

requirements-completed: [AUTH-01, AUTH-02, AUTH-03]

duration: 10min
completed: 2026-07-05
---

# Phase 11-05: Human Verification Summary

**GitHub OAuth web flow confirmed end-to-end against real credentials — sign-in, avatar, sign-out, persistence, and error path all verified**

## Performance

- **Duration:** ~10 min
- **Completed:** 2026-07-05
- **Tasks:** 1 (human checkpoint)

## Accomplishments
- SC1 (AUTH-01): Sign-in button → GitHub OAuth redirect → avatar in header; URL cleaned of `?code&state`
- SC2: Avatar click → dropdown shows GitHub username + "Sign out"
- SC3 (AUTH-03): Sign out clears token; page reload stays signed out
- SC4 (AUTH-02): Endpoint changed via `VITE_AUTH_ENDPOINT` only — no source edits required
- Error path: Cancel on GitHub → red dismissible toast; sign-in button remains usable
- Persistence: Reload after sign-in → avatar shown (token validated via GET /user, D-06)

## Deviations from Plan

None — all success criteria passed on first run. Two compile errors were fixed during setup:
- `api/tsconfig.json` missing → added with NodeNext/ES2020 config
- `@types/node` missing → installed for `process.env` and global `fetch` types

## Issues Encountered

Vercel compilation errors on first `vercel dev` run: missing `api/tsconfig.json` caused TypeScript to default to ES5 lib (no `Iterable`, `WeakMap`, `Promise`). Fixed by adding `api/tsconfig.json` (NodeNext, ES2020, skipLibCheck) and installing `@types/node@^20`. Also: `"type": "module"` in package.json required `module: NodeNext` not `CommonJS` to avoid "exports is not defined in ES module scope".

## Next Phase Readiness

Phase 11 complete. Phase 12 (Repo Sync & Toolbar) can consume `useGitHubAuth()` directly:
- `auth.token` — the GitHub access token for API calls
- `auth.user` — identity (login, avatar_url) already in state
- `auth.signOut` — clear token on permission errors

---
*Phase: 11-github-auth-foundation*
*Completed: 2026-07-05*
