---
phase: 12-repo-sync-toolbar
plan: "02"
subsystem: ui-components
tags: [dialog, modal, conflict, a11y, presentational]
dependency_graph:
  requires: []
  provides: [Dialog, ConflictModal]
  affects: [src/components/Dialog.tsx, src/components/ConflictModal.tsx]
tech_stack:
  added: []
  patterns: [modal-primitive, blocking-modal, aria-dialog, useId, focus-management]
key_files:
  created:
    - src/components/Dialog.tsx
    - src/components/ConflictModal.tsx
  modified: []
decisions:
  - "Dialog uses onClose?: () => void — when undefined the modal is non-dismissible (Escape and backdrop-click are no-ops via optional chaining)"
  - "useId() provides stable aria titleId for aria-labelledby association"
  - "backdrop click dismiss checks e.target === e.currentTarget to avoid closing on panel content clicks"
  - "ConflictModal passes no onClose to Dialog so it is structurally non-dismissible"
metrics:
  duration: "87s"
  completed: "2026-07-06"
  tasks_completed: 2
  files_changed: 2
---

# Phase 12 Plan 02: Dialog Primitive and ConflictModal Summary

Reusable Dialog modal primitive with full a11y attributes (role/aria-modal/aria-labelledby) and the non-dismissible ConflictModal (keep-local / use-remote conflict prompt) built on top of it.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build Dialog modal primitive | 8baf21c | src/components/Dialog.tsx |
| 2 | Build ConflictModal component | ee93d9e | src/components/ConflictModal.tsx |

## What Was Built

**Dialog.tsx** — a reusable modal primitive that:
- Renders a dark backdrop (`bg-black/60`) with the panel centered via flexbox
- Provides full ARIA semantics: `role="dialog"`, `aria-modal="true"`, `aria-labelledby={titleId}` (stable id via `useId()`)
- Closes on Escape key and backdrop click when `onClose` is provided; omitting `onClose` makes the modal structurally non-dismissible
- Backdrop click handled via `e.target === e.currentTarget` guard to prevent accidental dismissal on panel content clicks
- Moves focus to the panel on open (`tabIndex={-1}` + `useEffect`)

**ConflictModal.tsx** — a blocking conflict prompt that:
- Wraps Dialog with no `onClose` prop so it cannot be dismissed via Escape or backdrop
- Shows exact UI-SPEC copy: title "Your local edits differ from GitHub", body "Choose which version to keep. This cannot be undone."
- Two full-width stacked buttons: "Keep my local version" (gray, safe default, first) and "Use GitHub version" (red destructive, second)

## Threat Model Compliance

T-12-04 (accidental data loss via ConflictModal) is fully mitigated:
- Non-dismissible modal (no `onClose`) forces an explicit user choice
- Destructive "Use GitHub version" button is styled red (`bg-red-800`) and placed second (safe option first)
- Body text warns "This cannot be undone."

T-12-05 (focus trap escape) is accepted: lightweight focus-to-panel (no full focus-trap library) per plan threat model.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — both components are pure presentational with all props wired; no hardcoded empty values or placeholder data.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced.

## Self-Check: PASSED

- src/components/Dialog.tsx: FOUND
- src/components/ConflictModal.tsx: FOUND
- Commit 8baf21c: FOUND
- Commit ee93d9e: FOUND
