# Phase 1: Foundation & Layout - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the complete app shell: two-pane layout with draggable splitter, header with branding, and mobile tab navigation. No editor functionality or resume preview content — Phase 1 delivers the structural scaffolding that all subsequent phases plug into.

Requirements: LAYO-01, LAYO-02, LAYO-03

</domain>

<decisions>
## Implementation Decisions

### Framework & Build
- **D-01:** React + Vite — component framework and build tool
- **D-02:** Tailwind CSS — utility-first styling for layout and responsive design

### App Shell Chrome
- **D-03:** Include a header/toolbar bar in Phase 1 — reserve space now with app title visible; placeholder slots for template switcher and export button (wired in Phase 2/3). Avoids layout reflow later.
- **D-04:** Show "md2cv" as the app title/branding in the header

### Mobile Tab Design
- **D-05:** Tab bar at the top of the viewport on mobile
- **D-06:** Editor tab is active by default on load (user lands ready to type)

### Splitter Behavior
- **D-07:** Default pane width ratio: 50/50 (editor left, preview right)
- **D-08:** Min pane width: 20% on each side — prevents either pane from collapsing entirely
- **D-09:** Persist split ratio to localStorage — restores user's last position on reload

### Claude's Discretion
- Splitter visual styling (handle width, color, hover/drag affordance) — standard drag handle pattern
- Transition/animation on mobile tab switch — Claude picks something clean
- Exact breakpoint for mobile vs desktop layout — standard Tailwind `md:` or `lg:` breakpoint

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Context
- `.planning/PROJECT.md` — Project vision, core value, constraints
- `.planning/REQUIREMENTS.md` — Full v1 requirements, LAYO-01/02/03 definitions
- `.planning/ROADMAP.md` — Phase 1 goal and success criteria

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes the patterns all subsequent phases follow

### Integration Points
- Phase 2 will mount the CodeMirror editor into the left pane container
- Phase 2 will mount the resume preview into the right pane container
- Phase 2 will wire the template switcher into the header placeholder
- Phase 3 will wire the export button into the header placeholder

</code_context>

<specifics>
## Specific Ideas

- The header should have placeholder areas for controls (template switcher, export) that Phase 2/3 will fill in — not empty space, but visually reserved slots
- Draggable splitter needs a visible drag handle (not just a 1px border) — users need to discover it

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-layout*
*Context gathered: 2026-04-14*
