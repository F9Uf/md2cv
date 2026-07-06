---
phase: 12-repo-sync-toolbar
plan: "04"
subsystem: github-sync-dialogs
tags: [react, typescript, dialog, picker, github-api, ui-components]
dependency_graph:
  requires: [12-01, 12-02, 12-03]
  provides: [PickerDialog, CommitDialog]
  affects: [src/components/PickerDialog.tsx, src/components/CommitDialog.tsx]
tech_stack:
  added: []
  patterns: [two-step-dialog-flow, async-data-loading, controlled-form]
key_files:
  created:
    - src/components/PickerDialog.tsx
    - src/components/CommitDialog.tsx
  modified: []
decisions:
  - "PickerDialog loads branches and files concurrently via Promise.all when a repo is selected"
  - "Step transition is driven by selectRepo() click (no Next button in step 1) — clicking a repo row advances to step 2"
  - "Token is passed only to githubRepo.ts API functions — never rendered or stored in the DOM (T-12-09)"
  - "All API strings rendered as React text children — no dangerouslySetInnerHTML (T-12-10)"
  - "Commit button disabled until message.trim() is non-empty (T-12-11)"
metrics:
  duration: "~8 minutes"
  completed: "2026-07-06"
  tasks_completed: 2
  files_created: 2
  files_modified: 0
---

# Phase 12 Plan 04: Picker and Commit Dialogs Summary

Two dialog components built on the Dialog primitive: `PickerDialog` (searchable two-step repo/branch/file picker that emits a `RepoConfig`) and `CommitDialog` (pre-filled commit message form with disabled/committing states).

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Build PickerDialog | fe77bc9 | src/components/PickerDialog.tsx |
| 2 | Build CommitDialog | 0b37585 | src/components/CommitDialog.tsx |

## What Was Built

### PickerDialog (`src/components/PickerDialog.tsx`)

Two-step flow inside the Dialog primitive (title "Connect repository", `maxWidthClass="max-w-lg"`):

**Step 1 — Repository selection:**
- Loads user repos via `listUserRepos` on open (with cancel-on-unmount pattern)
- Real-time search filter against `full_name`
- Loading spinner with "Loading repositories…" label during fetch
- "No repositories found" empty state
- Row shows `full_name` (left) and `toLocaleDateString(pushed_at)` (right)
- Clicking a row calls `selectRepo()` which sets the repo, pre-selects `default_branch`, and concurrently loads branches (`listBranches`) and files (`listMdFiles`) via `Promise.all`

**Step 2 — Branch + file selection:**
- Branch `<select>` pre-filled with `default_branch`; changing branch reloads files via `listMdFiles`
- File list with same row/loading/empty pattern; selected row styled `bg-blue-900/40 text-blue-200`
- "Back" button returns to step 1; "Open file" button (disabled until file selected) emits the `RepoConfig` and closes

### CommitDialog (`src/components/CommitDialog.tsx`)

Presentational dialog (title "Commit to GitHub") wrapping the Dialog primitive:

- Pre-fills `Update ${filename}` on open/filename change via `useEffect`
- Commit button disabled (`opacity-50 cursor-not-allowed`) when `message.trim() === ''`
- When `committing` is true: button shows spinner + "Committing…", is disabled with `aria-busy="true"`
- "Discard" dismissal button closes without committing
- Delegates commit via `onCommit(message.trim())`

## Deviations from Plan

None — plan executed exactly as written. All copy strings, class names, and behavior match the UI-SPEC and plan action specs.

## Threat Mitigations Applied

| Threat | Mitigation |
|--------|-----------|
| T-12-09 (token disclosure) | Token only passed to `githubRepo.ts` functions; never rendered, logged, or placed in DOM |
| T-12-10 (XSS via repo/file names) | All API strings rendered as React text children (auto-escaped), no `dangerouslySetInnerHTML` |
| T-12-11 (empty commit message) | `message.trim() === ''` check disables commit button |

## Known Stubs

None — both components are fully wired to their data sources and callbacks.

## Threat Flags

None — no new security-relevant surface beyond what the plan's threat model covers.

## Self-Check: PASSED

- [x] `src/components/PickerDialog.tsx` exists (234 lines, > 90 min)
- [x] `src/components/CommitDialog.tsx` exists (66 lines, > 40 min)
- [x] Commit fe77bc9 exists (PickerDialog)
- [x] Commit 0b37585 exists (CommitDialog)
- [x] `npx tsc -b --noEmit` exits 0
