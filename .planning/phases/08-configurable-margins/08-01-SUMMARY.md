---
phase: 08-configurable-margins
plan: "01"
subsystem: margin-controls
tags: [margins, ui, localStorage, react, tailwind]
dependency_graph:
  requires: []
  provides: [MarginControls component, margin state in App, md2cv-margins localStorage]
  affects: [src/App.tsx, src/components/MarginControls.tsx]
tech_stack:
  added: []
  patterns: [controlled-input, localStorage-init-pattern, useCallback]
key_files:
  created:
    - src/components/MarginControls.tsx
  modified:
    - src/App.tsx
decisions:
  - "MarginValues interface exported from MarginControls.tsx and re-imported in App.tsx via 'type' import"
  - "margins prop forwarded to both Preview instances even though Preview.tsx does not yet accept it — TypeScript errors expected, resolved by Plan 02"
  - "DEFAULT_MARGINS declared inside function body (consistent with existing App.tsx style)"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-18"
  tasks_completed: 2
  files_changed: 2
---

# Phase 8 Plan 01: MarginControls Component and App Wiring Summary

**One-liner:** Four-input margin control strip (top/bottom/left/right, 15mm default) with localStorage persistence wired into App.tsx state.

---

## What Was Built

### Task 1 — src/components/MarginControls.tsx (new)

- Exports `MarginValues` interface (`{ top, right, bottom, left: number }`)
- Renders `h-9 bg-gray-900 border-b border-gray-700` strip matching header visual treatment
- Four `<label>`-wrapped units (Top, Bottom, Left, Right) each with `type="number"` input and "mm" suffix
- Input spec: `h-7 w-14 text-center min=0 max=50 step=1` with per-UI-SPEC Tailwind classes
- All four inputs have correct `aria-label` (e.g. `"Top margin in millimetres"`)
- `<div role="group" aria-label="Page margins">` wraps the four units
- onChange guard: empty string and NaN are ignored; value clamped to `[0, 50]` before calling `onMarginsChange`
- Reset button (`ml-auto`) calls `onMarginsChange` for all four sides with `15`
- Commit: `73bf95c`

### Task 2 — src/App.tsx (updated)

- Added import: `MarginControls, { type MarginValues }` from `./components/MarginControls`
- `DEFAULT_MARGINS` const `{ top: 15, right: 15, bottom: 15, left: 15 }`
- `margins` useState with localStorage initializer: reads `md2cv-margins`, validates each value is `number` in `[0, 50]`, falls back to `15` per side
- `handleMarginChange` useCallback: updates margins state and persists to `md2cv-margins` via try/catch
- `<MarginControls margins={margins} onMarginsChange={handleMarginChange} />` inserted between `<Header>` and `<main>` inside `#app-shell`
- Both `<Preview>` instances (live and `#print-area`) receive `margins={margins}` prop
- Commit: `fdb0e1f`

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known TypeScript Issues (Expected — Not Deviations)

`Preview.tsx` does not yet accept a `margins` prop. TypeScript will report type errors on the two `margins={margins}` usages in `App.tsx`. This is explicitly noted in the plan as expected — Plan 02 updates `Preview.tsx` to consume the prop.

---

## Threat Model Coverage

| Threat ID | Mitigation | Status |
|-----------|-----------|--------|
| T-08-01 | localStorage value validation on load (number in [0,50], fallback 15) | Implemented in App.tsx margins useState initializer |
| T-08-02 | onChange guard: NaN check + clamp Math.min(50, Math.max(0, parsed)) | Implemented in MarginControls.tsx handleChange |
| T-08-03 | Accept — same risk profile as existing md2cv-content debounce writes | Accepted |

---

## Self-Check

- [x] `src/components/MarginControls.tsx` exists
- [x] `src/App.tsx` contains `md2cv-margins`, `MarginControls`, `handleMarginChange`, `margins={margins}` (×2)
- [x] Commit `73bf95c` exists (MarginControls.tsx)
- [x] Commit `fdb0e1f` exists (App.tsx wiring)

## Self-Check: PASSED
