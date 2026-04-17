---
phase: 04-inline-styles-html-preview
reviewed: 2026-04-16T00:00:00Z
depth: standard
files_reviewed: 4
files_reviewed_list:
  - src/lib/parseResume.ts
  - src/types/resume.ts
  - src/components/Preview.tsx
  - src/components/ExportTarget.tsx
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-04-16T00:00:00Z
**Depth:** standard
**Files Reviewed:** 4
**Status:** issues_found

## Summary

Four files were reviewed: the markdown parser, the shared resume type definitions, the live-preview component, and the export/PDF target component. The code is generally well-structured with clear separation between the Tailwind-based preview and the inline-style export path.

Three warnings were found: a crash-on-null in the parser when an `h3` appears before any `h2`, fragile token-level assumptions for nested list detection, and silently-undefined style properties in the export component. Two info items cover index-based React keys and an accepted but unguarded `dangerouslySetInnerHTML` surface.

---

## Warnings

### WR-01: Null dereference crash when h3 appears before h2

**File:** `src/lib/parseResume.ts:83`
**Issue:** When an `h3` heading is encountered while `currentSection` is `null` (i.e., no `h2` has been seen yet), the code at line 83 attempts `currentSection.entries.push(currentEntry)` without a null guard. This throws `TypeError: Cannot read properties of null (reading 'entries')` at runtime. A resume document that starts with an `h3` before any `h2`, or a user accidentally typing `### Title` at the top of the document, will crash the parser.
**Fix:**
```ts
// Line 82–92 — guard currentSection before push
} else if (tag === 'h3') {
  if (currentEntry && currentSection) {
    currentSection.entries.push(currentEntry)
  }
  currentEntry = {
    title: content,
    details: [],
    extra: '',
  }
  context = 'entry'
  i += 3
  continue
}
```

---

### WR-02: Fragile token-level assumption for nested bullet items

**File:** `src/lib/parseResume.ts:113`
**Issue:** The condition `t.level === 2 || t.level === 3` hard-codes markdown-it's internal token level numbers to distinguish tight vs. loose list items. This assumption holds only when the bullet list is at the top level of the document. If the list is nested inside a blockquote (`> - item`) or another block wrapper, all token levels shift by the nesting depth and the condition silently evaluates to `false` for every item — causing all bullet text to be dropped without error. The parser offers no feedback when this happens.
**Fix:** Use a relative-level approach anchored to the `bullet_list_open` token's level, rather than hard-coded absolute levels:
```ts
// Capture the base level when collecting the list
const baseLevel = token.level // bullet_list_open level

// Then inside the extraction loop:
if (t.type === 'inline' && (t.level === baseLevel + 2 || t.level === baseLevel + 3)) {
  currentEntry.details.push(md.renderInline(t.content))
}
```

---

### WR-03: Accessing potentially-undefined style properties in ExportTarget

**File:** `src/components/ExportTarget.tsx:41,52`
**Issue:** Two places read `s.sectionHeading.marginTop` (line 41) and `s.entryTitle.marginTop` (line 52) from the inline style objects to use as fallback values. If a template's inline style definition does not declare `marginTop` on these style objects, the expression evaluates to `undefined`. The spread `{ ...s.sectionHeading, marginTop: undefined }` silently removes the `marginTop` property rather than keeping the template default, causing invisible layout inconsistencies that vary by template.

Line 41:
```ts
marginTop: si === 0 ? '24px' : s.sectionHeading.marginTop,
```
Line 52:
```ts
marginTop: s.entryTitle.marginTop
```
**Fix:** Use nullish coalescing to fall back explicitly:
```ts
// Line 41
marginTop: si === 0 ? '24px' : (s.sectionHeading.marginTop ?? '16px'),

// Line 52
marginTop: s.entryTitle.marginTop ?? '8px',
```
Alternatively, enforce that all template inline style definitions include `marginTop` by strengthening the TypeScript interface for `TEMPLATE_INLINE_STYLES` entries.

---

## Info

### IN-01: Array index used as React key

**File:** `src/components/Preview.tsx:34,42,53`
**Issue:** All three map calls use the array index as the `key` prop (`key={si}`, `key={ei}`, `key={di}`). In a live-preview editor where the resume is re-parsed on every keystroke, React uses these keys to reconcile the DOM. When sections/entries are reordered or inserted, index-based keys can cause stale state to be retained on wrong nodes (e.g., animated transitions, focus, scroll position). For purely static rendered output this is low risk, but it is an anti-pattern.
**Fix:** Use a stable derived key such as the section heading or entry title:
```tsx
{resumeData.sections.map((section) => (
  <div key={section.heading}>
    ...
    {section.entries.map((entry) => (
      <div key={entry.title}>
```
Apply the same pattern in `ExportTarget.tsx` lines 39, 51, 61.

---

### IN-02: dangerouslySetInnerHTML surface in both components

**File:** `src/components/Preview.tsx:29,39,48,54` / `src/components/ExportTarget.tsx:36,46,55,62`
**Issue:** All `extra`, `preamble`, and `details` fields are rendered via `dangerouslySetInnerHTML`. The parser enables `html: true` on the MarkdownIt instance (documented in a comment as accepted risk T-04-01 for a personal single-user tool). This is an acknowledged decision. The finding is recorded here for completeness: if the tool scope ever expands to accept external/untrusted markdown input, all `dangerouslySetInnerHTML` call sites and the `html: true` flag would need to be revisited with DOMPurify or equivalent sanitization.
**Fix:** No action required for current scope. If scope expands, add sanitization:
```ts
import DOMPurify from 'dompurify'
// wrap all rendered HTML before storing in ResumeData fields:
DOMPurify.sanitize(rendered)
```

---

_Reviewed: 2026-04-16T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
