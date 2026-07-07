# Phase 11: GitHub Auth Foundation - Pattern Map

**Mapped:** 2026-07-05
**Files analyzed:** 6 (3 new, 3 modified)
**Analogs found:** 5 / 6

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/hooks/useGitHubAuth.ts` | hook | request-response | `src/hooks/useSplitPane.ts` + `src/hooks/usePagedjsPreview.ts` | role-match (composite) |
| `src/components/Header.tsx` | component | request-response | `src/components/Header.tsx` (self — modify) | exact |
| `src/App.tsx` | component | request-response | `src/App.tsx` (self — modify) | exact |
| `api/github-auth.ts` | service | request-response | none | no analog |
| `src/vite-env.d.ts` | config | N/A | `src/vite-env.d.ts` (self — modify) | exact |
| `.env.example` | config | N/A | none | no analog |

---

## Pattern Assignments

### `src/hooks/useGitHubAuth.ts` (hook, request-response)

**Primary analog:** `src/hooks/useSplitPane.ts`
**Secondary analog:** `src/hooks/usePagedjsPreview.ts`

**Hook structure + localStorage key constant pattern** (`src/hooks/useSplitPane.ts` lines 1-17):
```typescript
import { useState, useCallback, useRef, useEffect } from 'react'

const STORAGE_KEY = 'md2cv-split-ratio'
const DEFAULT_RATIO = 0.5

function loadRatio(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      const val = parseFloat(stored)
      if (!isNaN(val) && val >= MIN_RATIO && val <= MAX_RATIO) return val
    }
  } catch { /* localStorage unavailable */ }
  return DEFAULT_RATIO
}

export function useSplitPane() {
  const [ratio, setRatio] = useState(loadRatio)
```

- Apply: define `const STORAGE_KEY = 'md2cv-github-token'` at module top; use a `loadToken()` helper for the lazy `useState` initializer so the pattern stays consistent with `useSplitPane`.

**localStorage persist + useEffect** (`src/hooks/useSplitPane.ts` lines 24-29):
```typescript
useEffect(() => {
  try {
    localStorage.setItem(STORAGE_KEY, ratio.toString())
  } catch { /* localStorage unavailable */ }
}, [ratio])
```

- Apply: persist token to localStorage whenever auth state changes; clear the key on sign-out.

**Async operation + loading/error state** (`src/hooks/usePagedjsPreview.ts` lines 36-37, 55-56, 113-119):
```typescript
const [pageCount, setPageCount] = useState<number | null>(null)
const [hasError, setHasError] = useState(false)
// ...
setHasError(false)
// ...
} catch (err) {
  console.error(errorLogPrefix ?? 'paged.js render failed', err)
  if (!cancelled) setHasError(true)
}
```

- Apply: `useState` for `{ token, user, loading, error }`. Set `loading: true` while exchange or validation fetch is in flight; set `error` string on failure; clear both on success.

**Cancellation pattern for async effects** (`src/hooks/usePagedjsPreview.ts` lines 61-71):
```typescript
let cancelled = false
// ...
;(async () => {
  await Promise.resolve()  // yield so cleanup can fire before async work
  if (cancelled) return
  try {
    // ... async work ...
  } catch (err) {
    if (!cancelled) setHasError(true)
  }
})()

