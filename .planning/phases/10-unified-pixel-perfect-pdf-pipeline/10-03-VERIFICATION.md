# Phase 10 Verification Record

**Date:** YYYY-MM-DD
**Tester:** {name}
**Browser + OS:** {e.g. Chromium 124 / macOS 14.5}
**Dev server URL:** http://localhost:5173
**Resume page count tested (N):** N ≥ 2 (to be confirmed by tester)

---

## Pre-test checklist

Before running the matrix, confirm the following in your browser DevTools:

- [ ] `http://localhost:5173` loads without console errors
- [ ] `#print-area` exists in the DOM (Elements panel → search `id="print-area"`)
- [ ] `#print-area` has computed style `position: absolute` and `left: -9999px` (or equivalent off-screen offset)
- [ ] `#print-area > .pagedjs_pages > .pagedjs_page` exists (print-mount paged.js ran)
- [ ] The on-screen preview pill reads "Page X of N" with N ≥ 2 (use the bundled SAMPLE_RESUME and append extra Experience entries if needed)

---

## Matrix Results

Each row tests a property across all three templates.  
Fill each cell with **pass** or **fail — {brief note}**.

| Check | Classic | Modern | Minimal |
|-------|---------|--------|---------|
| Page count matches: on-screen pill N equals PDF dialog page count | | | |
| Page 1 visual diff: text, colors, fonts, section headings all match | | | |
| Page 1 visual diff: margins match MarginControls current values | | | |
| Page 2+ break positions: PDF break aligns with on-screen boundary at 100% zoom | | | |
| Saved PDF: text is selectable (not rasterized), fonts render natively | | | |
| Saved PDF: colors match on-screen preview (no color shift) | | | |
| No pill / drop-shadow / gray surround visible in PDF | | | |

**How to test each column:**

1. Switch to the template via the header template selector.
2. Confirm on-screen pill reads "Page X of N" with N ≥ 2. Note N.
3. Click **Export PDF**. In the print dialog, set scale to **100%** (not "Fit to printable area") and use **Save as PDF**.
4. Check that the dialog's page count equals N.
5. Visually compare the PDF preview page 1 against the on-screen preview page 1.
6. Advance to page 2 in both — confirm the section/paragraph break lands at the same content boundary.
7. Save the PDF (suggested name: `verify-{template}-{date}.pdf`). Open in OS PDF viewer (Preview.app / Acrobat).
8. Confirm text is selectable, fonts are native (not rasterized), colors match.
9. Confirm no on-screen chrome appears (pill, drop-shadow, gray background).

---

## Scenario Results

### Margin propagation (Classic template only)

Steps:
1. Switch to the **Classic** template.
2. In MarginControls, change `top` from **15 → 30** (or any large delta).
3. Wait ~200ms for paged.js to reflow.
4. Export PDF. The top gutter in the PDF must visibly grow to match the new on-screen top margin.
5. Reset top to 15.

| Scenario | Result | Notes |
|----------|--------|-------|
| Margin propagation (top 15 → 30 → 15, Classic) | | |

Failure modes:
- **Unchanged gutter** → `@page { margin: 15mm }` static rule was not fully removed from `index.css`
- **Doubled gutter** → browser print engine is adding its own physical-page margin on top of paged.js's margin; `@page { margin: 0 }` may be missing from the `@media print` block

---

### Mobile A4 capture (DevTools Device Toolbar)

Steps:
1. Open DevTools → Device Toolbar → select an iPhone or Android mobile preset (≤ 767px width).
2. Confirm the on-screen preview appears at approximately 0.5 zoom (looks ~half-size relative to the viewport).
3. Click **Export PDF**.
4. The print dialog preview must show full-size A4 pages (210mm × 297mm), **not** half-size.
5. Save the PDF and confirm in OS PDF viewer that pages are A4 (not a scaled-down A4).

| Scenario | Result | Notes |
|----------|--------|-------|
| Mobile A4 capture (DevTools mobile viewport, ≤ 767px) | | |

Failure mode:
- **Half-size PDF** → the Phase 9 `.pagedjs-scale-wrapper { zoom: 1 !important; transform: none !important; height: auto !important }` rule in `src/styles/pages.css` is not winning the cascade at print time.

---

### No-chrome check (any template)

Confirm the final saved PDF contains **none** of the following on any page:

| Item to be absent | Present in PDF? (yes = FAIL) |
|-------------------|------------------------------|
| "Page X of N" pill | |
| Drop shadow around page | |
| Gray background behind page | |
| Blank/duplicate page from on-screen mount bleeding through | |

---

### Doc-line spot check

Open the files locally (or inspect the running app's source) and confirm the following exact wording:

| File | Line | Expected wording | Matches? |
|------|------|-----------------|---------|
| `README.md` | 32 | `**paged.js + browser print** — paginated DOM rendered in-browser, exported via the browser's native Save-as-PDF` | |
| `CLAUDE.md` | 14 | `- **Tech stack**: markdown-it for parsing, CodeMirror for editor, paged.js for pagination, browser print for PDF export` | |

---

## Open Issues / Follow-ups

- {none, or list failures here with template name, check name, and what was visually observed}

---

## Outcome

- [ ] **Approved** — all matrix cells pass; phase ships.
- [ ] **Partial failure** — one or more cells failed; see Open Issues. Phase pauses for gap-closure plan.

*Fill in one of the above before returning results to the executor.*
