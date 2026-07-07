---
phase: 12-repo-sync-toolbar
plan: "03"
subsystem: hooks
tags: [react-hook, github-sync, localStorage, conflict-resolution, dirty-flag]
dependency_graph:
  requires: [12-01]
  provides: [useRepoSync.ts]
  affects: [src/App.tsx, src/components/Header.tsx, src/components/ConflictModal.tsx, src/components/CommitDialog.tsx]
tech_stack:
  added: []
  patterns: [cancellation-guarded async effect, ref-stable callbacks, derived isDirty, localStorage shape validation]
key_files:
  created:
    - src/hooks/useRepoSync.ts
  modified: []
decisions:
  - "commitFile not imported in Task 1 scaffold to avoid noUnusedLocals TS error; added in Task 2 when real implementation was written"
  - "setCommitting(false) placeholder in commit stub prevents noUnusedLocals error while stubs are active"
  - "refs (contentRef/configRef/syncRef/conflictRef) updated every render to give callbacks fresh state without re-creating them"
  - "Auto-pull effect depends on [token] so it re-runs once when auth hydrates from null to a value"
  - "isDirty is a derived value (not state) so the dirty indicator updates synchronously with each keystroke"
metrics:
  duration: "294s"
  completed: "2026-07-06"
  tasks_completed: 2
  files_created: 1
  files_modified: 0
---

# Phase 12 Plan 03: useRepoSync Hook Summary

**One-liner:** React hook centralizing GitHub repo sync — localStorage persistence, cancellation-guarded auto-pull on open, sha-based dirty flag, commit-with-conflict-re-raise, and keep-local/take-remote conflict resolution.

---

## What Was Built

`src/hooks/useRepoSync.ts` — the stateful sync layer for Phase 12:

- **4 exported interfaces:** `RepoConfig`, `SyncState`, `ConflictState`, `UseSyncResult`
- **localStorage helpers:** `loadRepoConfig()` and `loadSyncState()` with try/catch + field-type validation
- **Persist effects:** two `useEffect` calls mirroring `useGitHubAuth`'s token persist pattern (set/removeItem on change)
- **isDirty:** derived each render — `!!repoConfig && (!syncState || currentContent !== syncState.contentSnapshot)` — no extra state, updates synchronously per keystroke
- **Auto-pull-on-open effect:** cancellation-guarded async IIFE depending on `[token]`; reads localStorage directly to avoid stale closures; raises `ConflictState` when local was edited AND differs from remote
- **connectRepo:** loads the chosen file immediately via `getFileContent`, applies remote content, sets sync snapshot
- **clearRepo / dismissSyncError / dismissSuccess:** simple state resets
- **commit:** PUT against stored sha; on 409/422 fetches fresh remote and raises `source: 'commit'` conflict instead of silently failing
- **resolveConflict:** handles take-remote (apply + update snapshot) and keep-local for both `source: 'pull'` (adopt fresh sha, preserve old snapshot so isDirty stays true) and `source: 'commit'` (re-commit with fresh sha to overwrite remote)
- **Stable refs:** `contentRef`, `configRef`, `syncRef`, `conflictRef` updated every render — callbacks read current values without re-creating on every state change

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Hook scaffold — types, localStorage, connectRepo/clearRepo, auto-pull effect, dirty flag | 277dd71 | src/hooks/useRepoSync.ts |
| 2 | Commit flow + conflict resolution | aeeb895 | src/hooks/useRepoSync.ts |

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] noUnusedLocals: removed commitFile import in Task 1 scaffold**
- **Found during:** Task 1 verification
- **Issue:** `tsconfig.app.json` has `noUnusedLocals: true`; importing `commitFile` before use in Task 2 caused TS6133. Similarly `setCommitting` was declared but the stubs didn't call it.
- **Fix:** Removed `commitFile` from the import in Task 1 (added back in Task 2). Added `setCommitting(false)` to the commit stub as a no-op placeholder to prevent the unused-local error.
- **Files modified:** src/hooks/useRepoSync.ts
- **Commit:** 277dd71 (no separate commit — fixed inline before Task 1 commit)

---

## Threat Surface Scan

All STRIDE mitigations from the plan's threat model are implemented:

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-12-06 | `loadRepoConfig`/`loadSyncState` wrap JSON.parse in try/catch and validate every field type before use; malformed data returns `null` |
| T-12-07 | isDirty derived from sha+snapshot comparison; commit sends stored sha; 409/422 mismatch re-raises conflict instead of clobbering; pull raises conflict when local was edited and differs from remote |
| T-12-08 | Auto-pull effect is cancellation-guarded; failure sets dismissible `syncError` and app continues working from localStorage |

No new security surface beyond what the plan's threat model covers.

---

## Known Stubs

None — all `UseSyncResult` members are fully implemented.

---

## Self-Check

- FOUND: src/hooks/useRepoSync.ts
- FOUND commit 277dd71 (Task 1)
- FOUND commit aeeb895 (Task 2)
- `npx tsc -p tsconfig.app.json --noEmit` exits 0
- `npm run lint` exits 0 with 0 errors in useRepoSync.ts

## Self-Check: PASSED
