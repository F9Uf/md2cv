---
phase: 13-file-tree-sidebar
plan: "01"
subsystem: data-layer
tags: [github-api, repo-sync, tree-fetch, file-switch]
dependency_graph:
  requires: []
  provides: [listTreeEntries, GitHubTreeEntry, GitHubTreeResult, useRepoSync.openFile]
  affects: [src/lib/githubRepo.ts, src/hooks/useRepoSync.ts]
tech_stack:
  added: []
  patterns: [TDD red-green, useCallback with ref pattern for stable closures]
key_files:
  created: []
  modified:
    - src/lib/githubRepo.ts
    - src/lib/githubRepo.test.ts
    - src/hooks/useRepoSync.ts
decisions:
  - "openFile reads configRef.current (not stale repoConfig) matching the existing commit/resolveConflict pattern"
  - "openFile mutates editor content + sync state only inside the try block after a successful fetch (D-07)"
  - "listTreeEntries returns all blob/tree entries unfiltered; excludes submodule commit entries"
metrics:
  duration: "95s"
  completed: "2026-07-06"
  tasks_completed: 2
  files_modified: 3
requirements: [TREE-01, TREE-03, TREE-04]
---

# Phase 13 Plan 01: GitHub Repo Tree API Foundation Summary

**One-liner:** Full-tree GitHub API fetch (unfiltered, truncation-aware) and openFile hook for file-switch capability on useRepoSync.

## What Was Built

Added two lowest-level pieces required by the file-tree sidebar:

1. **`listTreeEntries` + tree types in `githubRepo.ts`** — fetches the full recursive repo tree without filtering to `.md`, returns `GitHubTreeEntry[]` (both blob and tree entries) plus a `truncated` boolean. Submodule `commit` entries are excluded. Error handling matches existing `listMdFiles` pattern (`tree_fetch_failed_${status}`).

2. **`openFile(path)` in `useRepoSync`** — callback that pulls a different file into the editor and re-anchors sync state to it. Mirrors `connectRepo` but uses `configRef.current` (not stale closure) and only mutates editor content + sync state after a successful fetch (D-07: on failure the current file and its edits are untouched).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 (RED) | Failing tests for listTreeEntries | 870b65c | src/lib/githubRepo.test.ts |
| 1 (GREEN) | Implement listTreeEntries + tree types | c738351 | src/lib/githubRepo.ts |
| 2 | Add openFile(path) to useRepoSync | e0d0f87 | src/hooks/useRepoSync.ts |

## TDD Gate Compliance

- RED gate: `test(13-01): add failing tests for listTreeEntries` commit `870b65c` — 5 tests failed, 19 passed
- GREEN gate: `feat(13-01): implement listTreeEntries + GitHubTreeEntry/GitHubTreeResult types` commit `c738351` — all 24 tests pass

## Verification

- `npx vitest run src/lib/githubRepo.test.ts` — 24 tests pass (19 existing + 5 new listTreeEntries tests)
- `npx tsc -b --noEmit` — clean, no errors

## Deviations from Plan

None — plan executed exactly as written.

## Threat Flags

No new security surface beyond what is documented in the plan threat model.
- T-13-01: `encodeURIComponent(branch)` present in listTreeEntries URL
- T-13-03: `truncated` flag surfaced in GitHubTreeResult for downstream UI warning
- T-13-04: `openFile` mutates state only inside try after successful await

## Self-Check: PASSED

Files exist:
- src/lib/githubRepo.ts — FOUND (listTreeEntries at line 122, GitHubTreeResult at line 23)
- src/lib/githubRepo.test.ts — FOUND (describe listTreeEntries block)
- src/hooks/useRepoSync.ts — FOUND (openFile at line 168, interface at line 35, return at line 277)

Commits exist:
- 870b65c — test(13-01): add failing tests for listTreeEntries
- c738351 — feat(13-01): implement listTreeEntries + GitHubTreeEntry/GitHubTreeResult types
- e0d0f87 — feat(13-01): add openFile(path) to useRepoSync
