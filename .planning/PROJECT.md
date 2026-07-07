# md2cv

## What This Is

md2cv is a personal single-page web application that lets you write your resume in Markdown and instantly see it rendered as a styled resume. It parses markdown structure (h1 = name, h2 = sections, h3 = entries, bullets = details) into a live preview with three switchable templates (Classic, Modern, Minimal), and exports the result as a PDF or .md file — all in the browser, no server needed. Bullet points and inline text support full markdown formatting (bold, italic, code, links) and arbitrary HTML.

## Core Value

Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.

## Current State

**Shipped:** v1.4.0 — Support GitHub repository (2026-07-06). Phases 11–13 complete. Users can sign in with GitHub via OAuth web flow, pick a repo and branch, auto-pull the open file on load, manually commit changes, see a dirty indicator, and browse the full repo directory tree in a VS Code-style sidebar.

**Next:** v1.5.0 — to be defined via `/gsd-new-milestone`.

## Requirements

### Validated

- ✓ CodeMirror markdown editor with syntax highlighting — v1.0
- ✓ Live resume preview (updates in real time as user types) — v1.0
- ✓ markdown-it parsing: h1 = name, h2 = sections, h3 = entries, bullets = details — v1.0
- ✓ Three switchable resume templates: Classic, Modern, Minimal — v1.0
- ✓ Client-side PDF export (html2pdf.js, print-quality) — v1.0
- ✓ LocalStorage auto-save with 150ms debounce (persist content between sessions) — v1.0
- ✓ Import .md file from disk into editor — v1.0
- ✓ Export current markdown as .md file (h1-derived filename) — v1.0
- ✓ Responsive layout: side-by-side on desktop, tabbed Editor/Preview on mobile — v1.0
- ✓ Draggable split pane separator with localStorage ratio persistence — v1.0
- ✓ Inline markdown styles in bullet points (bold, italic, inline code, links) rendered in preview — v1.1.0
- ✓ Full HTML rendering everywhere via `html: true` on markdown-it — v1.1.0

### Active

(None — define next milestone requirements with `/gsd-new-milestone`.)

### Validated in v1.4.0: Support GitHub repository

- ✓ GitHub OAuth web flow sign-in via Vercel serverless token-exchange function — v1.4.0
- ✓ Auth endpoint abstracted via `VITE_AUTH_ENDPOINT` — host portable to Cloudflare Worker/Next.js — v1.4.0
- ✓ Sign-out / disconnect GitHub, clearing stored token — v1.4.0
- ✓ Repo/branch picker from authenticated user's GitHub repos — v1.4.0
- ✓ Auto-pull open file from selected repo on app load — v1.4.0
- ✓ Conflict prompt (keep-local / take-remote) when local edits differ from remote — v1.4.0
- ✓ Manual commit: commit-message dialog (sensible default) + commit + push via GitHub API — v1.4.0
- ✓ Dirty indicator dot visible when open file has uncommitted changes — v1.4.0
- ✓ Toggleable VS Code-style file tree sidebar rendering repo directory structure — v1.4.0
- ✓ Clicking a .md file in the tree opens it (editor + preview swap to that file) — v1.4.0
- ✓ GitHub sync controls grouped with import/export .md; PDF export stays separate — v1.4.0

### Validated in Phase 10: unified-pixel-perfect-pdf-pipeline

- ✓ Exported PDF visually matches preview pixel-for-pixel (page size, margins, page break positions, fonts, colors) — v1.3.0
- ✓ Unified rendering path — both preview and PDF export consume the same paged.js DOM; `templateInlineStyles.ts` parallel-map workaround retired — v1.3.0

### Validated in Phase 07–09 (v1.3.0)

- ✓ Preview pane renders content inside A4-sized page rectangle(s) with visible margins — Phase 07
- ✓ Multi-page preview: content overflowing one page auto-flows onto additional page rectangles — Phase 07
- ✓ UI shows current page count ("Page X of N") that updates live as user types — Phase 07
- ✓ User can configure page margins via four numeric inputs (top/bottom/left/right); persisted to localStorage — Phase 08
- ✓ Responsive auto-fit zoom for the preview pane on desktop and mobile — Phase 09

### Validated in Phase 06: tailwind-powered-preview-rendering

- ✓ Preview applies Tailwind classes to elements by tag type (via @custom-variant scoped CSS) — v1.2.0
- ✓ Tailwind runtime support so user-authored HTML classes work in preview (Play CDN + DOMPurify with ADD_ATTR: ['class']) — v1.2.0

### Validated in Phase 05: parser-simplification-template-restructure

- ✓ Use `md.render()` for HTML output instead of token-walking parser — v1.2.0
- ✓ Template styles keyed by HTML element tag (h1, h2, h3, ul, li, code, a, etc.) — v1.2.0

### Out of Scope

- User accounts / cloud sync — personal tool, no backend needed
- Server-side rendering — 100% client-side by design
- Custom template builder — three fixed templates is sufficient for v1
- Real-time collaboration — single-user personal tool
- Sanitizing/restricting HTML — personal tool, single user, no XSS concern
- PDF export correctness for inline styles/HTML (STYLE-05, HTML-03) — dropped with Phase 5

## Context

Shipped v1.4.0 with ~3,651 LOC TS/TSX. v1.4.0 added Vercel serverless function for token exchange + OAuth hooks + GitHub API library + sync hook + tree sidebar; net codebase growth ≈2,660 LOC over v1.3.0.

