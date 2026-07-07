# Phase 13: File Tree Sidebar - Pattern Map

**Mapped:** 2026-07-06
**Files analyzed:** 8 (4 new, 4 extended)
**Analogs found:** 8 / 8

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/FileSidebar.tsx` | component (layout container) | event-driven | `src/components/MobileTabs.tsx` | role-match |
| `src/components/FileTree.tsx` | component (recursive list) | event-driven | `src/components/Header.tsx` (file menu section) | partial |
| `src/hooks/useRepoTree.ts` | hook | request-response | `src/hooks/useRepoSync.ts` | exact |
| `src/components/DirtySwitchDialog.tsx` | component (modal) | event-driven | `src/components/ConflictModal.tsx` | exact |
| `src/components/Header.tsx` | component (extended) | event-driven | `src/components/Header.tsx` | self |
| `src/App.tsx` | component (root, extended) | mixed | `src/App.tsx` | self |
| `src/hooks/useRepoSync.ts` | hook (extended) | request-response | `src/hooks/useRepoSync.ts` | self |
| `src/lib/githubRepo.ts` | utility / API lib (extended) | request-response | `src/lib/githubRepo.ts` (`listMdFiles`) | self |

---

## Pattern Assignments

### `src/components/FileSidebar.tsx` (component, event-driven)

**Analog:** `src/components/MobileTabs.tsx` (layout container with conditional CSS visibility) and `src/components/SplitPane.tsx` (flex sibling layout in `<main>`).

**Imports pattern** — copy from `MobileTabs.tsx` lines 1-2:
```typescript
import { useState, type ReactNode } from 'react'
// FileSidebar will additionally import useMediaQuery and any tree types
```

**Desktop hidden-not-unmounted pattern** — copy from `MobileTabs.tsx` lines 40-42:
```tsx
{/* Keep sidebar mounted when hidden so tree fetch state is preserved */}
<div className={sidebarOpen ? 'flex flex-col ...' : 'hidden'}>
  {children}
</div>
```

**Mobile overlay / drawer pattern** — `MobileTabs` keeps both panes mounted with a CSS `hidden` class; `FileSidebar` does the same but uses translate for the drawer. Reference `src/components/MobileTabs.tsx` line 40 for `hidden` toggle and `src/components/Header.tsx` line 117 for `h-12 bg-gray-900` header row convention.

**Core component shape:**
```tsx
// Desktop: <aside> as flex sibling before <main> — matches SplitPane positioning in App.tsx line 187
// Mobile: fixed overlay with translate-x transition
// Both: hidden class (not unmounted) when sidebarOpen === false so tree state survives toggle

interface FileSidebarProps {
  open: boolean
  repoConfig: RepoConfig | null
  // ... tree data props, callbacks
}

export default function FileSidebar({ open, repoConfig, ... }: FileSidebarProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  // Desktop path: className={open ? 'w-60 flex flex-col ...' : 'hidden'}
  // Mobile path: className={`fixed left-0 z-40 w-60 flex flex-col ... transition-transform duration-200 ${open ? 'translate-x-0' : '-translate-x-full'}`}
}
```

**Border convention** — from `Header.tsx` line 117 and `MobileTabs.tsx` line 14:
```tsx
// Sidebar right edge: border-r border-gray-700
// Sidebar header bottom: border-b border-gray-700
```

---

### `src/components/FileTree.tsx` (component, event-driven)

**Analog:** File menu in `src/components/Header.tsx` lines 156-184 (interactive list of items, hover:bg-gray-700, cursor-pointer, role="menu").

**Imports pattern:**
```typescript
import type { RepoConfig } from '../hooks/useRepoSync'
// No external deps beyond React — pure functional component
```

**Interactive row pattern** — copy hover, cursor, and text conventions from `Header.tsx` lines 170-181:
```tsx
// Clickable row (folder or .md file):
<button
  className="w-full text-left px-... py-... text-sm text-gray-200 hover:bg-gray-700 cursor-pointer"
  onClick={...}
>
  {name}
</button>

// Non-clickable row (non-.md file):
<div
  aria-disabled="true"
  className="w-full text-left px-... text-sm text-gray-500 cursor-not-allowed"
>
  {name}
