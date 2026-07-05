---
phase: 11-github-auth-foundation
plan: "04"
subsystem: auth-ui
tags: [auth, header, ui, react, github-oauth]
dependency_graph:
  requires: ["11-03"]
  provides: ["auth-ui-surface"]
  affects: ["src/components/Header.tsx", "src/App.tsx"]
tech_stack:
  added: []
  patterns: ["conditional-render-auth-states", "dropdown-outside-click-escape", "avatar-img-fallback"]
key_files:
  modified:
    - src/components/Header.tsx
    - src/App.tsx
decisions:
  - "Auth UI appended as last child of header control row per PATTERNS positioning"
  - "Error toast fixed outside header flow so h-12 header height stays locked"
  - "imgFailed state resets on user login change via useEffect dependency on authState.user.login"
  - "No extra useCallback on auth handlers — useGitHubAuth already returns stable callbacks"
metrics:
  duration: "~3 minutes"
  completed: "2026-07-05"
  tasks_completed: 2
  files_modified: 2
---

# Phase 11 Plan 04: Auth UI Header Integration Summary

Auth UI rendered inside the existing h-12 header — five states (signed-out, loading, signed-in, dropdown, error toast) wired from useGitHubAuth hook in App.tsx.

## What Was Built

**Task 1 — Header.tsx auth UI (5 states)**
- Extended `HeaderProps` with `authState: GitHubAuthState`, `onSignIn`, `onSignOut`, `onDismissError`
- Signed-out: "Sign in with GitHub" gray button with inline GitHub octocat SVG mark
- Loading: disabled spinner button (`animate-spin`, `aria-busy="true"`) during OAuth exchange
- Signed-in: circular avatar button (`h-8 w-8 rounded-full`) with `onError` fallback to login initial
- Dropdown: `absolute right-0 top-full` panel with `role="menu"`, username label, sign-out menuitem
- Outside-click (`mousedown`) and Escape key close the dropdown via `useEffect` with cleanup
- Error toast: `fixed top-12 right-4 z-50 role="alert" aria-live="polite"` floats below header
- Header height `h-12` unchanged; no blue on sign-in or avatar (only avatar focus ring uses blue)
- Return wrapped in `<>` fragment so toast is sibling of `<header>` and doesn't expand it

**Task 2 — App.tsx wiring**
- Added `import { useGitHubAuth } from './hooks/useGitHubAuth'`
- Called `const auth = useGitHubAuth()` after `useMediaQuery` hook
- Passed `authState={auth}`, `onSignIn={auth.signIn}`, `onSignOut={auth.signOut}`, `onDismissError={auth.dismissError}` to `<Header />`

## Verification

```
npx tsc -b --force  →  (no output = clean)
UIOK  →  Sign in with GitHub, Signing in..., Sign out present
WIREOK  →  useGitHubAuth() and authState={auth} present in App.tsx
ALLOK  →  avatar_url, dropdown classes, toast classes, Escape/mousedown/keydown listeners present
```

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1    | 6a44d9f | feat(11-04): add auth UI to Header.tsx (5 states) |
| 2    | e69a08c | feat(11-04): wire useGitHubAuth into App.tsx |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — auth UI renders live data from `useGitHubAuth` hook (token/user from localStorage + GitHub API).

## Threat Surface Scan

No new network endpoints, auth paths, or schema changes beyond what the plan's threat model covers. T-11-13 mitigated: username rendered as React text child (auto-escaped); avatar set via `src` attribute only, no `dangerouslySetInnerHTML`. T-11-15 mitigated: sign-out is explicit `role="menuitem"` action.

## Self-Check: PASSED

- `src/components/Header.tsx` exists and contains all required strings
- `src/App.tsx` exists and contains `useGitHubAuth()` and `authState={auth}`
- Commits 6a44d9f and e69a08c exist in git log
