# Phase 12: Repo Sync & Toolbar - Pattern Map

**Mapped:** 2026-07-06
**Files analyzed:** 10 (7 new, 3 modified)
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/githubRepo.ts` | utility | request-response | `src/lib/githubAuth.ts` | exact |
| `src/lib/githubRepo.test.ts` | test | request-response | `src/lib/githubAuth.test.ts` | exact |
| `src/hooks/useRepoSync.ts` | hook | event-driven + CRUD | `src/hooks/useGitHubAuth.ts` | exact |
| `src/components/Dialog.tsx` | component | event-driven | `src/components/Header.tsx` (dropdown pattern) | role-match |
| `src/components/PickerDialog.tsx` | component | request-response | `src/components/Header.tsx` (dropdown + loading spinner) | role-match |
| `src/components/ConflictModal.tsx` | component | event-driven | `src/components/Header.tsx` (toast/alert pattern) | role-match |
| `src/components/CommitDialog.tsx` | component | request-response | `src/components/Header.tsx` (auth spinner + button states) | role-match |
| `src/components/Header.tsx` | component | event-driven | self (modified) | self |
| `src/App.tsx` | component | CRUD + event-driven | self (modified) | self |

---

## Pattern Assignments

### `src/lib/githubRepo.ts` (utility, request-response)

**Analog:** `src/lib/githubAuth.ts`

This is the primary analog — a pure fetch-based module with no React, no side effects, fully unit-testable. Every new GitHub API function follows this exact shape.

**Imports / types pattern** (lines 1-10):
```typescript
export interface GitHubUser {
  login: string
  avatar_url: string
}

