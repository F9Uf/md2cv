# Phase 9: Responsive Auto-Fit Zoom - Pattern Map

**Mapped:** 2026-05-19
**Files analyzed:** 2 modified, 0–1 new (decision below)
**Analogs found:** 2 / 2 (modified files have themselves as the "before" analog; new-hook option has 2 strong analogs)

## File Classification

| File (status) | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/components/Preview.tsx` (modify) | component | event-driven (DOM observation → derived style) | self (pre-Phase-9) + `src/hooks/useSplitPane.ts` (observer lifecycle) | exact (file itself) |
| `src/styles/pages.css` (modify) | styles (page chrome) | n/a | self (pre-Phase-9) | exact (file itself) |
| `src/hooks/usePaneWidth.ts` (NEW — **optional**, see Recommendation) | hook | event-driven (ResizeObserver → state) | `src/hooks/useMediaQuery.ts` (subscribe-and-cleanup), `src/hooks/useSplitPane.ts` (ref + measurement) | role-match |

### Recommendation: Inline in `Preview.tsx`, do NOT extract a hook

CONTEXT.md §"Established Patterns" explicitly allows either path. The arguments tip toward **inline**:

1. **Single consumer.** The ResizeObserver state is consumed only by `Preview.tsx` and only on the paginated branch. A hook adds a file without adding reuse.
2. **Tight coupling to paged.js mount.** The scale calc reads `getBoundingClientRect().width` from `.pagedjs_page` inside `previewerRootRef` (D-06). That ref already lives in `Preview.tsx`; a hook would either need the ref passed in (leaking internals) or have to query `document.querySelector` (worse).
3. **Coexists with paged.js effect.** The existing paged.js `useEffect` (lines 33–91) and the new ResizeObserver `useEffect` share the same `previewerRootRef`. Keeping both in one file makes the ordering/cleanup contract obvious.
4. **D-05 wording.** "All scale state and the ResizeObserver lifecycle live inside `Preview.tsx`" reads as a soft preference for in-file.

If a future phase (e.g., manual zoom controls ZOOM-02) needs the pane width elsewhere, extract then. For Phase 9, inline.

The hook excerpts below are still included so the planner has a fallback pattern if it disagrees.

---

## Pattern Assignments

### `src/components/Preview.tsx` (modify — add ResizeObserver effect + scaled-wrapper JSX)

**Analog A:** `src/components/Preview.tsx` itself (existing paged.js effect — mirror its lifecycle shape)

**Imports pattern** (lines 1–7) — already in place, no new imports needed beyond what's there. `useEffect` and `useRef` are imported; `useState` is imported. ResizeObserver is a browser global — no import:
```typescript
import { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { Previewer } from 'pagedjs'
import { TEMPLATE_STYLES, type TemplateName } from '../lib/templateStyles'
import { type MarginValues } from './MarginControls'
import { DEFAULT_MARGINS } from '../lib/constants'
import '../styles/themes.css'
```

**State declaration pattern** (lines 25–27) — `useRef` for DOM nodes, `useState` for values React renders. Mirror this for the new scale state and a new ref for the scaled wrapper:
```typescript
const previewerRootRef = useRef<HTMLDivElement>(null)
const [pageCount, setPageCount] = useState<number | null>(null)
const [hasError, setHasError] = useState(false)
```
Add alongside: `const scrollContainerRef = useRef<HTMLDivElement>(null)` (the observed outer div, currently has no ref) and `const [scale, setScale] = useState(1)`. The wrapper height can be derived inline from `scale` × measured natural height stored in a ref or a second state slot — Claude's choice per CONTEXT.md.

**useEffect lifecycle pattern** (lines 33–91) — the gold-standard cleanup shape this phase MUST mirror. Note the `cancelled` flag and the cleanup function that disconnects/destroys long-lived objects:
```typescript
useEffect(() => {
  if (!enablePagination) return
  if (!htmlContent.trim()) return
  const root = previewerRootRef.current
  if (!root) return

  let cancelled = false
  let activePreviewer: Previewer | null = null

  // ... setup ...

  return () => {
    cancelled = true
    if (activePreviewer) {
      try { activePreviewer.polisher?.destroy() } catch { /* ignore */ }
      try { activePreviewer.chunker?.destroy() } catch { /* ignore */ }
    }
  }
}, [htmlContent, template, enablePagination, styles.container, onPageCountChange, margins])
```

**For the new ResizeObserver effect, mirror this shape:**
```typescript
useEffect(() => {
  if (!enablePagination) return
  const container = scrollContainerRef.current
  if (!container) return

  const observer = new ResizeObserver(() => {
    // read available pane width (subtract px-4 = 16px each side → 32px total)
    // read .pagedjs_page width via getBoundingClientRect (fallback: 793.7px)
    // setScale(Math.min(availableWidth / pageWidth, 1))
  })
  observer.observe(container)

  return () => observer.disconnect()
}, [enablePagination])  // intentionally NOT depending on htmlContent/template/margins (D-08)
```
The dependency list MUST exclude `htmlContent`, `template`, `margins`, `styles.container`, `onPageCountChange` — D-08 forbids re-binding the observer on every paged.js reflow.

**Paginated-path JSX pattern** (lines 117–128) — the structure to modify. Currently the `previewerRootRef` div is a bare child of the scroll container; Phase 9 either (a) adds a wrapper around it or (b) attaches `style={{ transform, height }}` directly to `previewerRootRef`. CONTEXT.md §"Claude's Discretion" allows either:
```typescript
return (
  <div className="relative h-full overflow-auto bg-gray-100 px-4 py-6">
    <div ref={previewerRootRef} />
    <div
      className="sticky bottom-4 right-4 ml-auto inline-block bg-gray-900/85 text-white text-xs font-medium leading-tight px-2 py-1 rounded-md"
      aria-live="polite"
    >
      {pillLabel}
    </div>
  </div>
)
```

**Modification target — must add `ref` to the outer scroll div** so the ResizeObserver can attach. The sticky pill is OUTSIDE the scaled wrapper so it doesn't shrink. The scaled wrapper wraps `previewerRootRef` (recommended pattern, matches D-03 cleanly):
```typescript
return (
  <div ref={scrollContainerRef} className="relative h-full overflow-auto bg-gray-100 px-4 py-6">
    <div
      style={scale < 1 ? { transform: `scale(${scale})`, transformOrigin: 'top center', height: naturalHeightPx * scale } : undefined}
    >
      <div ref={previewerRootRef} />
    </div>
    <div className="sticky bottom-4 right-4 ml-auto inline-block bg-gray-900/85 text-white text-xs font-medium leading-tight px-2 py-1 rounded-md" aria-live="polite">
      {pillLabel}
    </div>
  </div>
)
```
The `scale < 1 ? … : undefined` guard implements the "invisible at 1:1" rule from `<specifics>` — no transform string written when not needed.

**Loop-guard pattern** (CONTEXT.md §"Constraints"): the `style={{ height: … }}` write MUST land on the INNER wrapper, not the observed `scrollContainerRef` div. The above structure satisfies this — the observed element's box never changes as a result of the callback.

---

**Analog B:** `src/hooks/useSplitPane.ts` (`containerRef` + `getBoundingClientRect` measurement pattern, lines 37–42)

**Measurement pattern** (lines 37–42):
```typescript
const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.current || !containerRef.current) return
  const rect = containerRef.current.getBoundingClientRect()
  const newRatio = (e.clientX - rect.left) / rect.width
  setRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, newRatio)))
}
```

**Pattern to copy:** ref-guard (`if (!ref.current) return`) → `getBoundingClientRect()` → clamp with `Math.min`/`Math.max` → `setState`. The new scale calc has the same shape:
```typescript
// inside ResizeObserver callback
if (!scrollContainerRef.current) return
const containerRect = scrollContainerRef.current.getBoundingClientRect()
const availableWidth = containerRect.width - 32  // px-4 left + right
const firstPage = scrollContainerRef.current.querySelector('.pagedjs_page')
const pageWidth = firstPage ? firstPage.getBoundingClientRect().width : 793.7
setScale(Math.min(availableWidth / pageWidth, 1))
```

The clamp shape (`Math.min(…, 1)`) mirrors `Math.min(MAX_RATIO, Math.max(MIN_RATIO, newRatio))` — direct stylistic precedent.

---

### `src/styles/pages.css` (modify — add transform-related rules + defensive print reset)

**Analog:** `src/styles/pages.css` itself (existing structure)

**Existing structure to extend** (lines 10–14, 33–39):
```css
.pagedjs_pages {
  display: flex;
  flex-direction: column;
  align-items: center;
}

