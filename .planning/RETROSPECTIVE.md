# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — MVP

**Shipped:** 2026-04-15
**Phases:** 3 | **Plans:** 6 | **Sessions:** 2

### What Was Built
- Vite 5 + React 18 + TypeScript + Tailwind CSS v4 app shell with responsive split-pane and mobile tabs
- CodeMirror 6 editor + markdown-it token-walker parser with live preview and three switchable templates
- Full storage layer (localStorage auto-save/restore) + PDF export (html2pdf.js) + .md import/export

### What Worked
- Coarse granularity (2 plans per phase) kept phases focused and well-scoped — no mid-phase drift
- Human verification checkpoints caught the oklch/html2canvas crash before it was called "done"
- isInternalChange ref pattern for CodeMirror controlled sync worked cleanly on first attempt
- Initializing resumeData from the same localStorage source as markdownContent eliminated the empty-state flash

### What Was Inefficient
- REQUIREMENTS.md checkbox tracking fell behind — traceability table showed "Pending" for requirements that were actually shipped. Tracking should be updated at plan completion, not left for milestone archival.
- Two parallel style systems (templateStyles.ts + templateInlineStyles.ts) are maintenance overhead introduced by html2pdf.js's old html2canvas. Worth revisiting if upgrading PDF export library.

### Patterns Established
- `isInternalChange` ref guard for CodeMirror external prop sync
- Lazy `useState` initializer for localStorage reads (avoids extra effect on mount)
- Parallel inline-style map alongside Tailwind class map when third-party libs can't handle CSS custom properties
- Hidden off-screen DOM element (`left: -9999px`, `width: 794px`) for PDF capture via html2pdf.js

### Key Lessons
1. **Verify PDF export early** — html2canvas/html2pdf oklch incompatibility with Tailwind v4 is a known landmine. Test PDF generation before considering the plan complete.
2. **Update requirement checkboxes at plan commit time**, not at milestone archive — stale tracking creates unnecessary uncertainty at close.
3. **Vite version is pinned to Node.js engine** — document the Node.js version constraint explicitly (v20.11.0 → Vite 5 max) to avoid re-discovering it.

### Cost Observations
- Model mix: sonnet-dominant (balanced profile)
- Sessions: 2
- Notable: 6 plans executed in ~2 days; coarse granularity kept individual plans short and atomic

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 2 | 3 | Initial project — baseline established |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 | 0% | 0 |

### Top Lessons (Verified Across Milestones)

1. Test PDF/canvas-based exports early — third-party rendering libraries have CSS compatibility constraints that surface late.
2. Keep requirement tracking live during execution — stale checkboxes create unnecessary review work at milestone close.
