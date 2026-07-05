---
phase: 11-github-auth-foundation
plan: "03"
subsystem: auth
tags: [react-hook, oauth, localStorage, CSRF, token-persistence]
dependency_graph:
  requires: ["11-02"]
  provides: ["useGitHubAuth hook", "GitHubAuthState interface", "UseGitHubAuthResult interface"]
  affects: ["src/App.tsx (Phase 11-04)", "src/components/Header.tsx (Phase 11-04)"]
tech_stack:
  added: []
  patterns: ["cancelled-flag async effect", "lazy useState initializer", "persist-effect on token"]
key_files:
  created:
    - src/hooks/useGitHubAuth.ts
  modified: []
decisions:
  - "401 on GET /user silently clears token per D-06 — no setError call in that catch block"
  - "ERR_DENIED wording: 'GitHub access was denied. Click Sign in to try again.'"
  - "ERR_FAILED wording: 'Sign-in failed. Please try again.'"
  - "CSRF state nonce stored in sessionStorage (md2cv-oauth-state) — ephemeral, single-use, removed before exchange"
  - "Token stored in localStorage (md2cv-github-token) via persist-effect pattern matching useSplitPane"
metrics:
  duration: "5 minutes"
  completed: "2026-07-05"
  tasks_completed: 1
  tasks_total: 1
  files_created: 1
  files_modified: 0
---

# Phase 11 Plan 03: useGitHubAuth Hook Summary

**One-liner:** React hook orchestrating full OAuth web flow with CSRF state verification, token exchange via VITE_AUTH_ENDPOINT, localStorage persistence, and silent 401 token invalidation per D-06.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Implement useGitHubAuth hook | 817c850 | src/hooks/useGitHubAuth.ts (created) |

## What Was Built

`src/hooks/useGitHubAuth.ts` — a single React hook exporting `useGitHubAuth()`, `GitHubAuthState`, and `UseGitHubAuthResult`.

### Key behaviors

**Mount effect (runs once, [] deps):**
1. Parses `window.location.search` for `?code&state&error` via `parseCallbackParams`
2. If `error` param present: cleans URL, sets `ERR_DENIED` error state
3. If `code+state` present: reads and removes sessionStorage nonce; if mismatch → `ERR_FAILED`; if match → exchanges code for token via `VITE_AUTH_ENDPOINT`; URL cleaned via `history.replaceState`
4. If `activeToken` available: validates via `fetchGitHubUser`; on any failure → silently clears token + user (D-06, NO setError)
5. Sets `loading(false)` when complete

**Persist effect (runs on token change):**
- token truthy → `localStorage.setItem('md2cv-github-token', token)`
- token null → `localStorage.removeItem('md2cv-github-token')`

**signIn():** generates 32-hex nonce, stores in `sessionStorage['md2cv-oauth-state']`, clears error, redirects to `buildAuthorizeUrl(VITE_GITHUB_CLIENT_ID, state, origin + '/')`

**signOut():** `setToken(null)` (triggers persist-effect removal), `setUser(null)`, `setError(null)`, removes sessionStorage nonce

**dismissError():** `setError(null)`

### Imports from lib (all 5 functions)
`buildAuthorizeUrl`, `generateState`, `parseCallbackParams`, `exchangeCodeForToken`, `fetchGitHubUser` + `GitHubUser` type — all from `'../lib/githubAuth'`

### Patterns followed
- `useSplitPane` module-top STORAGE_KEY constant + `loadToken()` lazy initializer
- `useSplitPane` persist-effect with try/catch `/* ignore */`
- `usePagedjsPreview` cancelled-flag async effect with `await Promise.resolve()` yield

## Deviations from Plan

None — plan executed exactly as written. The hook implementation matches the pseudocode in the plan action block verbatim.

## Threat Surface Scan

No new threat surface introduced beyond what is captured in the plan's threat model:

| Flag | File | Description |
|------|------|-------------|
| threat_flag: CSRF | src/hooks/useGitHubAuth.ts | T-11-09 mitigated — state compared to sessionStorage nonce, single-use, mismatch → ERR_FAILED, no exchange |
| threat_flag: info-disclosure | src/hooks/useGitHubAuth.ts | T-11-10 mitigated — history.replaceState strips ?code&state immediately |
| threat_flag: stale-creds | src/hooks/useGitHubAuth.ts | T-11-12 mitigated — GET /user validates on load; 401 silently clears token |

All threats are in the plan's threat register with `mitigate` disposition. No new surface found outside the register.

## Known Stubs

None — no hardcoded values flow to UI. Hook is data-source wired (localStorage + sessionStorage + env vars).

## Verification

```
npx tsc -b --force  # exits 0, no output
grep "md2cv-github-token" src/hooks/useGitHubAuth.ts  # found: TOKEN_KEY const + persist-effect
grep "from '../lib/githubAuth'" src/hooks/useGitHubAuth.ts  # found: import block
```

## Self-Check: PASSED

- [x] `src/hooks/useGitHubAuth.ts` exists at expected path
- [x] Commit `817c850` exists in git log
- [x] `npx tsc -b --force` passes (no errors, no output)
- [x] All 5 lib functions imported
- [x] TOKEN_KEY = 'md2cv-github-token', STATE_KEY = 'md2cv-oauth-state' present
- [x] 401 catch: setToken(null) + setUser(null), NO setError
- [x] signOut: setToken(null) present
