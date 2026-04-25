---
plan: 05-02
phase: 05-parser-simplification-template-restructure
status: complete
completed: 2026-04-25
---

## Summary

Replaced the semantic-keyed `TemplateClasses` interface and all three template definitions in `templateStyles.ts` with an element-keyed structure. Old keys (name, sectionHeading, entryTitle, entryDetail, detailList, preamble, extra) are gone; new keys mirror HTML element tags (h1, h2, h3, p, ul, ol, li, code, pre, a, blockquote, hr).

## What was built

- **New `TemplateClasses` interface**: 13 keys — container, h1, h2, h3, p, ul, ol, li, code, pre, a, blockquote, hr
- **Three templates** (classic, modern, minimal) fully expressed in new format, visual output preserved via direct mapping (name→h1, sectionHeading→h2, entryTitle→h3, detailList→ul, entryDetail→li, preamble→p)
- New keys without old equivalents (ol, code, pre, a, blockquote, hr) derived with sensible defaults matching each template's typographic character

## Key decisions

- `TemplateName` type unchanged
- TypeScript errors in `Preview.tsx` (which still references old keys) are expected and will be resolved in Plan 03

## Key files

- `src/lib/templateStyles.ts` — complete restructure

## Self-Check: PASSED