**Tech stack:** Vite 5, React 18, TypeScript, Tailwind CSS v4, CodeMirror 6, markdown-it, DOMPurify, paged.js (pagination), browser-native print (PDF export), Vercel serverless function (GitHub OAuth token exchange), GitHub REST API (repo sync)

**Known technical debt:**
- Dark mode for CodeMirror editor — quick task dropped from v1.1.0, carry forward if desired.
- `PrintMount` lacks a `hasError` fallback path — paged.js render failure produces a silent blank PDF (Phase 10 WR-01). Track for follow-up.
- Bundle size: pagedjs adds ~1.3MB to the largest chunk. Revisit with `await import('pagedjs')` code-split if first-paint matters.
- Phase 8 UI-SPEC cosmetic deviations (margin strip `bg-gray-700` vs spec, UPPERCASE labels, SVG Reset) — accepted at ship.
- `useRepoSync` hook grew to ~300 lines — consider splitting into `useRepoConfig` + `useRepoActions` in a future refactor.
- Tree fetch is a full recursive call on every file open — no cache layer; acceptable for personal-tool scope.
- No offline / network-error retry in file tree — sidebar shows error state but no retry button.

## Constraints

- **Static app + one auth function**: App remains a static client-side SPA; the only server-side piece is a single token-exchange serverless function for GitHub OAuth (Vercel, portable to Cloudflare Worker/Next.js). Relaxed in v1.4.0 from "client-side only, no backend".
- **No user management**: Personal single-user tool — GitHub OAuth is for repo access only, not accounts/profiles
- **Node.js**: Project machine runs v20.11.0 — use Vite 5 (not 6+) which requires ^20.19.0

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| markdown-it for parsing | Specified by user; well-maintained, extensible | ✓ Good — token walker works cleanly |
| CodeMirror 6 for editor | Specified by user; syntax highlighting, markdown-aware | ✓ Good — controlled-ish pattern with isInternalChange ref works well |
| Client-side PDF via html2pdf.js | No server dependency; mature option | ✗ Retired in v1.3.0 — replaced with paged.js + browser print over the same DOM the preview uses |
| paged.js + browser print for PDF export (v1.3.0) | Same DOM the user sees ⇒ pixel-perfect preview/PDF parity; no canvas rasterization, no oklch crash | ✓ Good — Phase 10 ships single rendering path; `templateInlineStyles.ts` workaround retired |
| Dedicated `<PrintMount/>` for #print-area (Phase 10) | Reusing full `<Preview/>` for the off-screen print mount bled scroll-container / pill chrome into the PDF | ✓ Good — minimal mount with zero on-screen chrome avoids the bleeding-chrome bug class entirely |
| `position: fixed; visibility: hidden` cloak for #print-area (Phase 10) | `position: absolute; left: -9999px` removed the element from the print engine's flow → blank PDF | ✓ Good — element stays in real layout for paged.js measurement and reachable for print |
| LocalStorage + import/export | Best of both worlds — auto-persists and allows .md portability | ✓ Good |
| Mobile: tabbed layout | Cleaner UX than vertical stack on small screens | ✓ Good — Editor default tab is correct |
| Tailwind CSS v4 via @tailwindcss/vite | No postcss.config.js needed | ✓ Good — clean setup |
| Three templates as Tailwind class maps | Simpler than separate component files | ✓ Good — but ExportTarget needs parallel inline-style map |
| Vite 5 (not latest) | Node.js v20.11.0 engine constraint | ✓ Correct — stable LTS-track version |
| html: true on MarkdownIt | Enable inline HTML and proper inline style rendering | ✓ Good — XSS accepted (personal tool) |
| md.renderInline() for bullet details | Converts inline markdown to HTML without wrapping `<p>` tags | ✓ Good — clean output for list items |
| dangerouslySetInnerHTML for detail `<li>` | Consistent with existing `extra` field pattern in Preview/ExportTarget | ✓ Good |
| md.render() replaces token-walker (v1.2.0) | Dramatically simpler pipeline; HTML string as the single data format eliminates ResumeData type | ✓ Good — parseResume.ts went from ~120 to 5 lines |
| Tailwind v4 `@custom-variant` for theme CSS (v1.2.0) | Discovered during build as valid alternative to `@layer base`; scopes element styles to `.theme-{template}` container | ✓ Good — production verified |
| Play CDN for runtime Tailwind (v1.2.0) | Enables arbitrary user-authored utility classes without build-time scanning | ✓ Good — required for user-authored HTML classes |
| DOMPurify `ADD_ATTR: ['class']` (v1.2.0) | Required to let user class attributes survive sanitization before CDN resolves them | ✓ Good — PREV-03 blocker fix |
| Vercel serverless function for token exchange (v1.4.0) | Keeps `GITHUB_CLIENT_SECRET` out of browser bundle; `VITE_AUTH_ENDPOINT` satisfies AUTH-02 portability | ✓ Good — clean zero-dependency function |
| `useRepoSync` single hook for all sync state (v1.4.0) | One hook owns config + dirty flag + conflict + commit; avoids split state across components | ✓ Good — clear API, but hook is ~300 lines |
| `buildFileTree` folders-first alphabetical ordering (v1.4.0) | VS Code UX convention; handles GitHub's flat tree array + implied intermediate folders | ✓ Good — resilient to deep repos |
| `DirtySwitchDialog` interception at navigation time (v1.4.0) | Prevents accidental content loss; checked on file-click before switching, not at commit time | ✓ Good — correct UX pattern |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-07-07 after v1.4.0 milestone*
