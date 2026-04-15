---
phase: 03-export-storage
plan: 01
subsystem: storage-export
tags: [localStorage, persistence, download, markdown]
dependency_graph:
  requires: []
  provides: [STOR-01, STOR-02, EXPRT-02]
  affects: [src/App.tsx, src/components/Header.tsx]
tech_stack:
  added: []
  patterns: [lazy-useState-initializer, blob-download, try-catch-localstorage]
key_files:
  modified:
    - src/App.tsx
    - src/components/Header.tsx
decisions:
  - "md2cv-content used as localStorage key for editor content"
  - "resumeData initialized from same localStorage source as markdownContent for consistency"
  - "Download filename slugified from h1 name; falls back to resume.md when name is empty"
metrics:
  duration: ~10min
  completed_date: "2026-04-15"
  tasks_completed: 2
  files_modified: 2
---

# Phase 03 Plan 01: localStorage Auto-Save + Download MD Summary

**One-liner:** localStorage persistence with 150ms debounce auto-save/restore and Blob-based markdown file download with h1-derived filename.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add localStorage auto-save and restore to App.tsx | e4d0c01 | src/App.tsx |
| 2 | Add Download MD button and wire download handler | 7cb7d38 | src/App.tsx, src/components/Header.tsx |

---

## What Was Built

**Task 1 — localStorage auto-save and restore:**
- `markdownContent` useState now uses a lazy initializer that reads `localStorage.getItem('md2cv-content')` first, falling back to `SAMPLE_RESUME`
- `resumeData` useState also reads from the same localStorage key so the parsed data is consistent with restored content
- `handleMarkdownChange` debounce callback saves to `localStorage.setItem('md2cv-content', value)` after parsing — fires 150ms after typing stops
- All localStorage calls wrapped in try/catch for silent fail on quota errors or security restrictions

**Task 2 — Download MD button:**
- `handleDownloadMd` in App.tsx slugifies `resumeData.name` (lowercase, trim, spaces→hyphens, strip non-alphanumeric), falls back to `resume` if empty, appends `.md`
- Creates a `Blob` with `text/markdown` type, creates an object URL, triggers click on a temporary anchor element, then revokes the URL
- `Header.tsx` `HeaderProps` interface extended with `onDownloadMd: () => void`
- Placeholder `<div>` replaced with a styled `<button>` rendering "Download MD"
- App.tsx passes `onDownloadMd={handleDownloadMd}` to `<Header>`

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None — all functionality fully wired.

---

## Threat Flags

None — no new network endpoints or trust boundaries introduced beyond what was in the plan's threat model.

---

## Self-Check: PASSED

- src/App.tsx — modified, committed e4d0c01 + 7cb7d38
- src/components/Header.tsx — modified, committed 7cb7d38
- localStorage.getItem('md2cv-content') appears twice in App.tsx (lines 29, 38)
- localStorage.setItem('md2cv-content', value) appears once in debounce callback (line 53)
- Download MD button present in Header.tsx with onDownloadMd handler
- No placeholder div remaining in Header.tsx
