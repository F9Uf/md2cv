# Phase 10: Unified Pixel-Perfect PDF Pipeline - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `10-CONTEXT.md` — this log preserves the alternatives considered.

**Date:** 2026-05-20
**Phase:** 10-unified-pixel-perfect-pdf-pipeline
**Areas discussed:** PDF generation strategy, `#print-area` Preview retirement, Margin flow into PDF, html2pdf.js cleanup, Print-mount scale safety (mobile export)

---

## Area Selection

| Area | Selected | Notes |
|------|----------|-------|
| PDF generation strategy | ✓ | The foundational decision; everything else flows from this. |
| `#print-area` Preview retirement | ✓ | Tied to PDF source choice. |
| Margin flow into PDF | ✓ | Today's `@page { margin: 15mm }` in `index.css` is hardcoded and stale. |
| html2pdf.js cleanup | ✓ | Dead dep in `package.json`; no source imports it. |

---

## PDF generation strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Print paged.js output via `window.print()` | Same DOM the user sees IS the PDF source. Browser's Save-as-PDF captures the paged.js-rendered `.pagedjs_pages` DOM. Page count / break positions / margins / fonts guaranteed identical to preview. Defensive `@media print` rules in `pages.css` already strip on-screen-only chrome. | ✓ |
| Keep separate native-print path | Keep today's `#print-area` sibling Preview (non-paged.js) and `@media print` toggle, but fix margins to be dynamic. PDF pagination still uses browser-native paged-media — break positions may drift from paged.js's calculations. | |
| Use html2pdf.js / canvas library | Programmatic capture via `html2pdf.js` (current dep) or similar. Reintroduces the oklch / html2canvas pain Phase 6 deleted. | |

**User's clarification:** "The exported PDF should pixel-perfect match with the preview but exclude the shadow, gray background, and pagination. What should I use?"

**Recommendation given:** `window.print()` over the paged.js-rendered preview output. Pixel parity is automatic (no second render), shadow/gray-bg/pill exclusion is a CSS-only job via `@media print`, filename behavior already works via `document.title` set from h1, and the html2pdf.js / canvas approach is the path that forced the oklch workaround Phase 6 deleted.

**User's choice:** Option A — `window.print()` over paged.js output.

**Notes:** Captured as D-01.

---

## `#print-area` Preview retirement

| Option | Description | Selected |
|--------|-------------|----------|
| Delete it entirely | Remove the `<div id="print-area"><Preview ... enablePagination={false} /></div>` block from App.tsx, drop the related `#print-area` / `#app-shell` `@media print` rules from index.css. Print captures the on-screen paged.js preview directly. | |
| Keep it as a fallback | Keep the sibling as a defensive fallback if paged.js hasn't rendered yet (`pageCount === null`). Adds branching logic but covers the edge case where user hits Export PDF in the ~150ms before first paged.js flow completes. | |
| Keep, but switch it to paged.js too | Render a second paged.js Previewer into `#print-area` for print. Pixel-perfect like option A but doubles paged.js render cost. | ✓ |

**User's choice:** Option C — keep `#print-area` and switch its `<Preview>` to `enablePagination={true}`.

**Notes:** Captured as D-02. Trade-off: every reflow runs paged.js twice (one on-screen, one off-screen). User accepted the cost in exchange for clean isolation between the on-screen state and the print pipeline.

---

## `#print-area` mount staging (follow-up to retirement choice)

| Option | Description | Selected |
|--------|-------------|----------|
| Render-on-demand at export time | `handleExportPdf` sets `isPrinting=true` → mounts the print-mount Preview → paged.js flows → `onPageCountChange` fires → `window.print()` → unmount. One paged.js instance at a time. Costs ~150-300ms delay on each Export PDF click. | |
| Always mounted, off-screen via absolute positioning | Replace today's `display: none` with `position: absolute; left: -9999px; top: 0` so paged.js has layout always. Two paged.js Previewer instances continuously rerender on every keystroke. Instant print, double the runtime cost. Pattern matches the old pre-Phase-6 `ExportTarget` trick. | ✓ |
| Always mounted, `visibility: hidden` | Keep mounted with `visibility: hidden` + height/width set to A4 page area so paged.js has layout but element is invisible. Same double-render cost as B; less robust because element still takes flow space. | |

**User's choice:** Option B — always mounted off-screen via absolute positioning.

**Notes:** Captured as D-03. Cost trade-off accepted in exchange for instant Export PDF response and clean DOM-state isolation.

---

## Margin flow into PDF

| Option | Description | Selected |
|--------|-------------|----------|
| Only via paged.js inline stylesheet | The `#print-area` Preview receives the same `margins` prop as on-screen and paged.js injects `@page { margin: ${...} }` the same way (Preview.tsx:76). Delete the hardcoded `@page { margin: 15mm }` rule from index.css. One source of truth: App.tsx margins state → paged.js → PDF. | ✓ |
| Paged.js inline + override `@page { margin: 0 }` in print CSS | Belt-and-suspenders override against browsers that apply user-agent default print margins. paged.js's `@page` rule should already cover this, but the override is defensive. | |
| CSS custom property piped through both rule and inline stylesheet | Define `--page-margin-top/right/bottom/left` at `:root` from App.tsx state, reference in both the paged.js `@page` injection and a static `@media print { @page }` rule. More indirection, no real benefit. | |

