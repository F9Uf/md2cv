---
quick_id: 260518-vgl
slug: fix-duplicate-first-page-bug-on-page-ref
title: Fix duplicate first page bug on initial mount / refresh
completed: 2026-05-18
status: complete
commits:
  - c3924c2  # first attempt — guard at top of IIFE (insufficient)
  - 8b8b54b  # corrected — yield microtask before guard
files_changed:
  - src/components/Preview.tsx
---

# 260518-vgl — Fix duplicate first page on initial mount / refresh

## Symptom

On first visit / hard reload, the preview pane contains **two `.pagedjs_pages` containers** stacked under the previewer root. Editing the markdown (any change) reflows once and the duplication disappears.

## Root cause

React 18 `<StrictMode>` (configured in `src/main.tsx:12`) runs the effect lifecycle as `setup → cleanup → setup` synchronously in dev. The async IIFE in `Preview.tsx` that drives `pagedjs.Previewer.preview()` ran **synchronously** all the way up to `await previewer.preview(...)` *inside the original setup call* — past `new Previewer()`, past `polisher.setup()`, and far enough that `chunker.flow()` is queued. By the time React invoked cleanup, the in-flight `preview()` could not be aborted: `polisher.destroy()` and `chunker.destroy()` don't prevent `chunker.flow()` from later appending a `pagesArea` (`Chunker.setup()` appends, doesn't replace — see 07-RESEARCH §Pitfall 3).

Net effect on initial mount under StrictMode dev:
1. IIFE 1 ran preview() to completion → mounted `pagesArea` #1.
2. IIFE 2 ran preview() to completion → mounted `pagesArea` #2.

Both coexisted because paged.js appends rather than replaces and because effect 2's sync `root.innerHTML = ''` only cleared what was mounted *before* setup 2 returned — not what IIFE 1 mounted later in microtasks.

On subsequent prop changes, only one effect cycle fires (StrictMode double-invoke applies only to mount), so the sync clear in setup wipes any stale stacks before the new IIFE runs. That's why typing made the duplication disappear.

## Fix iterations

### Attempt 1 — `if (cancelled) return` at top of IIFE — INSUFFICIENT (`c3924c2`)

Placed the cancellation check at the top of the async IIFE. **Did not work** because the IIFE runs synchronously up to its first `await`, so it executes inside setup 1's synchronous prefix — before React invokes cleanup 1. The `cancelled` flag is still `false` when the check runs.

### Attempt 2 — yield microtask, then check — WORKS (`8b8b54b`)

```diff
   ;(async () => {
+    await Promise.resolve()
+    if (cancelled) return
     try {
       // ... DOMPurify, new Previewer(), preview() ...
     } catch (err) { ... }
   })()
```

`await Promise.resolve()` queues the rest of the IIFE as a microtask. React's `flushPassiveEffects` runs the entire setup → cleanup → setup chain synchronously inside one scheduler task; microtasks run only after that task completes. So by the time the continuation runs, `cancelled1` is already `true` (cleanup 1 set it), and the discarded iteration bails before it constructs a `Previewer` or calls `.preview()`. The surviving iteration is the sole previewer that mounts.

## Verification

- `npx tsc --noEmit` — clean.
- Manual smoke test (to be confirmed by user):
  - Hard-refresh dev page → exactly one `.pagedjs_pages` element under the previewer root.
  - The "Page X of N" pill reports a count matching the number of `.pagedjs_page` children.
  - Edit markdown → preview still updates with a single stack.

## Out of scope

- Generation-counter / AbortController rewrite of the previewer lifecycle. The yield + flag combination handles every observed case.
- Removing `<StrictMode>`. Would just mask future async-effect bugs.
- Asking paged.js to make `preview()` abortable upstream. Plausible feature request but out of scope here.

## Commits

- `c3924c2` — first attempt (guard at top of IIFE, insufficient).
- `8b8b54b` — corrected (microtask yield before guard).
