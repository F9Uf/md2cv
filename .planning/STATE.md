---
gsd_state_version: 1.0
milestone: v1.3.0
milestone_name: Support preview with realistic page
status: planning
stopped_at: Phase 8 UI-SPEC approved
last_updated: "2026-05-18T15:50:00.000Z"
last_activity: 2026-05-18
progress:
  total_phases: 4
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
  percent: 100
---

# State: md2cv

*Project memory. Updated at each session boundary.*

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-05-18)

**Core value:** Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.
**Current focus:** Phase 07 — page-chrome-auto-pagination

---

## Current Position

Phase: 8
Plans: 2 plans ready
Status: Ready to execute
Last activity: 2026-05-18

```
Progress: [          ] 0% (0/4 phases complete in v1.3.0)
```

**v1.3.0 phase sequence:**

- Phase 7: Page Chrome & Auto Pagination (PREV-01, PREV-02, PREV-03)
- Phase 8: Configurable Margins (MARG-01, MARG-02, MARG-03)
- Phase 9: Responsive Auto-Fit Zoom (ZOOM-01)
- Phase 10: Unified Pixel-Perfect PDF Pipeline (PDFX-01, PDFX-02)

---

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-04-24:

| Category | Item | Status |
|----------|------|--------|
| verification | Phase 04: 04-VERIFICATION.md | human_needed |
| quick_task | 260415-05x-add-dark-mode-styling-to-the-codemirror | missing |
| requirement | STYLE-05 — Inline styles in PDF export | dropped with Phase 5 |
| requirement | HTML-03 — HTML renders in PDF export | dropped with Phase 5 |

| quick_task | 260415-05x-add-dark-mode-styling-to-the-codemirror (v1.2.0) | false positive — SUMMARY.md exists, task complete |

Known deferred items at close: 5 (see above)

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

---

## Session Continuity

**Last session:** --stopped-at
**Stopped at:** Phase 8 UI-SPEC approved
**Next action:** `/gsd-execute-phase 7` to execute Phase 7 (Page Chrome & Auto Pagination — PREV-01, PREV-02, PREV-03)

---

*Last updated: 2026-05-18 — quick task 260518-vgl completed (paged.js StrictMode duplicate-page fix)*

**Planned Phase:** 07 (page-chrome-auto-pagination) — 3 plans — 2026-05-18T04:11:03.710Z