**User's choice:** Option A — only via paged.js inline stylesheet.

**Notes:** Captured as D-04. Implementation refinement (D-04a): a static `@media print { @page { size: A4 portrait; margin: 0 } }` rule still belongs in `index.css` because paged.js's inline `@page` rule influences only paged.js's internal chunking — the browser's print engine needs its own `@page { margin: 0 }` declaration so it doesn't add a second physical-page gutter on top of paged.js's logical margins. The 15mm hardcoded value is gone, replaced by 0 (since paged.js has internalized user margins as page-box padding). Researcher to verify behavior against current paged.js docs.

---

## html2pdf.js cleanup

| Option | Description | Selected |
|--------|-------------|----------|
| Remove in this phase | `npm uninstall html2pdf.js @types/html2pdf.js`, drop the html2pdf.js mention from README.md and CLAUDE.md tech-stack lines. One commit, ships with the phase. | ✓ |
| Defer to a separate cleanup task | Leave deps untouched in Phase 10; file a follow-up quick task to remove them later. Smaller phase scope, but the milestone closes with dead deps still in package.json. | |
| Leave for now | Keep as a quick rollback option if `window.print()` approach has unforeseen issues in some browser. Re-evaluate after v1.3.0 ships. | |

**User's choice:** Option A — remove in this phase.

**Notes:** Captured as D-05. README.md (line 32) and CLAUDE.md (line 14) tech-stack mentions are updated as part of the phase work.

---

## Print-mount scale safety (mobile export)

**Context for area:** User asked "what about export when using in mobile view?" — surfaced a real risk introduced by D-02: Preview.tsx:158 hardcodes `effectiveZoom = isMobile ? 0.5 : scale`. With `#print-area` switching to the paged.js path, a mobile-viewport user clicking Export PDF would hit the 0.5 zoom on the print-mount and get a half-size PDF.

| Option | Description | Selected |
|--------|-------------|----------|
| Rely on existing `@media print` CSS reset | Phase 9 already added `@media print { .pagedjs-scale-wrapper { zoom: 1 !important; transform: none !important; height: auto !important } }` in pages.css. When `window.print()` fires, that rule overrides the inline `zoom: 0.5` on the print-mount's wrapper, and the PDF captures at full scale. Zero new code; the rule is already there for exactly this defense. | ✓ |
| Add a `forPrint` prop on Preview | Pass `<Preview ... forPrint />` for the `#print-area` mount. Inside Preview.tsx, when `forPrint===true`, skip the useMediaQuery / ResizeObserver / scale-state logic entirely. More explicit boundary; slightly more component complexity. | |
| Do both — `forPrint` prop AND the CSS reset | Belt-and-suspenders. Heaviest of the three but most resilient against future refactors. | |

**User's choice:** Option A — rely on existing `@media print` CSS reset.

**Notes:** Captured as D-06. The rule's `!important` cascade beats the inline `zoom: 0.5` style, so the PDF always captures at 100% regardless of viewport. The rule must not be deleted or weakened in future refactors — Phase 10 has formally adopted it as the load-bearing mechanism for mobile PDF parity.

---

## Wrap-up

After 4 initially-selected areas plus the mobile-export follow-up (6 decisions total), the user opted to wrap up rather than discuss the remaining secondary gray areas:
- Early-export timing (paged.js race within ~150-300ms of content change)
- Print-mount paged.js failure fallback
- Verification approach for PDFX-01/02

These were captured in CONTEXT.md as Claude's Discretion / Deferred items so the planner and human-verification step can address them without re-asking.

## Claude's Discretion

- Exact wording / file placement of new `@media print` rules
- Whether to lift `MarginValues` into a shared type / hook for the dual-mount
- Optional `aria-hidden` / `tabindex=-1` on the off-screen `#print-area`
- README.md / CLAUDE.md tech-stack wording for the new pipeline
- Cleanup of stale STATE.md D-17 / D-18 entries (end-of-phase transition step)
- Early-export timing race handling (block button vs accept rare edge)
- Print-mount paged.js failure fallback (silent DOMPurify fallback vs error toast)

## Deferred Ideas

- Automated visual-diff testing of PDF output (screenshot diff / PDF parsing) — out of scope
- Explicit `forPrint` prop on `Preview` — reviewed and rejected (D-06)
- PROJECT.md / STATE.md cleanup of stale D-17 / D-18 entries — end-of-phase transition
- Paper sizes other than A4 (PAPER-01/02) — future milestone
- Manual page-break syntax in markdown (PAGEBREAK-01) — future milestone
