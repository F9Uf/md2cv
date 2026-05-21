---
quick_id: 260521-vq8
type: quick
status: complete
completed: 2026-05-21
commits:
  - 4e440e4  # Task 1: feat — extract usePagedjsPreview hook
  - 916a3aa  # Task 2: refactor — consume hook in Preview.tsx
  - f98b28a  # Task 3: refactor — consume hook in PrintMount.tsx
files_created:
  - src/hooks/usePagedjsPreview.ts
files_modified:
  - src/components/Preview.tsx
  - src/components/PrintMount.tsx
---

# Quick Task 260521-vq8: Refactor paged.js lifecycle into shared hook

**One-liner:** Extracted the duplicated paged.js render/cleanup useEffect from `Preview.tsx` and `PrintMount.tsx` into a single `usePagedjsPreview` hook; both components now call the hook with their inputs and keep only their unique chrome (Preview keeps its scroll container/zoom/pill, PrintMount stays chromeless).

## Outcome

Behavior-identical refactor. The paged.js lifecycle — fresh `Previewer` per reflow, sanitize + wrap, StrictMode-safe async IIFE with `Promise.resolve()` yield, `cancelled` flag, `polisher.destroy() + chunker.destroy()` cleanup — now lives in exactly one place. All four anchor comments (RESEARCH.md §Pitfall 2 stylesheets, §Pitfall 3 clear-mount, StrictMode double-mount safety, "Do NOT reset pageCount to null" zoom-snap justification) were preserved verbatim inside the hook.

## Tasks

### Task 1: Create `usePagedjsPreview` hook — commit 4e440e4

Created `src/hooks/usePagedjsPreview.ts` with a single named export `usePagedjsPreview`. Signature accepts `{ rootRef, htmlContent, template, templateContainerClass, margins, enabled?, onPageCount?, errorLogPrefix? }` and returns `{ pageCount, hasError }`. Default `enabled = true` (parameter default) so the dep array references the destructured variable directly per the plan's preferred form. The hook owns the `useState<number | null>(null)` for pageCount, the `useState(false)` for hasError, and the full useEffect lifecycle copied verbatim from Preview.tsx (the canonical version with richer comments).

The `errorLogPrefix` argument preserves PrintMount's distinct console.error message ('paged.js print-mount render failed') while keeping Preview's default ('paged.js render failed'). The `setHasError(true)` in the catch fires for both callers — safe because PrintMount never reads `hasError`, and Preview's silent fallback branch (`!enablePagination || hasError`) already handled this case identically before the refactor.

Effect dependency array is exactly `[htmlContent, template, templateContainerClass, margins, enabled, onPageCount, errorLogPrefix]` — a superset of both prior call sites' deps. `rootRef` is intentionally omitted (it is a stable RefObject; identity never changes across renders, and the original Preview.tsx omitted `previewerRootRef` from its deps for the same reason — see "Deviations" below for the ESLint warning trade-off).

### Task 2: Refactor `Preview.tsx` to consume the hook — commit 916a3aa

Replaced the paged.js useEffect (66 lines) and the two local useState calls (`pageCount`, `hasError`) with a single `usePagedjsPreview({ ... })` call placed immediately after `previewerRootRef`. Removed the `Previewer` import from `pagedjs` (no longer used directly). Kept the `DOMPurify` import (still used by the `!enablePagination || hasError` fallback branch at line ~84). Kept the `useState` import (still used by `const [scale, setScale] = useState(1)`).

The auto-fit zoom effect (ResizeObserver + 793.7px A4 constant), the `recomputeRef` pageCount-trigger effect, the empty-state branch, the `!enablePagination || hasError` plain-render fallback, the pill JSX, and the `zoomStyle` computation are all preserved byte-identical. Net change: −62 lines.

### Task 3: Refactor `PrintMount.tsx` to consume the hook — commit f98b28a

