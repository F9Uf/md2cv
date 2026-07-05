# Phase 12: Repo Sync & Toolbar - Context

**Gathered:** 2026-07-06
**Status:** Ready for planning

<domain>
## Phase Boundary

After sign-in, the user picks a repository + branch + markdown file from their GitHub repos; the app auto-pulls that file on open (prompting keep-local/take-remote when local edits diverge), commits the current file via a button + message dialog, and shows a dirty indicator for uncommitted changes. The GitHub sync actions are grouped with the import/export .md buttons; PDF export stays separate. Requirements: SYNC-01..05, TOOL-01.

Locked upstream (REQUIREMENTS.md / PROJECT.md — not revisited here):
- Multi-file tabs (SYNC-F1), file create/rename/delete (SYNC-F2), and diff view before commit (SYNC-F3) are deferred to future milestones
- File tree sidebar is Phase 13 — Phase 12 opens exactly one file chosen in the picker
- All GitHub API calls happen client-side with the Phase 11 token; the only server piece remains the token-exchange function

</domain>

<decisions>
## Implementation Decisions

### Toolbar regrouping (TOOL-01)
- **D-01:** Import MD and Download MD collapse into a single **"File" dropdown-menu button** in the toolbar. GitHub actions (connect repository, commit) live in that same menu. Export PDF remains its own separate button. This replaces the two current standalone MD buttons.
- **D-02:** The File menu is **always present**. It always shows Import MD / Download MD. The GitHub section adapts: "Connect repository…" when signed in without a repo; hidden (or a "Sign in to sync" hint) when signed out. One stable button in all states.

