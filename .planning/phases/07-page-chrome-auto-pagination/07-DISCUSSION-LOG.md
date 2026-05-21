# Phase 7: Page Chrome & Auto Pagination - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `07-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 07-page-chrome-auto-pagination
**Areas discussed:** Pagination approach, Page break behavior

---

## Gray-Area Selection

User was offered four gray areas and selected two:

| Gray Area | Description | Selected |
|-----------|-------------|----------|
| Pagination approach | How content flows from page 1 to page 2+ (DOM slicing / CSS columns / paged.js / etc.) | ✓ |
| Page chrome visual style | White-on-gray, shadow, page gap, etc. | |
| Page X of N indicator | Where the counter lives (header / preview footer / floating) | |
| Page break behavior | Whether to add `break-inside: avoid` / forced section page breaks | ✓ |

The two unselected areas were rolled into "Claude's Discretion" in `07-CONTEXT.md`.

---

## Pagination approach

### Q1: Which pagination approach should drive Phase 7?

| Option | Description | Selected |
|--------|-------------|----------|
| Programmatic DOM slicing | Measure rendered heights, split into A4-sized chunks, render each chunk inside its own page rectangle. No dep, full control, hand-rolled measurement code. | |
| paged.js polyfill | Library implementing CSS Paged Media on screen and PDF — `@page`, `break-inside`, page counters all work via standard CSS. Strongest path toward Phase 10 PDF parity. ~80KB dep. | ✓ |
| CSS multi-column | Use `column-count` to flow content into A4-sized columns. Browser handles flow, but columns flow left→right, not stacked top-to-bottom. | |

**User's choice:** paged.js polyfill
**Notes:** Aligns with Phase 10 PDF parity goal — print stylesheet already uses `@page`.

### Q2: How often should paged.js re-page the preview as the user types?

| Option | Description | Selected |
|--------|-------------|----------|
| On the existing 150ms debounce | Same cadence as today's `htmlContent` debounce in `App.tsx`. Simplest — reuses existing timer. | ✓ |
| Slower paginate cadence (300–500ms) | Decouple typing-feedback from pagination. Preview text updates fast, pages reflow on a longer debounce. | |
| You decide | Claude picks based on paged.js Previewer behavior under load. | |

**User's choice:** Reuse the existing 150ms debounce.
**Notes:** —

### Q3: How should the "Page X of N" indicator get its values?

| Option | Description | Selected |
|--------|-------------|----------|
| From paged.js (native page counters) | Read from paged.js Previewer output / `counter(pages)`. Single source of truth. | ✓ |
| Count page DOM elements after render | `querySelectorAll('.pagedjs_page')` after render. Bypasses Previewer API, coupled to paged.js DOM class names. | |
| You decide | Claude picks. | |

**User's choice:** From paged.js native page counters.
**Notes:** Avoids drift between rendered output and indicator.

### Q4: What default margin should Phase 7 ship with (before Phase 8 makes it configurable)?

| Option | Description | Selected |
|--------|-------------|----------|
| 15mm — match existing print CSS | `index.css` already declares `@page { margin: 15mm }`. Preview matches print. | ✓ |
| 20mm — closer to common resume margins | More whitespace, but diverges from current print CSS. | |
| You decide | Phase 8 makes it user-configurable anyway. | |

**User's choice:** 15mm.
**Notes:** Reuses existing value; minimizes divergence until Phase 8 unifies.

### Q5: More pagination questions, or move to Page break behavior?

| Option | Description | Selected |
|--------|-------------|----------|
| Move to Page break behavior | Pagination approach, reflow cadence, counter source, and margin all decided. | ✓ |
| More questions about pagination | Cover Preview.tsx integration shape, theme class scoping, print path treatment. | |

**User's choice:** Move on. The skipped sub-questions became Claude's Discretion in `07-CONTEXT.md`.

---

## Page break behavior

### Q6: When content overflows, which elements should avoid being split across two pages?

(multiSelect)

| Option | Description | Selected |
|--------|-------------|----------|
| h3 entry block (title + bullets) | `break-inside: avoid` on entry grouping. Most common resume convention. | |
| h2 section block | `break-after: avoid` on h2 — never the last thing on a page. | |
| Individual bullet (li) | `break-inside: avoid` on li — bullets never wrap mid-sentence. | |
| Let it break wherever | No break-inside rules. Paged.js breaks at natural points. | ✓ |

**User's choice:** Let it break wherever.
**Notes:** Personal tool — ship the simplest thing; revisit only if real resumes look bad.

### Q7: Should an h2 section that doesn't have room left on the page force a new page?

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — keep h2 with its first entry | Push h2 to next page if section + first entry won't fit. | |
| No — break naturally | h2 stays wherever it lands; defaults handle worst cases. | ✓ |
| You decide | — | |

**User's choice:** No — break naturally.
**Notes:** Consistent with Q6: minimal break engineering.

---

## Claude's Discretion

Areas where the user explicitly deferred to Claude or did not select for discussion:

- **Page chrome visual style** — color, shadow, gap between stacked pages (not selected as a discussion area; defaults to Word/Docs-style white-on-gray look)
- **Page X of N indicator placement** — preview footer / app header / floating (not selected as a discussion area)
- **paged.js integration shape** in `Preview.tsx` — wrap vs replace `dangerouslySetInnerHTML`; how `useEffect` triggers reflow
- **Existing print path** in `index.css` (`@page`, `#print-area`) — leave as-is or unify in this phase; Phase 10 owns final unification
- **Performance optimizations** — Previewer reuse, abort-on-rapid-edits

## Deferred Ideas

- Smarter break behavior (`break-inside: avoid` on entries/sections, orphan/widow control) — revisit only if real resumes look broken
- Manual page-break markers in markdown (PAGEBREAK-01) — future requirement
- Paper sizes other than A4 (PAPER-01/02) — future requirement
- Manual zoom controls (ZOOM-02) — future requirement
- Configurable margins via UI — Phase 8
- Auto-fit-to-pane-width scaling — Phase 9
- Unifying preview and PDF rendering / retiring `templateInlineStyles.ts` hack — Phase 10

---

*Discussion completed: 2026-05-18*
