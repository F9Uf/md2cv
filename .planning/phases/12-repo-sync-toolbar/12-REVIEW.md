---
phase: 12-repo-sync-toolbar
reviewed: 2026-07-06T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - src/App.tsx
  - src/components/CommitDialog.tsx
  - src/components/ConflictModal.tsx
  - src/components/Dialog.tsx
  - src/components/Header.tsx
  - src/components/PickerDialog.tsx
  - src/hooks/useRepoSync.ts
  - src/lib/githubRepo.test.ts
  - src/lib/githubRepo.ts
findings:
  critical: 0
  warning: 6
  info: 4
  total: 10
status: issues_found
---

# Phase 12: Code Review Report

**Reviewed:** 2026-07-06T00:00:00Z
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This phase introduces GitHub repo sync: a file picker dialog, commit dialog, conflict modal, a shared Dialog base, and the `useRepoSync` hook that drives all sync logic, backed by a `githubRepo.ts` API layer with a corresponding test suite.

The overall design is solid — the conflict-resolution flow is well thought out, the ref-based stable-callback pattern in `useRepoSync` is correct, and the API layer correctly handles UTF-8 base64 encoding via `TextEncoder`/`TextDecoder`. The test suite covers all five exported functions with meaningful edge cases.

Six warnings were found: one silent no-op commit path, two silent data-truncation issues in the API layer, two race conditions in the picker, and one fragile string-coupling between `App.tsx` and `useRepoSync`. None are crashers but each can cause quietly incorrect behavior.

---

## Warnings

### WR-01: Silent no-op when `syncState` is null at commit time

**File:** `src/hooks/useRepoSync.ts:177`

**Issue:** `commit()` checks `if (!token || !configRef.current || !syncRef.current) return` and exits silently with no error or user feedback when `syncRef.current` is null. `syncState` can be null if — after reconnecting — the initial pull failed and was caught silently (the `connectRepo` catch at line 157 sets `syncError` but does not prevent `syncState` from remaining null). A user could then open CommitDialog and press "Commit Changes" and nothing would happen.

**Fix:**
```ts
const commit = useCallback((message: string) => {
  if (!token || !configRef.current) return
  if (!syncRef.current) {
    setSyncError('Cannot commit — file not yet synced. Try reconnecting the repository.')
    return
  }
  // ... rest of commit logic
}, [token])
```

---

### WR-02: `listUserRepos` silently omits repos beyond 100

**File:** `src/lib/githubRepo.ts:57`

**Issue:** The URL uses `per_page=100` but does not follow GitHub's pagination (`Link` header). Users with more than 100 repositories see an incomplete list with no indication that the list is truncated.

**Fix:** Either paginate using the `Link` response header, or surface a notice when the response length equals `per_page`:
```ts
export async function listUserRepos(token: string): Promise<GitHubRepo[]> {
  const res = await fetch('https://api.github.com/user/repos?sort=pushed&per_page=100', {
    headers: authHeaders(token),
  })
  if (!res.ok) throw new Error(`repos_fetch_failed_${res.status}`)
  const data = (await res.json()) as Array<...>
  // Minimal fix: throw a distinguishable error so the caller can show a hint
  if (data.length === 100) {
    // consider adding a `truncated` flag to the return type instead
  }
  return data.map(...)
}
```
The same issue applies to `listBranches` at line 85.

---

### WR-03: `listMdFiles` ignores GitHub's `truncated` flag

**File:** `src/lib/githubRepo.ts:104-109`

**Issue:** The GitHub git-trees API returns `{ tree: [...], truncated: boolean }`. For repositories with more than ~100,000 tree entries the API sets `truncated: true` and returns a partial tree. The code discards this flag, so the file picker silently shows an incomplete list of `.md` files with no warning.

**Fix:**
```ts
const data = (await res.json()) as {
  tree: Array<{ type: string; path: string }>
  truncated: boolean
}
if (data.truncated) throw new Error('tree_truncated')
return data.tree
  .filter((entry) => entry.type === 'blob' && entry.path.endsWith('.md'))
  .map((entry) => ({ path: entry.path }))
```
The caller in `PickerDialog` already has an error state and can display a user-friendly message for this case.

---

### WR-04: Race condition in `selectRepo` and `handleBranchChange`

**File:** `src/components/PickerDialog.tsx:59-94`

**Issue:** Both `selectRepo` (line 59) and `handleBranchChange` (line 80) are async functions that update component state on completion but have no in-flight cancellation. If the user clicks repo A and then quickly clicks repo B, both `Promise.all` calls are live simultaneously. Whichever resolves last wins, so repo A's branches and files could overwrite repo B's. The `selectedRepo` state would show repo B while `branches`/`files` display repo A's data.

