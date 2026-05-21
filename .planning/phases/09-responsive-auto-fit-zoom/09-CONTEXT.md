# Phase 9: Responsive Auto-Fit Zoom - Context

**Gathered:** 2026-05-19
**Status:** Ready for planning

<domain>
## Phase Boundary

The A4 preview page (already rendered by paged.js per Phase 7) is always fully visible inside the preview pane: it scales down when the pane is narrower than 210mm so the full page fits with no horizontal scrollbar, and shows at 1:1 when the pane is at least as wide as A4 (never enlarged). Scale updates smoothly as the user drags the split-pane separator.

In scope:
- Auto-fit scale calculation from preview-pane width
- Visual scaling only — paged.js page count and per-page layout stay identical to the 1:1 case
- Smooth scale update during split-pane drag and window resize
- Same logic on mobile tab view as on desktop

Out of scope for this phase:
- Re-flowing paged.js at a different physical size — scaling is purely visual; pagination must remain stable
- Manual zoom controls / user-chosen zoom percentage — ZOOM-02, deferred beyond v1.3.0
- A "current scale" UI indicator (e.g., "75%" pill) — not in success criteria
- Any change to paged.js trigger cadence — the existing 150ms debounce on `htmlContent` reflow is untouched

Out of scope for this milestone:
- Paper sizes other than A4 (PAPER-01/02) — future
- Manual page-break markers (PAGEBREAK-01) — future
- Unifying preview and PDF rendering path (PDFX-01/02) — Phase 10

</domain>

<decisions>
## Implementation Decisions

