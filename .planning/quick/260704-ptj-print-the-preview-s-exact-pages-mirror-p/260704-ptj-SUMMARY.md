---
quick_id: 260704-ptj
description: Print the preview's exact pages — mirror preview pagination into print-area
status: complete
date: 2026-07-04
commit: 98f3a3f
---

# Summary: Print the preview's exact pages

## What was done

Eliminated the second, independent paged.js pagination that `PrintMount` ran for `#print-area`. Two passes over the same content could break pages at slightly different points, so the exported PDF didn't always match the preview (observed: one line shifted across the page break).

Now the preview mirrors its rendered `.pagedjs_pages` into `#print-area` after every reflow via a new `onRendered` callback on `usePagedjsPreview`. The PDF reproduces the preview's page breaks by construction — one pagination, one truth. `PrintMount.tsx` deleted. `MobileTabs` keeps both panes mounted (CSS-hidden) so the preview keeps paginating while editing on mobile, keeping `#print-area` fresh for Export PDF.

## Verification

- `npm run build` passes; real project tests 14/14 pass (`npx vitest run --dir src`). Note: bare `npm test` also sweeps stale `.claude/worktrees/agent-*` copies at old commits — those failures are unrelated leftovers.
- Headless puppeteer check with the user's repro resume, edit-reflow under zoom 0.76: preview `.pagedjs_page` text matches `#print-area` (exact) and a real `page.pdf()` export (per-page character multiset + page-start prefix, tolerant of pdfminer's reading-order quirks) — all pages MATCH.

## Deviations

- Executed inline (no planner/executor subagents): follow-up to human-approved 260704-op6, per established preference.
