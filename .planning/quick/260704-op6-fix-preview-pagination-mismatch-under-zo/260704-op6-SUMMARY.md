---
quick_id: 260704-op6
description: Fix preview pagination mismatch under zoom
status: complete
date: 2026-07-04
commit: 7266a96
---

# Summary: Fix preview/print pagination mismatch under zoom

## What was done

Fixed the bug where the on-screen preview showed wrong page breaks and dropped content when the resume overflowed to multiple pages, while browser print output was correct.

**Root cause:** `usePagedjsPreview` re-paginated inside `.pagedjs-scale-wrapper` while CSS `zoom < 1` (auto-fit) was applied. The hook keeps the previous `pageCount` through reflows (to avoid a scale-snap blink), so every re-pagination after the first ran under zoom — and CSS zoom skews paged.js's break measurements. The print mount (`#print-area`, unzoomed) was unaffected, hence the mismatch.

**Fix** (`src/hooks/usePagedjsPreview.ts`, commit `7266a96`): paged.js now renders into an off-screen 1:1 staging node appended to `<body>` (mirroring the `#print-area` cloak — `position:fixed; width:210mm; visibility:hidden`), and the finished pages are swapped into the visible mount afterwards. Side benefit: old pages stay visible through the reflow, removing the blank flash during re-render. Staging node is removed on swap, error, and effect cleanup.

## Verification

- `npm run build` passes; `npm test` — same 5 pre-existing templateStyles failures with and without the change (confirmed via stash), no new failures.
- Headless-browser check (puppeteer, dev server): seeded the user's repro resume, triggered an edit-reflow while preview zoom was 0.76, then compared `.pagedjs_page` textContent between the preview and `#print-area`:
  - **Before fix:** both page breaks MISMATCH (preview page 2 started mid-entry, matching the reported screenshot).
  - **After fix:** all pages MATCH, all 3 "B.E. Computer Engineering" entries visible.

## Deviations

- Executed inline (no planner/executor subagents): plan was already human-approved in plan mode, per established preference to skip redundant agents after human approval.
