---
gsd_state_version: 1.0
milestone: v1.4.0
milestone_name: Support GitHub repository
status: executing
stopped_at: Phase 13 UI-SPEC approved
last_updated: "2026-07-06T07:32:44.843Z"
last_activity: 2026-07-06 -- Phase 13 planning complete
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 18
  completed_plans: 12
  percent: 67
---

# State: md2cv

*Project memory. Updated at each session boundary.*

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-21 after v1.3.0 close)

**Core value:** Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.
**Current focus:** Phase 12 — repo-sync-toolbar

---

## Current Position

Phase: 12 (repo-sync-toolbar) — EXECUTING
Plan: 1 of 7
Status: Ready to execute
Last activity: 2026-07-06 -- Phase 13 planning complete

**Roadmap:**

- [x] Phase 11: GitHub Auth Foundation — AUTH-01, AUTH-02, AUTH-03 (completed 2026-07-05)
- [ ] Phase 12: Repo Sync & Toolbar — SYNC-01..05, TOOL-01
- [ ] Phase 13: File Tree Sidebar — TREE-01..04

---

## Deferred Items

### Acknowledged at v1.3.0 close (2026-05-21)

| Category | Item | Status |
|----------|------|--------|
| verification | Phase 08: 08-VERIFICATION.md | human_needed — cosmetic UI deviations only (`bg-gray-700` vs spec, label case, SVG vs text Reset); all 3 functional requirements MARG-01/02/03 SATISFIED; user accepted by shipping |
| quick_task | 260518-vgl-fix-duplicate-first-page-bug-on-page-ref | complete — committed c3924c2; audit-open scan does not match its SUMMARY naming convention |
| quick_task | 260521-m56-fix-preview-blink-during-editor-updates- | complete — committed d4354fa; same false-positive class as 260518-vgl |
| quick_task | 260415-05x-add-dark-mode-styling-to-the-codemirror- | false positive — SUMMARY.md exists, previously acknowledged at v1.2.0 close |
| housekeeping | Stray `.planning/phases/06-use-html2canvas-jspdf-...` (abandoned v1.2 work) | resolved — git rm during v1.3.0 close |

### Acknowledged at v1.1.0 close (2026-04-24)

| Category | Item | Status |
|----------|------|--------|
| verification | Phase 04: 04-VERIFICATION.md | human_needed |
| quick_task | 260415-05x-add-dark-mode-styling-to-the-codemirror | missing |
| requirement | STYLE-05 — Inline styles in PDF export | dropped with Phase 5 |
| requirement | HTML-03 — HTML renders in PDF export | dropped with Phase 5 |

---

## Accumulated Context

### Key Decisions

- **D-01:** Vite 5 (not 6/7) used due to Node.js v20.11.0 constraint — newer create-vite requires ^20.19.0
- **D-02:** Tailwind CSS v4 integrated via @tailwindcss/vite plugin (no postcss.config.js needed)
- **D-03:** App shell uses h-screen + overflow-hidden for full-viewport layout with fixed header
- **D-04:** Header is h-12 dark bar (bg-gray-900) with branding left and placeholder slots right
- **D-05:** Mobile tabs rendered at top of viewport area (above content, below header)
- **D-06:** Editor tab is active by default on mobile
- **D-07:** Default split ratio is 50/50 on first load
- **D-08:** Minimum pane width is 20% each side (max 80%) to prevent pane collapse
- **D-09:** Split ratio persisted to localStorage under key 'md2cv-split-ratio'; range-validated on read (NaN rejected, fallback 0.5)
- **D-10:** MarkdownIt() instantiated with `html: true` — XSS accepted (personal tool, no other users)
- **D-11:** CodeMirror Editor uses isInternalChange ref to guard external prop sync, preventing cursor-jumping loops
- **D-12:** Bullet list items extracted at level=2 (list_item > paragraph > inline nesting in markdown-it token tree)
- **D-13:** Three templates implemented as Tailwind class maps keyed by TemplateName union ('classic'|'modern'|'minimal') — no separate component files per template
- **D-14:** debounceRef uses ReturnType<typeof setTimeout> for environment-agnostic timer typing
- **D-15:** localStorage template value validated against explicit allowlist before use (T-02-07 mitigation)
- **D-16:** resumeData initialized with parseResume(SAMPLE_RESUME) to prevent empty-state flash on first load
- **D-17:** ExportTarget uses inline CSSProperties (hex/rgb only) instead of Tailwind classes to avoid oklch color function errors in html2canvas
- **D-18:** templateInlineStyles.ts is a separate file from templateStyles.ts — Preview keeps Tailwind classes, ExportTarget uses inline styles
- **D-19:** `md.renderInline()` used to convert bullet detail content to HTML strings — dangerouslySetInnerHTML used in Preview and ExportTarget to render them

### Active Todos

*(None)*

### Blockers

*(None)*

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260518-vgl | Fix duplicate first page bug on initial mount / refresh (pagedjs + React 18 StrictMode) | 2026-05-18 | c3924c2 | [260518-vgl-fix-duplicate-first-page-bug-on-page-ref](./quick/260518-vgl-fix-duplicate-first-page-bug-on-page-ref/) |
| 260521-m56 | Fix preview blink during editor updates (zoom-fit reset on reflow) | 2026-05-21 | d4354fa | [260521-m56-fix-preview-blink-during-editor-updates-](./quick/260521-m56-fix-preview-blink-during-editor-updates-/) |
| 260521-vq8 | Refactor: extract usePagedjsPreview hook to remove duplicated paged.js lifecycle in Preview.tsx and PrintMount.tsx | 2026-05-21 | e598bc2 | [260521-vq8-refactor-code-by-reusing-redundant-compo](./quick/260521-vq8-refactor-code-by-reusing-redundant-compo/) |
| 260704-op6 | Fix preview/print pagination mismatch under zoom (paged.js measured inside zoomed wrapper, dropping content on overflow) | 2026-07-04 | 7266a96 | [260704-op6-fix-preview-pagination-mismatch-under-zo](./quick/260704-op6-fix-preview-pagination-mismatch-under-zo/) |
| 260704-ptj | Print the preview's exact pages — mirror preview pagination into #print-area instead of a second paged.js pass | 2026-07-04 | 98f3a3f | [260704-ptj-print-the-preview-s-exact-pages-mirror-p](./quick/260704-ptj-print-the-preview-s-exact-pages-mirror-p/) |
| 260521-w4e | Fix: PDF export emitted a trailing blank page when content fit on one page — override paged.js's polyfill `break-after: page` on `.pagedjs_page:last-child` in print CSS | 2026-05-21 | 61253f8 | [260521-w4e-fix-pdf-export-extra-blank-page-when-con](./quick/260521-w4e-fix-pdf-export-extra-blank-page-when-con/) |

---

## Session Continuity

**Last session:** 2026-07-06T07:11:41.395Z
**Stopped at:** Phase 13 UI-SPEC approved
**Next action:** Execute Phase 12 (`/gsd-execute-phase 12`)

---

*Last updated: 2026-07-05 — Roadmap for v1.4.0 (Support GitHub repository) created*
