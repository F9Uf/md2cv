---
phase: 07-page-chrome-auto-pagination
reviewed: 2026-05-18T00:00:00Z
depth: standard
files_reviewed: 6
files_reviewed_list:
  - package.json
  - src/App.tsx
  - src/components/Preview.tsx
  - src/main.tsx
  - src/styles/pages.css
  - src/types/pagedjs.d.ts
findings:
  critical: 0
  warning: 4
  info: 3
  total: 7
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-05-18T00:00:00Z
**Depth:** standard
**Files Reviewed:** 6
**Status:** issues_found

## Summary

Phase 07 integrates pagedjs into the React/TypeScript preview pipeline. The implementation is well-structured overall: the cleanup pattern (cancel flag + polisher/chunker destroy), the explicit stylesheets argument to avoid the strip-all pitfall, and the fallback rendering path are all sound. However, there are four warnings worth addressing before shipping, and three informational items.

---

## Warnings

### WR-01: Page counter pill always shows "Page N of N" — never shows the current page

**File:** `src/components/Preview.tsx:103`
**Issue:** The pill label is computed as `Page ${pageCount} of ${pageCount}`, using `pageCount` for both numerator and denominator. This means the counter always reads "Page 3 of 3" when a 3-page resume renders — it never shows which page the user is currently viewing. A scroll-position tracker is needed to derive the current page, or the label should be reworded to "X pages" to accurately reflect what the value represents.

**Fix:**
```tsx
// Option A — reword to match what we actually know
const pillLabel = pageCount === null ? '— pages' : `${pageCount} page${pageCount === 1 ? '' : 's'}`

// Option B — track current page via IntersectionObserver on .pagedjs_page elements
// and maintain a `currentPage` state alongside `pageCount`.
```

---

### WR-02: Cleanup destroys `polisher` and `chunker` but not the DOM nodes pagedjs injected into `<head>`

**File:** `src/components/Preview.tsx:70-76`
**Issue:** `polisher.destroy()` tears down pagedjs's internal state, but pagedjs injects `<style>` elements into `document.head` during each `preview()` call. These are not removed by `destroy()`. With every re-render (triggered by `htmlContent` or `template` changes), orphaned style tags accumulate in `<head>`, which can cause visual artifacts and a slow memory leak in long editing sessions.

**Fix:**
```tsx
return () => {
  cancelled = true
  if (activePreviewer) {
    try { activePreviewer.polisher?.destroy() } catch { /* ignore */ }
    try { activePreviewer.chunker?.destroy() } catch { /* ignore */ }
  }
  // Remove any <style> tags pagedjs injected into <head>
  document
    .querySelectorAll('style[data-pagedjs-inserted]')
    .forEach(el => el.remove())
  // Note: verify the exact attribute name by inspecting pagedjs source;
  // a broader selector like style[id^="pagedjs"] may be needed.
}
```

---

### WR-03: `onPageCountChange` in the `useEffect` dependency array can cause infinite re-render loops

**File:** `src/components/Preview.tsx:77`
**Issue:** `onPageCountChange` is listed in the `useEffect` deps array on line 77. If a caller passes an inline arrow function (e.g., `onPageCountChange={(n) => setCount(n)}`), the function reference is new on every parent render, which triggers the effect again, which calls `onPageCountChange`, which triggers the parent to re-render, and so on. App.tsx currently does not pass this prop, so the bug is latent — but it will surface the moment any caller wires it up.

**Fix:**
```tsx
// Stabilize the callback reference with useCallback in the caller, OR
// wrap in useRef inside Preview.tsx so the effect dep is stable:

const onPageCountChangeRef = useRef(onPageCountChange)
useEffect(() => { onPageCountChangeRef.current = onPageCountChange })

// then inside the async block:
if (!cancelled) onPageCountChangeRef.current?.(count)

// and remove onPageCountChange from the useEffect dependency array.
```

---

### WR-04: `themes.css` imported in both `main.tsx` and `Preview.tsx` — double-import

**File:** `src/components/Preview.tsx:5`, `src/main.tsx:4`
**Issue:** `src/styles/themes.css` is imported once in `main.tsx` (global stylesheet) and again with a relative import inside `Preview.tsx`. With Vite's CSS deduplication this is harmless in production, but in development (HMR) duplicate CSS module registrations can produce ordering surprises when themes.css is updated, and it signals an unclear ownership model. Global stylesheets should be imported exclusively from `main.tsx`.

**Fix:** Remove the `import '../styles/themes.css'` line from `src/components/Preview.tsx:5`. The stylesheet is already applied globally via `main.tsx`.

---

## Info

### IN-01: `polisher` and `chunker` typed as non-optional on `Previewer` — may cause false confidence

**File:** `src/types/pagedjs.d.ts:26-27`
**Issue:** `polisher` and `chunker` are declared without `?` (non-optional), implying they are always present after construction. In practice they are only assigned after `preview()` resolves. The try/catch guards in Preview.tsx (`activePreviewer.polisher?.destroy()`) use optional chaining, which suggests the author already knows they can be undefined — but the type declaration doesn't reflect that. This can mislead future callers who don't read the cleanup code carefully.

**Fix:**
```ts
polisher?: { destroy(): void }
chunker?: { destroy(): void; total: number; pages: unknown[] }
```

---

### IN-02: `console.error` left in production code path

**File:** `src/components/Preview.tsx:65`
**Issue:** `console.error('paged.js render failed', err)` is intentional for debugging, but will appear in production browser consoles for all users who trigger a pagedjs failure. Consider gating it on an env flag or removing it once the integration is stable.

**Fix:**
```tsx
if (import.meta.env.DEV) {
  console.error('paged.js render failed', err)
}
```

---

### IN-03: Magic inline `@page` rule couples page dimensions to JavaScript

**File:** `src/components/Preview.tsx:56`
**Issue:** `'@page { size: A4 portrait; margin: 15mm; }'` is a magic string embedded in the `preview()` call. If page size or margins need to change (e.g., US Letter support, per-template margins), callers must hunt down this string in the component body. The pages.css file comment acknowledges this coupling but does not resolve it.

**Fix:** Extract to a named constant in a shared config file:
```ts
// src/lib/pageConfig.ts
export const PAGE_STYLESHEET = '@page { size: A4 portrait; margin: 15mm; }'
```

---

_Reviewed: 2026-05-18T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
