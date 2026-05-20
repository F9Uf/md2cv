---
phase: 10-unified-pixel-perfect-pdf-pipeline
plan: "03"
subsystem: human-verification
tags:
  - human-verification
  - pdf-export
  - visual-parity
  - mobile
  - regression-fix
dependency_graph:
  requires:
    - "Plan 10-01: print-mount paged.js wiring"
    - "Plan 10-02: dead-dep cleanup + doc update"
  provides:
    - "Recorded human sign-off of Phase 10 success criteria (all four)"
    - "Documented two regressions caught at verification time and the in-place fixes that resolved them"
  affects: []
tech_stack:
  added:
    - "src/components/PrintMount.tsx (new) — minimal paged.js mount for #print-area, no on-screen chrome"
  patterns:
    - "Two-mount paged.js: full <Preview/> on screen, minimal <PrintMount/> in #print-area"
    - "In-flow off-screen cloak: `position: fixed; visibility: hidden` instead of `left: -9999px`"
key_files:
  created:
    - .planning/phases/10-unified-pixel-perfect-pdf-pipeline/10-03-VERIFICATION.md
    - src/components/PrintMount.tsx
  modified:
    - src/App.tsx
    - src/components/Preview.tsx
    - src/index.css
decisions:
  - "Used position:fixed + visibility:hidden for the screen-side cloak instead of left:-9999px (D-03 amendment): the negative-offset technique broke print-engine reachability of the off-screen paged.js DOM."
  - "Extracted PrintMount as a dedicated component instead of CSS-resetting Preview chrome in @media print — clearer separation of concerns and removes the bleeding-chrome bug class entirely."
metrics:
  duration: "~25 minutes (verification + bug-fix cycle)"
  completed_date: "2026-05-21"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
  files_created: 2
---

# Phase 10 Plan 03: Human Verification Summary

**One-liner:** Human side-by-side verified the Phase 10 print pipeline across three templates, multi-page content, margin propagation, mobile A4 capture, and no-chrome — caught and fixed two print-pipeline regressions during the run, re-verified, and shipped.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Boot dev server + prepare multi-page resume | (no commit — runtime setup) | — |
| 2 | Human side-by-side verification (3 templates × matrix + scenarios) | `738bea4` (fix), record-only for 10-03 | src/components/PrintMount.tsx (new), src/App.tsx, src/components/Preview.tsx, src/index.css, 10-03-VERIFICATION.md |

---

## What the verification proved

All four Phase 10 success criteria (per `.planning/ROADMAP.md §Phase 10`) were confirmed by side-by-side comparison **after the regression fixes landed**:

1. **PDF page count, breaks, margins, and layout match preview at 100% zoom** — confirmed across Classic / Modern / Minimal.
2. **Colors, fonts, headings, bullets, Tailwind classes render identically** — confirmed; no color shift, no font fallback observed.
3. **All three templates match their previews without per-template inline adjustments** — confirmed; the unified paged.js path holds.
4. **Single rendering path** — confirmed; no `templateInlineStyles.ts`, no `ExportTarget`, no `html2pdf.js` in `package.json` (verified by Plans 10-01/10-02).

Additionally confirmed:

- **Margin propagation** (D-04) — changing MarginControls `top` from 15 → 30 visibly grew the PDF top gutter; reset to 15 restored.
- **Mobile A4 capture** (D-06) — DevTools mobile viewport (≤ 767px) preview at `zoom: 0.5`, PDF dialog shows full-size A4 (210×297mm). The Phase 9 `.pagedjs-scale-wrapper { zoom: 1 !important }` print reset is doing its job.
- **No chrome in PDF** (D-07) — no pill / drop shadow / gray surround / blank duplicate page.
- **Doc-line spot checks** — README.md:32 and CLAUDE.md:14 match the wording shipped by Plan 10-02.

---

## Regressions caught & fixed during verification

The initial verification surfaced **3 blank PDF pages while the on-screen preview showed 1 page with content**. Two stacked bugs:

### Regression 1 — Bleeding on-screen chrome inside `#print-area`

`#print-area` reused the full `<Preview/>` component, which carried:

- `relative h-full overflow-auto bg-gray-100 px-4 py-6` outer scroll container
- `.pagedjs-scale-wrapper` (screen-only scaling)
- Sticky `Page X of N` pill

In `@media print`, `overflow: auto` becomes a fragmentation container the browser refuses to break across pages — paged.js's emitted A4 pages were clipped and blank A4 pages emitted in their place.

**Fix:** New `<PrintMount/>` component in `src/components/PrintMount.tsx` — minimal paged.js mount with zero chrome (just `<div ref={rootRef}/>`). `App.tsx` `#print-area` now uses `<PrintMount/>` instead of `<Preview/>`.

### Regression 2 — `left: -9999px` removed `#print-area` from print flow

The negative-offset technique kept `#print-area` invisible on screen but the print engine could not reliably reach the rendered `.pagedjs_page` nodes inside an absolutely-positioned negative-offset box.

**Fix:** Replaced `position: absolute; left: -9999px` with `position: fixed; visibility: hidden; pointer-events: none; z-index: -1` in `src/index.css`. Element stays in real layout (paged.js measurement works) and is invisible on screen. The `@media print` rule flips it back to `position: static; visibility: visible` so the print engine sees it inline.

**Belt-and-suspenders:** Added defensive print CSS `#print-area > div { overflow: visible; background: none; padding: 0; margin: 0; height: auto }` so a future nested wrapper inside `#print-area` cannot reintroduce the same fragmentation/clip bug.

Both fixes shipped in commit `738bea4 fix(10-01): isolate #print-area paged.js mount + keep it in flow`.

---

## Deviations from Plan

- **Scope expanded** beyond `files_modified: [10-03-VERIFICATION.md]` to include `src/App.tsx`, `src/components/Preview.tsx`, `src/components/PrintMount.tsx` (new), and `src/index.css` because two print-pipeline regressions were caught at verification and fixed inline rather than deferred to a gap-closure plan. This was a judgment call — the fixes were small and clearly belonged with Plan 10-01's print-pipeline core wiring; deferring would have pushed phase completion by a full discuss/plan/execute cycle for a ~50-line fix.
- **Decision D-03 amendment** — the original "use `left: -9999px` to keep paged.js layout valid" technique didn't hold up in print; replaced with `position: fixed; visibility: hidden` (still in layout for paged.js measurement, but the print-engine reaches it cleanly).

---

## Known Stubs

None.

---

## Threat Flags

None — `<PrintMount/>` inherits the same DOMPurify sanitization (`ADD_ATTR: ['class']`) used in `<Preview/>` (Preview.tsx:64-style, replicated in PrintMount.tsx). No new network endpoints, auth paths, or schema changes.

---

## Self-Check: PASSED

- `.planning/phases/10-unified-pixel-perfect-pdf-pipeline/10-03-VERIFICATION.md`: contains `## Matrix Results` with Classic / Modern / Minimal columns, all `pass` — confirmed.
- Outcome section marked **Approved** — confirmed.
- `npm run build`: passed (zero TypeScript errors, zero new warnings).
- `npm run lint`: passed (zero errors).
- Fix commit `738bea4` present in git log.
- All four ROADMAP §Phase 10 success criteria recorded as confirmed by human in the verification record.
