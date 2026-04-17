---
phase: 05-export-correctness
plan: "01"
subsystem: export
tags: [css, print, dead-code-removal]
dependency_graph:
  requires: []
  provides: [print-css-inline-elements, dead-code-removed]
  affects: [src/index.css]
tech_stack:
  added: []
  patterns: [print-media-query, css-pseudo-element]
key_files:
  created: []
  modified:
    - src/index.css
  deleted:
    - src/components/ExportTarget.tsx
    - src/lib/templateInlineStyles.ts
decisions:
  - "Use #print-area a[href]::after { content: none !important } to suppress printed URL text (D-01)"
  - "ExportTarget.tsx and templateInlineStyles.ts deleted as dead code — export flow uses window.print() via Preview"
metrics:
  duration: "~5 minutes"
  completed_date: "2026-04-18"
  tasks_completed: 2
  files_changed: 3
---

# Phase 05 Plan 01: Print CSS and Dead Code Removal Summary

**One-liner:** Added print-media-query CSS to suppress link URL display and style inline code, then deleted html2pdf.js dead code (ExportTarget + templateInlineStyles).

---

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add print CSS for link URL suppression and inline code styling | cce45c7 | src/index.css |
| 2 | Delete orphaned ExportTarget and templateInlineStyles files | b749918 | src/components/ExportTarget.tsx (deleted), src/lib/templateInlineStyles.ts (deleted) |

---

## What Was Built

### Task 1: Print CSS

Added two rule blocks inside the existing `@media print {}` block in `src/index.css`:

1. `#print-area a[href]::after { content: none !important }` — Suppresses browser-injected URL text after hyperlinks in printed output (T-05-01 mitigation).
2. `#print-area code { font-family: monospace; background-color: #f3f4f6; padding: 1px 3px; border-radius: 2px; }` — Gives inline code monospace font and a subtle gray background in all templates when printing.

All pre-existing `@media print` rules (app-shell hiding, print-area show, @page A4, body reset) were preserved unchanged.

### Task 2: Dead Code Deletion

Deleted two files that are orphaned from the old html2pdf.js export path:

- `src/components/ExportTarget.tsx` — React component that rendered resume into a hidden div for html2canvas capture. The export flow now uses `window.print()` via the Preview component's `#print-area`.
- `src/lib/templateInlineStyles.ts` — Parallel inline-style map for ExportTarget to avoid oklch color crashes in html2canvas. No longer needed.

`npx tsc --noEmit` and `npm run build` both pass with no errors after deletion.

---

## Deviations from Plan

None - plan executed exactly as written.

---

## Known Stubs

None.

---

## Threat Flags

None — no new network endpoints, auth paths, or file access patterns introduced.

---

## Self-Check: PASSED

- src/index.css contains `content: none !important` — FOUND (line 36)
- src/index.css contains `#print-area code` — FOUND (line 40)
- src/components/ExportTarget.tsx does not exist in worktree — CONFIRMED
- src/lib/templateInlineStyles.ts does not exist in worktree — CONFIRMED
- Commits cce45c7 and b749918 exist — CONFIRMED
- `npm run build` succeeded with no errors