### Repo/branch/file picker (SYNC-01)
- **D-03:** Picker opens from the File menu ("Connect repository…") as a dialog.
- **D-04:** Repository selection is a **searchable list** — user's repos sorted by recently pushed, with a type-to-filter input.
- **D-05:** Branch selection **pre-selects the repo's default branch**, changeable via dropdown.
- **D-06:** The picker has a **file-selection step**: a flat list of `.md` files in the chosen branch; the user picks which file to open. (Phase 13's tree later becomes the richer browsing UI.)

### Auto-pull & conflict handling (SYNC-02, SYNC-03)
- **D-07:** Divergence detection: on every pull/commit, store the file's **blob SHA + a content snapshot** in localStorage. On app open: if local content equals the last-synced snapshot, take remote silently; prompt only when local was edited AND differs from remote. No false prompts.
- **D-08:** Conflict prompt is a **blocking modal** on load: "Your local edits differ from GitHub" with Keep my local version / Use GitHub version. Local content stays loaded and visible behind it; nothing is overwritten until the user chooses.
- **D-09:** "Keep local" touches nothing remotely — the file is simply marked dirty; the user commits when ready (which overwrites remote).
- **D-10:** Pull failure (offline, 401, deleted repo): dismissible toast ("Couldn't sync with GitHub — working locally"); editor loads localStorage content as before. On 401, clear the token per Phase 11 D-06. The app never blocks on network.

### Commit flow (SYNC-04)
- **D-11:** Commit action lives **inside the File menu** ("Commit to GitHub…"), disabled/hidden when no repo is connected. Opens a small modal: single message input + Commit/Cancel.
- **D-12:** Default commit message: **`Update <filename>`** (GitHub web-editor convention), pre-filled.
- **D-13:** Commit-time conflict: commit against the stored blob SHA; if GitHub rejects (SHA mismatch), re-prompt with the same keep-local/take-remote modal — "Overwrite remote" re-commits with the fresh SHA, "Take remote" discards local.
- **D-14:** Post-commit: success toast ("Committed to <branch>") using the Phase 11 toast pattern; dirty indicator clears; stored SHA/snapshot update. Errors show a red toast; retry by reopening the dialog.

### Dirty indicator & repo info display (SYNC-05)
- **D-15:** Dirty indicator is a **small colored dot (e.g. amber) on the File menu button** whenever the open file has uncommitted changes — VS Code tab-dot convention.
- **D-16:** Connected repo/branch and open file display as **small muted header text next to the md2cv title** (e.g. `owner/repo · file.md`). Note: header is 48px and space-constrained on mobile — planner should keep this compact/truncatable.

### Claude's Discretion
- Picker dialog layout/styling details (match existing dark modal-free aesthetic; this is the app's first dialog — establish a reusable pattern)
- localStorage key naming for repo config, synced SHA, and content snapshot (follow `md2cv-*` convention)
- GitHub API specifics (REST contents API vs Git data API) — researcher/planner choice
- Exact toast wording, spinner/loading states during pull and commit
- How the repo/branch header text truncates on narrow screens

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & scope
- `.planning/REQUIREMENTS.md` — SYNC-01..05, TOOL-01 definitions; SYNC-F1/F2/F3 deferred; Out of Scope table
- `.planning/ROADMAP.md` — Phase 12 success criteria (5 observable outcomes); Phase 13 boundary (file tree)
- `.planning/PROJECT.md` — v1.4.0 constraints ("Static app + one auth function", Node v20.11.0 / Vite 5 pin)

### Prior phase decisions
- `.planning/phases/11-github-auth-foundation/11-CONTEXT.md` — auth decisions D-01..D-13 (token in localStorage, client-side API calls, toast pattern, avatar dropdown)

No external specs/ADRs exist — implementation decisions fully captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/Header.tsx` — current toolbar with Import MD / Download MD buttons (to be collapsed into File menu), Export PDF, and the Phase 11 auth UI. The avatar dropdown's outside-click/Escape close pattern is the template for the File menu. The error-toast pattern (fixed top-12 right-4, role="alert") is reusable for sync/commit toasts.
- `src/hooks/useGitHubAuth.ts` — exposes `token`; Phase 12 GitHub API calls consume it. localStorage persistence pattern (`md2cv-github-token`) to copy for repo config.
- `src/lib/githubAuth.ts` — pure fetch-based GitHub API helpers with unit tests (`githubAuth.test.ts`) — follow this pattern for a `githubRepo.ts` (or similar) API module with tests.
- `src/App.tsx` — lazy `useState` initializers with try/catch localStorage reads; content autosave with 150ms debounce (`md2cv-content`). Dirty detection hooks into this content state.

### Established Patterns
- No router, no state library — state lifted to `App.tsx`, props down. Sync state (repo config, dirty flag, conflict modal) follows.
- localStorage keys prefixed `md2cv-` (`md2cv-content`, `md2cv-template`, `md2cv-margins`, `md2cv-github-token`).
- No modal/dialog component exists yet — the picker, conflict prompt, and commit dialog are the app's first modals; worth one shared lightweight dialog primitive.
- Toolbar buttons: `h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600`.

### Integration Points
- `Header.tsx` — File menu button replaces Import MD / Download MD buttons; dirty dot renders here; repo/branch text mounts next to the `md2cv` title.
- `App.tsx` — owns repo config state, auto-pull-on-open effect (runs after auth hydration), dirty computation (current content vs synced snapshot), and modal open/close state.
- Phase 13 will reuse the repo config + file-content loading path to open files from the tree — expose file open/pull/commit as a hook or module (e.g. `useRepoSync`), not buried in App.

</code_context>

<specifics>
## Specific Ideas

- File menu consolidation was the user's own call ("dedicated button instead of Import MD and Download MD") — the toolbar gets *narrower* than today, not wider, despite the added GitHub features.
- Dirty dot follows the VS Code tab-dot convention — small, amber, on the File button.
- The same keep-local/take-remote modal serves both pull-time and commit-time conflicts — one component, two triggers.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Diff view, multi-file, and file CRUD were already deferred as SYNC-F1..F3 in REQUIREMENTS.md.)

</deferred>

---

*Phase: 12-repo-sync-toolbar*
*Context gathered: 2026-07-06*
