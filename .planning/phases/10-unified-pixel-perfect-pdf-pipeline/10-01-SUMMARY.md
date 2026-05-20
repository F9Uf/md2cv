---
phase: 10-unified-pixel-perfect-pdf-pipeline
plan: "01"
subsystem: pdf-export
tags:
  - pdf-export
  - paged-js
  - print-css
  - react
dependency_graph:
  requires:
    - "Phase 9: pagedjs-scale-wrapper @media print reset in pages.css"
    - "Phase 8: margins state and MarginValues type in App.tsx"
  provides:
    - "Unified paged.js render path for both on-screen preview and PDF export"
    - "Off-screen #print-area with real layout for paged.js measurement"
    - "@page { margin: 0 } in @media print — no double gutter"
  affects:
    - "src/App.tsx — print-mount enablePagination changed"
    - "src/index.css — @page rule and #print-area positioning changed"
tech_stack:
  added: []
  patterns:
    - "Two-Previewer pattern: on-screen + off-screen paged.js Previewer instances"
    - "Off-screen absolute positioning (left: -9999px) for paged.js real-layout measurement"
    - "Print-time neutralization: position: static; left: auto in @media print"
key_files:
  created: []
  modified:
    - src/App.tsx
    - src/index.css
decisions:
  - "Used enablePagination={true} explicitly (not prop omission) for clarity per D-02"
  - "aria-hidden=\"true\" added to #print-area div per T-10-02 mitigation"
  - "pages.css verified byte-identical — no edits made in Task 3"
metrics:
  duration: "~2 minutes"
  completed_date: "2026-05-20"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 2
  files_created: 0
---

# Phase 10 Plan 01: Unified Pixel-Perfect PDF Pipeline — Core Wiring Summary

**One-liner:** Flip #print-area Preview to paged.js-rendered via enablePagination={true}, park it off-screen (left: -9999px) for real layout, and delete the static @page { margin: 15mm } in favor of @page { margin: 0 }.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Flip #print-area to paged.js-rendered (App.tsx) | c3b90e6 | src/App.tsx |
| 2 | Refactor src/index.css — @page margin:0, off-screen positioning | d6b2e49 | src/index.css |
| 3 | Verify pages.css invariants (Phase 9 rules preserved) | (no commit — verification only, no edits) | src/styles/pages.css |

## Changes Made

### src/App.tsx (Task 1)

Changed lines 165-167 (the `#print-area` block):

**Before:**
```tsx
<div id="print-area">
  <Preview htmlContent={htmlContent} template={selectedTemplate} enablePagination={false} margins={margins} />
</div>
```

**After:**
```tsx
<div id="print-area" aria-hidden="true">
  <Preview htmlContent={htmlContent} template={selectedTemplate} enablePagination={true} margins={margins} />
</div>
```

- `enablePagination={false}` → `enablePagination={true}`: The off-screen print-mount now runs its own paged.js Previewer (D-02). Both on-screen and print-mount instances go through the same paged.js render effect in Preview.tsx:38-97, including the same `pagedjs_inline` stylesheet path that injects the user's configured margins as `@page { size: A4 portrait; margin: Xmm Xmm Xmm Xmm }`.
- `aria-hidden="true"` added: Prevents assistive technology from double-announcing the off-screen resume content (T-10-02 mitigation).
- `handleExportPdf` (lines 90-96) unchanged — the h1 → document.title trick and `window.print()` call are byte-identical to their pre-phase state.
- The on-screen `preview` const on line 138 is unchanged.

### src/index.css (Task 2)

File rewritten with four substantive changes:

1. **Deleted** `@page { size: A4 portrait; margin: 15mm }` — the static 15mm gutter contradicted and overrode the dynamic margin paged.js injects via `pagedjs_inline` (D-04).

2. **Added** `@page { size: A4 portrait; margin: 0 }` inside `@media print` — tells the browser print engine the physical page has no gutter, so paged.js's per-page margins (already baked inside each `.pagedjs_page`) are not doubled (D-04a).

3. **Replaced** screen-side `#print-area { display: none }` with off-screen absolute positioning:
   ```css
   #print-area {
     position: absolute;
     left: -9999px;
     top: 0;
     width: 210mm;
   }
   ```
   paged.js requires real layout (not `display:none`) to measure `.pagedjs_page` dimensions correctly (D-03).

4. **Added** `position: static; left: auto` to the existing `@media print #print-area` rule — neutralizes the off-screen offset so the browser print engine sees the print-mount in normal document flow (D-03).

### src/styles/pages.css (Task 3 — verification only)

No edits made. All Phase 9 invariants confirmed present:

- `.pagedjs-scale-wrapper { zoom: 1 !important; transform: none !important; height: auto !important }` — the load-bearing mobile PDF parity rule (D-06). Present verbatim.
- `.pagedjs_page { box-shadow: none; border: none; margin-bottom: 0 }` inside `@media print` — chrome strip rule (D-07). Present.
- `git diff src/styles/pages.css` produces zero output (file unchanged).

## Verification

```
npm run build    ✓  (tsc -b + vite build, no TypeScript errors)
npm run lint     ✓  (eslint ., no new warnings)
```

The pre-existing chunk size warning (`index-DXzNX2dK.js: 1,320.68 kB`) is not caused by these changes — it predates Phase 10.

## Deviations from Plan

None — plan executed exactly as written.

- Task 1: Used `enablePagination={true}` explicitly rather than omitting the prop. Both are equivalent (default is `true`), but explicit is clearer for a second Previewer instance.
- Task 2: File written to exact content specified in the plan.
- Task 3: Verification passed with no intervention needed.

## Known Stubs

None. This plan wires behavior (off-screen paged.js mount + correct print CSS) — no placeholder data, no TODO comments introduced.

## Threat Flags

No new threat surface introduced. T-10-02 (`aria-hidden="true"` on #print-area) is mitigated as planned. T-10-01 (DOMPurify sanitization of off-screen content) continues to apply via the shared Preview component code path.

## Self-Check: PASSED

Files confirmed:
- src/App.tsx: contains `enablePagination={true}` and `aria-hidden="true"` on #print-area
- src/index.css: contains `left: -9999px`, `width: 210mm`, `position: static`, `@page { margin: 0 }`; does NOT contain `margin: 15mm`
- src/styles/pages.css: unchanged (git diff is empty)

Commits confirmed:
- c3b90e6: feat(10-01): flip #print-area Preview to enablePagination={true}
- d6b2e49: refactor(10-01): rewrite index.css — @page margin:0, off-screen #print-area
