---
phase: 13-file-tree-sidebar
fixed_at: 2026-07-06T00:00:00Z
review_path: .planning/phases/13-file-tree-sidebar/13-REVIEW.md
iteration: 1
findings_in_scope: 3
fixed: 3
skipped: 0
status: all_fixed
---

# Phase 13: Code Review Fix Report

**Fixed at:** 2026-07-06
**Source review:** .planning/phases/13-file-tree-sidebar/13-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 3
- Fixed: 3
- Skipped: 0

## Fixed Issues

### WR-01: "Discard my edits" button is not disabled while a commit is in flight

**Files modified:** `src/components/DirtySwitchDialog.tsx`
**Commit:** 6df1120
**Applied fix:** Added `disabled={committing}` prop to the "Discard my edits" button and added `disabled:opacity-60 disabled:cursor-not-allowed` to its className, matching the style already applied to the "Commit changes…" button. This prevents a user from triggering `openFile` while a commit network call is still in progress, eliminating the race condition that could corrupt `syncState` with a stale SHA.

### WR-02: Switching files does not auto-expand ancestor folders in the tree

**Files modified:** `src/hooks/useRepoTree.ts`
**Commit:** 286a378
**Applied fix:** Added a second, lightweight `useEffect` that depends only on `repoConfig?.filePath`. When the active file path changes, it merges the path's ancestor segments into the existing `expandedPaths` set (using a functional updater), so manually collapsed folders are preserved while the new file's parent chain is always revealed.

### WR-03: `getFileContent` silently returns empty string for files between 1 MB and 100 MB

**Files modified:** `src/lib/githubRepo.ts`
**Commit:** 51d8ac1
**Applied fix:** Widened the inline type assertion to include `size` and `download_url` fields, then added a guard that throws `new Error('content_too_large')` when `data.content` is empty but a `download_url` is present. Existing callers already catch and display user-facing error messages, so this integrates without further changes. Silent data loss on large files is now prevented.

---

_Fixed: 2026-07-06_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
