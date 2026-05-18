---
quick_id: 260518-vgl
slug: fix-duplicate-first-page-bug-on-page-ref
title: Fix duplicate first page bug on initial mount / refresh
created: 2026-05-18
mode: quick
status: ready
---

# 260518-vgl — Fix duplicate first page on initial mount / refresh

## Problem

On first visit or hard reload, paged.js renders a **doubled stack of pages** (DOM contains two `.pagedjs_pages` containers, so the first page appears twice). Once the user edits the markdown, the preview reflows correctly and the duplication disappears.

## Root cause

`src/components/Preview.tsx` runs paged.js inside an async IIFE in a `useEffect`. Under React 18 `<StrictMode>` (enabled in `src/main.tsx`), the effect runs **setup → cleanup → setup** synchronously on mount.

Timeline on first mount:

1. Effect 1 sync: `cancelled1 = false`, `root.innerHTML = ''`, schedules async IIFE 1.
2. Cleanup 1 sync: sets `cancelled1 = true`, but `activePreviewer1` is still `null` (the IIFE hasn't started yet — microtasks haven't run), so `polisher.destroy()` / `chunker.destroy()` are skipped.
3. Effect 2 sync: `cancelled2 = false`, `root.innerHTML = ''`, schedules async IIFE 2.
4. Microtasks run. IIFE 1 starts, constructs a `Previewer`, and `await previewer.preview(...)` mounts a stack of pages into `root`. The `if (cancelled) return` check happens **after** `await` — by then the DOM is already polluted.
5. IIFE 2 then runs, mounts a second stack of pages into the same `root`. Paged.js's `Chunker.setup()` appends to (does not replace) `renderTo` (07-RESEARCH.md §Pitfall 3), so the two stacks coexist.

When the user types, only **one** effect run fires (StrictMode double-invoke only applies on mount). The sync `root.innerHTML = ''` wipes both prior stacks, and a single fresh stack is mounted. Hence the bug only appears on first load / reload.

## Fix

Check `cancelled` at the **start** of the async IIFE — before `new Previewer()` and before any DOM mutation. Because cleanup-1 runs synchronously before any microtask, `cancelled1` is already `true` when IIFE 1 enters the queue. The early-return makes IIFE 1 a no-op, leaving IIFE 2 as the only previewer that mounts.

This is the standard React 18 StrictMode-safety pattern for async effects.

## Tasks

### Task 1 — Add early `cancelled` check at start of paged.js IIFE

**Files:**
- `src/components/Preview.tsx`

**Action:**
Insert `if (cancelled) return` as the first statement inside the async IIFE that starts at `;(async () => {` on line 41, before the `try` block.

```diff
   ;(async () => {
+    if (cancelled) return
     try {
       const safeHtml = DOMPurify.sanitize(...)
```

No other changes. The existing cleanup (`cancelled = true`, polisher/chunker destroy) still handles the rapid-edit case where IIFE has progressed past `activePreviewer = previewer`.

**Verify:**
- TypeScript build passes (`npm run build` or `tsc --noEmit`).
- In dev (`npm run dev`), hard-refresh the page → only one `.pagedjs_pages` element exists in the DOM under `#root`. The "Page X of N" pill shows the correct N (matching number of `.pagedjs_page` children).
- Edit markdown → preview still updates correctly with a single stack.

**Done when:**
- One-line edit applied to `src/components/Preview.tsx`.
- Dev server shows a single page stack on first load.
- No new TypeScript errors.

## Must-haves

- **Truths:** React 18 StrictMode runs setup → cleanup → setup on mount in dev; paged.js's `Chunker.setup()` appends to `renderTo` rather than replacing.
- **Artifacts:** modified `src/components/Preview.tsx` (1 line added).
- **Key links:** `src/components/Preview.tsx:41`, `src/main.tsx:12`, `.planning/phases/07-page-chrome-auto-pagination/07-RESEARCH.md` (Pitfall 3, Pitfall 5).

## Out of scope

- Refactoring the entire previewer lifecycle (a "generation counter" ref pattern would be more robust against arbitrary concurrent reflows, but the simple `cancelled` check handles every observed case including StrictMode and rapid edits).
- Removing `<StrictMode>` (would mask other potential bugs; not the right tradeoff).
- Pre-clearing `root.innerHTML` inside cleanup (redundant — effect 2's sync clear already handles it).
