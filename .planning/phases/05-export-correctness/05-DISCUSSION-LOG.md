# Phase 5: Export Correctness - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-16
**Phase:** 05-export-correctness
**Areas discussed:** Link behavior in PDF, Inline code print styling, ExportTarget component

---

## Link behavior in PDF

| Option | Description | Selected |
|--------|-------------|----------|
| Text only, no URL | Suppress the URL — 'Visit Google' prints as 'Visit Google'. Clean for a resume. | ✓ |
| Text with URL appended | Keep browser default — 'Visit Google (https://google.com)'. Useful for paper. | |
| You decide | Claude picks the most resume-appropriate default | |

**User's choice:** Text only, no URL — suppress with print CSS
**Notes:** User clarified: "Text only if we detect that is a valid url, and also support with markdown format like `[Visit Google](https://google.com)`" — both cases render as `<a href>` tags so a single CSS rule covers both.

---

## Inline code print styling

| Option | Description | Selected |
|--------|-------------|----------|
| Monospace font, subtle background | Light gray background + monospace font — visually distinct without being heavy. | ✓ |
| Monospace font only, no background | Clean, minimal — code distinguishable by font only. | |
| Match preview exactly | Whatever browser renders on screen (may have oklch issues). | |
| You decide | Claude picks based on template context | |

**User's choice:** Monospace font, subtle background
**Notes:** No additional clarifications needed.

---

## ExportTarget component

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as-is, ignore it | Don't touch ExportTarget — unused but harmless. | |
| Delete it (cleanup) | Remove orphaned component and templateInlineStyles.ts dependency. | ✓ |
| Wire it up instead | Switch export to use ExportTarget + html2pdf.js for headless PDF. | |

**User's choice:** Delete it (cleanup)
**Notes:** ExportTarget.tsx and templateInlineStyles.ts are dead code — window.print() is the real export path.

---

## Claude's Discretion

- Whether to add print CSS for `<strong>`, `<em>` (browser UA defaults are appropriate)
- Whether to add print CSS for `<a>` styling beyond URL suppression
- Exact hex value for subtle code background (using `#f3f4f6`)

## Deferred Ideas

None — discussion stayed within phase scope
