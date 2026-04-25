---
phase: 06-tailwind-powered-preview-rendering
reviewed: 2026-04-25T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - index.html
  - src/components/Preview.tsx
  - src/lib/templateStyles.ts
  - src/main.tsx
  - src/styles/theme-classic.css
  - src/styles/theme-minimal.css
  - src/styles/theme-modern.css
  - src/styles/themes.css
findings:
  critical: 1
  warning: 3
  info: 2
  total: 6
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-04-25T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This phase wires up theme-scoped CSS (via Tailwind `@custom-variant`) to the live preview component. The architecture is clean: a single `theme-${template}` class on the container activates all child element styles through CSS custom variants, and `templateStyles.ts` contributes layout/font container classes. The code is compact and readable.

However, there is one critical XSS vulnerability in `Preview.tsx`, two meaningful correctness warnings around how Tailwind CDN interacts with the build-time CSS pipeline, and one warning about an invalid pseudo-class ordering in `theme-modern.css`. Two info-level items are also noted.

## Critical Issues

### CR-01: Unsanitized HTML injected via `dangerouslySetInnerHTML`

**File:** `src/components/Preview.tsx:22`
**Issue:** `htmlContent` is rendered directly with `dangerouslySetInnerHTML` with no sanitization. The markdown parser (markdown-it) can emit raw HTML if the user includes it in the markdown input (e.g. `<script>alert(1)</script>` or `<img onerror="...">`). Even though this is a personal tool, malicious markdown pasted from external sources (e.g. a job posting template, a shared snippet) will execute arbitrary JavaScript in the browser context.
**Fix:**
```tsx
import DOMPurify from 'dompurify'

// Inside Preview component, before the return:
const sanitized = DOMPurify.sanitize(htmlContent)

// In JSX:
<div
  className={`theme-${template} ${styles.container}`}
  dangerouslySetInnerHTML={{ __html: sanitized }}
/>
```
Install the package: `npm install dompurify` and `npm install -D @types/dompurify`.

Alternatively, ensure markdown-it is configured with `html: false` (the default) so raw HTML pass-through is disabled at the parser level. Confirm this is set wherever markdown-it is instantiated.

---

## Warnings

### WR-01: Tailwind CDN and Vite build-time CSS are in conflict

**File:** `index.html:10` and `src/styles/theme-classic.css:1` / `theme-modern.css:1` / `theme-minimal.css:1`
**Issue:** `index.html` loads the Tailwind CDN script (`https://cdn.tailwindcss.com`). The theme CSS files use `@reference "tailwindcss"` and `@apply`, which are Vite/PostCSS build-time directives processed by the Tailwind CLI or PostCSS plugin — they are entirely separate from the CDN runtime. At runtime the CDN script generates its own utility classes by scanning the DOM; it does not process `@apply` in your bundled CSS. This creates two parallel Tailwind runtimes that will likely conflict:

1. The CDN resets or overrides base styles, potentially undoing `@apply`-generated rules.
2. The CDN does not know about `@custom-variant` — that feature requires Tailwind v4 PostCSS processing, which the CDN script does not provide.
3. Both runtimes inject `<style>` tags, producing specificity conflicts.

**Fix:** Remove the CDN `<script>` from `index.html` entirely. The Vite build pipeline (PostCSS/Tailwind plugin) already processes all CSS at build time, so the CDN is not needed and is actively harmful here. If Tailwind utility classes are needed in JSX (e.g., `className="flex items-center"`), the build-time plugin covers those via the content scan.

```html
<!-- Remove this line from index.html -->
<script src="https://cdn.tailwindcss.com"></script>
```

---

### WR-02: `hover:theme-modern:text-blue-800` — invalid variant ordering

**File:** `src/styles/theme-modern.css:14`
**Issue:** The rule `hover:theme-modern:text-blue-800` stacks a state variant (`hover:`) before a custom variant (`theme-modern:`). Tailwind v4 custom variants created with `@custom-variant` act as selector wrappers; stacking `hover:` before a custom ancestor-selector variant produces an invalid or non-functional selector. The generated CSS would attempt something like `.hover\:theme-modern\:text-blue-800:hover` scoped inside `.theme-modern &`, which is syntactically ambiguous and may silently produce no output.
**Fix:** Reverse the variant order to put the custom variant first, or use a plain CSS rule for the hover state:
```css
/* Option A: plain CSS fallback */
a { @apply theme-modern:text-gray-500 theme-modern:underline; }
.theme-modern a:hover { color: theme(colors.blue.800); }

/* Option B: if Tailwind v4 supports this ordering, verify with the generated output */
a { @apply theme-modern:text-gray-500 theme-modern:underline theme-modern:hover:text-blue-800; }
```

---

### WR-03: Non-exhaustive `TemplateName` guard — runtime crash if unknown template passed

**File:** `src/components/Preview.tsx:9` and `src/lib/templateStyles.ts:7`
**Issue:** `TEMPLATE_STYLES[template]` will return `undefined` if `template` is ever a value not in the record (e.g., a future template not yet added, or a serialized value from `localStorage`/URL params that has become stale). The component then destructures `styles.container` on line 21, throwing `TypeError: Cannot read properties of undefined`. TypeScript's `TemplateName` union prevents this at compile time but not at runtime boundary crossings (e.g., query params, stored state).
**Fix:** Add a runtime fallback:
```ts
const styles = TEMPLATE_STYLES[template] ?? TEMPLATE_STYLES['classic']
```
Or add an explicit guard and log a warning in development.

---

## Info

### IN-01: `theme-classic.css` missing `strong` rule (inconsistent with `theme-minimal.css`)

**File:** `src/styles/theme-classic.css` and `src/styles/theme-minimal.css:17`
**Issue:** `theme-minimal.css` defines a `strong` rule (`theme-minimal:text-gray-700`), but `theme-classic.css` and `theme-modern.css` do not. This is likely an oversight rather than intentional, and `<strong>` elements will inherit browser defaults in those themes.
**Fix:** Decide intentionally whether `strong` needs overrides in each theme and add rules consistently, or document that only `theme-minimal` overrides `strong`.

---

### IN-02: Non-assertion root element access in `main.tsx`

**File:** `src/main.tsx:7`
**Issue:** `document.getElementById('root')!` uses a non-null assertion. If the `#root` div is ever missing from `index.html`, this throws at runtime with a confusing error. The `!` suppresses the TypeScript null check.
**Fix:**
```tsx
const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found in DOM')
createRoot(rootEl).render(...)
```
This is a minor issue since `index.html` is controlled, but it produces a better error message if the HTML is misconfigured.

---

_Reviewed: 2026-04-25T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
