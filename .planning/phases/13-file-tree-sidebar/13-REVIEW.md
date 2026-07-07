---
phase: 13-file-tree-sidebar
reviewed: 2026-07-06T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/App.tsx
  - src/components/DirtySwitchDialog.tsx
  - src/components/FileSidebar.tsx
  - src/components/FileTree.tsx
  - src/components/Header.tsx
  - src/hooks/useRepoSync.ts
  - src/hooks/useRepoTree.ts
  - src/lib/fileTree.ts
  - src/lib/githubRepo.ts
findings:
  critical: 0
  warning: 3
  info: 6
  total: 9
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-07-06
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This phase adds a file-tree sidebar that lets users browse and switch between `.md` files in a connected GitHub repository. The implementation covers the GitHub tree API (`listTreeEntries`), tree building and sorting (`buildFileTree`), a `useRepoTree` hook for fetch/expand state, a `FileSidebar` + `FileTree` component pair, a `DirtySwitchDialog` for handling dirty-file switching, and `useRepoSync.openFile` for fetching and switching the active file.

The code is well-structured and the happy path is sound. Three issues warrant attention: a race condition that can corrupt sync state when "Discard" is clicked mid-commit, a missing dependency that prevents auto-expansion of ancestor folders when switching files, and a silent data-truncation bug in `getFileContent` for large files. Six lower-priority items (ARIA, unnecessary re-runs, brittle string matching, etc.) are captured as Info.

---

## Warnings

### WR-01: "Discard my edits" button is not disabled while a commit is in flight

**File:** `src/components/DirtySwitchDialog.tsx:29`

**Issue:** The "Commit changes…" button is disabled when `committing` is true, but the "Discard my edits" button is not. A user can click Discard while the commit network call is still in flight. `handleDirtyDiscard` calls `repoSync.openFile(path)` immediately, starting a second async operation. If `openFile`'s `setSyncState` settles first and the commit's `setSyncState` resolves after it, `syncState` is overwritten with the old file's SHA and snapshot while the editor is already showing the new file. On the next commit the SHA will be wrong, causing a guaranteed 422 conflict and potential data confusion.

**Fix:**
```tsx
<button
  onClick={onDiscard}
  disabled={committing}   // add this
  className="h-9 w-full rounded text-red-400 text-sm hover:bg-gray-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
>
  Discard my edits
</button>
```

---

### WR-02: Switching files does not auto-expand ancestor folders in the tree

**File:** `src/hooks/useRepoTree.ts:60`

**Issue:** `setExpandedPaths(new Set(pathsToExpand(cfg.filePath)))` runs only inside the fetch effect. The effect's dependency array is `[token, repoConfig?.owner, repoConfig?.repo, repoConfig?.branch, refreshTick]`. When `openFile` changes `repoConfig.filePath` (a different dependency), the effect does not re-run and `expandedPaths` is not updated. If the newly opened file lives in a folder that the user previously collapsed, that folder remains collapsed and the file's highlighted row is invisible in the tree.

**Fix:** Expand the ancestor paths of the new active file whenever `filePath` changes, without re-fetching the tree:

```ts
// Add filePath to the effect deps so we update expandedPaths on file switch.
// Because we only want to expand (not reset), merge into existing expanded set.
useEffect(() => {
  if (!repoConfig?.filePath) return
  setExpandedPaths(prev => {
    const next = new Set(prev)
    for (const p of pathsToExpand(repoConfig.filePath)) next.add(p)
    return next
  })
}, [repoConfig?.filePath])
```

This can live as a second, lightweight effect alongside the fetch effect. Alternatively, add `repoConfig?.filePath` to the existing effect's deps and change the `setExpandedPaths` call from `new Set(...)` to a merge so manual toggles are preserved.

---

### WR-03: `getFileContent` silently returns empty string for files between 1 MB and 100 MB

**File:** `src/lib/githubRepo.ts:157`

**Issue:** GitHub's Contents API returns HTTP 200 with `"content": ""` (empty string) for blobs between 1 MB and 100 MB; it provides a `download_url` instead. The current code:

```ts
const data = (await res.json()) as { content: string; sha: string }
return { content: decodeBase64(data.content), sha: data.sha }
```

`decodeBase64("")` returns `""`. The hook propagates the empty string to `applyRemoteContent`, the editor goes blank, and if the user then saves, the entire file is overwritten with empty content — silent data loss.

**Fix:**
```ts
const data = (await res.json()) as { content: string; sha: string; size?: number; download_url?: string }
if (!data.content && data.download_url) {
  // File is too large for the Contents API (>1 MB). Surface a clear error rather
  // than silently replacing the editor with an empty string.
  throw new Error('content_too_large')
}
return { content: decodeBase64(data.content), sha: data.sha }
```

Callers (`connectRepo`, `openFile`, auto-pull) already catch and display a user-facing error message, so this integrates cleanly.

---

## Info

### IN-01: `aria-selected` attribute on a `<button>` element violates the ARIA spec

**File:** `src/components/FileTree.tsx:119`

