---
phase: "03-export-storage"
plan: "02"
subsystem: "export"
tags: [pdf-export, html2pdf, inline-styles, tailwind-oklch-fix, import-md]
dependency_graph:
  requires: ["03-01"]
  provides: ["EXPRT-01", "STOR-03"]
  affects: ["src/components/ExportTarget.tsx", "src/lib/templateInlineStyles.ts", "src/App.tsx", "src/components/Header.tsx"]
tech_stack:
  added: ["html2pdf.js", "FileReader API", "templateInlineStyles.ts"]
  patterns: ["inline CSSProperties for html2canvas-safe rendering", "hidden off-screen DOM element for PDF capture"]
key_files:
  created:
    - src/components/ExportTarget.tsx
    - src/lib/templateInlineStyles.ts
  modified:
    - src/App.tsx
    - src/components/Header.tsx
decisions:
  - "D-17: ExportTarget uses inline CSSProperties (hex/rgb only) instead of Tailwind classes to avoid oklch color function errors in html2canvas"
  - "D-18: templateInlineStyles.ts is a separate file from templateStyles.ts — Preview keeps Tailwind classes, ExportTarget uses inline styles"
metrics:
  duration_minutes: 20
  completed_date: "2026-04-15"
  tasks_completed: 3
  files_modified: 4
---

# Phase 03 Plan 02: PDF Export and MD Import Summary

**One-liner:** PDF export (html2pdf.js from hidden 794px ExportTarget) and .md file import via FileReader, with oklch crash fixed by replacing Tailwind classes with inline hex/rgb CSSProperties in ExportTarget.

---

## What Was Built

1. **ExportTarget component** — hidden off-screen element (`left: -9999px`, `width: 794px`) that renders the resume using inline styles only. Used by html2pdf.js to produce an A4 PDF.

2. **templateInlineStyles.ts** — a parallel style map to `templateStyles.ts` that provides `CSSProperties` objects with hex/rgb colors for all three templates (classic, modern, minimal). No Tailwind, no oklch.

3. **handleExportPdf in App.tsx** — calls `html2pdf().set(...).from(element).save()` with A4 config, 15mm margins, scale 2 for print quality.

4. **handleImportMd / handleFileChange in App.tsx** — hidden `<input type="file" accept=".md">` triggered by Import MD button; reads file via FileReader and feeds content through `handleMarkdownChange` (which auto-saves to localStorage).

5. **Export PDF and Import MD buttons in Header.tsx** — Export PDF is blue (primary action), Import MD is gray.

---

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Replaced Tailwind classes with inline styles in ExportTarget to fix oklch crash**

- **Found during:** Human verification of Task 3 checkpoint
- **Issue:** html2pdf.js uses an old html2canvas that cannot parse `oklch()` color functions. Tailwind CSS v4 generates CSS custom properties using oklch (e.g., `--color-gray-50: oklch(...)`). These leaked into ExportTarget's computed styles and caused a fatal parse error, producing no PDF.
- **Fix:** Created `src/lib/templateInlineStyles.ts` with `CSSProperties` objects using hex/rgb values only. Rewrote `ExportTarget.tsx` to use `style={...}` props throughout — no `className` usage.
- **Files modified:** `src/components/ExportTarget.tsx`, `src/lib/templateInlineStyles.ts` (new)
- **Commit:** a415ed9

---

## Known Stubs

None — all resume data is wired from live editor state through `resumeData` prop.

---

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced.

---

## Self-Check: PASSED

- `src/components/ExportTarget.tsx` exists with `id="export-target"`, `left: '-9999px'`, `width: '794px'`
- `src/lib/templateInlineStyles.ts` exists with three template style maps
- `src/App.tsx` contains `handleExportPdf`, `handleImportMd`, `ExportTarget` in JSX
- `src/components/Header.tsx` contains "Export PDF" and "Import MD" buttons
- TypeScript compiles with no errors (`tsc --noEmit`)
- Commit a415ed9 exists in git log