@media print {
  .pagedjs_page {
    box-shadow: none;
    border: none;
    margin-bottom: 0;
  }
}
```

**Existing in-file conventions to follow:**
- Top-of-file comment explaining the rule's scope (lines 1–8) — add a paragraph noting the on-screen scale wrapper is purely visual (D-01).
- Two-rule `@media print` block — extend with the defensive `transform: none; height: auto` reset (CONTEXT.md §"Claude's Discretion" — "fine to add").

**Patterns to write** (the scale itself is applied inline via React `style={…}` per D-01 — so `pages.css` may need only the defensive print rule). If a class-based approach is preferred:
```css
/* On-screen auto-fit wrapper around paged.js output. Height is computed in JS
 * so the wrapper's bottom edge tracks the scaled page stack — no empty void
 * below the resume. transform-origin: top center keeps the page horizontally
 * centered as it shrinks. */
.pagedjs-scale-wrapper {
  transform-origin: top center;
  /* transform and height set inline by Preview.tsx */
}

@media print {
  .pagedjs-scale-wrapper {
    transform: none !important;
    height: auto !important;
  }
}
```

The print-reset rule is consistent with the existing belt-and-suspenders comment on lines 29–32.

---

### `src/hooks/usePaneWidth.ts` (NEW — OPTIONAL — only if planner overrides recommendation)

**Analog A:** `src/hooks/useMediaQuery.ts` (lazy SSR-safe init + subscribe-cleanup pattern, lines 1–16)

**Full file** (16 lines — small enough to read as one unit):
```typescript
import { useState, useEffect } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}
```

**Patterns to copy:**
- Lazy `useState` initializer (`useState(() => …)`) — avoid running browser-only code on first render of a non-DOM environment.
- `addEventListener` in effect body, `removeEventListener` in returned cleanup — direct analog for `observer.observe()` / `observer.disconnect()`.
- Single value returned (no object) — keeps the call site terse.

**Adapted shape:**
```typescript
import { useState, useEffect, type RefObject } from 'react'

