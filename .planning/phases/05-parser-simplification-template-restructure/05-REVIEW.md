---
phase: 05-parser-simplification-template-restructure
reviewed: 2026-04-25T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - src/App.tsx
  - src/components/Preview.tsx
  - src/lib/parseResume.test.ts
  - src/lib/parseResume.ts
  - src/lib/templateStyles.ts
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-04-25T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Phase 5 simplified the resume parsing pipeline significantly: `parseResume()` is now a thin `md.render()` wrapper returning an HTML string, `Preview.tsx` renders via `dangerouslySetInnerHTML`, and `templateStyles.ts` moved from semantic keys to HTML element keys. The simplification is clean and coherent. XSS via `dangerouslySetInnerHTML` with `html: true` is an explicitly accepted risk (D-10, personal single-user tool) and is not flagged here.

Three warnings concern real logic gaps: template styles are defined as Tailwind class strings on a parent container but never applied to the actual child elements rendered by `dangerouslySetInnerHTML`, making every template look identical at runtime. The remaining findings are minor quality items.

---

## Warnings

### WR-01: Template element classes (h1, h2, h3, etc.) are never applied — all templates render identically

**File:** `src/components/Preview.tsx:19-24` / `src/lib/templateStyles.ts:1-65`

**Issue:** `TEMPLATE_STYLES` defines per-element Tailwind classes (`h1`, `h2`, `h3`, `p`, `ul`, `li`, etc.), but `Preview.tsx` only reads `styles.container` and passes the raw HTML string to `dangerouslySetInnerHTML`. The HTML produced by `md.render()` contains plain `<h1>`, `<h2>`, `<li>` elements with no class attributes. Tailwind's JIT compiler purges unused classes, so even if the class strings are present in the source, they have no effect on elements inside `dangerouslySetInnerHTML` unless injected into the DOM. Switching between classic / modern / minimal changes only the wrapper font-family and max-width — every heading, list, and paragraph looks the same across all three templates.

**Fix:** One of two approaches:

Option A — inject a `<style>` block scoped to the container using a stable selector, e.g.:

```tsx
const styleTag = `
  <style>
    .resume-preview h1 { /* map styles.h1 Tailwind values to raw CSS */ }
    .resume-preview h2 { ... }
  </style>
`
return (
  <div
    className={`resume-preview ${styles.container}`}
    dangerouslySetInnerHTML={{ __html: styleTag + htmlContent }}
  />
)
```

Option B — use a markdown-it plugin (e.g. `markdown-it-attrs`) to inject `class=` attributes during rendering, driven by the active template's class map.

Option C (simplest path) — drop the per-element keys from `TemplateClasses` entirely until a proper injection mechanism is implemented, to avoid the false impression that the keys are active.

---

### WR-02: Two `<Preview>` instances are rendered simultaneously; the print-area one is always mounted

**File:** `src/App.tsx:134-136`

**Issue:** A second `<Preview htmlContent={htmlContent} template={selectedTemplate} />` is always present in the DOM inside `#print-area` (line 135). Both instances parse and render the same content. On every keystroke the debounce fires, sets `htmlContent`, and both components re-render (two `dangerouslySetInnerHTML` replacements). For the current payload this is harmless, but the second instance also holds live DOM nodes that are permanently attached, which may confuse screen readers (`aria-hidden` is not set on `#print-area`).

**Fix:** Add `aria-hidden="true"` to the `#print-area` div so assistive technology ignores the duplicate content:

```tsx
<div id="print-area" aria-hidden="true">
  <Preview htmlContent={htmlContent} template={selectedTemplate} />
</div>
```

---

### WR-03: `handleDownloadMd` appends an `<a>` to `document.body` via `a.click()` without attaching it first — cross-browser inconsistency

**File:** `src/App.tsx:60-68`

**Issue:** The download anchor is created and `.click()`-ed directly without being appended to the DOM (lines 64-67). Firefox requires the element to be in the document before a programmatic click triggers a download. Chromium-based browsers work without attachment, but this is not spec-guaranteed behavior.

**Fix:**

```ts
const a = document.createElement('a')
a.href = url
a.download = filename
document.body.appendChild(a)
a.click()
document.body.removeChild(a)
URL.revokeObjectURL(url)
```

---

## Info

### IN-01: `TemplateClasses` interface documents unused element keys with no enforcement that they are applied

**File:** `src/lib/templateStyles.ts:3-17`

**Issue:** The interface declares 12 keys (`container`, `h1`, `h2`, `h3`, `p`, `ul`, `ol`, `li`, `code`, `pre`, `a`, `blockquote`, `hr`) and all three template objects implement all 12. However, as noted in WR-01, none of the non-`container` keys are consumed anywhere in the codebase. Future contributors may add a fourth template believing those keys are active.

**Fix:** Add a comment to the interface noting which keys are currently consumed vs. reserved:

```ts
export interface TemplateClasses {
  /** Applied to the wrapper div in Preview.tsx */
  container: string
  // The following keys are defined for future use; not yet applied to rendered HTML.
  h1: string
  // ...
}
```

---

### IN-02: Test file imports `TEMPLATE_STYLES` but only checks key existence — no values are validated

**File:** `src/lib/parseResume.test.ts:86-94`

**Issue:** The `classic has element keys` test (lines 86-94) checks that the keys exist with `toHaveProperty` but does not assert the values are non-empty strings. A refactor that sets any key to `''` or `undefined` would silently pass. The pattern is inconsistent: the container tests at lines 73-84 do check `toBeTruthy()`.

**Fix:** Extend the element-key assertions to also verify non-empty strings, matching the container test pattern:

```ts
expect(s.h1).toBeTruthy()
expect(typeof s.h1).toBe('string')
// repeat for h2, h3, p, ul, li
```

---

### IN-03: `parseResume.ts` singleton `md` instance is module-level — harmless now, but note for future plugin usage

**File:** `src/lib/parseResume.ts:3-4`

**Issue:** The `MarkdownIt` instance is created once at module load time with `{ html: true }`. This is fine for the current use case. However, if future phases add per-template plugins (e.g., custom renderers, `markdown-it-attrs` for class injection), the singleton pattern will require a factory or re-initialization. This is not a bug today — just a note to track before WR-01 is addressed.

**Fix:** No immediate action required. Document the constraint with a comment:

```ts
// Singleton instance — options fixed at module load. If per-template plugin
// configuration is needed in future, convert to a factory function.
const md = new MarkdownIt({ html: true })
```

---

_Reviewed: 2026-04-25T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