export interface CallbackParams {
  code: string | null
  state: string | null
  error: string | null
}
```

Apply: define exported interfaces for `GitHubRepo`, `GitHubBranch`, `GitHubFileContent`, `GitHubCommitResult` at the top of `githubRepo.ts`.

**GitHub API fetch pattern** (lines 51-61):
```typescript
export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) throw new Error(`user_fetch_failed_${res.status}`)
  const data = (await res.json()) as GitHubUser
  return { login: data.login, avatar_url: data.avatar_url }
}
```

Apply this pattern for every new API function in `githubRepo.ts`:
- `listUserRepos(token)` — GET `/user/repos?sort=pushed&per_page=100`
- `listBranches(token, owner, repo)` — GET `/repos/{owner}/{repo}/branches`
- `listMdFiles(token, owner, repo, branch)` — GET `/repos/{owner}/{repo}/git/trees/{branch}?recursive=1`, filter `.md`
- `getFileContent(token, owner, repo, path, branch)` — GET `/repos/{owner}/{repo}/contents/{path}?ref={branch}`
- `commitFile(token, owner, repo, path, branch, content, message, sha)` — PUT `/repos/{owner}/{repo}/contents/{path}`

**Error throwing convention** (lines 45-48):
```typescript
if (!res.ok) throw new Error(`exchange_failed_${res.status}`)
const data = (await res.json()) as { access_token?: string; error?: string }
if (!data.access_token) throw new Error(data.error || 'exchange_failed')
```

Apply: throw `new Error(\`<verb>_failed_\${res.status}\`)` for non-ok responses. Let the hook layer convert these to user-visible strings.

---

### `src/lib/githubRepo.test.ts` (test, request-response)

**Analog:** `src/lib/githubAuth.test.ts`

**Test file structure** (lines 1-10):
```typescript
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  buildAuthorizeUrl,
  generateState,
  parseCallbackParams,
  exchangeCodeForToken,
  fetchGitHubUser,
} from './githubAuth'

afterEach(() => {
  vi.restoreAllMocks()
})
```

Apply: same vitest imports, same `afterEach(() => vi.restoreAllMocks())` reset.

**Mocked fetch pattern — ok path** (lines 57-72):
```typescript
it('returns access_token when fetch is ok', async () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ access_token: 'tok' }),
  })
  vi.stubGlobal('fetch', mockFetch)

  const token = await exchangeCodeForToken('c', 'https://ep')
  expect(token).toBe('tok')
  expect(mockFetch).toHaveBeenCalledWith('https://ep', expect.objectContaining({
    method: 'POST',
    body: expect.stringContaining('c'),
  }))
})
```

**Mocked fetch pattern — error path** (lines 73-81):
```typescript
it('throws when fetch response is not ok', async () => {
  const mockFetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 502,
  })
  vi.stubGlobal('fetch', mockFetch)

  await expect(exchangeCodeForToken('c', 'https://ep')).rejects.toThrow()
})
```

Apply: one happy-path test and one error-path test per exported function. Test `listUserRepos`, `getFileContent`, and `commitFile` at minimum.

---

### `src/hooks/useRepoSync.ts` (hook, event-driven + CRUD)

**Analog:** `src/hooks/useGitHubAuth.ts`

**Imports / state shape pattern** (lines 1-28):
```typescript
import { useState, useEffect, useCallback } from 'react'
import {
  buildAuthorizeUrl,
  generateState,
  // ...
} from '../lib/githubAuth'

const TOKEN_KEY = 'md2cv-github-token'
const STATE_KEY = 'md2cv-oauth-state'

const ERR_DENIED = 'GitHub access was denied. Click Sign in to try again.'
const ERR_FAILED = 'Sign-in failed. Please try again.'

export interface GitHubAuthState {
  token: string | null
  user: GitHubUser | null
  loading: boolean
  error: string | null
}

export interface UseGitHubAuthResult extends GitHubAuthState {
  signIn: () => void
  signOut: () => void
  dismissError: () => void
}
```

Apply: define `REPO_CONFIG_KEY = 'md2cv-repo-config'`, `SYNC_STATE_KEY = 'md2cv-sync-state'` at the top. Export a `RepoConfig` interface and `UseSyncResult` interface.

**localStorage load helper** (lines 30-32):
```typescript
function loadToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
```

Apply: define `loadRepoConfig(): RepoConfig | null` and `loadSyncState(): SyncState | null` helpers that wrap `localStorage.getItem` + `JSON.parse` in `try/catch`, returning `null` on failure.

**localStorage persist effect** (lines 41-47):
```typescript
useEffect(() => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch { /* ignore */ }
}, [token])
```

Apply: mirror this for `repoConfig` and `syncState` (store/remove on change).

**Async effect with cancellation guard** (lines 49-100):
```typescript
useEffect(() => {
  let cancelled = false
  ;(async () => {
    await Promise.resolve()
    if (cancelled) return
    // ... async work ...
    if (!cancelled) setLoading(false)
  })()
  return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

Apply: the auto-pull-on-open effect MUST use this exact cancellation pattern. Guard every `setState` call with `if (!cancelled)`.

**useCallback for exposed actions** (lines 102-122):
```typescript
const signIn = useCallback(() => {
  // ...
}, [])

const signOut = useCallback(() => {
  setToken(null)
  setUser(null)
  setError(null)
  // ...
}, [])
```

Apply: `pullFile`, `commitFile`, `connectRepo`, `clearRepo` all use `useCallback`.

**Return shape** (lines 124-125):
```typescript
return { token, user, loading, error, signIn, signOut, dismissError }
```

Apply: `useRepoSync` returns `{ repoConfig, syncState, isDirty, pulling, committing, syncError, pullFile, commitFile, connectRepo, clearRepo, dismissSyncError }`.

---

### `src/components/Dialog.tsx` (component, event-driven)

**Analog:** `src/components/Header.tsx` — the avatar dropdown's outside-click + Escape close pattern.

**Outside-click + Escape close effect** (lines 38-59):
```typescript
useEffect(() => {
  if (!menuOpen) return

  function handleMouseDown(e: MouseEvent) {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setMenuOpen(false)
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      setMenuOpen(false)
    }
  }

  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('keydown', handleKeyDown)
  return () => {
    document.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('keydown', handleKeyDown)
  }
}, [menuOpen])
```

Apply: `Dialog.tsx` uses the same `useEffect` guard (`if (!open) return`). Backdrop click fires `onClose`; Escape fires `onClose`. The ConflictModal variant omits Escape and backdrop-click by not wiring them (`onClose` is not passed or is a no-op).

**Modal backdrop + panel markup** (from UI-SPEC.md component 3):
```tsx
<div
  className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby={titleId}
  onClick={handleBackdropClick}
>
  <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-xl w-full max-w-md p-6">
    <h2 id={titleId} className="text-base font-semibold text-white mb-4">
      {title}
    </h2>
    {children}
    <div className="flex justify-end gap-2 mt-6">
      {/* footer buttons rendered by consuming component or via props */}
    </div>
  </div>
