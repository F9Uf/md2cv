# Phase 10 Verification Record

**Date:** 2026-05-21
**Tester:** charnsak (atoseka@gmail.com)
**Browser + OS:** Chromium / macOS 15.7.2
**Dev server URL:** http://localhost:5173
**Resume page count tested (N):** N = multi-page (≥ 2 after print-pipeline fix)

---

## Pre-test checklist

- [x] `http://localhost:5173` loads without console errors
- [x] `#print-area` exists in the DOM
- [x] `#print-area` is hidden on screen via `position: fixed; visibility: hidden` (revised from the initial `left: -9999px` approach — see `Open Issues` for the deviation)
- [x] `#print-area > div > .pagedjs_pages > .pagedjs_page` exists (print-mount paged.js ran)
- [x] On-screen preview pill reads "Page X of N" with N ≥ 2

---

## Matrix Results

| Check | Classic | Modern | Minimal |
|-------|---------|--------|---------|
| Page count matches: on-screen pill N equals PDF dialog page count | pass | pass | pass |
| Page 1 visual diff: text, colors, fonts, section headings all match | pass | pass | pass |
| Page 1 visual diff: margins match MarginControls current values | pass | pass | pass |
| Page 2+ break positions: PDF break aligns with on-screen boundary at 100% zoom | pass | pass | pass |
| Saved PDF: text is selectable (not rasterized), fonts render natively | pass | pass | pass |
| Saved PDF: colors match on-screen preview (no color shift) | pass | pass | pass |
| No pill / drop-shadow / gray surround visible in PDF | pass | pass | pass |

---

## Scenario Results

| Scenario | Result | Notes |
|----------|--------|-------|
| Margin propagation (top 15 → 30 → 15, Classic) | pass | Top gutter visibly grew after slider change; reset cleanly |
| Mobile A4 capture (DevTools mobile viewport, ≤ 767px) | pass | PDF dialog shows full-size A4 (210×297mm), not half-size |
| README.md line 32 matches expected wording | pass | `**paged.js + browser print** — paginated DOM rendered in-browser, exported via the browser's native Save-as-PDF` |
| CLAUDE.md line 14 matches expected wording | pass | `- **Tech stack**: markdown-it for parsing, CodeMirror for editor, paged.js for pagination, browser print for PDF export` |

---

## No-chrome check

| Item to be absent | Present in PDF? (yes = FAIL) |
|-------------------|------------------------------|
| "Page X of N" pill | no |
| Drop shadow around page | no |
| Gray background behind page | no |
| Blank/duplicate page from on-screen mount bleeding through | no |

---

## Open Issues / Follow-ups

**Two regressions surfaced during initial verification and were fixed inline** (commit `738bea4 fix(10-01): isolate #print-area paged.js mount + keep it in flow`):

1. **Blank PDF pages** — `#print-area` reused the full `<Preview/>` component, so its DOM contained `relative h-full overflow-auto bg-gray-100 px-4 py-6` plus a "Page X of N" pill. In `@media print`, `overflow: auto` becomes a fragmentation container that the browser refuses to break across pages — paged.js's emitted A4 pages were clipped and blank A4 pages emitted in their place.
   - **Fix:** New `<PrintMount/>` component (`src/components/PrintMount.tsx`) — minimal paged.js mount with zero chrome. `#print-area` now uses this instead of `<Preview/>`.

2. **`left: -9999px` removed `#print-area` from the printer's flow** — paged.js measurement against an absolutely-positioned negative-offset box was unreliable; the print engine could not reach the rendered `.pagedjs_page` nodes during the print run.
   - **Fix:** Replaced `position: absolute; left: -9999px` with `position: fixed; visibility: hidden; pointer-events: none; z-index: -1` in `src/index.css` — element stays in real layout for paged.js measurement, invisible on screen. Print rule flips it back to `position: static; visibility: visible` so the print engine sees it inline.
   - **Defensive print CSS** added: `#print-area > div { overflow: visible; background: none; padding: 0; margin: 0; height: auto }` so a future nested wrapper inside `#print-area` cannot reintroduce the same fragmentation/clip bug.

After the fix, the matrix above was re-run end-to-end and all cells pass.

---

## Outcome

- [x] **Approved** — all matrix cells pass; phase ships.
- [ ] **Partial failure** — one or more cells failed; see Open Issues. Phase pauses for gap-closure plan.
