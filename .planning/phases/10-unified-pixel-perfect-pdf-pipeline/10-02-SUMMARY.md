---
phase: 10-unified-pixel-perfect-pdf-pipeline
plan: "02"
subsystem: dependency-cleanup
tags:
  - dependency-cleanup
  - documentation
  - tech-stack
dependency_graph:
  requires: []
  provides:
    - "package.json clean of html2pdf.js (supply-chain surface reduced)"
    - "README.md and CLAUDE.md accurate tech-stack descriptions"
  affects:
    - "npm install / lockfile consumers"
    - "Any agent reading CLAUDE.md for project context"
tech_stack:
  added: []
  removed:
    - "html2pdf.js ^0.14.0"
    - "@types/html2pdf.js ^0.10.0"
  patterns:
    - "browser-native print over paged.js DOM (documented in CLAUDE.md and README.md)"
key_files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - README.md
    - CLAUDE.md
decisions:
  - "D-05 confirmed: html2pdf.js and @types/html2pdf.js removed (dead since Phase 6); PROJECT.md update deferred to end-of-phase transition per CONTEXT.md <deferred>"
metrics:
  duration: "3 minutes"
  completed: "2026-05-20"
  tasks_completed: 3
  tasks_total: 3
  files_changed: 4
---

# Phase 10 Plan 02: Dependency Cleanup & Doc Update Summary

**One-liner:** Removed dead html2pdf.js deps (21 packages gone from lockfile) and updated README.md + CLAUDE.md tech-stack bullets to reflect the paged.js + browser print pipeline.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Remove html2pdf.js and @types/html2pdf.js from package.json + regenerate package-lock.json | 312c03d | package.json, package-lock.json |
| 2 | Update README.md tech-stack PDF line | 0e3b56d | README.md |
| 3 | Update CLAUDE.md tech-stack line (inside GSD project block) | 0fcec60 | CLAUDE.md |

---

## Deps Removed

### Direct (from package.json)

| Package | Pre-removal version | Scope |
|---------|---------------------|-------|
| `html2pdf.js` | ^0.14.0 | dependencies |
| `@types/html2pdf.js` | ^0.10.0 | devDependencies |

### Transitive packages removed from package-lock.json

21 entries dropped in total:

- `@types/html2pdf.js`
- `@types/pako`
- `@types/raf`
- `base64-arraybuffer`
- `canvg`
- `core-js`
- `css-line-break`
- `fast-png`
- `fflate`
- `html2canvas`
- `html2pdf.js`
- `iobuffer`
- `jspdf`
- `pako`
- `performance-now`
- `raf`
- `rgbcolor`
- `stackblur-canvas`
- `svg-pathdata`
- `text-segmentation`
- `utrie`

No other package versions were bumped. The diff was limited to html2pdf.js and its transitives exactly as expected.

---

## Documentation Changes

### README.md (line 32)

**Before:** `- **html2pdf.js / jsPDF** — client-side PDF export`

**After:** `- **paged.js + browser print** — paginated DOM rendered in-browser, exported via the browser's native Save-as-PDF`

### CLAUDE.md (line 14, inside `<!-- GSD:project-start -->` block)

**Before:** `- **Tech stack**: markdown-it for parsing, CodeMirror for editor, html2pdf.js or jsPDF for PDF export`

**After:** `- **Tech stack**: markdown-it for parsing, CodeMirror for editor, paged.js for pagination, browser print for PDF export`

---

## PROJECT.md Note (Deferred)

Per CONTEXT.md `<deferred>` and D-05, PROJECT.md tech-stack and tech-debt sections still reference html2pdf.js (lines 77 and 80). These updates are **deferred to the end-of-phase transition step** (`/gsd-transition`) — not handled in this plan. The CLAUDE.md edit here is the operative change for agent context; the transition regenerator will carry the equivalent update into PROJECT.md at close.

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Verification Results

- `npm run build` passed (zero errors, zero TypeScript errors)
- `npm run lint` passed (zero errors)
- `git diff --stat` shows exactly the four files listed in `files_modified`
- Zero html2pdf.js references in package.json, package-lock.json, README.md, CLAUDE.md
- Zero html2pdf.js usages in src/ (confirmed before and after)

---

## Known Stubs

None — this plan is documentation-only and dependency cleanup; no UI or data flow involved.

---

## Threat Flags

None — removing deps reduces supply-chain surface; no new network endpoints, auth paths, or schema changes introduced.

---

## Self-Check: PASSED

- package.json exists and contains no html2pdf.js: PASS
- package-lock.json exists and contains no html2pdf.js: PASS
- README.md contains "paged.js + browser print": PASS
- CLAUDE.md contains "paged.js for pagination, browser print for PDF export": PASS
- Commits 312c03d, 0e3b56d, 0fcec60 all present in git log: PASS