### Scaling Mechanism
- **D-01:** Use **`transform: scale(s)` with `transform-origin: top center`**. Web-standard, GPU-accelerated, smooth during split-pane drag. Page count stays stable because the DOM and paged.js layout are unchanged — only the visual rendering is scaled. Applied to the `.pagedjs_pages` flex container (single transform covers all stacked pages).
- **D-02:** The `zoom` CSS property is explicitly **not** used (historically non-standard, only recently added to Firefox 126; we don't need its layout-flow behavior because D-03 solves that problem cleanly).

### Vertical Flow Handling
- **D-03:** Wrap `.pagedjs_pages` (or the existing `previewerRootRef` div) in a sized wrapper whose **height is set to `naturalHeight × scale`** in the same ResizeObserver callback that computes the scale. With `transform-origin: top center`, the visually-shrunk page stack ends at the wrapper's bottom edge — no empty gray void below the resume, scrollbar reflects actual visible content.

### Pane-Width Detection
- **D-04:** **`ResizeObserver`** on `Preview.tsx`'s outer scroll container (`<div className="relative h-full overflow-auto bg-gray-100 px-4 py-6">`). The single observer fires for both split-pane drag and window resize — no need to lift the split-pane ratio out of `useSplitPane`, no separate `window.resize` listener.
- **D-05:** All scale state and the ResizeObserver lifecycle live **inside `Preview.tsx`**. App.tsx, SplitPane.tsx, and `useSplitPane` are not modified. Scale is a derived value, not persisted state — no localStorage involvement.

### Scale Formula
- **D-06:** `scale = min(availablePaneWidthPx / pageWidthPx, 1)`. Capped at 1.0 — never enlarged beyond actual size (per success criterion 2). `availablePaneWidthPx` accounts for the existing `px-4` (16px) horizontal padding on the wrapper. `pageWidthPx` is read from the actual rendered `.pagedjs_page` element (`getBoundingClientRect().width`) when available so the calc tolerates browser zoom and real A4-to-px conversion; falls back to 210mm × 96/25.4 ≈ 793.7px if no page has rendered yet.

### Mobile (Tab View) Behavior
- **D-07:** **Same logic on mobile as on desktop.** The ResizeObserver observes the same outer Preview container regardless of which parent renders it (SplitPane on desktop, MobileTabs on mobile). On a typical 360px mobile viewport the page renders at ~0.45 scale with no horizontal scroll, which is exactly what ZOOM-01 requires.

### No Reflow Trigger
- **D-08:** Scale changes **do not** retrigger paged.js. The Previewer's render dependency list in `Preview.tsx` (currently `[htmlContent, template, enablePagination, styles.container, onPageCountChange, margins]`) is untouched — scale state belongs to a separate effect that observes pane width and writes to transform/height style properties only.

### Claude's Discretion
- Whether to apply a CSS `transition` to the transform for very smooth resize polish — likely unnecessary (ResizeObserver fires synchronously, drag movement is already smooth) but Claude may add a brief `transition: transform 80ms linear` if it reads better in practice.
- Exact selector / wrapper structure for D-03 — could be a new wrapper div, could attach styles directly to the existing `previewerRootRef` element; either is fine as long as `transform-origin: top center` and computed-height work together cleanly.
- Defensive `@media print { .pagedjs_pages { transform: none; height: auto; } }` rule in `pages.css` — print path uses `enablePagination={false}` and `#app-shell { display: none }` already, so a stray transform shouldn't reach print, but adding the belt-and-suspenders reset is fine.
- Throttling / rAF batching of the ResizeObserver callback if performance shows any judder — start without it; add only if needed.
- Whether to also expose `min-height: 0` / `flex-shrink` adjustments on the Preview's outer container if the computed wrapper height creates flex-layout weirdness — fix in place if observed.
- No scale floor (the gray area was not selected for discussion). Split-pane already enforces 20% min pane width and mobile floor is ~360px — both keep the page visually legible.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §ZOOM-01 — exact wording of the requirement
- `.planning/ROADMAP.md` §Phase 9 — success criteria (3 items) the phase will be verified against
- `.planning/PROJECT.md` — milestone goal, tech stack, Node v20.11.0 / Vite 5 constraints

### Existing Implementation (the surface this phase changes)
- `src/components/Preview.tsx` — paged.js integration; outer scroll container `<div className="relative h-full overflow-auto bg-gray-100 px-4 py-6">` is where the ResizeObserver lives and where `previewerRootRef` mounts. Scale + computed-height go on the wrapper around `previewerRootRef`.
- `src/styles/pages.css` — `.pagedjs_pages` (flex column, centered) and `.pagedjs_page` (white bg, shadow, 16px margin-bottom). New rules for the scaled wrapper land here. `@media print` already strips on-screen visuals — extend with a transform reset if a defensive guard is wanted.
- `src/components/SplitPane.tsx` and `src/hooks/useSplitPane.ts` — NOT modified by this phase. The ResizeObserver observes Preview's own container; SplitPane internals stay private.
- `src/App.tsx` — NOT modified by this phase. No new state, no new prop on Preview.
- `src/components/MobileTabs.tsx` — NOT modified. The mobile preview pane container will be observed by the same ResizeObserver instance inside Preview.

### Prior Phase Context (decisions inherited)
- `.planning/phases/07-page-chrome-auto-pagination/07-CONTEXT.md` D-01 — paged.js owns the page chrome; Phase 9 only adds a visual transform layer over paged.js's output
- `.planning/phases/07-page-chrome-auto-pagination/07-CONTEXT.md` D-02 — existing 150ms debounce is the reflow trigger; Phase 9 explicitly does NOT add a new reflow trigger
- `.planning/phases/08-configurable-margins/08-CONTEXT.md` D-05 — margins are injected into the paged.js `@page` stylesheet; page width is still 210mm regardless of margin values, so the scale formula in D-06 doesn't need margin awareness

### External Docs to Reference During Research
- `ResizeObserver` — MDN reference; specifically the observer lifecycle, the `ResizeObserverEntry.contentBoxSize` vs `contentRect` precedence, and the rAF-loop warning ("ResizeObserver loop limit exceeded") that can occur when the callback writes back into the observed subtree's size. Researcher should pull current docs via Context7 or MDN.
- `transform-origin` behavior with `position: relative` flex parents — the outer Preview container is `relative` and the scroll container; verify `transform-origin: top center` interacts cleanly with the existing `align-items: center` on `.pagedjs_pages`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`Preview.tsx` outer container** (`<div className="relative h-full overflow-auto bg-gray-100 px-4 py-6">`) — the natural mount point for ResizeObserver. No structural change needed to the wrapper itself.
- **`previewerRootRef` div** — the existing paged.js mount point. The scaled wrapper either replaces this div with a sized wrapper around it, or attaches transform/height directly to it.
- **`pages.css`** — already has `.pagedjs_pages` and `.pagedjs_page` rules; new transform-related styles live alongside them. The `@media print` block already exists for defensive resets.

### Established Patterns
- **Hooks live in `src/hooks/`** (`useMediaQuery`, `useSplitPane`) — the ResizeObserver logic could be a `useElementWidth` (or `usePaneWidth`) hook for reuse and testability, or inlined as a `useEffect` in `Preview.tsx`. Either is consistent with existing patterns.
- **`useEffect` cleanup pattern in `Preview.tsx`** — the existing paged.js effect uses `cancelled` flag + cleanup function; ResizeObserver effect should mirror this with `observer.disconnect()` in cleanup.
- **No external state libraries** — all state is `useState` / `useRef` / hooks; Phase 9 follows the same pattern.

### Integration Points
- **None outside `Preview.tsx` and `pages.css`** — the phase is intentionally surgical. No App.tsx changes, no new props, no new localStorage keys.
- **`#print-area` Preview** uses `enablePagination={false}` and renders the plain (non-paged.js) path — the scale effect is gated on the paginated branch, so the print preview is unaffected.

### Constraints
- **No paged.js re-render on resize** — D-08 explicitly excludes scale from the Previewer's dependency list. Re-running paged.js on every ResizeObserver callback would tank performance and recreate the duplicate-mount class of bug fixed in quick task 260518-vgl.
- **ResizeObserver loop guard** — if the callback writes a style change that resizes the observed element, the browser throws "ResizeObserver loop limit exceeded". The compensated-height wrapper (D-03) MUST be an inner element, not the observed outer container, so the write doesn't feed back into the observed dimension.
- **Browser support** — ResizeObserver is supported in all modern browsers (Chrome 64+, Firefox 69+, Safari 13.1+). Project targets modern browsers; no polyfill needed.

</code_context>

<specifics>
## Specific Ideas

- The scaling is **visual only** — multiple pages stacked vertically all shrink together as a single transformed unit, preserving the relative gap between pages. The user must see a recognizably "smaller A4 page" rather than a re-flowed shorter page.
- The phase should be invisible at 1:1 — no `scale(1)` style writes, no transform applied at all when `paneWidth >= pageWidth`, so DevTools inspection of a wide-pane preview shows the same DOM as before Phase 9.
- "Don't over-engineer" applies: no animation library, no requestAnimationFrame batching, no throttling unless the browser actually judders. ResizeObserver is already efficient.

</specifics>

<deferred>
## Deferred Ideas

- **Scale floor / "too narrow" message** — gray area surfaced but not selected for discussion; no minimum scale is enforced, the page just keeps shrinking. Revisit only if real usage shows pages becoming unreadably small.
- **Visible scale-percentage indicator** ("75%" pill in the corner) — out of scope for this phase; success criteria don't require it. Could be added later if the user wants visibility into the current zoom level.
- **Manual zoom controls** (ZOOM-02) — explicit future requirement, out of scope for v1.3.0.
- **Paper-size-aware scaling** — when PAPER-01 lands, the scale formula's `pageWidthPx` source becomes paper-size-dependent. D-06 already reads from the actual rendered `.pagedjs_page` element so the formula will adapt automatically.
- **Print-time transform safety rule** — the defensive `@media print { .pagedjs_pages { transform: none; height: auto; } }` is Claude's discretion; if Phase 10 unifies preview and print, this rule may become more important.

</deferred>

---

*Phase: 09-responsive-auto-fit-zoom*
*Context gathered: 2026-05-19*
