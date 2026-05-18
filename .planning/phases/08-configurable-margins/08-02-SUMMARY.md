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
  tasks_completed: 2
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

## Task 2 — Status: Human Verification APPROVED

All 10 browser checks passed. User confirmed approval on 2026-05-18.

**Verified:**
1. Margin strip visible (four inputs labeled Top, Bottom, Left, Right, each showing 15, plus Reset button)
2. Changing Top to 25 reflows preview with visibly larger top margin
3. Changing Left to 5 reflows preview with narrower left margin
4. Reload retains 25 / 5 (localStorage persistence)
5. Reset returns all inputs to 15 and preview reflows
6. Reload after reset shows all inputs at 15 (reset persisted)
7. DevTools localStorage `md2cv-margins` = `{"top":15,"right":15,"bottom":15,"left":15}`
8. Top = 0 (min) reflows correctly; Top = 50 (max) reflows correctly; 99 clamps to 50
9. Clearing Top input entirely does not reflow (last valid margin persists)

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
