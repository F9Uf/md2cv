# Phase 13: File Tree Sidebar - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning

<domain>
## Phase Boundary

A toggleable left sidebar renders the connected repo's directory tree VS Code-style (nested folders). Clicking a `.md` file opens it — editor and preview swap to that file's content, replacing the currently open file (one file open at a time). Sidebar visibility toggles via a button and persists across interactions. Requirements: TREE-01, TREE-02, TREE-03, TREE-04.

Locked upstream (REQUIREMENTS.md / PROJECT.md — not revisited here):
- Only `.md` files are openable (Out of Scope: non-markdown file editing)
- Multi-file tabs (SYNC-F1), file create/rename/delete (SYNC-F2), diff view (SYNC-F3) deferred to future milestones
- All GitHub API calls client-side with the Phase 11 token; static SPA + one auth function
- Phase 12's picker, sync model (sha + snapshot), conflict modal, commit dialog, and File menu are shipped — Phase 13 builds on them, not around them

</domain>

<decisions>
## Implementation Decisions

### Sidebar layout & toggle (TREE-01, TREE-02)
- **D-01:** Toggle is a **hamburger/panel icon at the far left of the header**, before the md2cv title — VS Code convention, icon-only to respect the space-constrained 48px header.
- **D-02:** Sidebar **auto-opens when a repo is connected**, then open/closed state **persists in localStorage** (follow `md2cv-*` key convention). When no repo is connected, the sidebar (and its toggle) are hidden entirely.
- **D-03:** **Fixed width** (~240px) — no resize handle; avoids a second drag divider next to the existing SplitPane one.
- **D-04:** Mobile: **overlay drawer** sliding over the content from the left with a scrim; picking a file closes the drawer. The Editor/Preview tab layout is untouched.

### Switching files with unsaved edits (TREE-03, TREE-04)
- **D-05:** Clicking a different file while the current file is dirty **prompts before switching** — a modal warns "You have uncommitted changes"; nothing is ever replaced silently.
- **D-06:** The dirty-switch dialog offers **Commit / Discard / Cancel**: "Commit changes…" opens the Phase 12 commit dialog then switches after success; "Discard my edits" loads the new file; "Cancel" stays put.
- **D-07:** If the newly clicked file **fails to load** (offline, deleted, 401): the switch aborts, the current file and its edits remain untouched, and the existing sync-error toast pattern reports the failure. Content is only replaced once the new content actually arrives.
- **D-08:** Opening a file from the tree re-anchors sync state to that file — `repoConfig.filePath`, stored sha/snapshot, and the dirty indicator all track the newly opened file (mechanics per Phase 12 model; planner details).

### Tree content & filtering (TREE-01)
- **D-09:** The tree shows the **full repo tree — all files — with non-markdown files grayed out and unclickable** (VS Code-faithful). Note: `listMdFiles` currently filters to `.md`; this needs an unfiltered tree fetch (same `git/trees?recursive=1` endpoint, no filter, or a new `listTreeEntries` alongside it).
- **D-10:** Ordering: **folders first, then files, alphabetical at every level** (VS Code convention).

### Tree behavior (TREE-01, TREE-03)
- **D-11:** Tree **fetches on repo connect / app open, plus a manual refresh icon** in the sidebar header for on-demand re-fetch. No polling, no re-fetch on toggle.
- **D-12:** Folders start **collapsed except the path to the currently open file**, which is auto-expanded. Expand/collapse toggling is remembered in-session only (no localStorage persistence).
- **D-13:** The **Phase 12 picker keeps its file-selection step unchanged** — connecting always lands with a file open; the tree is the richer in-app way to browse and switch afterward. Zero rework of tested Phase 12 code.
- **D-14:** The open file is marked with an **active-row highlight plus the same amber dirty dot** used on the File menu button when uncommitted changes exist.

