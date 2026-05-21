# Phase 7: Page Chrome & Auto Pagination - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace today's continuous flowing `<div>` preview with one or more real A4-sized page rectangles (210×297mm) that show visible inner margins, auto-flow content across pages when it overflows, and display a live "Page X of N" indicator that updates within ~150ms as the user types.

In scope:
- A4 page chrome on screen (one or more page rectangles)
- Multi-page auto-flow when content overflows page 1
- Live "Page X of N" indicator
- Collapsing back to one page when content shrinks

Out of scope for this phase (delivered in later phases of v1.3.0):
- Configurable margins via UI inputs — Phase 8
- Auto-fit-to-pane-width scaling — Phase 9
- Unifying preview and PDF rendering path / retiring `templateInlineStyles.ts` — Phase 10

Out of scope for this milestone:
- Manual page-break markers in markdown (PAGEBREAK-01) — future
- Paper sizes other than A4 (PAPER-01, PAPER-02) — future
- Manual zoom controls (ZOOM-02) — future

</domain>

<decisions>
## Implementation Decisions

### Pagination Approach
- **D-01:** Use **paged.js polyfill** to render A4 page boxes on screen. It implements W3C CSS Paged Media (`@page`, `break-*`, `counter(page) / counter(pages)`) in the browser, so the preview uses the same paged-media model the existing print stylesheet already uses. This is also the strongest foundation for Phase 10 PDF parity.
- **D-02:** Page reflow runs on the **existing 150ms debounce** already used for `htmlContent` in `App.tsx` (`debounceRef`). Pagination is not put on a slower secondary cadence — same trigger as the current HTML update keeps the indicator within the ~150ms requirement in PREV-03.

### Page Count Source
- **D-03:** "Page X of N" reads from **paged.js's native page counters** (Previewer's emitted page count / `counter(pages)` value), not from counting DOM nodes by class. Single source of truth — the counter cannot drift from what paged.js actually rendered.

### Default Margin (this phase only)
- **D-04:** Default page margin is **15mm on all four sides**, matching the existing `@page { margin: 15mm }` rule in `src/index.css`. Phase 8 makes this user-configurable; until then preview and print use the same value.

### Page Break Behavior
- **D-05:** **No `break-inside: avoid` rules.** Content breaks at whatever natural point paged.js chooses — an h3 entry, its bullets, or an h2 heading may split across pages. Justification: personal tool, ship the simplest thing; revisit only if a real resume looks visibly bad. Keeps the implementation small.
- **D-06:** **No forced page-before on h2 sections.** Sections do not get pushed to a new page if room is tight — they break naturally where paged.js chooses.

### Claude's Discretion
- **Page chrome visual style** — color of the page background, gray surround color, drop shadow, gap between stacked pages. Not discussed; choose a clean Word/Google-Docs-style look (white page on light gray, subtle shadow, modest gap).
- **Page X of N indicator placement and styling** — where it lives (preview footer / app header / floating sticky strip) and whether it shows when there's only one page. Pick what feels least intrusive; the requirement only says it must be visible in the UI and update live.
- **paged.js integration shape** in `Preview.tsx` — whether the Previewer renders directly into the preview pane root, into a child container, or replaces the current `dangerouslySetInnerHTML` div entirely. Pick whatever keeps theme-class scoping working (see code_context) and lets `useEffect` reflow cleanly on `htmlContent` / `template` changes.
- **Existing print path** in `src/index.css` (`@page`, `#print-area`, the hidden second `<Preview>`) — leave as-is for this phase if paged.js doesn't naturally take over print, or unify if it does. Phase 10 owns the final unification; this phase should not regress current PDF export.
- **Performance/reflow optimizations** — Previewer reuse vs fresh instance per render, abort-on-rapid-edits, etc.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §PREV-01, PREV-02, PREV-03 — exact wording of what must be visible to the user
- `.planning/ROADMAP.md` §Phase 7 — success criteria (4 items) the phase will be verified against
- `.planning/PROJECT.md` — milestone goal, tech stack, Node v20.11.0 constraint, current known tech debt

### Existing Implementation (the surface this phase changes)
- `src/components/Preview.tsx` — current renderer (DOMPurify + `dangerouslySetInnerHTML`, applies `theme-${template}` + container class). Paged.js wraps or replaces this rendering path.
- `src/App.tsx` — owns `htmlContent` state, the 150ms debounce ref, and renders a second `<Preview>` inside `#print-area` for print export. Reflow is triggered by changes to the props paged.js consumes.
- `src/lib/templateStyles.ts` — `TEMPLATE_STYLES[template].container` is the per-template font/leading wrapper that must continue to apply inside paged.js page boxes.
- `src/styles/themes.css` and `src/styles/theme-{classic,modern,minimal}.css` — element-keyed `@apply` rules scoped under `.theme-{name}`. Whatever DOM paged.js emits must keep the `.theme-{name}` ancestor so these rules still cascade.
- `src/index.css` — current print rules: `@page { size: A4 portrait; margin: 15mm }`, `#app-shell { display: none }` while printing, `#print-area { display: block }`. New on-screen page styles must not regress this.

