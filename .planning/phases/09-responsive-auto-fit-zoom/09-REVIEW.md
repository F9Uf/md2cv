---
phase: 09-responsive-auto-fit-zoom
reviewed: 2026-05-19T00:00:00Z
depth: standard
files_reviewed: 2
files_reviewed_list:
  - src/components/Preview.tsx
  - src/styles/pages.css
findings:
  critical: 0
  warning: 2
  info: 2
  total: 4
status: issues_found
---

# Phase 9: Code Review Report

**Reviewed:** 2026-05-19
**Depth:** standard
**Files Reviewed:** 2
**Status:** issues_found

## Summary

Reviewed two files introduced/modified in Phase 9 (responsive auto-fit zoom). The CSS file is clean with no issues. The React component has one real bug risk (unstable callback reference in a useEffect dependency causing spurious paged.js re-renders), one design limitation that produces a misleading UI label, and two minor code-quality items. No security issues were found — DOMPurify sanitization is correctly applied on both render paths.

---

## Warnings

### WR-01: `onPageCountChange` in useEffect deps causes spurious paged.js re-renders

**File:** `src/components/Preview.tsx:97`

**Issue:** `onPageCountChange` is included in the dependency array of the paged.js render `useEffect`. If the parent component passes this callback as an inline arrow function (or any non-memoized function), it will have a new reference on every parent render, causing the full paged.js teardown-and-reflow cycle to fire even when `htmlContent`, `template`, and `margins` haven't changed. paged.js re-renders are expensive (full DOM clear + re-paginate), so spurious triggers are user-visible.

**Fix:** Wrap the callback in `useCallback` in the parent, or stabilize it inside `Preview` with a ref so the effect dependency is eliminated:

```tsx
// In Preview.tsx — replace direct use in deps with a stable ref
const onPageCountChangeRef = useRef(onPageCountChange)
useEffect(() => { onPageCountChangeRef.current = onPageCountChange }, [onPageCountChange])

// Then in the render effect, call onPageCountChangeRef.current?.(count) and remove
// onPageCountChange from the deps array.
```

---

### WR-02: Mobile zoom hardcoded at 0.5 — bypasses auto-fit logic entirely

**File:** `src/components/Preview.tsx:158`

**Issue:** `effectiveZoom` short-circuits to a fixed `0.5` on mobile with no calculation:

```ts
const effectiveZoom = isMobile ? 0.5 : scale
```

The `scale` computed by the ResizeObserver (`availableWidth / 793.7`) is ignored for all mobile viewports regardless of actual container width. On a tablet-size mobile viewport (e.g. 768px wide, where `availableWidth` might be 736px), this forces the page to render at 50% zoom when it could fit at ~93%. Conversely, on very narrow viewports (e.g. 320px), `scale` would be ~0.37, so the hardcoded 0.5 actually over-scales.

**Fix:** Remove the `isMobile` ternary and rely solely on the computed `scale`:

```ts
const effectiveZoom = scale  // auto-fit applies to all viewport sizes
```

The ResizeObserver already clamps to `Math.min(..., 1)`, so desktop full-width is unaffected. The `isMobile` import and `useMediaQuery` hook can be removed if no longer used elsewhere.

---

## Info

### IN-01: Page pill label format is misleading — always shows same number twice

**File:** `src/components/Preview.tsx:151`

**Issue:** The pill always displays `Page N of N` (e.g. "Page 2 of 2") because both values come from `pageCount`. This reads as a pager (current page / total pages) but there is no scroll tracking, so it only ever communicates total page count. A reader scanning quickly may interpret "Page 2 of 2" as "you are on page 2" rather than "your resume is 2 pages long."

**Fix:** Change the label to communicate total pages unambiguously:

```tsx
const pillLabel = pageCount === null ? '– pages' : `${pageCount} page${pageCount === 1 ? '' : 's'}`
```

Or if the "Page X of Y" format is intentional per spec, add scroll-position tracking to supply a meaningful current-page number.

---

### IN-02: Magic number `32` for padding offset in scale computation

**File:** `src/components/Preview.tsx:110`

**Issue:** The comment explains the value (`px-4 × 2 = 16 + 16 = 32`), but the literal `32` is a magic number tightly coupled to the Tailwind class `px-4` on the container. If the padding class changes, this will silently produce wrong scale values.

**Fix:** Extract to a named constant or derive dynamically:

```ts
const SCROLL_CONTAINER_PADDING_PX = 32 // px-4 (16px) on each side
const availableWidth = scrollContainerRef.current.getBoundingClientRect().width - SCROLL_CONTAINER_PADDING_PX
```

---

_Reviewed: 2026-05-19_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