Reduced PrintMount to a thin component: imports, the file-level chrome-bleed explanation comment (preserved verbatim — still applies), the `PrintMountProps` interface, and a body that calls `usePagedjsPreview` once and returns `<div ref={rootRef} />`. The hook is called with `errorLogPrefix: 'paged.js print-mount render failed'` to preserve the distinct log message. `enabled` defaults to true at the hook signature so PrintMount's unconditional behavior is preserved without passing the flag.

Removed imports: `useEffect`, `DOMPurify`, `Previewer`. Kept imports: `useRef`, `TEMPLATE_STYLES` + `TemplateName`, `MarginValues`, `DEFAULT_MARGINS`, the themes.css side-effect import. Net change: −32 lines.

## Verification

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` (after Task 1) | passed (no output) |
| `npx tsc --noEmit` (after Task 2) | passed (no output) |
| `npx eslint src/components/Preview.tsx src/hooks/usePagedjsPreview.ts` | 0 errors, 1 warning (intentional — see Deviations) |
| `npx tsc --noEmit` (after Task 3) | passed (no output) |
| `npx eslint src/components/PrintMount.tsx src/components/Preview.tsx src/hooks/usePagedjsPreview.ts` | 0 errors, 1 warning (same warning, no new errors) |
| `npm run build` | passed — `tsc -b && vite build` both succeed; production bundle built in 1.84s |
| `grep -n "new Previewer" src/components/` | empty — `new Previewer()` now exists ONLY in `src/hooks/usePagedjsPreview.ts` |
| `grep -rn "polisher?.destroy\|chunker?.destroy" src/` | only `src/hooks/usePagedjsPreview.ts` lines 99–100 |
| `grep -n "from 'pagedjs'" src/components/` | empty — no component imports pagedjs directly |
| Preserved comment markers in hook | all 4 present: "RESEARCH.md §Pitfall 3", "Do NOT reset pageCount to null", "StrictMode dev double-mount safety", "RESEARCH.md §Pitfall 2" |

Net diff: `src/hooks/usePagedjsPreview.ts` +106 lines (new file); `src/components/Preview.tsx` +10/−72; `src/components/PrintMount.tsx` +10/−42. Total: roughly +8 net lines but one canonical lifecycle implementation instead of two near-duplicates.

## Deviations from Plan

### Intentional ESLint warning — `react-hooks/exhaustive-deps` on `rootRef`

**Found during:** Task 1 (visible after Task 2 ESLint run).
**Warning:** `usePagedjsPreview.ts:103:6  warning  React Hook useEffect has a missing dependency: 'rootRef'.`
**Reason:** The plan specifies the effect dependency array MUST be EXACTLY `[htmlContent, template, templateContainerClass, margins, enabled, onPageCount, errorLogPrefix]` — `rootRef` is deliberately excluded. This matches the pre-refactor semantics: the original Preview.tsx effect did not list `previewerRootRef` in its deps either, and PrintMount likewise did not list `rootRef`. React ref objects are stable — their identity never changes across renders — so omitting them from the deps array is safe in practice and is the idiomatic pattern.
**Action taken:** None. The warning is expected and matches the plan's explicit instruction. ESLint reports 0 errors. Adding `rootRef` to the deps would technically silence the warning but would deviate from the plan's exact-dep-array requirement.

### Other deviations

None. Behavior should be bit-identical to pre-refactor.

## Human Verification (deferred to orchestrator/user)

The plan's Task 3 "human verification" steps (run `npm run dev`, switch all three templates, adjust each margin, trigger browser-print, edit markdown rapidly to exercise StrictMode reflow) are not executed by this autonomous agent. The automated verification (tsc + eslint + build + grep checks) all passed. Production build succeeded with no errors.

## Self-Check: PASSED

Verified after writing this SUMMARY:

- File `src/hooks/usePagedjsPreview.ts` exists.
- File `src/components/Preview.tsx` exists and was modified in commit 916a3aa.
- File `src/components/PrintMount.tsx` exists and was modified in commit f98b28a.
- Commits 4e440e4, 916a3aa, f98b28a all present in `git log`.
