---
phase: 12-repo-sync-toolbar
plan: "05"
subsystem: header-toolbar
tags: [toolbar, file-menu, dirty-indicator, repo-caption, toasts, accessibility]
dependency_graph:
  requires: [12-03]
  provides: [TOOL-01, SYNC-05-ui]
  affects: [src/components/Header.tsx, src/App.tsx]
tech_stack:
  added: []
  patterns: [dropdown-menu, dirty-dot, toast-container, auto-dismiss]
key_files:
  modified:
    - src/components/Header.tsx
    - src/App.tsx
decisions:
  - "File menu button stays bg-gray-700 (not blue accent) — amber dot is the only dirty change"
  - "Toast container uses flex-col gap-2 wrapper to stack toasts without per-toast fixed positioning"
  - "App.tsx stub props (null/false/no-ops) added to satisfy TypeScript until plan 06 wires real values"
metrics:
  duration: "220s"
  completed: "2026-07-06T02:27:04Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 12 Plan 05: Header Toolbar — File Menu, Dirty Dot, Repo Caption, Toast Variants Summary

**One-liner:** File menu dropdown collapses Import/Download MD + state-adaptive GitHub actions; amber dirty dot and owner/repo caption surface sync state; success/warning/error toast variants stack in a fixed container.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | File dropdown menu + dirty dot + repo caption | 0481f68 | src/components/Header.tsx, src/App.tsx |
| 2 | Success + warning toast variants | faef029 | src/components/Header.tsx, src/App.tsx |

---

## What Was Built

### Task 1: File Dropdown Menu (TOOL-01) + Dirty Dot + Repo Caption

Modified `HeaderProps` to add four new props: `repoConfig: RepoConfig | null`, `isDirty: boolean`, `onOpenFilePicker: () => void`, `onOpenCommitDialog: () => void`. Imported `type RepoConfig` from `../hooks/useRepoSync`.

Added a second dropdown state (`fileMenuOpen` / `fileMenuRef`) following the exact avatar-dropdown pattern from lines 38-59. The File button replaces the two standalone Import MD / Download MD buttons.

**File menu structure:**
- Always visible: Import MD, Download MD menu items
- Divider `<hr>`
- State-adaptive GitHub section: signed-out shows non-interactive hint; signed-in + no repo shows "Connect repository…"; signed-in + repo connected shows both "Connect repository…" and "Commit to GitHub…"

**Amber dirty dot:** `absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400` renders when `isDirty` is true. The `aria-label` also conveys dirty state ("File — uncommitted changes") satisfying the T-12-13 accessibility mitigation.

**Repo caption:** Grouped `<h1>` and caption in `<div className="flex items-center min-w-0">` so truncation works correctly. Caption `hidden sm:inline-block` hides on mobile.

**Export PDF** stays separate as the blue `bg-blue-600` button — unchanged.

### Task 2: Success + Warning Toast Variants

Extended `HeaderProps` with six more props: `syncError`, `syncSuccess`, `syncWarning`, `onDismissSyncError`, `onDismissSyncSuccess`, `onDismissSyncWarning`.

Replaced the standalone fixed error toast with a `<div className="fixed top-12 right-4 z-50 flex flex-col gap-2 items-end">` container holding all four toast slots. Each toast uses the base class pattern (no per-toast `fixed` positioning) to stack without overlap.

- **Error (auth):** `bg-red-950 border-red-800 text-red-400`, `role="alert" aria-live="polite"`, manual dismiss
- **Error (sync):** same classes, `onDismissSyncError`
- **Warning:** `bg-amber-950 border-amber-800 text-amber-400`, `role="alert" aria-live="polite"`, manual dismiss
- **Success:** `bg-green-950 border-green-800 text-green-400`, `aria-live="polite"`, auto-dismisses after 4s via `useEffect` + `setTimeout`

All dismiss buttons use `aria-label="Dismiss"`.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] App.tsx missing required Header props**
- **Found during:** Task 1 TypeScript verification
- **Issue:** Adding required props to `HeaderProps` caused `App.tsx` to fail TypeScript compilation — `npx tsc -b --noEmit` exit code 1. The acceptance criteria requires exit 0.
- **Fix:** Added stub props to the `<Header />` call in `App.tsx`: `repoConfig={null}`, `isDirty={false}`, `onOpenFilePicker={() => {}}`, `onOpenCommitDialog={() => {}}` (Task 1), plus `syncError={null}`, `syncSuccess={null}`, `syncWarning={null}`, and no-op dismiss handlers (Task 2). Plan 06 (wave 4) will replace all stubs with real `useRepoSync` values.
- **Files modified:** src/App.tsx
- **Commits:** 0481f68, faef029

---

## Known Stubs

| File | Stub | Reason |
|------|------|--------|
| src/App.tsx | `repoConfig={null}` | Plan 06 wires real useRepoSync value |
| src/App.tsx | `isDirty={false}` | Plan 06 wires real useRepoSync value |
| src/App.tsx | `onOpenFilePicker={() => {}}` | Plan 06 wires real picker dialog open handler |
| src/App.tsx | `onOpenCommitDialog={() => {}}` | Plan 06 wires real commit dialog open handler |
| src/App.tsx | `syncError={null}` | Plan 06 wires real useRepoSync.syncError |
| src/App.tsx | `syncSuccess={null}` | Plan 06 wires real useRepoSync.successMessage |
| src/App.tsx | `syncWarning={null}` | Plan 06 wires real warning state |
| src/App.tsx | no-op dismiss handlers | Plan 06 wires real dismiss callbacks |

These stubs are intentional — they exist only to satisfy TypeScript until plan 06 (App.tsx wiring) runs. The Header component is fully functional given the correct props.

---

## Threat Model Compliance

| Threat ID | Status | Evidence |
|-----------|--------|----------|
| T-12-12 (XSS — repo caption + toasts) | Mitigated | All values rendered as React text children — no `dangerouslySetInnerHTML` in Header.tsx |
| T-12-13 (a11y — dirty state via color only) | Mitigated | `aria-label="File — uncommitted changes"` on the File button when dirty |

---

## Self-Check: PASSED

- `src/components/Header.tsx` — present and modified
- `src/App.tsx` — present and modified
- Commit 0481f68 — present in git log
- Commit faef029 — present in git log
- `npx tsc -b --noEmit` exits 0
- `npm run lint` reports 0 errors (2 pre-existing warnings in other files)
