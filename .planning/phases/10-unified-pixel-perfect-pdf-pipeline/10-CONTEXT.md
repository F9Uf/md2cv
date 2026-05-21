# Phase 10: Unified Pixel-Perfect PDF Pipeline - Context

**Gathered:** 2026-05-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Produce the exported PDF from the same paged.js-rendered DOM the user sees on screen, so page count, page-break positions, page size, margins, fonts, colors, and per-template Tailwind classes are visually identical between preview and PDF. The PDF must exclude on-screen-only chrome — the page drop-shadow, the gray surround background, and the "Page X of N" pill — but otherwise match the preview 1:1 across all three templates (Classic, Modern, Minimal).

In scope:
- Switch `#print-area` from the non-paginated `<Preview enablePagination={false}>` sibling to a paged.js-rendered Preview that mirrors the on-screen preview's inputs (`htmlContent`, `template`, `margins`).
- Always-mount the `#print-area` Preview off-screen so paged.js has real layout to chunk against; bring it into the print viewport only via the existing `@media print` toggle.
- Make user margins (Phase 8) flow into the PDF through the same `pagedjs_inline` stylesheet path the on-screen preview already uses; delete the hardcoded `@page { margin: 15mm }` from `src/index.css`.
- Strip on-screen-only chrome (shadow, border, gray background, page-X-of-N pill) from the PDF via `@media print` CSS.
- Remove `html2pdf.js` and `@types/html2pdf.js` from `package.json` (dead deps since Phase 6); update README.md and CLAUDE.md tech-stack lines.

Out of scope for this phase:
- Any change to the on-screen preview, the `#app-shell` layout, paged.js reflow cadence (still the 150ms `App.tsx` debounce), or the `MarginControls` / `Header` UI.
- Re-introducing any canvas-based PDF library or a programmatic PDF generator.
- A `forPrint` prop on `Preview` (D-06 explicitly relies on the existing `@media print` CSS reset instead).
- Automated visual-diff testing of PDF output — verification stays manual via the human checkpoint plan.

Out of scope for this milestone:
- Paper sizes other than A4 (PAPER-01/02) — future.
- Manual page-break markers in markdown (PAGEBREAK-01) — future.
- Manual zoom controls (ZOOM-02) — future.

Already done in earlier phases (mentioned in success criterion 4 of ROADMAP.md §Phase 10 but already shipped):
- `templateInlineStyles.ts` was deleted in Phase 6.
- `ExportTarget.tsx` was deleted in Phase 6.
- Defensive `@media print { .pagedjs-scale-wrapper { zoom: 1 !important; transform: none !important; height: auto !important } }` rule landed in `pages.css` during Phase 9.

</domain>

<decisions>
## Implementation Decisions

### PDF generation strategy
- **D-01:** The exported PDF is produced by **`window.print()` over the paged.js-rendered DOM**. No separate render pipeline, no library (html2pdf.js / jsPDF / canvas capture). Because paged.js has already laid the content into `.pagedjs_page` boxes of A4 size, the browser's Save-as-PDF dialog rasterizes pages that already exist — page count, break positions, margins, and visual styling cannot drift from the preview because there *is* no second render.

### `#print-area` mount strategy
- **D-02:** The `<div id="print-area">` block in `App.tsx` (currently lines 165-167) is **kept** and its `<Preview>` switches from `enablePagination={false}` to `enablePagination={true}`. The print-mount runs its own paged.js `Previewer` instance, isolated from the on-screen mount. Same component, same paged.js render effect (Preview.tsx:38-97), distinct ref / Previewer.
- **D-03:** The print-mount is **always-mounted off-screen** via `position: absolute; left: -9999px; top: 0; width: 210mm` (or similar) so paged.js has real layout to chunk against on every reflow. This replaces today's screen-side `#print-area { display: none }` rule, which would prevent paged.js from measuring page-box dimensions correctly. The existing `@media print` toggle (`#app-shell { display: none } / #print-area { display: block }`) stays as the print-time visibility flip; the off-screen offset is neutralized inside the same `@media print` block (e.g., `#print-area { position: static; left: auto }`) so the print engine sees the print-mount in a regular flow context.