### Prior Phase Context
- `.planning/phases/06-tailwind-powered-preview-rendering/06-CONTEXT.md` — establishes the `.theme-${template}` container + `@apply` CSS pattern that Phase 7 builds on (D-01 through D-07)
- `.planning/phases/05-parser-simplification-template-restructure/05-CONTEXT.md` — establishes `md.render()` as the single HTML source (Phase 5 D-03) — paged.js consumes this same string

### External Docs to Research
- paged.js — Previewer API, React integration patterns, page count event/hook, performance characteristics on incremental re-render. (No file path — researcher should pull current docs via Context7 or upstream site.)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`Preview.tsx`** — already receives `htmlContent` + `template`, already applies theme container class. Paged.js wraps this rendering path; the theme class must still wrap whatever paged.js outputs so `theme-*.css` cascades.
- **`TEMPLATE_STYLES[template].container`** — per-template font/leading class string. Should be applied *inside* the paged.js page content box, not at the outer page rectangle.
- **`App.tsx` `debounceRef` (150ms)** — reuse this exact timer for paged.js reflow per D-02; do not add a parallel debounce.
- **`#print-area` div + sibling `<Preview>` in `App.tsx`** — current print pathway; left untouched in Phase 7 unless paged.js naturally subsumes it (Claude's discretion).

### Established Patterns
- **`dangerouslySetInnerHTML` with DOMPurify (`ADD_ATTR: ['class']`)** — current rendering pattern in `Preview.tsx`. Sanitized HTML string must be the input paged.js receives.
- **Theme scoping via `.theme-{name}` ancestor + `@custom-variant`** — paged.js can rewrite the inner DOM and add wrapper elements; the `.theme-{name}` class must remain an ancestor of the rendered content for `theme-*.css` rules to apply.
- **`@layer base` for template element styles, `@layer utilities` for user-authored Tailwind via Play CDN** — preserved; user-authored classes still win.

### Integration Points
- **`Preview.tsx` render output** — replaced or wrapped so paged.js owns the content layout; the surrounding pane (`<main>` flex container) stays as it is.
- **Page count readout** — needs to surface from `Preview.tsx` (or `paged.js` hook) up to wherever the indicator is rendered. React state + callback prop is the obvious wiring; placement is Claude's discretion.
- **`index.css`** — new on-screen page rules added here (or in a new `pages.css`); existing print rules must continue to work.
- **`index.html`** — paged.js script needs loading; coordinate with the existing Tailwind Play CDN tag so order is predictable.

### Constraints
- **html2pdf.js path** — current PDF export is `window.print()` based (per `App.tsx` `handleExportPdf` and `index.css` `@page`). Phase 7 must not break this path; Phase 10 unifies preview and PDF.
- **`templateInlineStyles.ts` (`ExportTarget`)** — was removed in Phase 6 (no longer present in `src/lib/`). Confirmed during scout — only `templateStyles.ts` remains.
- **Node v20.11.0 / Vite 5** — paged.js dependency must be compatible with this stack.

</code_context>

<specifics>
## Specific Ideas

- The on-screen pages should feel like Word / Google Docs — white A4 sheets with a subtle drop shadow on a light gray background, modest vertical gap between stacked pages. (Visual style is Claude's discretion; this is the rough mental model.)
- Reflow speed is bounded by the existing 150ms debounce — there is no separate performance budget to introduce.
- "Don't over-engineer" applies to page break behavior: the user explicitly chose to let it break wherever paged.js chooses rather than add `break-inside` rules. Resist suggesting break rules during planning unless a sample resume looks visibly broken.

</specifics>

<deferred>
## Deferred Ideas

- **Smarter break behavior** (`break-inside: avoid` on h3 entries / h2 sections, orphan/widow control) — explicitly chosen to skip in this phase; revisit only if real resumes look bad. Could be a follow-up phase in a later milestone.
- **Configurable margins via UI** — Phase 8 (already in roadmap).
- **Auto-fit-to-pane-width scaling** — Phase 9 (already in roadmap).
- **Unifying preview and PDF rendering / retiring `templateInlineStyles.ts` hack** — Phase 10 (already in roadmap). Note: `templateInlineStyles.ts` already appears to have been removed; Phase 10 will confirm and unify the print path.
- **Manual page-break syntax in markdown** (PAGEBREAK-01) — future requirement, not in v1.3.0.
- **Paper sizes other than A4** (PAPER-01/02) — future requirement.
- **Manual zoom controls** (ZOOM-02) — future requirement.

</deferred>

---

*Phase: 07-page-chrome-auto-pagination*
*Context gathered: 2026-05-18*
