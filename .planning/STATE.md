---
gsd_state_version: 1.0
milestone: v1.1.0
milestone_name: Support text styles & HTML
status: roadmap_complete
stopped_at: Roadmap created — Phase 4 and Phase 5 defined
last_updated: "2026-04-16T00:00:00.000Z"
progress:
  total_phases: 2
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# State: md2cv

*Project memory. Updated at each session boundary.*

---

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-16)

**Core value:** Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.
**Current focus:** Milestone v1.1.0 — Support text styles & HTML

---

## Current Position

Phase: Phase 4 — Inline Styles & HTML Preview (not started)
Plan: —
Status: Roadmap complete, ready to plan Phase 4
Last activity: 2026-04-16 — v1.1.0 roadmap created

Progress: [----------] 0% (0/2 phases complete)

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
- **D-10:** MarkdownIt() instantiated without html:true — XSS mitigation; extra fields contain escaped HTML only (NOTE: v1.1.0 will enable html:true — personal tool, no other users)
- **D-11:** CodeMirror Editor uses isInternalChange ref to guard external prop sync, preventing cursor-jumping loops
- **D-12:** Bullet list items extracted at level=2 (list_item > paragraph > inline nesting in markdown-it token tree)
- **D-13:** Three templates implemented as Tailwind class maps keyed by TemplateName union ('classic'|'modern'|'minimal') — no separate component files per template
- **D-14:** debounceRef uses ReturnType<typeof setTimeout> for environment-agnostic timer typing
- **D-15:** localStorage template value validated against explicit allowlist before use (T-02-07 mitigation)
- **D-16:** resumeData initialized with parseResume(SAMPLE_RESUME) to prevent empty-state flash on first load
- **D-17:** ExportTarget uses inline CSSProperties (hex/rgb only) instead of Tailwind classes to avoid oklch color function errors in html2canvas
- **D-18:** templateInlineStyles.ts is a separate file from templateStyles.ts — Preview keeps Tailwind classes, ExportTarget uses inline styles

### Active Todos

*(None)*

### Blockers

*(None)*

---

## Session Continuity

**Last session:** 2026-04-16
**Stopped at:** v1.1.0 roadmap created — Phase 4 (Inline Styles & HTML Preview) and Phase 5 (Export Correctness) defined
**Next action:** `/gsd-plan-phase 4`

---

*Last updated: 2026-04-16 — v1.1.0 roadmap created*