### Margin flow into PDF
- **D-04:** User margins reach the PDF **only through the paged.js `pagedjs_inline` stylesheet** that `Preview.tsx:76` already injects — the print-mount receives the same `margins` prop as the on-screen mount and emits the same `@page { size: A4 portrait; margin: ${top}mm ${right}mm ${bottom}mm ${left}mm; }` rule into its own Previewer. The static `@page { size: A4 portrait; margin: 15mm }` rule currently inside `@media print` in `src/index.css` is **deleted** — it duplicates and contradicts the dynamic value paged.js manages, and it would override the user's saved margins.
- **D-04a (implementation note for the planner):** Because paged.js's inline `@page` rule influences only paged.js's internal chunking, the browser's print engine still needs `@page { size: A4 portrait; margin: 0 }` declared in document CSS so the printer does not add a second physical-page gutter on top of the margins paged.js already baked inside each `.pagedjs_page`. Add this exact rule (no per-side mm values) inside an `@media print` block in `src/index.css`. The researcher should verify paged.js's print-time behavior against current docs before locking the rule wording.

### Dead-dep cleanup
- **D-05:** `html2pdf.js` (^0.14.0) and `@types/html2pdf.js` (^0.10.0) are removed from `package.json` in this phase. `package-lock.json` is regenerated. README.md (`html2pdf.js / jsPDF — client-side PDF export`) and CLAUDE.md (`html2pdf.js or jsPDF for PDF export`) tech-stack lines are updated to reflect the print-CSS pipeline. PROJECT.md updates are deferred to the end-of-phase transition step.

### Mobile / scale safety in the print-mount
- **D-06:** No `forPrint` prop is added to `Preview`. The print-mount inherits the on-screen `Preview` component's mobile zoom (`isMobile ? 0.5 : scale` at `Preview.tsx:158`) when rendered off-screen, but the existing **Phase 9 `@media print { .pagedjs-scale-wrapper { zoom: 1 !important; transform: none !important; height: auto !important } }` rule in `src/styles/pages.css`** overrides the inline zoom: 0.5 at print time. The `!important` cascade beats the inline style; the PDF is captured at 100% on every device. This decision rests on that rule continuing to exist — do not delete it during refactoring.

### On-screen-only chrome stripping
- **D-07:** On-screen-only chrome is stripped from the PDF via `@media print` rules:
  - `.pagedjs_page { box-shadow: none; border: none; margin-bottom: 0 }` — already in `pages.css` from Phase 7/9 (`margin-bottom` part is the only new piece).
  - Gray surround (`bg-gray-100` on Preview.tsx:165 scroll container) — irrelevant in PDF because `#app-shell` is hidden during print; no extra rule needed.
  - The "Page X of N" sticky pill (`Preview.tsx:170-174`) — irrelevant in PDF for the same reason; no extra rule needed.
  - The print-mount itself has no pill / shadow / gray background because the print engine sees a fresh paged.js layout without those decorations once `#print-area` is shown.

