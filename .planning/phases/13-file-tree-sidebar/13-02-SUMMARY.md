---
phase: 13-file-tree-sidebar
plan: "02"
subsystem: data-layer
tags: [file-tree, tree-transform, tdd, hooks, github-api]
dependency_graph:
  requires: [listTreeEntries, GitHubTreeEntry, GitHubTreeResult, RepoConfig]
  provides: [TreeNode, buildFileTree, pathsToExpand, useRepoTree, UseRepoTreeResult]
  affects: [src/lib/fileTree.ts, src/lib/fileTree.test.ts, src/hooks/useRepoTree.ts]
tech_stack:
  added: []
  patterns: [TDD red-green, cancelled-effect cleanup, useCallback with Set state, refreshTick increment pattern]
key_files:
  created:
    - src/lib/fileTree.ts
    - src/lib/fileTree.test.ts
    - src/hooks/useRepoTree.ts
  modified: []
decisions:
  - "Case-insensitive alphabetical sort puts logo.png before README.md (l < r) — plan example was incorrect; plan rule (case-insensitive) is what the implementation follows"
  - "Effect deps intentionally exclude repoConfig.filePath so opening a file does not re-fetch the whole tree"
  - "expandedPaths is seeded from pathsToExpand on each fresh fetch, then user-controlled via toggleFolder"
metrics:
  duration: "3m"
  completed: "2026-07-06"
  tasks_completed: 2
  files_modified: 3
requirements: [TREE-01]
---

# Phase 13 Plan 02: File Tree Transform and useRepoTree Hook Summary

**One-liner:** Pure flat-to-nested GitHub tree transform (folders-first, case-insensitive) with TDD coverage plus a fetch/expand-state hook that never re-fetches on file open.

## What Was Built

1. **`src/lib/fileTree.ts`** — two pure, export-only functions:
   - `buildFileTree(entries)`: converts GitHub's flat `GitHubTreeEntry[]` into a nested `TreeNode[]` with VS Code ordering (folders first, then files, each level alphabetical case-insensitively). Creates implied intermediate folders for deep blob paths that have no explicit tree entry. Marks each file node with `isMarkdown` (case-insensitive `.md` check). Avoids duplicate nodes.
   - `pathsToExpand(filePath)`: returns all ancestor folder paths for a given file path, used to auto-seed expand state on fetch.

2. **`src/lib/fileTree.test.ts`** — 13 unit tests in `describe('buildFileTree')` and `describe('pathsToExpand')` blocks covering: empty input, folders-first ordering, child nesting, full/partial path fields, isMarkdown detection (uppercase), case-insensitive sort, implied intermediate folders, duplicate prevention, and all pathsToExpand edge cases.

3. **`src/hooks/useRepoTree.ts`** — `useRepoTree(token, repoConfig)` hook returning `UseRepoTreeResult`:
   - Fetches tree on repo connect, branch change, or manual refresh (no polling, no re-fetch on file open or sidebar toggle — D-11)
   - Builds nested tree via `buildFileTree`
   - Exposes `loading`, `error`, `truncated` state
   - Manages non-persisted `expandedPaths: Set<string>` auto-seeded from `pathsToExpand(cfg.filePath)` on each fetch (D-12), then user-controlled via `toggleFolder`
   - `refresh()` callback increments `refreshTick` to trigger a manual re-fetch
   - Uses the cancelled-async-effect cleanup pattern from `useRepoSync.ts`

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing tests for buildFileTree + pathsToExpand | 373c3d6 | src/lib/fileTree.test.ts |
| 1 (GREEN) | Implement fileTree.ts + fix test case-sort expectation | a206d29 | src/lib/fileTree.ts, src/lib/fileTree.test.ts |
| 2 | useRepoTree hook | 128fde0 | src/hooks/useRepoTree.ts |

## TDD Gate Compliance

- RED gate: `test(13-02): add failing tests for buildFileTree and pathsToExpand` commit `373c3d6` — test suite failed (module not found)
- GREEN gate: `feat(13-02): implement buildFileTree and pathsToExpand with tests` commit `a206d29` — all 13 tests pass

## Verification

- `npx vitest run src/lib/fileTree.test.ts` — 13 tests pass
- `npx tsc -b --noEmit` — clean, no errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Corrected case-insensitive sort test expectation**
- **Found during:** Task 1 GREEN phase
- **Issue:** The plan's behavior example stated `[folder 'docs', file 'README.md', file 'logo.png']` but case-insensitive alphabetical sort places 'logo.png' before 'README.md' ('l' < 'r'). The implementation was correct; the plan's example was wrong.
- **Fix:** Updated the test to assert `logo.png` at index 1 and `README.md` at index 2, matching the stated rule ("case-insensitive alphabetical") rather than the incorrect example.
- **Files modified:** src/lib/fileTree.test.ts
- **Commit:** a206d29

## Known Stubs

None. All functions are fully implemented and wired.

## Threat Flags

No new security surface beyond the plan threat model.
- T-13-05: paths are split/compared as strings only; no DOM sink introduced in this plan
- T-13-07: re-fetch gated to token/owner/repo/branch/refreshTick; no polling loop

## Self-Check: PASSED

Files exist:
- src/lib/fileTree.ts — FOUND (buildFileTree, pathsToExpand, TreeNode)
- src/lib/fileTree.test.ts — FOUND (describe buildFileTree, describe pathsToExpand)
- src/hooks/useRepoTree.ts — FOUND (useRepoTree, UseRepoTreeResult)

Commits exist:
- 373c3d6 — test(13-02): add failing tests for buildFileTree and pathsToExpand
- a206d29 — feat(13-02): implement buildFileTree and pathsToExpand with tests
- 128fde0 — feat(13-02): add useRepoTree hook with fetch, expand state, and refresh
