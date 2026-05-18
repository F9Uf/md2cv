# Phase 8: Configurable Margins - Context

**Gathered:** 2026-05-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Add four numeric margin inputs (top / bottom / left / right) to the UI so the user can adjust the A4 page margins live, with values persisted to localStorage and the preview reflowing immediately on each change.

In scope:
- Four independent numeric inputs (mm) for top, bottom, left, right margins
- Navbar strip below the header (a second toolbar row, always visible)
- Real-time preview reflow on every keystroke (piggybacks the existing 150ms debounce)
- localStorage persistence restored on page load
- Default: 15mm on all four sides (carried from Phase 7 D-04)

Out of scope:
- Symmetric shortcut (one input sets all 4)
- Sliders or slider+number combos
- Paper size selection
- Any PDF pipeline changes (Phase 10)

</domain>

<decisions>
## Implementation Decisions

### UI Placement
- **D-01:** Margin inputs live in a **navbar strip below the main header** — a second compact toolbar row always visible (not inside the editor pane, header, or a collapsible). This is a new pattern for this app; keep it visually consistent with the existing header style (same background/border treatment).

### Input Design
- **D-02:** Plain `<input type="number">` with a `mm` label for each of the four margins. Step=1, min=0, max=50. No sliders.
- **D-03:** Four independent inputs — Top / Bottom / Left / Right — labeled clearly. No symmetric shortcut.

### Update Trigger
- **D-04:** Margin changes trigger preview reflow **on every keystroke** (onChange). Piggyback on App.tsx's existing 150ms debounce — margin state change feeds into the same dependency that triggers paged.js reflow, so no second debounce is needed.

### paged.js Integration
- **D-05:** Margin values are injected as CSS into the `@page` inline style passed to paged.js (the `pagedjs_inline` stylesheet object already used in Phase 7). Changing margin values → re-runs the paged.js Previewer with updated `@page { size: A4 portrait; margin: ${top}mm ${right}mm ${bottom}mm ${left}mm; }`.

### Persistence
- **D-06:** Store margins as a single JSON object under localStorage key `md2cv-margins` (shape: `{top, right, bottom, left}`, values in mm as numbers). Follows existing `md2cv-*` key convention. Validated on load (must be numbers in [0, 50], else fall back to defaults).

### Claude's Discretion
- Visual styling of the margin control strip (height, font size, spacing between the four inputs, label position above or inline)
- Whether to show a reset-to-defaults button in the strip
- Component file name and prop shape for the margin control component

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & Roadmap
- `.planning/REQUIREMENTS.md` §MARG-01, MARG-02, MARG-03 — exact wording of margin requirements
- `.planning/ROADMAP.md` §Phase 8 — success criteria (3 items)
- `.planning/PROJECT.md` — milestone goal and current tech debt

### Existing Implementation (the surface this phase changes)
- `src/components/Preview.tsx` — paged.js integration; the `pagedjs_inline` stylesheet object where `@page { margin: 15mm }` is hardcoded. Phase 8 replaces that hardcoded value with the user-controlled margin state.
- `src/App.tsx` — owns all persisted state (template, content, debounce ref). Margin state added here, passed to Preview and the new margin control component.
- `src/components/Header.tsx` — existing header; the new margin strip sits below it (or is composed alongside it in App.tsx layout).

### Prior Phase Context
- `.planning/phases/07-page-chrome-auto-pagination/07-CONTEXT.md` — D-04 establishes 15mm default; D-02 establishes the 150ms debounce reflow trigger that Phase 8 piggybacks.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/App.tsx` localStorage pattern (try/catch, validated read, typed state) — replicate for margin state
- `src/components/Preview.tsx` `pagedjs_inline` stylesheet object — replace hardcoded `margin: 15mm` with dynamic value

### Established Patterns
- State with localStorage persistence: `useState(() => { try { ... localStorage.getItem } catch {} return default })`
- All persisted keys follow `md2cv-*` naming
- Debounce reflow: 150ms `debounceRef` in App.tsx — margin changes feed into this same dependency chain

### Integration Points
- App.tsx renders `<Header>` then `<SplitPane>` — the new margin strip is inserted between (or below) the header
- Preview.tsx receives margin as a new prop; uses it to construct the `@page` CSS string for paged.js

</code_context>

<specifics>
## Specific Ideas

- User said margin inputs should be in a "navbar under header" — a second toolbar row, not inside editor/preview split

</specifics>

<deferred>
## Deferred Ideas

- Symmetric "set all" shortcut — reviewed, deferred (out of scope per phase boundary)
- Reset-to-defaults button — deferred to Claude's discretion

</deferred>

---

*Phase: 08-configurable-margins*
*Context gathered: 2026-05-18*
