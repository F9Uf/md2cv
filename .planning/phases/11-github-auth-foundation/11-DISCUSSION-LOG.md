# Phase 11: GitHub Auth Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-07-05
**Phase:** 11-github-auth-foundation
**Areas discussed:** OAuth flow UX, Token storage, Signed-in identity UI, Serverless fn & scopes

---

## OAuth flow UX

| Option | Description | Selected |
|--------|-------------|----------|
| Full-page redirect | Navigate to GitHub and back with ?code; no popup blockers, works on mobile | ✓ |
| Popup window | App stays loaded; popup blockers + cross-window messaging complexity | |

| Option | Description | Selected |
|--------|-------------|----------|
| Root URL + clean up | Detect ?code&state on load, exchange, history.replaceState — no router | ✓ |
| Dedicated /callback path | Requires adding routing to a router-less SPA | |

| Option | Description | Selected |
|--------|-------------|----------|
| Non-blocking button spinner | App loads normally; sign-in area shows spinner until identity appears | ✓ |
| Full-screen loading state | Splash/overlay until auth completes | |

| Option | Description | Selected |
|--------|-------------|----------|
| Toast/inline error, stay signed out | Dismissible error near sign-in button; retry by clicking again | ✓ |
| Silent fail | Return to signed-out state with no message | |
| You decide | Claude picks during planning | |

---

## Token storage

| Option | Description | Selected |
|--------|-------------|----------|
| localStorage | Persists across sessions; consistent with existing app state | ✓ (final) |
| sessionStorage | Survives reloads, not tab close — re-auth each session | (initial pick) |
| Memory only | Re-auth every page load | |

**Notes:** User first chose sessionStorage. After a follow-up on the trade-off (per-session re-auth click vs Phase 12 auto-pull-on-open), user switched to localStorage. The "soften it" alternatives (per-session click acceptable / auto-redirect restore) were declined in favor of localStorage.

| Option | Description | Selected |
|--------|-------------|----------|
| Validate on load, auto sign-out if dead | Identity fetch doubles as validation; 401 clears token | ✓ |
| Assume valid until an API call fails | Handle 401s wherever they occur | |
| You decide | Claude picks during planning | |

---

## Signed-in identity UI

**Clarification raised by user:** Should repo/branch name display be part of this question? → Resolved: repo/branch display is Phase 12 scope (SYNC-01, TOOL-01); Phase 11's identity UI should only leave room for it. Noted as deferred idea.

| Option | Description | Selected |
|--------|-------------|----------|
| Avatar only | Compact; username lives in dropdown; leaves toolbar room for Phase 12 | ✓ |
| Avatar + username | More explicit, costs toolbar width | |
| Username only | Text login name, no image | |

| Option | Description | Selected |
|--------|-------------|----------|
| Click avatar → dropdown menu | Menu with username + Sign out; Phase 12 can extend it | ✓ |
| Separate sign-out button | Permanent toolbar space for a rare action | |

| Option | Description | Selected |
|--------|-------------|----------|
| "Sign in with GitHub" button + icon | Matches existing gray toolbar button style | ✓ |
| GitHub icon only | Minimal but less obvious | |
| You decide | Claude picks during planning | |

---

## Serverless fn & scopes

| Option | Description | Selected |
|--------|-------------|----------|
| Same repo, api/ folder | Vercel auto-deploys api/*.ts alongside the static app | ✓ |
| Separate repo/project | Independent deploy for ~50 lines of code | |

| Option | Description | Selected |
|--------|-------------|----------|
| repo scope | Read/write private + public repos; needed for Phase 12 commits | ✓ |
| public_repo | Public repos only; breaks Phase 12 if resume repo is private | |

| Option | Description | Selected |
|--------|-------------|----------|
| Vite env var | VITE_AUTH_ENDPOINT via import.meta.env; env change + rebuild to move hosts | ✓ |
| Runtime config file | Fetched at startup; changeable without rebuild | |

| Option | Description | Selected |
|--------|-------------|----------|
| Exchange only | Code→token exchange; all other GitHub calls client-side | ✓ |
| Also proxy identity fetch | Token + profile in one round trip | |
| You decide | Claude picks during planning | |

---

## Claude's Discretion

- Error-message wording and toast implementation
- CSRF `state` generation/verification details
- localStorage key naming (follow `md2cv-*` convention)
- Dropdown styling details

## Deferred Ideas

- Repo/branch name display in header/dropdown — Phase 12 scope; Phase 11 dropdown designed to accommodate it
