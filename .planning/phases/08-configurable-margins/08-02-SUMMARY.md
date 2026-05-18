---
phase: 08-configurable-margins
plan: "02"
subsystem: preview-margin-wiring
tags: [margins, pagedjs, react, typescript]
dependency_graph:
  requires: [08-01]
  provides: [Preview margins prop, dynamic @page CSS, margin reflow trigger]
  affects: [src/components/Preview.tsx]
tech_stack:
  added: []
  patterns: [optional-prop-with-default, dynamic-template-literal-css]
key_files:
  created: []
  modified:
    - src/components/Preview.tsx
decisions:
  - "MarginValues imported from ./MarginControls (not redefined) — single source of truth"
  - "Default margins { top:15, right:15, bottom:15, left:15 } in destructure for backward compatibility"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-18"
  tasks_completed: 1
  files_changed: 1
---

# Phase 8 Plan 02: Preview.tsx Margin Wiring Summary

**One-liner:** Preview.tsx accepts optional margins prop and injects dynamic @page { margin: Tmm Rmm Bmm Lmm } into paged.js, closing the App → Preview margin data flow.

---

## What Was Built

### Task 1 — src/components/Preview.tsx (updated) — commit 3315f2d

- Added `import { type MarginValues } from './MarginControls'`
- Added `margins?: MarginValues` to `PreviewProps` interface
- Destructured `margins` with default `{ top: 15, right: 15, bottom: 15, left: 15 }`
- Replaced `'@page { size: A4 portrait; margin: 15mm; }'` with dynamic template literal using all four margin values
- Added `margins` to the `useEffect` dependency array — triggers paged.js reflow on any margin change
- `npx tsc --noEmit` passes clean

---

## Task 2 — Status: Awaiting Human Verification (checkpoint:human-verify)

The code changes are complete. Task 2 is a browser verification checkpoint — the orchestrator will present the verification steps to the user.

**Verification steps (for user):**
1. Run `npm run dev` and open http://localhost:5173
2. Confirm margin strip visible (four inputs labeled Top, Bottom, Left, Right, each showing 15, plus Reset button)
3. Change Top to 25 — preview should reflow with visibly larger top margin
4. Change Left to 5 — preview should reflow with narrower left margin
5. Reload — inputs should retain 25 / 5 (localStorage persistence)
6. Click Reset — all inputs return to 15, preview reflows
7. Reload again — all inputs show 15 (reset persisted)
8. DevTools → Application → localStorage → `md2cv-margins` = `{"top":15,"right":15,"bottom":15,"left":15}`
9. Set Top to 0 (min), then 50 (max), then type 99 (should clamp to 50)
10. Clear Top input entirely — preview should NOT reflow (last valid margin persists)

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Threat Model Coverage

| Threat ID | Disposition | Notes |
|-----------|-------------|-------|
| T-08-04 | Accept | Values already clamped to [0,50] by App.tsx before reaching Preview |
| T-08-05 | Accept | 150ms App.tsx debounce bounds reflow frequency |

---

## Self-Check

- [x] `src/components/Preview.tsx` contains `import { type MarginValues } from './MarginControls'`
- [x] `src/components/Preview.tsx` contains `margins?: MarginValues` in interface
- [x] `src/components/Preview.tsx` contains `margins = { top: 15` default
- [x] `src/components/Preview.tsx` contains `margins.top` in @page string (hardcode removed)
- [x] `src/components/Preview.tsx` dependency array ends with `, margins]`
- [x] `npx tsc --noEmit` exits 0
- [x] Commit `3315f2d` exists

## Self-Check: PASSED