</div>
```

**Button classes from Header.tsx** (lines 77-97):
```typescript
// Gray/secondary button:
"h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"

// Blue/primary button:
"h-8 px-3 rounded bg-blue-600 text-white text-sm border border-blue-500 hover:bg-blue-500 transition-colors"
```

---

### `src/components/PickerDialog.tsx` (component, request-response)

**Analog:** `src/components/Header.tsx`

**Loading spinner pattern** (lines 100-109):
```tsx
{authState.loading && !authState.user ? (
  <button
    className="h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 opacity-75 cursor-not-allowed flex items-center gap-1"
    disabled
    aria-label="Signing in, please wait"
    aria-busy="true"
  >
    <span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" />
    Signing in...
  </button>
) : ...}
```

Apply: when `loadingRepos` is true, show `<span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" />` centered in the list area with "Loading repositories…" below.

**Dropdown menu structure** (lines 132-145):
```tsx
{menuOpen && (
  <div role="menu" className="absolute right-0 top-full mt-1 min-w-[160px] z-50 bg-gray-900 border border-gray-600 rounded shadow-lg">
    <div className="px-3 py-2 text-sm font-semibold text-white border-b border-gray-700">
      {authState.user.login}
    </div>
    <button
      role="menuitem"
      onClick={() => { setMenuOpen(false); onSignOut() }}
      className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer rounded-b"
    >
      Sign out
    </button>
  </div>
)}
```

Apply: repo list rows use `role="option"`, selected row adds `bg-blue-900/40 text-blue-200`.

**Select input class** (line 70):
```typescript
"h-8 px-2 rounded bg-gray-700 text-white text-sm border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
```

Apply to: branch `<select>` in step 2.

---

### `src/components/ConflictModal.tsx` (component, event-driven)

**Analog:** `src/components/Header.tsx` — error toast and button patterns.

**Error toast markup** (lines 164-179):
```tsx
{authState.error && (
  <div
    role="alert"
    aria-live="polite"
    className="fixed top-12 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded bg-red-950 border border-red-800 text-red-400 text-sm shadow-md max-w-[320px]"
  >
    {authState.error}
    <button
      aria-label="Dismiss error"
      onClick={onDismissError}
      className="ml-auto pl-2 text-red-400 hover:text-white cursor-pointer"
    >
      ×
    </button>
  </div>
)}
```

Apply: ConflictModal is `role="dialog" aria-modal="true"` (not `role="alert"`). It uses Dialog.tsx as its container. Buttons are full-width stacked (`flex flex-col gap-2`). No Escape or backdrop dismiss — the `onClose` prop is not wired.

**Destructive button** (line 93-97 — blue pattern inverted):
```typescript
// Destructive: red variant of gray button
"h-9 w-full rounded bg-red-800 text-white text-sm border border-red-700 hover:bg-red-700 transition-colors"
```

---

### `src/components/CommitDialog.tsx` (component, request-response)

**Analog:** `src/components/Header.tsx` — loading/disabled button state + input styles.

**Disabled state with spinner pattern** (lines 100-109):
```tsx
<button
  className="h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 opacity-75 cursor-not-allowed flex items-center gap-1"
  disabled
  aria-busy="true"
>
  <span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" />
  Signing in...
</button>
```

Apply: when `committing` is true, show spinner inside the "Commit Changes" button + label "Committing…", `disabled`. When `commitMessage` is empty, use `opacity-50 cursor-not-allowed` + `aria-disabled="true"`.

**Input class** (line 70 — select class):
```typescript
"h-8 px-2 rounded bg-gray-700 text-white text-sm border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
```

Apply to the commit message `<input type="text">` (use `w-full` instead of constrained width, `px-3` for text input).

---

### `src/components/Header.tsx` (component, event-driven) — MODIFIED

**Analog:** self. Key patterns to preserve and extend.

**Props interface pattern** (lines 5-15):
```typescript
interface HeaderProps {
  selectedTemplate: TemplateName
  onTemplateChange: (template: TemplateName) => void
  onDownloadMd: () => void
  onExportPdf: () => void
  onImportMd: () => void
  authState: GitHubAuthState
  onSignIn: () => void
  onSignOut: () => void
  onDismissError: () => void
}
```

