---
phase: 12-repo-sync-toolbar
plan: "06"
subsystem: app-integration
tags: [sync, wiring, dialogs, toasts, app]
dependency_graph:
  requires: [12-01, 12-02, 12-03, 12-04, 12-05]
  provides: [full-sync-wiring]
  affects: [src/App.tsx]
tech_stack:
  added: []
  patterns: [hook-wiring, callback-bridge, dialog-open-state]
key_files:
  modified:
    - src/App.tsx
decisions:
  - "Offline pull-failure string matched in App to route to amber syncWarning toast instead of red syncError, matching UI-SPEC intent without adding hook state"
  - "applyRemoteContent callback placed before useRepoSync call but after both useState declarations it depends on (setMarkdownContent and setHtmlContent)"
  - "PickerDialog token-guarded with auth.token truthy check per T-12-15 mitigation"
metrics:
  duration: "~8 minutes"
  completed: "2026-07-06T02:31:21Z"
  tasks_completed: 2
  files_modified: 1
---

# Phase 12 Plan 06: App Integration Wiring Summary

**One-liner:** Wired useRepoSync hook, PickerDialog/CommitDialog/ConflictModal dialogs, and sync toasts into App.tsx — replacing 12-05 stub props with live repoSync state.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Consume useRepoSync and route remote content into editor | 9d88755 | src/App.tsx |
| 2 | Pass sync props to Header and render the three dialogs | 9d88755 | src/App.tsx |

(Tasks 1 and 2 were implemented together in a single atomic commit as the changes were tightly coupled.)

## What Was Built

- **`useRepoSync` integration**: App now calls `useRepoSync(auth.token, markdownContent, applyRemoteContent)` and exposes the full `UseSyncResult` to the UI.
- **`applyRemoteContent` bridge**: A `useCallback` that writes remote content directly into `markdownContent` state, `htmlContent` preview, and localStorage — bypassing the 150ms debounce for immediate remote-load rendering.
- **Dialog open state**: `pickerOpen` / `commitOpen` booleans with corresponding `handleOpenFilePicker` / `handleOpenCommitDialog` callbacks.
- **Header sync props**: `repoConfig`, `isDirty`, open handlers, and all toast props wired from `repoSync` result; stub values from 12-05 fully replaced.
- **PickerDialog**: Rendered conditional on `auth.token`; `onConnect` calls `repoSync.connectRepo` and closes picker.
- **CommitDialog**: Renders with dynamic filename from `repoConfig.filePath`; `onCommit` calls `repoSync.commit` and closes dialog.
- **ConflictModal**: `open={repoSync.conflict !== null}`; routes to `resolveConflict('local')` / `resolveConflict('remote')`.
- **Toast routing**: Offline pull-failure string detected in App and routed to amber `syncWarning` rather than red `syncError`.

## Deviations from Plan

### Collapsed Two Tasks Into One Commit

**Found during:** Implementation

**Issue:** Both tasks modify only `src/App.tsx`; the Header stub-replacement (Task 2) logically depends on the new state variables introduced in Task 1. Splitting into two commits would have left a compile error between them.

**Fix:** Implemented both tasks together and committed once. All acceptance criteria for both tasks were verified before committing.

**Commit:** 9d88755

## Threat Model Compliance

| Threat ID | Mitigation Applied |
|-----------|-------------------|
| T-12-14 | Accepted — remote content enters the existing preview render path; no new sink added |
| T-12-15 | PickerDialog wrapped in `{auth.token && ...}` guard; token only forwarded when present |

## Known Stubs

None. All sync props previously stubbed in 12-05 are now wired to live repoSync state.

## Verification

- `npx tsc -b --noEmit`: EXIT 0
- `npm run build`: EXIT 0, built in 1.96s
- `npm test -- --run`: 88/88 tests passed

## Self-Check: PASSED

- `src/App.tsx` modified: FOUND
- Commit 9d88755: FOUND
- All acceptance criteria grep checks: PASSED