**Issue:** `aria-selected` is placed on both the `<li role="treeitem">` (line 113, correct) and the `<button>` inside it (line 119, invalid). The `aria-selected` state is not a permitted attribute for the `button` role and may be announced twice or ignored by assistive technology.

**Fix:** Remove the duplicate `aria-selected` from the `<button>`:
```tsx
<button
  onClick={() => onOpenFile(node.path)}
  style={{ paddingLeft }}
  className={...}
  // aria-selected belongs on the treeitem <li>, not here
>
```

---

### IN-02: `setPendingSwitchPath(prev => prev)` no-op in `handleDirtyCommit` is misleading

**File:** `src/App.tsx:193`

**Issue:** `setPendingSwitchPath(prev => prev)` does nothing — it schedules a state update that produces the same value. The intent (documented in the comment) is simply "don't clear the pending path". The no-op call adds noise without communicating that intent.

**Fix:** Remove the call entirely. The `pendingSwitchPath` value is left unchanged naturally when it is not explicitly set:
```ts
const handleDirtyCommit = useCallback(() => {
  awaitingCommitRef.current = true
  setCommitOpen(true)
}, [])
```

---

### IN-03: `repoSync` object reference in a `useEffect` dependency causes the effect to re-run every render

**File:** `src/App.tsx:213`

**Issue:** The auto-switch effect lists both the primitive fields (`repoSync.committing`, `repoSync.isDirty`, `repoSync.syncError`) and `repoSync` itself as dependencies. `useRepoSync` returns a plain object literal on every render, so `repoSync` is always a new reference and the effect re-runs on every render. The early-return guard (`if (!awaitingCommitRef.current) return`) makes this harmless in the common case, but it is wasteful and the pattern will silently break if the early return is ever removed.

**Fix:** Remove `repoSync` from the dependency array and use a ref for the stable `openFile` reference:
```ts
const openFileRef = useRef(repoSync.openFile)
openFileRef.current = repoSync.openFile

useEffect(() => {
  if (!awaitingCommitRef.current) return
  if (repoSync.committing) return
  if (repoSync.syncError) {
    awaitingCommitRef.current = false
    setPendingSwitchPath(null)
    return
  }
  if (!repoSync.isDirty && pendingSwitchPath) {
    const path = pendingSwitchPath
    awaitingCommitRef.current = false
    setPendingSwitchPath(null)
    openFileRef.current(path)
  }
}, [repoSync.committing, repoSync.isDirty, repoSync.syncError, pendingSwitchPath])
```

---

### IN-04: Commit-error branch detection via `msg.includes('commit_failed_409')` is brittle

**File:** `src/hooks/useRepoSync.ts:214`

**Issue:** The conflict-detection logic searches for the literal string `'commit_failed_409'` in the error message. This creates a hidden coupling between `commitFile` in `githubRepo.ts` and the calling hook. If the error message format changes, the conflict branch silently falls through to the generic error handler, leaving the user unable to resolve a real SHA conflict.

**Fix:** Use a typed error or a discriminated error code instead:
```ts
// In githubRepo.ts:
class GitHubApiError extends Error {
  constructor(public code: string, public status: number) {
    super(`github_error_${status}`)
  }
}
// Throw: throw new GitHubApiError('commit_failed', res.status)

// In useRepoSync.ts:
if (e instanceof GitHubApiError && (e.status === 409 || e.status === 422)) { ... }
```

---

### IN-05: Duplicate click-outside / Escape handler logic in `Header.tsx`

**File:** `src/components/Header.tsx:63-108`

**Issue:** Two nearly identical `useEffect` blocks manage click-outside and Escape-key dismissal for the avatar dropdown and the file menu. The only difference is the ref and the setter function used.

**Fix:** Extract a reusable hook:
```ts
function useClickOutside(
  ref: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  onClose: () => void,
) {
  useEffect(() => {
    if (!enabled) return
    const handleMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [ref, enabled, onClose])
}
```

### IN-06: `useCallback` for `handleTreeOpenFile` is ineffective for memoization

**File:** `src/App.tsx:169-177`

**Issue:** `handleTreeOpenFile` lists `repoSync` as a dependency. Because `useRepoSync` returns a new object each render, `handleTreeOpenFile` itself is also recreated every render. The `useCallback` wrapper provides no memoization benefit and may mislead future readers into thinking the callback is stable.

**Fix:** Use a ref for the needed `repoSync` methods (as done elsewhere in the file for `configRef`, etc.):
```ts
const repoSyncRef = useRef(repoSync)
repoSyncRef.current = repoSync

const handleTreeOpenFile = useCallback((path: string) => {
  if (!isDesktop) setSidebarOpen(false)
  if (repoSyncRef.current.repoConfig?.filePath === path) return
  if (repoSyncRef.current.isDirty) {
    setPendingSwitchPath(path)
  } else {
    repoSyncRef.current.openFile(path)
  }
}, [isDesktop])
```

---

_Reviewed: 2026-07-06_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
