# Phase 13: File Tree Sidebar - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-06
**Phase:** 13-file-tree-sidebar
**Areas discussed:** Sidebar layout & toggle, Switching files with unsaved edits, Tree content & filtering, Tree behavior details

---

## Sidebar layout & toggle

| Option | Description | Selected |
|--------|-------------|----------|
| Header, far left | Hamburger/panel icon before the md2cv title — VS Code convention | ✓ |
| Inside the File menu | 'Show/Hide file tree' item in the Phase 12 File dropdown | |
| Attached to sidebar edge | Slim collapse handle on the sidebar's right border | |

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-open on connect, then remember | Opens on repo connect; state persists in localStorage; hidden when no repo | ✓ |
| Closed by default, remember after | User must click toggle to first reveal | |
| Always visible when connected | Toggle only hides for the session | |

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed width | ~240px column, no drag handle | ✓ |
| Resizable with persistence | Drag handle like SplitPane, width persisted | |

| Option | Description | Selected |
|--------|-------------|----------|
| Overlay drawer | Slides over content with scrim; picking a file closes it | ✓ |
| Third 'Files' tab | Extra tab next to Editor/Preview | |
| Desktop only | No tree on mobile | |

**Notes:** User explicitly flagged mobile responsiveness as a first-class concern when selecting areas.

---

## Switching files with unsaved edits

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt before switching | Modal warns about uncommitted changes; nothing replaced silently | ✓ |
| Stash edits per file locally | Per-file localStorage stash — rejected as multi-file (SYNC-F1) creep | |
| Switch and discard silently | Data loss with no warning | |

| Option | Description | Selected |
|--------|-------------|----------|
| Commit / Discard / Cancel | Commit opens Phase 12 commit dialog then switches; Discard loads new file; Cancel stays | ✓ |
| Discard / Cancel only | Two-button dialog; commit path requires extra clicks | |

| Option | Description | Selected |
|--------|-------------|----------|
| Stay on current file + toast | Switch aborts on load failure; current edits untouched | ✓ |
| Open empty editor + error | Editor clears with error banner | |

---

## Tree content & filtering

| Option | Description | Selected |
|--------|-------------|----------|
| .md files only | Only markdown files and folders containing them | |
| All files, non-md grayed out | Full repo tree, VS Code-faithful; non-md dimmed and unclickable | ✓ |

**User's choice:** All files grayed out — the one non-recommended pick of the session; VS Code fidelity preferred over minimal noise.

| Option | Description | Selected |
|--------|-------------|----------|
| Folders first, then files, A–Z | VS Code convention at every level | ✓ |
| Mixed alphabetical | Folders and files interleaved | |

---

## Tree behavior details

| Option | Description | Selected |
|--------|-------------|----------|
| On load + manual refresh | Fetch on connect/app open + refresh icon in sidebar header | ✓ |
| Every time sidebar opens | Re-fetch on each toggle | |
| Session-only | Fetch once per app load, no manual refresh | |

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-expand to open file | Collapsed except path to open file; in-session memory only | ✓ |
| Persist expanded folders | localStorage-persisted expansion state | |
| All collapsed at root | Manual drill-down every session | |

| Option | Description | Selected |
|--------|-------------|----------|
| Keep picker unchanged | Picker keeps its flat .md file step; tree is the in-app browser | ✓ |
| Picker picks repo+branch only | Tree becomes the file chooser; reworks Phase 12 | |

| Option | Description | Selected |
|--------|-------------|----------|
| Highlight + dirty dot | Active-row highlight plus amber dot matching the File menu | ✓ |
| Highlight only | Dirty status stays on File menu only | |

---

## Claude's Discretion

- Tree row styling, indentation, icons (match dark aesthetic)
- localStorage key naming for sidebar visibility
- Sidebar loading/empty/error states
- Truncated `git/trees` handling on very large repos
- Mobile drawer animation/scrim details
- Reuse of the shared Dialog primitive for the dirty-switch prompt

## Deferred Ideas

- Per-file edit stashing on dirty switches — rejected as creeping toward multi-file state (SYNC-F1, future milestone)