### Claude's Discretion
- **Exact wording / file placement of the new `@media print` rules** in `src/index.css` vs `src/styles/pages.css` — planner picks whichever keeps the print-related CSS coherent in one place.
- **Whether to lift `MarginValues` into a tiny shared type / hook** for the dual-mount, or just pass identical props from `App.tsx` to both `Preview` instances — same data either way.
- **Whether to add a brief `aria-hidden` / `tabindex=-1`** on the off-screen `#print-area` so accessibility tools ignore it. Reasonable but not required by any success criterion.
- **`README.md` and `CLAUDE.md` tech-stack wording** — replace the `html2pdf.js / jsPDF` mentions with a phrase that reflects "browser-native print over paged.js DOM" without over-explaining.
- **Cleanup of stale STATE.md decision entries D-17 (ExportTarget inline CSSProperties) and D-18 (templateInlineStyles.ts separate from templateStyles.ts)** — these reference files that no longer exist; may be retired during the end-of-phase transition. Not blocking this phase.
- **Early-export timing race** — if a user hits Export PDF in the ~150–300ms window between a content change and paged.js completing its flow, the print-mount might still be re-rendering. Not surfaced as a blocking decision; planner may choose to leave the rare blank-page-edge as-is, or guard `handleExportPdf` until both Previewers' `onPageCountChange` fires. Either is acceptable.
- **Print-mount paged.js failure handling** — if the print-mount's `Previewer.preview()` rejects, the existing `hasError` branch in `Preview.tsx` falls back to the plain DOMPurify path, which the print engine will then capture. That fallback is acceptable for v1.3.0; no error toast required.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §PDFX-01, PDFX-02 — exact wording of the pixel-perfect parity and unified-rendering-path requirements
- `.planning/ROADMAP.md` §Phase 10 — success criteria (4 items) the phase will be verified against (note: criterion 4's reference to `templateInlineStyles.ts` and `ExportTarget` is historical — those files were already deleted in Phase 6)
- `.planning/PROJECT.md` — milestone goal, tech stack, known tech debt (especially the html2pdf.js / oklch landmine, which this phase definitively closes)

### Existing Implementation (the surface this phase changes)
- `src/App.tsx` lines 90-96 — `handleExportPdf` calls `window.print()`; current implementation already sets `document.title` from the markdown h1 for the default PDF filename. Keep this verbatim.
- `src/App.tsx` lines 165-167 — `<div id="print-area"><Preview ... enablePagination={false} /></div>` — Phase 10 flips `enablePagination` to `true`, optionally adds aria-hidden, and is sized/positioned off-screen via new styling. The same `margins`, `template`, `htmlContent` props flow into it as into the on-screen `Preview`.
- `src/components/Preview.tsx` lines 38-97 — paged.js render effect. Both Previewer instances (on-screen and print-mount) go through this same code path. No changes to the effect logic itself; the new behavior comes from instantiating the component twice with `enablePagination={true}`.
- `src/components/Preview.tsx` lines 99-126 — ResizeObserver / zoom logic. The print-mount activates this code too because it's the same component; the Phase 9 `@media print { .pagedjs-scale-wrapper { zoom: 1 !important } }` rule in `pages.css` is what keeps the PDF at 100% (D-06).
- `src/index.css` — `@media print` block (lines 3-33) and the off-screen `#print-area { display: none }` rule (line 37). The `@page { margin: 15mm }` rule inside `@media print` is deleted per D-04. The screen-side `#print-area { display: none }` is replaced by a `position: absolute; left: -9999px` rule per D-03. The `@media print` block additionally gains `#print-area { position: static; left: auto }` to neutralize the offset for print.
- `src/styles/pages.css` — `.pagedjs_page` chrome rules and the existing `@media print` defensive resets. The `.pagedjs_page { margin-bottom: 0 }` print rule is the only addition needed for D-07; the rest of the print resets are already present from Phases 7 and 9.
- `package.json` — `html2pdf.js` (line 24) and `@types/html2pdf.js` (line 34) are removed (D-05). `package-lock.json` is regenerated.
- `README.md` line 32 and `CLAUDE.md` line 14 — tech-stack PDF library mentions are updated to reflect the new pipeline.

### Prior Phase Context (decisions inherited)
- `.planning/phases/06-tailwind-powered-preview-rendering/06-CONTEXT.md` — establishes the `.theme-${template}` container + Tailwind class theme system that the print-mount must continue to wrap content with (same as on-screen).
- `.planning/phases/07-page-chrome-auto-pagination/07-CONTEXT.md` D-01, D-02 — paged.js is the paged-media engine; 150ms debounce drives reflow. The print-mount piggybacks both.
- `.planning/phases/08-configurable-margins/08-CONTEXT.md` D-05, D-06 — margins reach paged.js via the `pagedjs_inline` stylesheet; persisted in localStorage under `md2cv-margins`. The print-mount consumes the same `margins` prop without any extra plumbing.
- `.planning/phases/09-responsive-auto-fit-zoom/09-CONTEXT.md` D-08 — scale changes never retrigger paged.js. The print-mount inherits this; its paged.js render only retriggers on `[htmlContent, template, enablePagination, styles.container, onPageCountChange, margins]` — never on zoom/scale.
- `.planning/phases/09-responsive-auto-fit-zoom/09-CONTEXT.md` deferred section — the print-time transform safety rule was already added in Phase 9; D-06 of this phase formally adopts it as the load-bearing mechanism for mobile PDF parity.

### External Docs to Reference During Research
- paged.js — `Previewer.preview()` behavior when the target element is `position: absolute; left: -9999px`; whether the `@page` rule injected via `pagedjs_inline` is also written to document.head (and thus visible to the browser's print engine) or kept internal to paged.js. The researcher should pull current docs via Context7 or the paged.js site, and verify against the Phase 7 paged.js integration code in `src/components/Preview.tsx`.
- `window.print()` + `@page` interaction across Chromium / Safari / Firefox — specifically whether modern browsers honor `@page { size: A4 portrait; margin: 0 }` declared inside `@media print` and how default user-agent print margins are suppressed.
- DOMPurify + Tailwind Play CDN behavior in an off-screen element — confirm that `ADD_ATTR: ['class']` continues to preserve user-authored Tailwind classes when the content is rendered into a `position: absolute; left: -9999px` container; Play CDN scans the DOM globally, so the off-screen mount's classes should still be picked up.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`Preview.tsx`** — the same component renders both on-screen and print-mount. No new component is created. The print-mount is a second invocation with `enablePagination={true}`, identical `htmlContent` / `template` / `margins`, and no `onPageCountChange` (the print-mount's page count is not surfaced to the UI).
- **`App.tsx` margins state** (lines 36-49) — already typed `MarginValues`, already validated on read, already persisted under `md2cv-margins`. Flows into both `<Preview>` instances without any new plumbing.
- **`pagedjs_inline` stylesheet pattern** (Preview.tsx:76) — single source of truth for the dynamic `@page` rule. Print-mount uses this exact code path.
- **Phase 9 defensive `@media print` rule** (`pages.css` lines 45-49) — the load-bearing mechanism for D-06; do not remove or weaken during refactoring.

### Established Patterns
- **Two-Previewer pattern is new for this codebase** — until now there has only been one paged.js Previewer per page. This phase introduces a second concurrent Previewer (one on-screen, one off-screen). Both follow the existing fresh-Previewer-per-reflow lifecycle (Preview.tsx:38-97), including the StrictMode dev safety yield (`await Promise.resolve()` at line 59) and the `polisher.destroy() / chunker.destroy()` cleanup.
- **`@media print` discipline** — print-only rules live in `src/index.css` (app-shell hiding / area swap) and `src/styles/pages.css` (paged.js chrome resets). Phase 10 keeps that split and adds the `@page { margin: 0 }` rule to `index.css` (alongside its `#app-shell { display: none }` neighbour).
- **No new state libraries / no new external deps** — Phase 10 is purely additive at the CSS / DOM-position layer; the only npm change is the *removal* of `html2pdf.js` and `@types/html2pdf.js`.

### Integration Points
- **`App.tsx` → on-screen `<Preview>`** — unchanged. Existing prop set (`htmlContent`, `template`, `margins`).
- **`App.tsx` → print-mount `<Preview>`** — switches `enablePagination={false}` to `enablePagination={true}`. Same other props. Optional `aria-hidden` on the wrapping `#print-area` div.
- **`#print-area` styling** — new screen rule `position: absolute; left: -9999px; top: 0` (or equivalent off-screen offset that keeps real layout); existing `display: none` screen rule is removed. `@media print` adds `position: static; left: auto` so the print-mount lands in the print viewport at normal flow.
- **`@page` rule in `index.css`** — `margin: 15mm` is removed; replaced by `margin: 0` (D-04a). `size: A4 portrait` is retained.

### Constraints
- **Double paged.js render cost** — every `htmlContent` / `template` / `margins` change triggers two paged.js flows in parallel (one per Previewer). Already accepted in D-03. Both ride the same 150ms debounce in `App.tsx`. On mobile (slower CPUs) this may be perceptible; not a blocker for v1.3.0.
- **DOMPurify + Tailwind Play CDN** — Play CDN scans the entire document for utility classes; the off-screen `#print-area` content is still in the DOM, so user-authored Tailwind classes survive and get applied identically in the print-mount.
- **StrictMode dev double-mount** — both Previewer instances independently rely on the Preview.tsx:59 `await Promise.resolve()` yield to survive React StrictMode's setup → cleanup → setup cycle. No new mitigation needed.
- **paged.js with off-screen layout** — paged.js measures `.pagedjs_page` dimensions via `getBoundingClientRect` and CSS computed styles. An element at `left: -9999px` still has layout (it is not `display: none`), so measurements remain correct. Researcher should confirm against paged.js source if any edge case is found.
- **Node v20.11.0 / Vite 5** — unchanged; no new tooling.

</code_context>

<specifics>
## Specific Ideas

- The PDF must look exactly like the preview at 100% zoom — text, fonts, colors, page-break positions, per-template Tailwind classes — but **without** the on-screen drop shadow on each page, the gray surround background, or the "Page X of N" pill. Everything else carries over.
- Mobile PDF export must produce a full-size A4 PDF even though the on-screen mobile view renders at 0.5 zoom. The existing Phase 9 `@media print` rule in `pages.css` (D-06) is the load-bearing mechanism for this — every refactor must preserve it.
- "Don't over-engineer" continues to apply: no canvas library, no programmatic PDF builder, no `forPrint` prop on Preview, no automated visual-diff testing. Browser's Save-as-PDF over paged.js's DOM is the entire pipeline.
- `templateInlineStyles.ts` / `ExportTarget.tsx` references in REQUIREMENTS.md and ROADMAP.md are historical — those files were deleted in Phase 6. Phase 10 closes the *full* loop of that retirement by removing the `html2pdf.js` / `@types/html2pdf.js` deps and the hardcoded print `@page` rule that survived as orphans.

</specifics>

<deferred>
## Deferred Ideas

- **Automated visual-diff testing of PDF output** (screenshot diff, PDF parsing) — out of scope; v1.3.0 verification is human side-by-side eyeball across the three templates.
- **Explicit "early-export" guard** in `handleExportPdf` (await print-mount paged.js flow before calling `window.print()`) — left to Claude's discretion during planning; rare-edge race is acceptable for a personal tool.
- **Explicit `forPrint` prop on `Preview`** — reviewed and rejected (D-06); the existing `@media print` CSS reset is the chosen mechanism. Revisit only if the CSS reset proves insufficient.
- **PROJECT.md, STATE.md cleanup of stale D-17 / D-18 entries** — these reference removed files (`templateInlineStyles.ts`, `ExportTarget`); handled during the end-of-phase transition step, not in this phase's main task list.
- **Paper sizes other than A4** (PAPER-01/02) — future milestone; the PDF pipeline already reads `size: A4 portrait` from the paged.js inline stylesheet, so adding a paper-size selector later only requires routing a new prop through the same path.
- **Manual page-break syntax in markdown** (PAGEBREAK-01) — future milestone.

</deferred>

---

*Phase: 10-unified-pixel-perfect-pdf-pipeline*
*Context gathered: 2026-05-20*