**Fix:** Use a cancellation flag, mirroring the pattern already used in the `open` effect at line 37:
```ts
async function selectRepo(r: GitHubRepo) {
  setSelectedRepo(r)
  setSelectedBranch(r.default_branch)
  setFiles([])
  setSelectedFile(null)
  setLoadingFiles(true)
  setError(null)
  let cancelled = false
  // store cancel ref on component or use useRef at hook level
  try {
    const [branchList, fileList] = await Promise.all([...])
    if (cancelled) return
    setBranches(branchList)
    setFiles(fileList)
  } catch {
    if (!cancelled) setError("Couldn't load repository data")
  } finally {
    if (!cancelled) setLoadingFiles(false)
  }
}
```
In practice a `useRef<() => void>` cancel token on the component works cleanly here.

---

### WR-05: Fragile exact-string coupling between `App.tsx` and `useRepoSync`

**File:** `src/App.tsx:178-183`

**Issue:** `App.tsx` routes `syncError` into either an error toast or a warning toast by matching the literal string `"Couldn't sync with GitHub — working locally"`. If that message string is ever changed in `useRepoSync.ts`, the routing silently breaks — the warning would become a red error or vice versa. This is a hidden coupling across module boundaries.

**Fix:** Expose the distinction as a typed field on the `UseSyncResult` interface instead of embedding it in the message string:
```ts
// In useRepoSync.ts
export interface UseSyncResult {
  ...
  syncError: string | null        // fatal errors
  syncWarning: string | null      // soft warnings (e.g. working locally)
}
```
Then produce each value separately inside the hook, and remove the string-matching logic from `App.tsx` entirely.

---

### WR-06: "Discard" button not disabled while commit is in-flight

**File:** `src/components/CommitDialog.tsx:34-39`

**Issue:** The "Discard" / close button has no `disabled` guard for the `committing` state. If the user clicks "Commit Changes" and then immediately clicks "Discard", the dialog closes but the async commit operation in `useRepoSync` continues running. The success or error toast will still appear, but the spinner in the dialog is lost and the user loses in-progress context. More importantly, if the user re-opens CommitDialog before the in-flight commit resolves, `committing` is still true, so the Commit button is still disabled — but no spinner is visible because the dialog was closed and reopened.

**Fix:**
```tsx
<button
  onClick={committing ? undefined : onClose}
  disabled={committing}
  className={`h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 transition-colors${
    committing ? ' opacity-50 cursor-not-allowed' : ' hover:bg-gray-600'
  }`}
>
  Discard
</button>
```

---

## Info

### IN-01: `role="option"` without parent `role="listbox"` (ARIA violation)

**File:** `src/components/PickerDialog.tsx:151, 198`

**Issue:** Repository buttons and file buttons use `role="option"` but their container `<div>` does not have `role="listbox"`. Per WAI-ARIA, `option` is an owned child of `listbox`; screen readers may ignore or mis-announce these elements.

**Fix:** Either add `role="listbox"` to the wrapping `<div>` containers (lines 135 and 182), or change the item roles to `role="button"` (the default for `<button>`) and rely on standard button semantics.

---

### IN-02: Incomplete focus trap in `Dialog`

**File:** `src/components/Dialog.tsx:30-32`

**Issue:** Focus is moved into the dialog panel on open, but there is no focus trap. A keyboard user can Tab through the dialog's interactive elements and then continue tabbing into background content while the modal overlay is visible. WAI-ARIA modal dialog practice requires that Tab and Shift+Tab cycle only within the dialog.

**Fix:** After `panelRef.current?.focus()`, add a `keydown` listener that intercepts Tab and cycles focus within all focusable children of `panelRef.current`.

---

### IN-03: `owner` and `repo` names not URL-encoded in path segments

**File:** `src/lib/githubRepo.ts:84-86, 99-100, 119-120, 139`

**Issue:** `encodePath` (line 50) is used for file paths but not applied to `owner` or `repo` in URL construction. GitHub names are constrained (alphanumeric, `-`, `_`, `.`) so this is low-risk in practice, but a repo name containing a character like `%` (technically valid) would produce a malformed URL.

**Fix:** Apply `encodeURIComponent` to `owner` and `repo` at the call sites:
```ts
`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/...`
```

---

### IN-04: Original commit message is lost on commit-conflict resolution

**File:** `src/hooks/useRepoSync.ts:232`

**Issue:** When the user resolves a commit conflict by choosing "Keep my local version", the re-commit (force-push path) uses a hardcoded message `Update ${cfg.filePath.split('/').pop()}` rather than the message the user originally typed. The original message is not passed to `resolveConflict` and is not stored anywhere.

**Fix:** Store the in-flight commit message in a ref inside `useRepoSync` when `commit()` is called, and re-use it inside `resolveConflict` for the commit-source path:
```ts
const pendingMessageRef = useRef<string>('')

const commit = useCallback((message: string) => {
  pendingMessageRef.current = message
  // ... rest unchanged
}, [token])

// In resolveConflict, source === 'commit':
const result = await commitFile(..., pendingMessageRef.current || `Update ${cfg.filePath.split('/').pop()}`, c.remoteSha)
```

---

_Reviewed: 2026-07-06T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
