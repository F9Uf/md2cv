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

## Milestone: v1.1.0 — Support text styles & HTML

**Shipped:** 2026-04-24
**Phases:** 1 | **Plans:** 2

### What Was Built
- MarkdownIt configured with `html: true` for full HTML pass-through
- Bullet details stored as HTML strings via `md.renderInline()` — bold, italic, code, links in bullet points
- Preview.tsx and ExportTarget.tsx updated to render detail items via `dangerouslySetInnerHTML`

### What Worked
- Single-phase milestone kept scope tight and execution fast
- renderInline() was the right call — wraps no `<p>` tags, clean output for list items

### What Was Inefficient
- Verification status left as `human_needed` — carried forward until v1.2.0 close rather than resolved promptly

### Patterns Established
- `html: true` as the MarkdownIt default for personal tools (XSS accepted, no multi-user surface)
- `dangerouslySetInnerHTML` pattern for `<li>` detail items — consistent with existing `extra` field pattern

### Key Lessons
1. **Close human verification prompts at the end of the session** — leaving them as `human_needed` creates noise at milestone close.

---

## Milestone: v1.2.0 — Support render HTML with Tailwind classes

**Shipped:** 2026-04-26
**Phases:** 2 | **Plans:** 5

### What Was Built
- Token-walking parser replaced with `md.render()` — parseResume.ts reduced from ~120 lines to 5; ResumeData type eliminated
- Template styles restructured from semantic keys to HTML element tags (13-key TemplateClasses interface)
- CSS theme architecture with Tailwind v4 `@custom-variant` for scoped per-template element styles
- Tailwind Play CDN for runtime utility class resolution; DOMPurify configured with `ADD_ATTR: ['class']`

### What Worked
- Test-first (Plan 05-01 wrote failing tests before implementation) gave a clear RED → GREEN signal for the parser swap
- Discovering `@custom-variant` as the correct Tailwind v4 mechanism early prevented wasted time on `@layer base`
- Human browser verification checkpoint at plan 06-02 caught style tuning opportunities before ship

### What Was Inefficient
- DOMPurify stripping `class` attributes was caught only at verification, not during planning — should have been a noted risk in the Phase 6 plan
- `@reference "tailwindcss"` directive needed for `@apply` in separate CSS files wasn't documented in the plan; discovered during build

### Patterns Established
- `@custom-variant theme-X (.theme-X &)` for scoped Tailwind v4 CSS — valid alternative to `@layer base` descendant selectors
- `DOMPurify.sanitize(html, { ADD_ATTR: ['class'] })` when sanitizing user HTML that needs class passthrough
- Play CDN in `<head>` (synchronous, no defer) for runtime Tailwind class resolution

### Key Lessons
1. **Plan for DOMPurify attribute stripping** when wiring user-authored HTML through sanitization — `class`, `style`, and `href` are commonly stripped.
2. **Check Tailwind v4 `@apply` requirements upfront** — `@apply` in separate CSS files requires `@reference "tailwindcss"` directive.
3. **Test-first pays off for pipeline rewrites** — writing the HTML string contract tests before changing `parseResume.ts` made the migration mechanical and confident.

### Cost Observations
- Model mix: sonnet-dominant
- Sessions: ~4
- Notable: Phase 5 plan granularity (3 plans) was appropriate; Phase 6 (2 plans) was tight but executed cleanly

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 2 | 3 | Initial project — baseline established |
| v1.1.0 | 1 | 1 | Inline HTML/markdown rendering in bullets |
| v1.2.0 | ~4 | 2 | Parser rewrite + Tailwind CSS runtime |

### Cumulative Quality

| Milestone | Tests | LOC (src) | Notes |
|-----------|-------|-----------|-------|
| v1.0 | 0 | ~1,100 | Baseline |
| v1.1.0 | 0 | ~1,100 | Minimal code change |
| v1.2.0 | 15 | ~633 | Parser simplification reduced LOC significantly |

### Top Lessons (Verified Across Milestones)

1. Test PDF/canvas-based exports early — third-party rendering libraries have CSS compatibility constraints that surface late.
2. Keep requirement tracking live during execution — stale checkboxes create unnecessary review work at milestone close.
3. Close human verification prompts within the same session — leaving them open carries noise into future milestone close.
4. DOMPurify strips `class` and other attributes by default — plan for this when sanitizing user-authored HTML that needs passthrough.
