---
phase: 13-file-tree-sidebar
plan: "05"
subsystem: ui-integration
tags: [sidebar, file-tree, dirty-switch, app-integration, header, localStorage]
dependency_graph:
  requires: [13-01, 13-02, 13-03, 13-04]
  provides: [TREE-02, TREE-03, TREE-04]
  affects: [src/App.tsx, src/components/Header.tsx]
tech_stack:
  added: []
  patterns:
    - awaitingCommitRef pattern for async commit-then-switch chaining
    - localStorage boolean persistence via !== 'false' sentinel
    - scrim overlay on mobile using fixed + z-index
key_files:
  created: []
  modified:
    - src/components/Header.tsx
    - src/App.tsx
decisions:
  - "Mobile scrim uses fixed inset-0 top-12 at z-30, below sidebar z-40, above main content"
  - "FileSidebar CSS-hidden on desktop (not unmounted) so tree fetch state survives toggling"
  - "CommitDialog onClose clears awaitingCommitRef to prevent stale switch on unrelated later commits"
  - "Auto-switch effect guards both isDirty===false and syncError===null before switching"
metrics:
  duration: ~5m
  completed: "2026-07-06"
  tasks_completed: 2
  tasks_planned: 2
  files_created: 0
  files_modified: 2
---

# Phase 13 Plan 05: App Integration (Sidebar + Toggle + Dirty-Switch) Summary

**One-liner:** Header toggle + App sidebar wiring with localStorage persistence, useRepoTree hook, FileSidebar mount, mobile scrim, and commit-chained dirty-switch flow.

## What Was Built

### Task 1: Header sidebar toggle button (commit `9178a96`)

Added `onToggleSidebar: () => void` to `HeaderProps` and inserted a panel-left icon button before the `<h1>` in the left group div. The button is gated on `repoConfig` so it is completely absent when no repository is connected (T-13-17). Uses the VS Code sidebar-toggle SVG glyph (outlined rectangle with filled left panel).

### Task 2: App wiring (commit `0f346b5`)

- **Imports:** `FileSidebar`, `DirtySwitchDialog`, `useRepoTree`
- **State:** `sidebarOpen` (lazy init from localStorage, defaults to `true`), `pendingSwitchPath`, `awaitingCommitRef`
- **Persistence:** `useEffect` writes `md2cv-sidebar` to localStorage on every toggle; read is wrapped in try/catch with `!== 'false'` guard (T-13-15)
- **Tree hook:** `useRepoTree(auth.token, repoSync.repoConfig)` — fetches on repo connect/branch change/manual refresh
- **handleTreeOpenFile:** closes mobile drawer immediately, guards same-file no-op, routes dirty files to `DirtySwitchDialog` and clean files to `repoSync.openFile`
- **DirtySwitchDialog actions:** Discard calls `openFile` directly; Commit sets `awaitingCommitRef.current = true` then opens CommitDialog; Cancel clears pending path
- **Auto-switch effect:** Watches `repoSync.committing`, `repoSync.isDirty`, `repoSync.syncError` and fires the switch only when the commit succeeds cleanly (T-13-16)
- **Layout:** `<main>` replaced with `<div className="flex flex-1 min-h-0">` containing `FileSidebar` + inner `<main>`; `FileSidebar.open` is `sidebarOpen && !!repoSync.repoConfig` (T-13-17)
- **Mobile scrim:** `fixed inset-0 top-12 bg-black/40 z-30` rendered only on mobile when sidebar is open and repo connected; click closes drawer
- **CommitDialog onClose** now clears `awaitingCommitRef.current = false` and `setPendingSwitchPath(null)` to prevent stale switch on cancellation (T-13-16)

## Deviations from Plan

None - plan executed exactly as written.

## Threat Mitigations Applied

| Threat | Mitigation |
|--------|-----------|
| T-13-14: silent loss of uncommitted edits on file switch | `isDirty` gate routes dirty clicks through DirtySwitchDialog; `openFile` only called on clean path, explicit Discard, or post-commit success |
| T-13-15: corrupted `md2cv-sidebar` localStorage value | Read wrapped in try/catch; `!== 'false'` sentinel — any non-'false' value treated as open |
| T-13-16: stale pending switch firing unintended swap | `awaitingCommitRef` cleared on CommitDialog onClose AND on commit error; switch effect requires both the ref flag and dirty===false with no syncError |
| T-13-17: sidebar/toggle without connected repo | Toggle gated on `repoConfig` in Header; `FileSidebar.open` ANDed with `!!repoSync.repoConfig`; scrim gated on `repoSync.repoConfig` |

## Verification

- `npx tsc -b --noEmit`: clean (no errors)
- `npm run build`: exits 0
- `npm run lint`: no errors in App.tsx / Header.tsx
- Manual smoke deferred to Plan 06 human-verify checkpoint

## Self-Check

PASSED — both modified files exist and both commits are in git log.