### Claude's Discretion
- Tree row styling, indentation, chevron/file/folder icons (match the existing dark aesthetic)
- localStorage key naming for sidebar visibility (follow `md2cv-*` convention)
- Loading/empty/error states inside the sidebar (skeleton vs spinner, "no repo" copy)
- Truncated `git/trees` responses on very large repos (API caps recursive listings) — handle gracefully, planner's choice
- Drawer animation/scrim details on mobile
- Whether the dirty-switch prompt reuses the shared `Dialog` primitive from Phase 12 (recommended)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & scope
- `.planning/REQUIREMENTS.md` — TREE-01..04 definitions; SYNC-F1/F2/F3 deferred; Out of Scope table (non-md editing excluded)
- `.planning/ROADMAP.md` — Phase 13 success criteria (4 observable outcomes); depends on Phase 12
- `.planning/PROJECT.md` — v1.4.0 constraints ("Static app + one auth function", Node v20.11.0 / Vite 5 pin)

### Prior phase decisions
- `.planning/phases/12-repo-sync-toolbar/12-CONTEXT.md` — sync model D-07..D-14 (sha + snapshot, conflict modal, commit flow, dirty dot convention), File menu, picker design
- `.planning/phases/11-github-auth-foundation/11-CONTEXT.md` — token in localStorage, client-side API calls, toast pattern

No external specs/ADRs exist — implementation decisions fully captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/hooks/useRepoSync.ts` — owns `RepoConfig` (incl. `filePath`), sync state (sha + snapshot), `isDirty`, `connectRepo` (pulls a file and applies content). File-switch logic extends this hook: opening a tree file is essentially `connectRepo` with a new `filePath` guarded by the dirty prompt.
- `src/lib/githubRepo.ts` — `listMdFiles` already calls `git/trees?recursive=1`; the full-tree fetch (D-09) is a variant returning all entries with `type`. `getFileContent` serves the file-open path. Follow the existing unit-test pattern (`githubRepo.test.ts`).
- `src/components/Dialog.tsx` — shared dialog primitive from Phase 12; reuse for the dirty-switch prompt.
- `src/components/CommitDialog.tsx` — invoked from the dirty-switch "Commit changes…" action.
- `src/components/Header.tsx` — toggle icon mounts at far left; existing toast patterns for load-failure errors.
- `src/hooks/useMediaQuery.ts` — `(min-width: 768px)` already drives desktop/mobile; reuse for sidebar-vs-drawer.

### Established Patterns
- No router, no state library — sidebar open/closed state and tree data live in `App.tsx` or a new hook (`useRepoTree`), props down.
- localStorage keys prefixed `md2cv-` with lazy `useState` initializers + try/catch (e.g. `md2cv-sidebar`).
- Toast/error conventions from Phases 11–12 (fixed top-right, role="alert"; "Couldn't sync with GitHub — working locally" warning class).
- Dark UI: gray-700/600 buttons, 48px header; tree styling should match.

### Integration Points
- `src/App.tsx` — `<main>` currently renders SplitPane (desktop) / MobileTabs (mobile) directly; sidebar inserts as a flex sibling before them (desktop) or as a drawer overlay (mobile).
- `Header.tsx` — new toggle button prop; visibility gated on `repoSync.repoConfig !== null`.
- `useRepoSync.ts` — needs an `openFile(path)` (or extended `connectRepo`) that pulls the new file, updates `repoConfig.filePath` + sync state, and surfaces load failures without touching current content (D-07/D-08).

</code_context>

<specifics>
## Specific Ideas

- VS Code is the explicit visual reference throughout: full tree with grayed non-md files, folders-first sorting, active-row highlight, dirty dot mirroring the File menu's amber dot.
- Mobile responsiveness was explicitly called out by the user as a first-class concern — the overlay drawer must work well, not be an afterthought.
- The tree complements, not replaces, the Phase 12 picker: picker = connect flow, tree = day-to-day browsing.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Per-file edit stashing was considered for dirty switches and rejected as creeping toward multi-file state — SYNC-F1 territory.)

</deferred>

---

*Phase: 13-file-tree-sidebar*
*Context gathered: 2026-07-06*
