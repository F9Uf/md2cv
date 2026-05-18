---
quick_id: 260518-vgl
slug: fix-duplicate-first-page-bug-on-page-ref
title: Fix duplicate first page bug on initial mount / refresh
completed: 2026-05-18
status: complete
commit: c3924c2
files_changed:
  - src/components/Preview.tsx
---

# 260518-vgl — Fix duplicate first page on initial mount / refresh

## Outcome

Single-line fix to `src/components/Preview.tsx` resolves the duplicate `.pagedjs_pages` stack rendered on first visit / page refresh under React 18 `<StrictMode>` in development.

## Root cause (recap)

React 18 `<StrictMode>` (configured in `src/main.tsx:12`) runs the effect lifecycle `setup → cleanup → setup` synchronously on mount in dev. The async IIFE in `Preview.tsx` that drives `pagedjs.Previewer.preview()` only checked the `cancelled` flag **after** `await previewer.preview(...)`. By that point paged.js had already mounted a `.pagedjs_pages` container into `root`. The first cleanup couldn't destroy the previewer either, because the cleanup fires synchronously before microtasks — so `activePreviewer` was still `null` when cleanup ran.

Net effect on mount:
1. IIFE 1 (`cancelled=true` by the time it ran) → mounted stack #1.
2. IIFE 2 → mounted stack #2.
3. Chunker.setup() appends rather than replaces (per `07-RESEARCH §Pitfall 3`), so both stacks coexisted.

On subsequent prop changes, only one effect run fires; its sync `root.innerHTML = ''` wiped both stale stacks, masking the bug.

## Change

`src/components/Preview.tsx` — added an early-return guard at the top of the async IIFE:

```diff
   ;(async () => {
+    // StrictMode dev double-mount safety: if cleanup already fired
+    // (cancelled=true) before this microtask runs, bail out before
+    // paged.js mutates the DOM. Without this, Previewer.preview()
+    // resolves and appends a second .pagedjs_pages stack
+    // (Chunker.setup appends, doesn't replace — see 07-RESEARCH §Pitfall 3).
+    if (cancelled) return
     try {
```

This makes IIFE 1 a no-op under StrictMode (because `cancelled1` is already `true` by the time the microtask runs), leaving IIFE 2 as the sole mounter. Rapid-edit / template-switch flows are unchanged: cleanup still calls `polisher.destroy()` and `chunker.destroy()` for in-flight previewers, and effect 2's sync `root.innerHTML = ''` still wipes leftovers.

## Verification

- `npx tsc --noEmit` — clean (no new TS errors).
- Diff confined to `src/components/Preview.tsx` (+5 lines, comment + guard).
- Manual smoke test (to be confirmed by user): hard-refresh dev page → DOM under `[ref=previewerRootRef]` contains exactly one `.pagedjs_pages` element, and the "Page X of N" pill reports a count that matches the number of `.pagedjs_page` siblings.

## Out of scope

- Generation-counter / AbortController rewrite of the previewer lifecycle. The `cancelled` flag is sufficient for the observed cases.
- Removing `<StrictMode>`. Not a fix — it would just hide future async-effect bugs.

## Commit

`c3924c2` — `fix(quick-260518-vgl): guard paged.js IIFE against StrictMode double-mount`
