---
phase: 11-github-auth-foundation
reviewed: 2026-07-05T00:00:00Z
depth: standard
files_reviewed: 9
files_reviewed_list:
  - api/github-auth.ts
  - src/App.tsx
  - src/components/Header.tsx
  - src/hooks/useGitHubAuth.ts
  - src/lib/githubAuth.test.ts
  - src/lib/githubAuth.ts
  - src/vite-env.d.ts
  - .env.example
  - .gitignore
findings:
  critical: 0
  warning: 3
  info: 3
  total: 6
status: issues_found
---

# Phase 11: Code Review Report

**Reviewed:** 2026-07-05
**Depth:** standard
**Files Reviewed:** 9
**Status:** issues_found

## Summary

This phase adds a complete GitHub OAuth web-flow: a Vercel serverless function for server-side code-to-token exchange, a pure helper library with unit tests, a React hook orchestrating state and persistence, and auth UI in the Header.

The high-priority security properties hold: the client secret lives only in server-side environment variables (`GITHUB_CLIENT_SECRET`, not `VITE_`-prefixed), no `dangerouslySetInnerHTML` is used on any user-controlled data, user-provided strings are rendered as React text nodes (auto-escaped), and the OAuth `code` is exchanged server-side before any token reaches the browser. The `.gitignore` correctly excludes real env files while keeping `.env.example`.

Three warnings require fixes before shipping: a CSRF state-mismatch error that silently disappears when the user is already signed in, an unguarded `JSON.parse` that can crash the serverless function, and env vars typed as non-optional in `vite-env.d.ts` which masks missing-configuration bugs at compile time. Three info items are lower priority.

---

## Warnings

### WR-01: CSRF State-Mismatch Error Silently Swallowed When User Is Already Signed In

**File:** `src/hooks/useGitHubAuth.ts:68-87`

**Issue:** When the OAuth callback arrives with a state that does not match the stored session value, `setError(ERR_FAILED)` is called on line 69 to alert the user of a potential CSRF attempt. However, because `activeToken` is loaded from localStorage before the state check (line 58), control immediately falls through to the `if (activeToken)` block (line 83). If the stored token is valid, `fetchGitHubUser` succeeds and calls `setError(null)` (line 87), erasing the CSRF error before the user ever sees it. The security intent of the state check is completely defeated for any user who is already signed in.

**Fix:** Set `activeToken = null` in the state-mismatch branch so the subsequent user-fetch block is skipped and the error remains visible:

```typescript
if (!expected || expected !== state) {
  if (!cancelled) setError(ERR_FAILED)
  activeToken = null  // prevent the user-fetch from clearing this error
} else {
  // ...exchange code...
}
```

---

### WR-02: Unguarded `JSON.parse` Crashes the Serverless Function on Malformed Body

**File:** `api/github-auth.ts:21`

**Issue:** When `req.body` is a string, it is passed directly to `JSON.parse`. If the body is malformed JSON (empty string, truncated payload, or garbage), `JSON.parse` throws a `SyntaxError` that is not caught anywhere in the function, causing an unhandled exception. The Vercel runtime will return a 500 with an opaque error body rather than the structured `{ error: '...' }` responses used everywhere else.

**Fix:** Wrap the parse in a try/catch and return 400 on failure:

```typescript
let body: { code?: unknown } | undefined
try {
  body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
} catch {
  res.status(400).json({ error: 'invalid_json' }); return
}
const code = typeof body?.code === 'string' ? body.code : undefined
```

The type narrowing to `string` also prevents a non-string `code` value from being forwarded to GitHub verbatim.

---

### WR-03: Env Vars Typed as Non-Optional Hides Missing-Configuration Bugs

**File:** `src/vite-env.d.ts:4-5`

**Issue:** `VITE_AUTH_ENDPOINT` and `VITE_GITHUB_CLIENT_ID` are declared as `string`. In Vite, if a `VITE_*` variable is absent from the env file, `import.meta.env.VITE_X` is `undefined` at runtime, not `""`. The `string` type declaration lies to TypeScript and suppresses the undefined-check that would catch a misconfigured deployment at compile time. Notably, `exchangeCodeForToken(code, import.meta.env.VITE_AUTH_ENDPOINT)` would silently call `fetch(undefined, ...)`, and `buildAuthorizeUrl(import.meta.env.VITE_GITHUB_CLIENT_ID, ...)` would embed `"undefined"` as the `client_id`.

**Fix:** Declare both as `string | undefined` and add runtime guards at the call sites:

```typescript
// vite-env.d.ts
interface ImportMetaEnv {
  readonly VITE_AUTH_ENDPOINT: string | undefined
  readonly VITE_GITHUB_CLIENT_ID: string | undefined
}
```

```typescript
// useGitHubAuth.ts — signIn guard
const signIn = useCallback(() => {
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
  const endpoint = import.meta.env.VITE_AUTH_ENDPOINT
  if (!clientId || !endpoint) {
    setError('App is misconfigured. Contact the site owner.')
    return
  }
  // ...
}, [])
```

---

## Info

### IN-01: CORS Wildcard Allows Any Origin to Call the Token Exchange Endpoint

**File:** `api/github-auth.ts:14`

**Issue:** `Access-Control-Allow-Origin: *` permits any website to POST to the token exchange endpoint. OAuth codes are single-use and redirect-URI-bound on GitHub's side, so practical exploitation requires obtaining a code first (which requires user interaction). The risk is low for a personal tool, but the intent is that only the app's own origin should talk to this endpoint.

**Fix:** Restrict to the production origin (can be an env var):

```typescript
const allowedOrigin = process.env.APP_ORIGIN || 'https://your-app.vercel.app'
res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
```

---

### IN-02: Raw GitHub Error String Forwarded to the Client

**File:** `api/github-auth.ts:42`

**Issue:** `res.status(502).json({ error: data.error || 'exchange_failed' })` forwards GitHub's error identifier (e.g., `bad_verification_code`, `redirect_uri_mismatch`, `incorrect_client_credentials`) directly to the browser. None of these strings are secrets, but they expose implementation details about the OAuth configuration. The comment on line 44 notes "Never echo… the raw GitHub response" — this line contradicts that intent.

**Fix:** Map to a fixed opaque string:

```typescript
if (data.error || !data.access_token) {
  res.status(502).json({ error: 'exchange_failed' }); return
}
```

---

### IN-03: `token` Field Unnecessary in Public Auth State

**File:** `src/hooks/useGitHubAuth.ts:119`, `src/components/Header.tsx:11`

**Issue:** The raw OAuth token is included in `GitHubAuthState` and flows down the prop tree from `App` through `Header`. `Header` never uses the token directly. Exposing it in the component tree increases the surface area for accidental logging, serialization, or misuse in future components that destructure `authState`.

**Fix:** Remove `token` from `GitHubAuthState` (keep it as private hook state). Provide only `user`, `loading`, `error`, and the action callbacks in the public interface. If a downstream feature needs the token (e.g., a Gist API call), pass it via a dedicated hook or context rather than through generic auth state.

---

_Reviewed: 2026-07-05_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