Apply: add new props for Phase 12:
- `repoSync: UseSyncResult` (from useRepoSync)
- `isDirty: boolean`
- `onOpenFilePicker: () => void`
- `onOpenCommitDialog: () => void`

Retain `onImportMd` and `onDownloadMd` as props: the File menu items inside Header invoke these callbacks, but the underlying file I/O logic lives in `App.tsx` (which owns `markdownContent` and the file input). Header wires them into the new File dropdown rather than owning the logic. (Note: earlier drafts said to remove these props; they are kept because the import/download implementation stays in App.tsx — Plan 05 Task 1 is the source of truth.)

**wrapperRef + menuOpen pattern** (lines 28-59) is the exact template for the File menu button's open/close state. Duplicate this pattern for the `fileMenuOpen` state with its own `fileMenuRef`.

**Repo/branch caption** (from UI-SPEC.md component 7):
```tsx
<span className="text-xs text-gray-400 truncate max-w-[160px] hidden sm:inline-block ml-3">
  owner/repo · file.md
</span>
```

Mount between `<h1>md2cv</h1>` and the toolbar `<div className="flex items-center gap-2">`.

**Dirty dot** (from UI-SPEC.md component 1):
```tsx
{/* on the File button, when isDirty */}
<span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" aria-hidden="true" />
```

**Toast variants** — extend the existing error toast. Add `variant` prop or separate state-driven renders for `success` and `warning`:
```typescript
// Success variant (new):
"fixed top-12 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded bg-green-950 border border-green-800 text-green-400 text-sm shadow-md max-w-[320px]"

// Warning variant (new):
"fixed top-12 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded bg-amber-950 border border-amber-800 text-amber-400 text-sm shadow-md max-w-[320px]"

// Error variant (existing, line 166-169):
"fixed top-12 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded bg-red-950 border border-red-800 text-red-400 text-sm shadow-md max-w-[320px]"
```

---

### `src/App.tsx` (component, CRUD + event-driven) — MODIFIED

**Analog:** self. Key patterns to preserve and extend.

**localStorage lazy initializer pattern** (lines 21-27):
```typescript
const [selectedTemplate, setSelectedTemplate] = useState<TemplateName>(() => {
  try {
    const stored = localStorage.getItem('md2cv-template')
    if (stored === 'classic' || stored === 'modern' || stored === 'minimal') return stored
  } catch { /* ignore */ }
  return 'classic'
})
```

Apply: add `repoSync` from `useRepoSync(auth.token)`. Repo config and sync state are managed inside the hook (not in App-level useState) — App.tsx just consumes the hook result, exactly as it consumes `useGitHubAuth()`.

**Debounce pattern** (lines 63-76):
```typescript
const debounceRef = useRef<ReturnType<typeof setTimeout>>()

const handleMarkdownChange = useCallback((value: string) => {
  setMarkdownContent(value)
  if (debounceRef.current) clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(() => {
    setHtmlContent(parseResume(value))
    try { localStorage.setItem('md2cv-content', value) } catch { /* ignore */ }
  }, 150)
}, [])
```

Apply: dirty detection compares `markdownContent` against `repoSync.syncState?.contentSnapshot`. This comparison is a derived value (no extra state) — computed directly in the render or passed as `isDirty` prop. Do NOT debounce the dirty flag; it should update synchronously with each keystroke so the dot appears immediately.

**useCallback for handlers** (lines 79-130):
```typescript
const handleDownloadMd = useCallback(() => {
  // ...
}, [markdownContent])
```

Apply: `handleOpenFilePicker`, `handleOpenCommitDialog`, `handleDismissSyncError` all use `useCallback`. Dialog open/close booleans (`pickerOpen`, `conflictOpen`, `commitOpen`) live as `useState` in `App.tsx` — no router, per the established no-router constraint.

**Cleanup effect** (lines 135-137):
```typescript
useEffect(() => {
  return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
}, [])
```

Apply: the auto-pull-on-open effect cleanup lives inside `useRepoSync` (not App.tsx) — consistent with how auth effects live in `useGitHubAuth`.

**Hook consumption pattern** (lines 18-19):
```typescript
const auth = useGitHubAuth()
```

Apply:
```typescript
const auth = useGitHubAuth()
const repoSync = useRepoSync(auth.token)
```

Pass `repoSync` and derived `isDirty` down to `Header` and dialog components.

