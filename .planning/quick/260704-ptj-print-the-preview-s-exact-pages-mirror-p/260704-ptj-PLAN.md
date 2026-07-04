---
quick_id: 260704-ptj
description: Print the preview's exact pages — mirror preview pagination into print-area
date: 2026-07-04
---

# Quick Task 260704-ptj: Print the preview's exact pages

## Problem

Follow-up to 260704-op6: preview is now internally correct, but the exported PDF still broke pages one line earlier than the preview on the user's machine.

## Root cause

`PrintMount` ran a second, independent paged.js pagination for `#print-area`. Two separate passes over identical content can break at slightly different points (timing/races between concurrent Previewer instances in one document). Any divergence makes the PDF disagree with the preview.

## Task 1: Mirror preview pages into #print-area (single pagination)

- `src/hooks/usePagedjsPreview.ts`: add `onRendered?: (root) => void`, fired after freshly paginated pages are swapped into the root.
- `src/components/Preview.tsx`: on render, copy `root.innerHTML` into `#print-area` — PDF reproduces preview breaks by construction. Guard auto-fit recompute against hidden container (width ≤ 0).
- `src/App.tsx`: drop `<PrintMount/>`, keep empty `#print-area` div.
- Delete `src/components/PrintMount.tsx`.
- `src/components/MobileTabs.tsx`: keep both tabs mounted (CSS `hidden`) so preview keeps paginating — and #print-area stays fresh — while editing on mobile.

**Verify:** headless browser — after reflow under zoom, compare `.pagedjs_page` text: preview vs `#print-area` vs a real `page.pdf()` export (per-page multiset + page-start prefix).

**Done:** exported PDF page breaks identical to preview.
