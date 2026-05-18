# Phase 8: Configurable Margins - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-18
**Phase:** 08-configurable-margins
**Areas discussed:** UI placement, Input type & constraints, Update trigger

---

## UI Placement

| Option | Description | Selected |
|--------|-------------|----------|
| Below the editor pane | Compact strip below CodeMirror | |
| Header toolbar | Alongside template selector and export buttons | |
| Collapsible panel | Expands when needed, hidden by default | |
| You decide | Claude picks | |
| Navbar under header (Other) | Second toolbar row below the main header | ✓ |

**User's choice:** "navbar under header" — a second always-visible toolbar row between the header and the editor/preview split.

---

## Input Type & Constraints

| Option | Description | Selected |
|--------|-------------|----------|
| Plain number inputs (mm) | `<input type=number>`, step=1, min=0, max=50 | ✓ |
| Sliders | Range sliders per margin | |
| Number + slider combo | Both in sync | |

**User's choice:** Plain number inputs (mm).

## Symmetric Shortcut

| Option | Description | Selected |
|--------|-------------|----------|
| Four independent inputs only | Top / Bottom / Left / Right separately | ✓ |
| Add symmetric shortcut | One input to set all 4 at once | |

**User's choice:** Four independent inputs only.

---

## Update Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Real-time on every keystroke | onChange, piggybacks existing 150ms debounce | ✓ |
| On blur or Enter only | Reflow only when user finishes editing | |

**User's choice:** Real-time on every keystroke.

---

## Claude's Discretion

- Visual styling of the margin control strip
- Whether to include a reset-to-defaults button
- Component file name and prop shape

## Deferred Ideas

- Symmetric "set all 4 at once" shortcut — noted but out of scope for this phase
