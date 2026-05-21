---
quick_id: 260521-w4e
mode: quick
type: bugfix
status: complete
tags: [pdf-export, paged.js, print-css, bugfix]
description: Exported PDF has an extra blank page when content fits on a single page
key-files:
  modified:
    - src/styles/pages.css
decisions:
  - "Override `break-after` and `page-break-after` on `.pagedjs_page:last-child` only (not all `.pagedjs_page`) to preserve multi-page pagination."
  - "Use `!important` on both modern and legacy properties because paged.js's polyfill stylesheet injects the same rules and we need to win the specificity battle in all browsers (Chrome/Edge accept `break-after`, Safari historically prefers `page-break-after`)."
  - "Add the override inside the existing `@media print` block in `src/styles/pages.css` rather than `src/index.css` to keep print-scope `.pagedjs_page` overrides cohesive."
---

# Quick 260521-w4e: Fix PDF export extra blank page Summary

One-liner: Added a print-scope CSS override that neutralizes paged.js's polyfill-injected `break-after: page` on the final `.pagedjs_page`, so a single-page resume exports as exactly one PDF page instead of two.

## What Was Built

A single new CSS rule (4 lines + 6-line comment) inside the existing `@media print` block of `src/styles/pages.css`, placed immediately after the `.pagedjs_page { box-shadow: none; ... }` rule and before the `.pagedjs-scale-wrapper` rule:

```css
.pagedjs_page:last-child {
  break-after: avoid !important;
  page-break-after: avoid !important;
}
```

The accompanying comment documents the root cause (paged.js's polyfill at `paged.esm.js` lines 27423–27431 forces `break-after: page` on every `.pagedjs_page`) and the rationale for scoping the override to `:last-child`.

## Tasks Completed

| Task | Name                                                                  | Commit  | Files                |
| ---- | --------------------------------------------------------------------- | ------- | -------------------- |
| 1    | Override trailing page break on last paged.js page in print context   | 61253f8 | src/styles/pages.css |

## Tasks Pending

| Task | Name                                | Type                    | Status                       |
| ---- | ----------------------------------- | ----------------------- | ---------------------------- |
| 2    | Manual PDF-export verification      | checkpoint:human-verify | Approved by user 2026-05-21  |

## Deviations from Plan

None — Task 1 was executed exactly as written. No auto-fixes were required.

## Verification

- `npm run build` succeeded (1.79s, no CSS errors).
- All pre-existing comments and rules in `src/styles/pages.css` preserved verbatim (Phase 7 header, "Belt-and-suspenders" comment, Phase 9 ZOOM-01 comment).
- Diff is +11 lines, -0 lines, single file.

Full validation requires the manual PDF-export checklist in Task 2 — see the plan for the four cases (single-page primary fix, multi-page regression, margin regression, all-three-templates regression).

## Next Step

**Human verification required (Task 2).** Run `npm run dev`, open the app, and walk through the 4 cases in the plan's `<how-to-verify>` block. Reply "approved" if all 4 pass; otherwise report the failing case with browser version, screen pill count, and saved PDF page count.

## Self-Check: PASSED

- `src/styles/pages.css` modified — confirmed via `git diff` (+11 lines).
- Commit `61253f8` present in `git log`.
- `npm run build` succeeded.
- No other files modified — `git status` clean except for the staged-and-committed `src/styles/pages.css`.
