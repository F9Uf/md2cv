# Milestones

## v1.4.0 Support GitHub repository (Shipped: 2026-07-06)

**Phases completed:** 3 phases, 18 plans (Phases 11–13)
**Git range:** `f2ed31f` (chore(11-01): add .env.example) → `f116966` (docs(13): add code review fix report)
**Timeline:** 2026-07-05 → 2026-07-06 (~2 days; 99 commits)
**Codebase:** ~3,651 LOC TS/TSX

**Key accomplishments:**

- GitHub OAuth web flow via Vercel serverless function — `api/github-auth.ts` exchanges codes for tokens server-side; `VITE_AUTH_ENDPOINT` env var abstracts the exchange host (AUTH-01, AUTH-02, AUTH-03)
- `useGitHubAuth` hook + 5-state header auth UI — signed-out/loading/signed-in (avatar+dropdown)/error/dismissible-error with GitHub Octocat icon and sign-out flow (Phase 11)
- GitHub repo API library (`githubRepo.ts`, 5 async functions) + `useRepoSync` hook — auto-pull on load, keep-local/take-remote ConflictModal, manual commit+push via GitHub API, dirty indicator dot (SYNC-01..05)
- Repo/branch/file PickerDialog + CommitDialog (pre-filled message) + toolbar regrouping — GitHub sync controls grouped with import/export .md; PDF export stays separate (TOOL-01, Phase 12)
- VS Code-style file tree sidebar — `buildFileTree` nested folders-first structure, `FileSidebar` panel with loading/empty/error states, `DirtySwitchDialog` for safe file switching, auto-expand ancestor folders on active file change (TREE-01..04, Phase 13)

**Known deferred items at close: 8 (all carry-overs from v1.3.0 close — see STATE.md Deferred Items)**

---

## v1.3.0 Support preview with realistic page (Shipped: 2026-05-21)

**Phases completed:** 4 phases, 10 plans, 18 tasks (Phases 7–10)
**Git range:** `fc2ba3c` (chore(07-01): install pagedjs) → `d4354fa` (fix(quick-260521-m56): keep zoom across reflows)
**Timeline:** 2026-05-17 → 2026-05-21 (~4 days; 93 commits since v1.2.0)
**Codebase:** ~990 LOC TS/TSX (1,184 LOC with CSS)

**Key accomplishments:**

- paged.js `Previewer` integrated in Preview.tsx — preview renders as one or more A4 page rectangles (210×297mm) with auto multi-page flow and a live "Page X of N" pill (Phase 7, PREV-01/02/03)
- Four-input MarginControls strip (top/bottom/left/right, 0–50mm clamped) with localStorage persistence under `md2cv-margins`; margin changes inject a dynamic `@page` rule and trigger paged.js reflow (Phase 8, MARG-01/02/03)
- ResizeObserver-driven CSS-`zoom` auto-fit — preview scales down to pane width on desktop and `zoom: 0.5` on mobile (≤767px); `pageCount` gate prevents pre-render measurement feedback loops (Phase 9, ZOOM-01)
- Unified paged.js render path for preview *and* PDF export — dedicated `<PrintMount/>` in `#print-area`, `position:fixed; visibility:hidden` cloak keeps it in print flow, `@page { margin: 0 }` in print to avoid double gutter; retires `templateInlineStyles.ts`, `ExportTarget`, and `html2pdf.js` entirely (Phase 10, PDFX-01/02)
- 21 dead transitive packages removed from `package-lock.json` (html2pdf.js + html2canvas + jspdf + canvg + pako + …); README.md and CLAUDE.md tech-stack lines updated to "paged.js + browser print"
- Two regressions caught during human UAT (blank PDF pages from `overflow:auto` inside `#print-area`; `left:-9999px` removing print-area from print engine flow) — fixed inline in commit `738bea4` and re-verified before ship

**Known deferred items at close: 5 (see STATE.md Deferred Items)**

---

## v1.0 MVP (Shipped: 2026-04-15)

**Phases completed:** 3 phases, 6 plans, 5 tasks

**Key accomplishments:**

- Vite 5 + React 18 + TypeScript + Tailwind CSS v4 app shell scaffolded with full-height layout and branded header
- Responsive split-pane layout with drag-to-resize desktop view and mobile tabbed Editor/Preview toggle
- markdown-it token-walking parser + CodeMirror 6 editor with real-time onChange and typed ResumeData structure
- Three-template (Classic/Modern/Minimal) live preview system with debounced parsing and localStorage template persistence
- localStorage auto-save/restore (150ms debounce) with Blob-based markdown file download
- PDF export (html2pdf.js from hidden ExportTarget) and .md file import via FileReader API

---

## v1.1.0 Support text styles & HTML (Shipped: 2026-04-24)

**Phases completed:** 1 phase, 2 plans, 2 tasks

**Key accomplishments:**

- MarkdownIt configured with `html: true` and bullet details stored as rendered HTML strings via `md.renderInline()` — supports bold, italic, code, and link formatting in bullet points
- Preview.tsx and ExportTarget.tsx updated to render bullet detail items using `dangerouslySetInnerHTML`, consuming HTML strings from the parser

**Known deferred items at close: 4 (see STATE.md Deferred Items)**

---

## v1.2.0 Support render HTML with Tailwind classes (Shipped: 2026-04-26)

**Phases completed:** 2 phases, 5 plans

**Key accomplishments:**

- Token-walking parser replaced with `md.render()` — parseResume.ts reduced from ~120 lines to 5; ResumeData type eliminated entirely
- Template styles restructured from semantic keys to HTML element tags (h1, h2, h3, ul, li, code, a, etc.) across all three templates
- CSS theme architecture using Tailwind v4 `@custom-variant` — per-template scoped element styles in three CSS files
- Tailwind Play CDN added for runtime utility class resolution; DOMPurify configured with `ADD_ATTR: ['class']` to preserve user-authored classes
- Full browser verification: Classic/Modern/Minimal templates visually distinct; user-authored Tailwind classes render correctly

**Known deferred items at close: 1 (false positive — see STATE.md Deferred Items)**

---