return () => {
  cancelled = true
```

- Apply: in the `useEffect` that runs on mount to detect `?code&state` and exchange the token, use the `cancelled` flag so stale async continuations do not mutate state after unmount.

**Named export with TypeScript return type** (`src/hooks/usePagedjsPreview.ts` lines 20-25):
```typescript
export interface UsePagedjsPreviewResult {
  pageCount: number | null
  hasError: boolean
}

export function usePagedjsPreview({ ... }: UsePagedjsPreviewArgs): UsePagedjsPreviewResult {
```

- Apply: export a `GitHubAuthState` interface and a `UseGitHubAuthResult` interface; return both from `useGitHubAuth`.

---

### `src/components/Header.tsx` (component, request-response — modify)

**Analog:** `src/components/Header.tsx` (self)

**Existing props interface pattern** (`src/components/Header.tsx` lines 3-9):
```typescript
interface HeaderProps {
  selectedTemplate: TemplateName
  onTemplateChange: (template: TemplateName) => void
  onDownloadMd: () => void
  onExportPdf: () => void
  onImportMd: () => void
}
```

- Apply: extend this interface with auth props:
  ```typescript
  authState: GitHubAuthState        // token, user, loading, error from useGitHubAuth
  onSignIn: () => void
  onSignOut: () => void
  onDismissAuthError: () => void
  ```

**Existing gray button pattern** (`src/components/Header.tsx` lines 27-33):
```typescript
<button
  onClick={onImportMd}
  className="h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"
  aria-label="Import markdown file"
>
  Import MD
</button>
```

- Apply verbatim for the "Sign in with GitHub" button: same `h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600` classes. Add `flex items-center gap-1` for icon alignment. The blue Export PDF button (`bg-blue-600 border-blue-500 hover:bg-blue-500`) remains the only primary-color button.

**Header controls container** (`src/components/Header.tsx` lines 15-16):
```typescript
<div className="flex items-center gap-2">
```

- The sign-in button / avatar element is appended as the last child of this `div` (after "Export PDF"). This preserves the existing right-to-left reading order of controls.

**Full header structural shell** (`src/components/Header.tsx` lines 13-14):
```typescript
<header className="h-12 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0">
  <h1 className="text-lg font-bold tracking-tight">md2cv</h1>
```

- The `h-12` header height is locked (UI-SPEC). The avatar dropdown must use `absolute right-0 top-full mt-1` positioning relative to a `relative`-wrapped avatar button container so it does not expand the header.

---

### `src/App.tsx` (component, request-response — modify)

**Analog:** `src/App.tsx` (self)

**localStorage lazy initializer pattern** (`src/App.tsx` lines 19-25):
```typescript
const [selectedTemplate, setSelectedTemplate] = useState<TemplateName>(() => {
  try {
    const stored = localStorage.getItem('md2cv-template')
    if (stored === 'classic' || stored === 'modern' || stored === 'minimal') return stored
  } catch { /* ignore */ }
  return 'classic'
})
```

- Apply: `useGitHubAuth` hook encapsulates equivalent logic for the token, so App.tsx does not need a raw `localStorage.getItem` for auth — just call the hook and destructure state + handlers.

**Props-down wiring pattern** (`src/App.tsx` lines 143-150):
```typescript
<Header
  selectedTemplate={selectedTemplate}
  onTemplateChange={handleTemplateChange}
  onDownloadMd={handleDownloadMd}
  onExportPdf={handleExportPdf}
  onImportMd={handleImportMd}
/>
```

- Apply: add `authState`, `onSignIn`, `onSignOut`, `onDismissAuthError` to the `<Header />` JSX — pass from `useGitHubAuth` directly.

**useCallback handler pattern** (`src/App.tsx` lines 99-102):
```typescript
const handleImportMd = useCallback(() => {
  fileInputRef.current?.click()
}, [])
```

- The auth sign-in and sign-out functions are stable callbacks returned by `useGitHubAuth`; App.tsx passes them through without wrapping in an additional `useCallback`.

**useEffect cleanup** (`src/App.tsx` lines 133-135):
```typescript
useEffect(() => {
  return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
}, [])
```

- `useGitHubAuth` owns its own cleanup via its internal `useEffect` return value; App.tsx does not need to handle auth cleanup directly.

---

### `api/github-auth.ts` (service, request-response — new)

**Analog:** none — no `api/` directory exists in the codebase.

Use Vercel serverless function conventions (Node.js 20 runtime per PROJECT.md):
- Export a default async function receiving `(req, res)` typed as Vercel's `VercelRequest` / `VercelResponse`.
- Function does only code→token exchange (CONTEXT.md D-13): receive `{ code }` in request body, POST to `https://github.com/login/oauth/access_token` with `client_id`, `client_secret`, `code`, return `{ access_token }`.
- Read `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` from `process.env` (server-side, never exposed to client).
- CORS: respond with `Access-Control-Allow-Origin: *` (or restrict to the deploy URL) and handle `OPTIONS` preflight.
- No external npm dependencies in `api/` — use the global `fetch` available in Node 20.

There is no existing analog to copy from. Reference RESEARCH.md for the Vercel function signature.

---

### `src/vite-env.d.ts` (config — modify)

**Analog:** `src/vite-env.d.ts` (self)

**Existing file** (`src/vite-env.d.ts` line 1):
```typescript
/// <reference types="vite/client" />
```

- Apply: add an `ImportMetaEnv` interface augmentation to declare `VITE_AUTH_ENDPOINT` as a required string:
```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AUTH_ENDPOINT: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

This gives TypeScript-safe access to `import.meta.env.VITE_AUTH_ENDPOINT` in `useGitHubAuth.ts`.

---

### `.env.example` (config — new)

**Analog:** none — no env files exist.

Minimal content:
```
# GitHub OAuth App credentials (server-side — never commit actual values)
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Vercel serverless function endpoint (client-side — safe to expose)
VITE_AUTH_ENDPOINT=http://localhost:3000/api/github-auth
```

Convention: `VITE_*` prefix exposes vars to the browser via `import.meta.env`; unprefixed vars are server-only (Vercel function env). Follows Vite 5 convention (PROJECT.md stack pin).

---

## Shared Patterns

### localStorage key naming
**Source:** `src/hooks/useSplitPane.ts` line 3; `src/App.tsx` lines 21, 30, 38
**Apply to:** `useGitHubAuth.ts`
```typescript
// All keys use the md2cv- prefix
const STORAGE_KEY = 'md2cv-split-ratio'    // useSplitPane.ts
localStorage.getItem('md2cv-template')      // App.tsx
localStorage.getItem('md2cv-content')       // App.tsx
localStorage.getItem('md2cv-margins')       // App.tsx
```
New key for Phase 11: `'md2cv-github-token'`.

### try/catch localStorage access
**Source:** `src/App.tsx` lines 19-25; `src/hooks/useSplitPane.ts` lines 9-16
**Apply to:** `useGitHubAuth.ts`
```typescript
try {
  const stored = localStorage.getItem('md2cv-template')
  if (stored === 'classic' || stored === 'modern' || stored === 'minimal') return stored
} catch { /* ignore */ }
return 'classic'
```
Every localStorage read and write is wrapped in `try/catch` with a silent `/* ignore */` comment. No error logging for storage failures.

### Gray button class string
**Source:** `src/components/Header.tsx` lines 28-30
**Apply to:** Sign-in button in `Header.tsx`, dropdown items
```typescript
className="h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"
```
This is the canonical non-primary button class. UI-SPEC mandates all auth UI uses this style to avoid competing with the blue PDF export button.

### TypeScript interface for component props
**Source:** `src/components/Header.tsx` lines 3-9; `src/hooks/usePagedjsPreview.ts` lines 7-18
**Apply to:** Extended `HeaderProps`, `GitHubAuthState`, `UseGitHubAuthResult`
```typescript
interface HeaderProps {
  selectedTemplate: TemplateName
  // ...
}

export default function Header({ selectedTemplate, ... }: HeaderProps) {
```
All component props and hook return types use named interfaces at the top of the file. Destructure in the function signature.

### useEffect with boolean cancellation flag
**Source:** `src/hooks/usePagedjsPreview.ts` lines 61-123
**Apply to:** `useGitHubAuth.ts` (OAuth callback detection effect on mount)
```typescript
let cancelled = false
;(async () => {
  await Promise.resolve()
  if (cancelled) return
  try { /* async work */ }
  catch (err) { if (!cancelled) setHasError(true) }
})()
return () => { cancelled = true }
```
Use this pattern in the `useEffect` that runs once on mount to detect `?code&state` query params and call the token exchange endpoint.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `api/github-auth.ts` | service | request-response | No `api/` directory or serverless functions exist in the codebase |
| `.env.example` | config | N/A | No environment variable files exist in the codebase |

---

## Metadata

**Analog search scope:** `src/hooks/`, `src/components/`, `src/App.tsx`, `src/lib/`, project root
**Files scanned:** 10
**Pattern extraction date:** 2026-07-05
