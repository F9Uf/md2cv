---
gsd_state_version: 1.0
milestone: v1.2.0
milestone_name: Support render HTML with Tailwind classes
status: executing
stopped_at: Phase 6 UI-SPEC approved
last_updated: "2026-04-25T16:35:04.616Z"
progress:
  total_phases: 2
  completed_phases: 1
  total_plans: 5
  completed_plans: 3
  percent: 60
---

# State: md2cv

*Project memory. Updated at each session boundary.*

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-24)

**Core value:** Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.
**Current focus:** Phase --phase — 06

---

## Current Position

Phase: --phase (06) — EXECUTING
Plan: 1 of --name
**Phase:** 6
**Plan:** 2 plans ready (06-01, 06-02)
**Status:** Executing Phase --phase

```
Progress: [          ] 0% (0/2 phases)
```

---

## Deferred Items

Items acknowledged and deferred at milestone close on 2026-04-24:

| Category | Item | Status |
|----------|------|--------|
| verification | Phase 04: 04-VERIFICATION.md | human_needed |
| quick_task | 260415-05x-add-dark-mode-styling-to-the-codemirror | missing |
| requirement | STYLE-05 — Inline styles in PDF export | dropped with Phase 5 |
| requirement | HTML-03 — HTML renders in PDF export | dropped with Phase 5 |

Known deferred items at close: 4 (see above)

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

---

## Session Continuity

**Last session:** --stopped-at
**Stopped at:** Phase 6 UI-SPEC approved
**Next action:** `/gsd-execute-phase 6`

---

*Last updated: 2026-04-25 — v1.2.0 roadmap created*