export function usePaneWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return width
}
```

**Analog B:** `src/hooks/useSplitPane.ts` (ref-returning pattern, lines 19–22, 56)

```typescript
export function useSplitPane() {
  const [ratio, setRatio] = useState(loadRatio)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  // …
  return { ratio, containerRef, onMouseDown }
}
```

**Patterns to copy:** if the hook owns the ref (so the caller just does `const { ref, width } = usePaneWidth()`), follow this object-return shape. Per-call freedom — both styles exist in the repo. The `ref` parameter signature (Analog A) keeps the ref owned by `Preview.tsx`, which is the cleaner match here because the ref is shared with the existing paged.js effect.

---

## Shared Patterns

### Lifecycle cleanup (subscribe → disconnect)
**Source:** `src/components/Preview.tsx` lines 33–91 (paged.js effect) and `src/hooks/useMediaQuery.ts` lines 8–13
**Apply to:** New ResizeObserver effect

Every long-lived browser-API subscription in this repo follows: instantiate inside `useEffect`, return a cleanup function that tears it down. No `useEffect` in the repo leaves a listener registered. Mirror exactly.

### Defensive try/empty-catch around browser-API calls
**Source:** `src/App.tsx` lines 38–47 (margins parse), `src/components/Preview.tsx` lines 87–88 (paged.js destroy)
```typescript
try { activePreviewer.polisher?.destroy() } catch { /* ignore */ }
```
**Apply to:** Any `querySelector`/`getBoundingClientRect` call inside the ResizeObserver callback if the element may not exist yet. Prefer a `?.` chain + null check over try/catch when the failure mode is "no element yet" (typed return) vs. "API threw" (use try/catch).

### Conditional inline `style` for "invisible at default"
**Source:** No exact prior analog — but this phase's `<specifics>` ("invisible at 1:1") establishes the rule.
**Apply to:** New scaled wrapper JSX. Use ternary `style={scale < 1 ? { … } : undefined}` so React omits the style attribute entirely when scale is 1.

### CSS file structure
**Source:** `src/styles/pages.css` lines 1–8 (header comment), lines 33–39 (`@media print` defensive block)
**Apply to:** New rules in `pages.css`. Every rule block has a comment explaining intent; the `@media print` defensive block is the established place for print-time guards.

### Tailwind utility classes inline, no CSS modules
**Source:** `src/components/Preview.tsx` line 119 (`className="relative h-full overflow-auto bg-gray-100 px-4 py-6"`), `src/components/SplitPane.tsx` lines 25, 29
**Apply to:** Any new wrapper div. The scaled wrapper needs no Tailwind classes (its only styling is the inline transform). If a `pagedjs-scale-wrapper` class is added for the `@media print` reset, it lives in `pages.css`, NOT as a `@apply` (no `@apply` usage in the repo).

### Phase-7/8-inherited "do not retrigger paged.js" rule
**Source:** Phase 7 CONTEXT.md D-02; Phase 9 CONTEXT.md D-08; `src/components/Preview.tsx` line 91 (the paged.js effect dep list)
**Apply to:** The new ResizeObserver effect's dep list. `[enablePagination]` only — never include `htmlContent`, `template`, `margins`, `styles.container`, `onPageCountChange`.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| — | — | — | All Phase 9 surface has at least one strong analog in the repo. |

`ResizeObserver` itself is not used anywhere in the codebase today, but the `addEventListener`/`removeEventListener` shape in `useMediaQuery.ts` and the `observer.disconnect()` shape are 1-line analogs to the API.

---

## Metadata

**Analog search scope:** `src/components/`, `src/hooks/`, `src/styles/`, `src/lib/`, `src/App.tsx`, `src/index.css`
**Files scanned:** 13 source files (entire src/ tree minus tests)
**Pattern extraction date:** 2026-05-19
