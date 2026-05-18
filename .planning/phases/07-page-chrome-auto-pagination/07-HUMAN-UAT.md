---
status: partial
phase: 07-page-chrome-auto-pagination
source: [07-VERIFICATION.md]
started: 2026-05-18
updated: 2026-05-18
---

## Current Test

[awaiting human testing]

## Tests

### 1. A4 page rectangle visible on gray surround
expected: Preview pane shows white A4 sheet(s) on a gray background with drop-shadow — matching the UI-SPEC design contract (PREV-01)
result: [pending]

### 2. Second page appears on overflow
expected: When resume content exceeds one A4 page, a second white sheet appears below the first with a 16px gap (PREV-02)
result: [pending]

### 3. "Page X of N" pill updates live
expected: Pill in bottom-right of preview updates within ~150ms as content is typed (PREV-03)
result: [pending]

### 4. Pill reduces on content shrink
expected: Pill shrinks back to "Page 1 of 1" when content is reduced to fit one page
result: [pending]

### 5. window.print() uses un-paginated output
expected: Print dialog / PDF export shows clean resume without paged.js chrome (borders, shadows, gray surround) — the #print-area path is used, not the paginated preview
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
