---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: executing
stopped_at: Checkpoint 02-02 Task 3 — awaiting human visual verification
last_updated: "2026-04-14T17:00:02Z"
progress:
  total_phases: 3
  completed_phases: 1
  total_plans: 4
  completed_plans: 3
  percent: 75
---

# State: md2cv

*Project memory. Updated at each session boundary.*

---

## Project Reference

**Core Value:** Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.
**Current Focus:** Phase 02 — editor-parsing-live-preview

---

## Current Position

Phase: 02 (editor-parsing-live-preview) — EXECUTING
Plan: 2 of 2 (02-01 complete, 02-02 pending)
**Phase:** 2 — Editor, Parsing & Live Preview
**Plan:** 02-02 tasks 1+2 complete — at checkpoint awaiting visual verification
**Status:** Executing Phase 02 (checkpoint)
**Progress:** [████████░░] 75%

| Phase | Status |
|-------|--------|
| 1. Foundation & Layout | Complete (2/2 plans) |
| 2. Editor, Parsing & Live Preview | 02-01 complete (editor + parser), 02-02 pending (preview + templates) |
| 3. Export & Storage | Not started |

---

## Performance Metrics

- Phases complete: 1/3
- Plans complete: 2
- Requirements delivered: 3/17 (LAYO-01, LAYO-02, LAYO-03)

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
- **D-10:** MarkdownIt() instantiated without html:true — XSS mitigation; extra fields contain escaped HTML only
- **D-11:** CodeMirror Editor uses isInternalChange ref to guard external prop sync, preventing cursor-jumping loops
- **D-12:** Bullet list items extracted at level=2 (list_item > paragraph > inline nesting in markdown-it token tree)
- **D-13:** Three templates implemented as Tailwind class maps keyed by TemplateName union ('classic'|'modern'|'minimal') — no separate component files per template
- **D-14:** debounceRef uses ReturnType<typeof setTimeout> for environment-agnostic timer typing
- **D-15:** localStorage template value validated against explicit allowlist before use (T-02-07 mitigation)
- **D-16:** resumeData initialized with parseResume(SAMPLE_RESUME) to prevent empty-state flash on first load

### Active Todos

*(None)*

### Blockers

*(None)*

---

## Session Continuity

**Last session:** 2026-04-14T17:00:02Z
**Stopped at:** Checkpoint 02-02 Task 3 — awaiting human visual verification of editor-preview pipeline
**Next action:** Verify app visually (npm run dev), then continue execution of 02-02 Task 3

---

*Last updated: 2026-04-14 after Phase 2 context discussion*
