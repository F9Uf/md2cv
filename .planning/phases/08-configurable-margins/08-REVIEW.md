---
phase: 08-configurable-margins
reviewed: 2026-05-18T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - src/components/MarginControls.tsx
  - src/App.tsx
  - src/components/Preview.tsx
findings:
  critical: 0
  warning: 3
  info: 2
  total: 5
status: issues_found
---

# Phase 08: Code Review Report

**Reviewed:** 2026-05-18
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

Three files implement the configurable-margins feature: `MarginControls.tsx` renders the margin input strip, `App.tsx` owns the margin state and persists it to localStorage, and `Preview.tsx` forwards the values into paged.js `@page` CSS. The implementation is generally sound — localStorage validation is thorough, DOMPurify sanitization is correctly applied, and the paged.js integration is well-guarded. Three functional issues were found, plus two minor quality items.

The most impactful bug is that margin changes have no effect on the exported PDF: the print-area `<Preview>` uses the non-paginated path which renders a plain `div` and never applies the margin values to any CSS.

---

## Warnings

### WR-01: Margin changes are silently ignored in the PDF print path

**File:** `src/App.tsx:167` / `src/components/Preview.tsx:104-110`

**Issue:** The print-area `<Preview>` is rendered with `enablePagination={false}`. When that flag is set (or when paged.js throws and `hasError` is true), Preview renders a bare `dangerouslySetInnerHTML` div. No inline style or CSS variable derived from `margins` is applied to that div. The user can adjust margins all they like — the printed/exported PDF will always use whatever the browser's default margin is, ignoring the stored values entirely.

**Fix:** Apply the margin values as inline CSS on the non-paginated div, e.g.:

```tsx
// Preview.tsx — non-paginated / print branch (lines 104-110)
if (!enablePagination || hasError) {
  const marginStyle: React.CSSProperties = {
    paddingTop:    `${margins.top}mm`,
    paddingRight:  `${margins.right}mm`,
    paddingBottom: `${margins.bottom}mm`,
    paddingLeft:   `${margins.left}mm`,
  }
  return (
    <div
      style={marginStyle}
      className={`theme-${template} ${styles.container}`}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] }) }}
    />
  )
}
```

Alternatively, inject a `@page` rule into the document's print stylesheet so the browser honours it during `window.print()`.

---

### WR-02: Input clear/retype is broken — user cannot clear a field to type a new value

**File:** `src/components/MarginControls.tsx:16`

**Issue:** The early-return guard `if (!e.target.value || isNaN(parsed)) return` bails out immediately when the field is empty (the user deleted all digits to start fresh). Because the component is fully controlled (`value={margins[key]}`), React immediately restores the previous numeric value, so the field snaps back to the old number. The user cannot clear the field and type a new value without awkward cursor gymnastics.

**Fix:** Use a separate piece of local state for the raw string value, only propagating upward when the input is valid and complete:

```tsx
// Option A — uncontrolled with defaultValue + onBlur commit
<input
  type="number"
  min="0" max="50" step="1"
  defaultValue={margins[key]}
  onBlur={handleChange(key)}
  ...
/>

// Option B — local string state per field that syncs on blur/Enter
```

The simplest minimal fix is to change the early return to only guard `isNaN(parsed)` and allow the empty-string case to pass through by treating it as `0` (or the minimum value):

```tsx
const handleChange = (side: keyof MarginValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
  const raw = e.target.value
  if (raw === '') return // let the field be visually empty; commit on blur
  const parsed = Number(raw)
  if (isNaN(parsed)) return
  const clamped = Math.min(50, Math.max(0, parsed))
  onMarginsChange(side, clamped)
}
```

And add an `onBlur` that ensures the field commits a valid value (defaulting to 0 or the previous value) when focus leaves.

---

### WR-03: Reset button hardcodes `15` instead of using a shared constant

**File:** `src/components/MarginControls.tsx:22`, `src/App.tsx:35`, `src/components/Preview.tsx:21`

**Issue:** The default margin value `15` is defined independently in three locations: the `handleReset` function, `DEFAULT_MARGINS` in App.tsx, and the `margins` default parameter in Preview.tsx. If the default ever changes, it must be updated in three places, and they can silently drift apart.

**Fix:** Extract a single constant to a shared location (e.g., `src/lib/constants.ts` or directly in `MarginControls.tsx`) and import it everywhere:

```ts
// src/lib/constants.ts
export const DEFAULT_MARGINS = { top: 15, right: 15, bottom: 15, left: 15 } as const
```

Then reference it in all three files:
```ts
// MarginControls.tsx
import { DEFAULT_MARGINS } from '../lib/constants'
const handleReset = () => {
  ;(['top', 'right', 'bottom', 'left'] as const).forEach(side =>
    onMarginsChange(side, DEFAULT_MARGINS[side])
  )
}
```

---

## Info

### IN-01: `DEFAULT_MARGINS` object is created inside the component body on every render

**File:** `src/App.tsx:35`

**Issue:** `const DEFAULT_MARGINS: MarginValues = { top: 15, right: 15, bottom: 15, left: 15 }` is declared inside the `App` function body. Because it is only used as the `useState` fallback (which is only evaluated once), there is no runtime impact, but it allocates a new object on every render unnecessarily and the name implies it is a module-level constant.

**Fix:** Move it outside the component function (module scope), or remove it in favour of the shared constant from WR-03.

---

### IN-02: `margins` object in useEffect dependency array causes identity-based reflow sensitivity

**File:** `src/components/Preview.tsx:90`

**Issue:** `margins` (an object) is listed as a `useEffect` dependency. React compares dependencies by reference. If a caller ever passes a new object literal with the same numeric values (e.g., during a refactor that inlines the default), paged.js will reflow unnecessarily. Currently App.tsx only replaces the margins reference when values change, so this is safe — but the code is fragile.

**Fix:** Either destructure the individual numeric values as dependencies:

```tsx
}, [htmlContent, template, enablePagination, styles.container, onPageCountChange,
    margins.top, margins.right, margins.bottom, margins.left])
```

Or use a stable serialized form:

```tsx
const marginsKey = `${margins.top},${margins.right},${margins.bottom},${margins.left}`
// ...use marginsKey in the dependency array
```

---

_Reviewed: 2026-05-18_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
