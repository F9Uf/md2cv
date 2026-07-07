# Phase 12: Repo Sync & Toolbar - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-06
**Phase:** 12-repo-sync-toolbar
**Areas discussed:** Repo/branch/file picker, Auto-pull & conflict prompt, Commit flow, Dirty indicator & toolbar grouping

---

## Repo/branch/file picker

| Option | Description | Selected |
|--------|-------------|----------|
| Avatar dropdown | Add "Connect repository…" to Phase 11's dropdown | |
| Dedicated toolbar button | Separate repo button in header | |
| Auto-open dialog after sign-in | Modal prompts repo selection right after OAuth | |
| *Other (free text)* | "dedicated button instead of 'import MD' and 'download MD'" | ✓ |

**User's choice:** Free text — a dedicated button replacing the Import MD / Download MD buttons.

Follow-up: what happens to Import/Download MD?

| Option | Description | Selected |
|--------|-------------|----------|
| One "File" menu button | Import MD, Download MD, and GitHub actions collapse into one dropdown menu; Export PDF stays separate | ✓ |
| GitHub button replaces them; import/export in its menu | Toolbar slot becomes one GitHub sync button | |
| Keep all visible, visually grouped | Three separate buttons with shared grouping | |

| Option | Description | Selected |
|--------|-------------|----------|
| Searchable list | Repos sorted by recently pushed, type-to-filter | ✓ |
| Simple dropdown | Plain select of all repos | |
| Type owner/repo manually | Text input | |

| Option | Description | Selected |
|--------|-------------|----------|
| Pick file in picker | Third step: flat list of .md files in the branch | ✓ |
| Convention: resume.md | Fixed filename at repo root | |
| Configurable path field | Text input for file path | |

| Option | Description | Selected |
|--------|-------------|----------|
| Default branch, changeable | Pre-select default branch, dropdown to switch | ✓ |
| Always ask | Branch is a required explicit step | |
| Default branch only | No branch UI | |

---

## Auto-pull & conflict prompt

| Option | Description | Selected |
|--------|-------------|----------|
| Store synced SHA + content | Snapshot in localStorage; prompt only when local edited AND differs from remote | ✓ |
| Compare content directly | Diff editor content vs fetched remote | |
| Timestamp heuristic | "Edited after last sync" flag | |

| Option | Description | Selected |
|--------|-------------|----------|
| Blocking modal | Keep local / Use GitHub version on load; nothing overwrites until chosen | ✓ |
| Non-blocking banner | App opens local; banner offers take-remote | |
| Show both previews | Side-by-side snippets (creeps toward deferred SYNC-F3) | |

| Option | Description | Selected |
|--------|-------------|----------|
| Nothing until commit | Keep-local just marks dirty; user commits when ready | ✓ |
| Prompt to commit immediately | Commit dialog opens right after keep-local | |

| Option | Description | Selected |
|--------|-------------|----------|
| Toast + work locally | Dismissible toast; load local content; 401 clears token | ✓ |
| Silent fallback | No message | |
| Retry prompt | Modal Retry / Work offline | |

---

## Commit flow

| Option | Description | Selected |
|--------|-------------|----------|
| Message input + commit button | Small modal, one pre-filled field, Commit/Cancel | ✓ |
| Message + description fields | GitHub Desktop style | |
| Inline in File menu | Input embedded in dropdown | |

| Option | Description | Selected |
|--------|-------------|----------|
| Update \<filename\> | GitHub web-editor default | ✓ |
| With timestamp/date | e.g. "Update resume.md — 2026-07-05" | |
| cv: update | Fixed prefix | |

| Option | Description | Selected |
|--------|-------------|----------|
| Detect & re-prompt | Commit with stored SHA; on rejection reuse keep-local/take-remote modal | ✓ |
| Force overwrite | Always commit over latest SHA | |
| Fail with error | "Pull first" error | |

| Option | Description | Selected |
|--------|-------------|----------|
| Success toast + clear dirty | Toast via Phase 11 pattern; SHA/snapshot update | ✓ |
| Silent success | Only dirty indicator clears | |
| Status in File menu | Last-commit info in menu | |

---

## Dirty indicator & toolbar grouping

| Option | Description | Selected |
|--------|-------------|----------|
| Dot on File button | Small amber dot, VS Code convention | ✓ |
| Filename + dot in toolbar | Editor-tab style filename with • | |
| Text badge | "Uncommitted changes" pill | |

| Option | Description | Selected |
|--------|-------------|----------|
| Inside File menu | "Commit to GitHub…" menu item | ✓ |
| Dedicated toolbar button | Visible Commit button when connected | |

| Option | Description | Selected |
|--------|-------------|----------|
| Inside File menu | Repo info in menu header with Change… | |
| Header text next to title | Muted "owner/repo · file.md" beside md2cv title | ✓ |
| Avatar dropdown | Per Phase 11's original note | |

**Notes:** User chose header text over the recommended File-menu placement — repo/branch/file info is always visible next to the title. CONTEXT.md flags mobile width as a planning consideration.

| Option | Description | Selected |
|--------|-------------|----------|
| Always present, GitHub items adapt | File menu stable; GitHub section adapts to auth/repo state | ✓ |
| GitHub items always visible, disabled | Greyed-out items when unavailable | |

---

## Claude's Discretion

- Picker dialog layout/styling; shared dialog primitive design
- localStorage key naming (follow `md2cv-*`)
- GitHub API approach (contents API vs Git data API)
- Toast wording, loading states, header-text truncation on narrow screens

## Deferred Ideas

None — discussion stayed within phase scope (SYNC-F1..F3 already deferred in REQUIREMENTS.md).