---

## Shared Patterns

### GitHub API fetch headers
**Source:** `src/lib/githubAuth.ts` lines 52-57
**Apply to:** all functions in `src/lib/githubRepo.ts`
```typescript
headers: {
  Authorization: `Bearer ${token}`,
  Accept: 'application/vnd.github+json',
}
```

### localStorage try/catch
**Source:** `src/App.tsx` lines 21-26 and `src/hooks/useGitHubAuth.ts` lines 30-32, 41-47
**Apply to:** all localStorage reads/writes in `useRepoSync.ts`
```typescript
// Read:
try { return localStorage.getItem(KEY) } catch { return null }
// Write:
try {
  if (value) localStorage.setItem(KEY, JSON.stringify(value))
  else localStorage.removeItem(KEY)
} catch { /* ignore */ }
```

### localStorage key prefix
**Source:** `src/App.tsx` (`md2cv-content`, `md2cv-template`, `md2cv-margins`) and `src/hooks/useGitHubAuth.ts` (`md2cv-github-token`)
**Apply to:** `useRepoSync.ts` new keys
```typescript
const REPO_CONFIG_KEY = 'md2cv-repo-config'   // { owner, repo, branch, filePath, defaultBranch }
const SYNC_STATE_KEY  = 'md2cv-sync-state'     // { sha, contentSnapshot }
```

### Async effect cancellation guard
**Source:** `src/hooks/useGitHubAuth.ts` lines 49-100
**Apply to:** auto-pull-on-open effect and any async operation in `useRepoSync.ts`
```typescript
useEffect(() => {
  let cancelled = false
  ;(async () => {
    await Promise.resolve()
    if (cancelled) return
    // ... async work, guard every setState:
    if (!cancelled) setLoading(false)
  })()
  return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [])
```

### Toolbar button base class
**Source:** `src/components/Header.tsx` lines 77-80
**Apply to:** File menu button in modified `Header.tsx`, all dialog footer buttons
```typescript
"h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"
```

### Error toast (role="alert")
**Source:** `src/components/Header.tsx` lines 164-179
**Apply to:** all toast variants in modified `Header.tsx` (success: green-950, warning: amber-950, error: red-950)
```tsx
<div
  role="alert"
  aria-live="polite"
  className="fixed top-12 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded {variant-classes} text-sm shadow-md max-w-[320px]"
>
  {message}
  <button aria-label="Dismiss" onClick={onDismiss} className="ml-auto pl-2 hover:text-white cursor-pointer">×</button>
</div>
```

### Outside-click + Escape close effect
**Source:** `src/components/Header.tsx` lines 38-59
**Apply to:** `Dialog.tsx` (Escape closes), File menu in modified `Header.tsx` (outside-click + Escape closes)
```typescript
useEffect(() => {
  if (!open) return
  function handleMouseDown(e: MouseEvent) {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose()
  }
  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose()
  }
  document.addEventListener('mousedown', handleMouseDown)
  document.addEventListener('keydown', handleKeyDown)
  return () => {
    document.removeEventListener('mousedown', handleMouseDown)
    document.removeEventListener('keydown', handleKeyDown)
  }
}, [open, onClose])
```

### Spinner element
**Source:** `src/components/Header.tsx` line 107
**Apply to:** PickerDialog loading state, CommitDialog in-progress state
```tsx
<span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" aria-hidden="true" />
```

### Dropdown menu panel
**Source:** `src/components/Header.tsx` lines 132-146
**Apply to:** File dropdown menu in modified `Header.tsx`
```tsx
<div role="menu" className="absolute left-0 top-full mt-1 min-w-[200px] z-50 bg-gray-900 border border-gray-600 rounded shadow-lg">
  {/* menu items */}
</div>
```

### Menu item class
**Source:** `src/components/Header.tsx` line 141
**Apply to:** all items in the File dropdown menu
```typescript
"w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer"
```

---

## No Analog Found

All files have analogs in the existing codebase. No entries required here.

---

## Metadata

**Analog search scope:** `src/components/`, `src/hooks/`, `src/lib/`
**Files scanned:** 5 source files fully read (`Header.tsx`, `App.tsx`, `useGitHubAuth.ts`, `githubAuth.ts`, `githubAuth.test.ts`)
**Pattern extraction date:** 2026-07-06
