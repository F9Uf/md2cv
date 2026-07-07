# Phase 11: GitHub Auth Foundation - Context

**Gathered:** 2026-07-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can sign in with GitHub via the OAuth web flow (token exchange through a Vercel serverless function), see their GitHub identity in the header, and sign out — clearing the stored token. The token-exchange endpoint URL comes from config so the host can move without app-code changes. This lays the auth groundwork for repo sync (Phase 12) and the file tree (Phase 13). Requirements: AUTH-01, AUTH-02, AUTH-03.

Locked upstream (REQUIREMENTS.md / PROJECT.md — not revisited here):
- OAuth **web flow** — Device Flow and PAT auth explicitly out of scope
- Token exchange via **Vercel serverless function**, portable to Cloudflare Worker / Next.js later
- App remains a static SPA; the auth function is the only server-side piece
- No user management — OAuth is for repo access only

</domain>

<decisions>
## Implementation Decisions

### OAuth Flow UX
- **D-01:** Full-page redirect flow (not popup). Editor content survives via existing localStorage autosave.
- **D-02:** GitHub redirects back to the app **root URL** with `?code&state`. App detects the params on load, exchanges the token, then cleans the URL via `history.replaceState`. No router added.
- **D-03:** Token exchange is non-blocking — app loads normally; the sign-in button area shows a spinner until identity appears.
- **D-04:** On auth failure (user denies, exchange error, bad `state`): dismissible toast/inline error near the sign-in button; app stays fully usable signed out; retry = click sign-in again.

### Token Storage
- **D-05:** Token stored in **localStorage** — persists across sessions, consistent with all existing app state (`md2cv-content`, `md2cv-template`, `md2cv-margins`). XSS exposure already accepted for this personal tool. (User initially chose sessionStorage, switched after weighing per-session re-auth friction against Phase 12's auto-pull-on-open.)
- **D-06:** Validate token on app load — the identity fetch (GET /user) doubles as validation. A 401 clears the token and returns the app to signed-out state; no separate validation request.

### Signed-in Identity UI
- **D-07:** Header shows **avatar only** after sign-in (compact — the 48px toolbar is already full and Phase 12 adds repo/branch UI). Username lives inside the dropdown.
- **D-08:** Clicking the avatar opens a **dropdown menu** with the username and a "Sign out" item. Design the dropdown so Phase 12 can slot repo/branch info into the same menu.
- **D-09:** Signed-out state: a **"Sign in with GitHub" button with the GitHub mark icon**, styled like the existing gray toolbar buttons (e.g., Import MD).

### Serverless Function & Scopes
- **D-10:** Function lives in **this repo's `api/` folder** — Vercel auto-deploys `api/*.ts` alongside the static app; one repo, one deploy. Endpoint URL still config-driven (AUTH-02) so it stays portable.
- **D-11:** Request the **`repo`** OAuth scope — read/write to private and public repos; required for Phase 12 commits to a (likely private) resume repo.
- **D-12:** Endpoint URL supplied via **Vite env var** (`VITE_AUTH_ENDPOINT` or similar) read from `import.meta.env` — set in `.env` locally and Vercel project settings; host changes need env change + rebuild, no source edits.
- **D-13:** Function does **code→token exchange only** — receives the code, POSTs to GitHub with the client secret, returns the access token. All other GitHub API calls (including identity fetch) happen client-side with the token.

### Claude's Discretion
- Exact error-message wording and toast implementation
- CSRF `state` parameter generation/verification details
- localStorage key naming (follow the existing `md2cv-*` convention)
- Dropdown menu styling details (match existing dark header aesthetic)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & scope
- `.planning/REQUIREMENTS.md` — AUTH-01/02/03 definitions; Out of Scope table (Device Flow, PAT ruled out with reasons)
- `.planning/ROADMAP.md` — Phase 11 success criteria (4 observable outcomes)
- `.planning/PROJECT.md` — v1.4.0 constraints ("Static app + one auth function", Node v20.11.0 / Vite 5 pin)

No external specs/ADRs exist — implementation decisions fully captured above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/Header.tsx` — the toolbar; sign-in button / avatar dropdown mounts here. Existing gray button style (`h-8 px-3 rounded bg-gray-700 ...`) is the template for the sign-in button.
- localStorage init pattern in `src/App.tsx` (lazy `useState` initializer with try/catch) — reuse for token persistence.
- `src/hooks/` — custom hook convention (`useMediaQuery`, `useSplitPane`); a `useGitHubAuth` hook would fit.

### Established Patterns
- No router, no state library — plain React state lifted to `App.tsx`, props down. Auth state should follow (callback param parsing on load, no route added).
- localStorage keys prefixed `md2cv-` (`md2cv-content`, `md2cv-template`, `md2cv-margins`).
- No `api/` directory or `.env` files exist yet — both are new in this phase. Vercel deployment assumed (function + static app in one project).

### Integration Points
- `Header.tsx` props interface extends with auth state + handlers from `App.tsx`.
- App boot in `App.tsx` (or a hook it calls) handles `?code&state` detection, exchange, URL cleanup, and token validation.
- Phase 12 will consume the token for repo listing/commits — expose it cleanly (hook or module), not buried in component state.

</code_context>

<specifics>
## Specific Ideas

- The avatar dropdown is deliberately the future home for Phase 12 repo/branch info — design it as a menu that can grow, not a bare sign-out button.

</specifics>

<deferred>
## Deferred Ideas

- **Repo/branch name display in header/dropdown** — Phase 12 scope (SYNC-01, TOOL-01). Phase 11's dropdown is designed to accommodate it.

</deferred>

---

*Phase: 11-github-auth-foundation*
*Context gathered: 2026-07-05*