</div>
```

**Active row highlight + amber dirty dot** — copy directly from `Header.tsx` lines 158-166:
```tsx
// Active row: bg-gray-700 background
// Dirty dot on active row ONLY (mirrors Header.tsx line 166):
{isDirty && isActiveFile && (
  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto mr-2" aria-hidden="true" />
)}
```

**Indentation pattern (per UI-SPEC):**
```tsx
// Row padding-left = depth * 12 + 8px
// depth 0 → pl-2 (8px), depth 1 → pl-5 (20px), depth 2 → pl-8 (32px)
const paddingLeft = depth * 12 + 8  // inline style or computed Tailwind
```

**Chevron rotation pattern:**
```tsx
// Rotate 90° on expand; matches existing transition patterns in codebase
<svg
  className={`transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
  ...
/>
```

**ARIA tree pattern (accessibility contract from UI-SPEC):**
```tsx
<ul role="tree">
  <li role="treeitem" aria-expanded={isFolder ? expanded : undefined} aria-selected={isActive}>
    ...
  </li>
</ul>
```

---

### `src/hooks/useRepoTree.ts` (hook, request-response)

**Analog:** `src/hooks/useRepoSync.ts` — same pattern: async GitHub API calls inside a hook, loading/error state, `useCallback` for stable references.

**Imports pattern** — copy from `useRepoSync.ts` lines 1-2:
```typescript
import { useState, useCallback } from 'react'
import { listTreeEntries } from '../lib/githubRepo'
```

**Async fetch with loading/error pattern** — copy from `useRepoSync.ts` lines 148-163:
```typescript
const fetchTree = useCallback(() => {
  if (!token || !repoConfig) return
  setLoading(true)
  setError(null)
  ;(async () => {
    try {
      const entries = await listTreeEntries(token, repoConfig.owner, repoConfig.repo, repoConfig.branch)
      setTreeEntries(entries)
    } catch {
      setError("Couldn't load file tree")
    } finally {
      setLoading(false)
    }
  })()
}, [token, repoConfig])
```

**Auto-fetch on config change pattern** — copy from `useRepoSync.ts` lines 112-145 (the `useEffect` that fires on `token` change):
```typescript
// Fetch tree when repo connects; re-fetch on manual refresh (no polling)
useEffect(() => {
  let cancelled = false
  ;(async () => {
    await Promise.resolve()
    if (cancelled || !repoConfig || !token) return
    setLoading(true)
    try {
      const entries = await listTreeEntries(token, ...)
      if (!cancelled) setTreeEntries(entries)
    } catch {
      if (!cancelled) setError("Couldn't load file tree")
    } finally {
      if (!cancelled) setLoading(false)
    }
  })()
  return () => { cancelled = true }
}, [token, repoConfig])
```

**Expand/collapse state pattern** — managed in-hook as a `Set<string>` of expanded folder paths (no localStorage, in-session only per D-12):
```typescript
const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())

const toggleFolder = useCallback((path: string) => {
  setExpandedPaths(prev => {
    const next = new Set(prev)
    if (next.has(path)) next.delete(path)
    else next.add(path)
    return next
  })
}, [])
```

**Auto-expand path to active file** — computed from `repoConfig.filePath` segments on tree load; add each path prefix to `expandedPaths`.

**Return shape** — mirror `useRepoSync.ts` UseSyncResult interface style (lines 26-40):
```typescript
export interface UseRepoTreeResult {
  treeEntries: TreeEntry[]
  loading: boolean
  error: string | null
  expandedPaths: Set<string>
  truncated: boolean
  toggleFolder: (path: string) => void
  refresh: () => void
}
```

---

### `src/components/DirtySwitchDialog.tsx` (component, event-driven)

**Analog:** `src/components/ConflictModal.tsx` (exact — same shape: Dialog wrapper, action buttons stacked in `flex flex-col gap-2`, no internal state) and `src/components/CommitDialog.tsx` (shows how to call Dialog and arrange buttons with primary/destructive/neutral grouping).

**Full ConflictModal pattern** — copy lines 1-29 of `src/components/ConflictModal.tsx` as the template:
```tsx
import Dialog from './Dialog'

interface DirtySwitchDialogProps {
  open: boolean
  currentFilename: string
  committing: boolean
  onCommit: () => void     // opens CommitDialog flow
  onDiscard: () => void
  onCancel: () => void
}

export default function DirtySwitchDialog({ open, currentFilename, committing, onCommit, onDiscard, onCancel }: DirtySwitchDialogProps) {
  return (
    <Dialog open={open} title="Unsaved Changes" onClose={onCancel}>
      <p className="text-sm text-gray-300 mb-6">
        <strong>{currentFilename}</strong> has uncommitted changes. What would you like to do?
      </p>
      <div className="flex flex-col gap-2">
        {/* Primary — blue, matches CommitDialog.tsx lines 45-49 */}
        <button
          onClick={onCommit}
          disabled={committing}
          className="h-9 w-full rounded bg-blue-600 text-white text-sm border border-blue-500 hover:bg-blue-500 transition-colors"
        >
          Commit changes…
        </button>
        {/* Destructive — red text, no bg, per UI-SPEC */}
        <button
          onClick={onDiscard}
          className="h-9 w-full rounded text-red-400 text-sm hover:bg-gray-800 transition-colors"
        >
          Discard my edits
        </button>
        {/* Neutral cancel — matches ConflictModal "Keep local" style */}
        <button
          onClick={onCancel}
          className="h-9 w-full rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </Dialog>
  )
}
```

**Dialog onClose = Cancel** — copy from `ConflictModal.tsx` line 11 (no `onClose` = blocking modal) vs `CommitDialog.tsx` line 24 (with `onClose`). For `DirtySwitchDialog`, pass `onClose={onCancel}` so Escape and backdrop-click = Cancel (per UI-SPEC interaction contract §4).

---

### `src/components/Header.tsx` (extended)

**Analog:** `src/components/Header.tsx` itself — add one icon-only toggle button at the very start of the left-group `<div>` (currently line 118).

**Toggle button pattern** — follow the existing h-8 w-8 icon-only button convention seen in `Header.tsx` lines 208-226 (avatar button):
```tsx
// Insert BEFORE the <h1> inside the flex items-center div (line 118):
{repoConfig && (
  <button
    onClick={onToggleSidebar}
    aria-label="Toggle file tree sidebar"
    className="h-8 w-8 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition-colors mr-1 focus:outline-none focus:ring-1 focus:ring-blue-400"
  >
    {/* panel-left SVG — 16×16, viewBox="0 0 16 16" */}
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      {/* rectangle split: left panel filled, right outline */}
    </svg>
  </button>
)}
```

**Inline SVG icon convention** — copy pattern from `Header.tsx` lines 121-134 (the lightning bolt) and lines 250-253 (GitHub mark). All icons are hand-authored inline SVGs with `aria-hidden="true"`.

**Gating on repoConfig** — copy pattern from `Header.tsx` lines 136-140:
```tsx
{repoConfig && (
  // only render when repo is connected
)}
```

---

### `src/App.tsx` (extended)

**Analog:** `src/App.tsx` itself — add `sidebarOpen` state with localStorage init, pass to `Header` and `FileSidebar`, wire `FileSidebar` as flex sibling.

**localStorage boolean state pattern** — copy from `App.tsx` lines 25-31 (template) and `useRepoSync.ts` lines 42-55 (try/catch load):
```typescript
const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
  try {
    return localStorage.getItem('md2cv-sidebar') !== 'false'
  } catch { return true }
})
```

**Persist on change** — copy `useRepoSync.ts` lines 93-98:
```typescript
useEffect(() => {
  try {
    localStorage.setItem('md2cv-sidebar', sidebarOpen ? 'true' : 'false')
  } catch { /* ignore */ }
}, [sidebarOpen])
```

**Flex sibling insertion** — current `<main>` in `App.tsx` lines 186-198. `FileSidebar` inserts as a sibling before `<main>` inside `#app-shell`:
```tsx
<div className="h-screen bg-gray-50 flex flex-col overflow-hidden" id="app-shell">
  <Header ... onToggleSidebar={() => setSidebarOpen(o => !o)} />
  <MarginControls ... />
  <div className="flex flex-1 min-h-0"> {/* new flex row wrapper */}
    <FileSidebar open={sidebarOpen && !!repoSync.repoConfig} ... />
    <main className="flex-1 flex min-h-0">
      {isDesktop ? <SplitPane ... /> : <MobileTabs ... />}
    </main>
  </div>
</div>
```

**Mobile scrim pattern** — follow `MobileTabs.tsx` line 40 (CSS hidden/visible) and `Dialog.tsx` line 42 (`fixed inset-0 bg-black/60`) for the overlay backdrop:
```tsx
{/* Scrim: only rendered on mobile when drawer is open */}
{!isDesktop && sidebarOpen && (
  <div
    className="fixed inset-0 bg-black/40 z-30"
    aria-hidden="true"
    onClick={() => setSidebarOpen(false)}
  />
)}
```

**Dialog mounting pattern** — copy `App.tsx` lines 220-231: mount `DirtySwitchDialog` alongside `CommitDialog` and `ConflictModal` in the fragment at the bottom.

---

### `src/hooks/useRepoSync.ts` (extended — add `openFile`)

**Analog:** `src/hooks/useRepoSync.ts` `connectRepo` callback (lines 148-163) — `openFile` is the same shape: fetch file, apply content, update sync state, surface error on failure, never touch current content on failure.

**`openFile` pattern** — model after `connectRepo` lines 148-163:
```typescript
const openFile = useCallback((path: string) => {
  if (!token || !configRef.current) return
  // Caller is responsible for ensuring isDirty check / dirty-switch dialog happened first
  setPulling(true)
  ;(async () => {
    try {
      const cfg = configRef.current!
      const remote = await getFileContent(token, cfg.owner, cfg.repo, path, cfg.branch)
      // Only update content + config AFTER successful fetch (D-07: never replace on failure)
      applyRemoteContent(remote.content)
      setSyncState({ sha: remote.sha, contentSnapshot: remote.content })
      setRepoConfig(prev => prev ? { ...prev, filePath: path } : prev)
    } catch {
      setSyncError("Couldn't open file — check your connection and try again.")
      // Current file and its edits remain untouched (D-07)
    } finally {
      setPulling(false)
    }
  })()
}, [token, applyRemoteContent])
```

**Add `openFile` to `UseSyncResult` interface** — copy interface extension pattern from lines 26-40:
```typescript
export interface UseSyncResult {
  // ... existing fields ...
  openFile: (path: string) => void  // new in Phase 13
}
```

**Return value addition** — add to the return object at lines 244-258:
```typescript
return {
  // ... existing ...
  openFile,
}
```

---

### `src/lib/githubRepo.ts` (extended — add `listTreeEntries`)

**Analog:** `listMdFiles` in `src/lib/githubRepo.ts` lines 93-110 — identical endpoint (`git/trees?recursive=1`), same auth headers, same error pattern. `listTreeEntries` omits the `.md` filter and preserves `type` and `path` for all entries.

**New interface** — add alongside `GitHubMdFile` (line 14):
```typescript
export interface GitHubTreeEntry {
  type: 'blob' | 'tree'  // 'blob' = file, 'tree' = folder
  path: string
}

export interface GitHubTreeResult {
  entries: GitHubTreeEntry[]
  truncated: boolean
}
```

**`listTreeEntries` function** — copy `listMdFiles` lines 93-110, remove `.filter()`, add `truncated`:
```typescript
export async function listTreeEntries(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<GitHubTreeResult> {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`,
    { headers: authHeaders(token) },
  )
  if (!res.ok) throw new Error(`tree_fetch_failed_${res.status}`)
  const data = (await res.json()) as {
    tree: Array<{ type: string; path: string }>
    truncated?: boolean
  }
  return {
    entries: data.tree
      .filter((e) => e.type === 'blob' || e.type === 'tree')
      .map((e) => ({ type: e.type as 'blob' | 'tree', path: e.path })),
    truncated: data.truncated ?? false,
  }
}
```

**Error code convention** — copy `listMdFiles` line 106: `throw new Error(\`tree_fetch_failed_${res.status}\`)`.

**Test pattern for `listTreeEntries`** — copy `githubRepo.test.ts` `describe('listMdFiles', ...)` block (lines 118-164):
```typescript
// vi.stubGlobal('fetch', mockFetch) per test
// mock response: { tree: [...], truncated: false }
// assert: entries include both blob and tree types (not filtered)
// assert: truncated: true propagates when API returns it
// assert: throws on non-ok response
```

---

## Shared Patterns

### localStorage boolean persistence
**Source:** `src/App.tsx` lines 25-31 and `src/hooks/useRepoSync.ts` lines 93-98
**Apply to:** `src/App.tsx` (`sidebarOpen` state)
```typescript
// Init (lazy useState):
const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
  try { return localStorage.getItem('md2cv-sidebar') !== 'false' } catch { return true }
})
// Persist (useEffect):
useEffect(() => {
  try { localStorage.setItem('md2cv-sidebar', sidebarOpen ? 'true' : 'false') } catch {}
}, [sidebarOpen])
```

### Async GitHub API fetch (loading + error + cancellation)
**Source:** `src/hooks/useRepoSync.ts` lines 112-145
**Apply to:** `src/hooks/useRepoTree.ts`
```typescript
// Pattern: let cancelled = false; cleanup: () => { cancelled = true }
// Always check cancelled before setState; always finally { setPulling(false) }
let cancelled = false
;(async () => {
  try { ... } catch { if (!cancelled) setError(...) } finally { if (!cancelled) setLoading(false) }
})()
return () => { cancelled = true }
```

### Error toast (sync error)
**Source:** `src/components/Header.tsx` lines 279-293 and `src/hooks/useRepoSync.ts` line 137
**Apply to:** `src/hooks/useRepoSync.ts` (openFile error), `src/hooks/useRepoTree.ts` (tree load error surfaced via App)
```tsx
// In Header toast container — role="alert" aria-live="polite" bg-red-950 border-red-800 text-red-400
// Triggered by setting syncError string in useRepoSync
setSyncError("Couldn't open file — check your connection and try again.")
```

### Dialog wrapper usage
**Source:** `src/components/Dialog.tsx`, `src/components/ConflictModal.tsx` lines 1-29, `src/components/CommitDialog.tsx` lines 23-24
**Apply to:** `src/components/DirtySwitchDialog.tsx`
```tsx
// Pass onClose for dismissible dialogs; omit for blocking modals
// Dialog handles Escape, backdrop click, focus management, aria-modal
<Dialog open={open} title="..." onClose={onCancel}>
  {children}
</Dialog>
```

### Inline SVG icons (16×16, currentColor, aria-hidden)
**Source:** `src/components/Header.tsx` lines 121-134, 250-253, 165
**Apply to:** `src/components/FileSidebar.tsx` (refresh icon), `src/components/FileTree.tsx` (chevron, folder, file icons)
```tsx
// Always: width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"
// Folder/file icons: 14×14 per UI-SPEC, same pattern
<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
  <path d="..." />
</svg>
```

### Dark UI button convention
**Source:** `src/components/Header.tsx` lines 144-148 (template select), lines 157-167 (File button)
**Apply to:** All new button elements in `FileSidebar.tsx`, `FileTree.tsx`, `DirtySwitchDialog.tsx`
```tsx
// Standard: bg-gray-700 border-gray-600 text-white text-sm hover:bg-gray-600 transition-colors
// Icon-only: h-8 w-8 rounded flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700
// Focus ring: focus:outline-none focus:ring-1 focus:ring-blue-400
```

### useCallback with ref for stable async callbacks
**Source:** `src/hooks/useRepoSync.ts` lines 81-91 (refs) and lines 148-163 (connectRepo callback)
**Apply to:** `src/hooks/useRepoSync.ts` (openFile), `src/hooks/useRepoTree.ts` (fetchTree, toggleFolder)
```typescript
// Refs updated every render so callbacks don't stale-close over state:
const configRef = useRef(repoConfig)
configRef.current = repoConfig
// Callback reads from ref, not state:
const myCallback = useCallback(() => {
  const cfg = configRef.current  // always fresh
  ...
}, [token])  // minimal deps
```

---

## No Analog Found

All files have analogs in the codebase. No entries needed here.

---

## Metadata

**Analog search scope:** `src/components/`, `src/hooks/`, `src/lib/`
**Files scanned:** 10 source files (all components, hooks, and lib files)
**Pattern extraction date:** 2026-07-06
