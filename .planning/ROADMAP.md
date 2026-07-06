# Roadmap: md2cv

## Milestones

- ✅ **v1.0 MVP** — Phases 1–3 (shipped 2026-04-15) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1.0 Support text styles & HTML** — Phase 4 (shipped 2026-04-24) — [archive](milestones/v1.1.0-ROADMAP.md)
- ✅ **v1.2.0 Support render HTML with Tailwind classes** — Phases 5–6 (shipped 2026-04-26) — [archive](milestones/v1.2.0-ROADMAP.md)
- ✅ **v1.3.0 Support preview with realistic page** — Phases 7–10 (shipped 2026-05-21) — [archive](milestones/v1.3.0-ROADMAP.md)
- 🔄 **v1.4.0 Support GitHub repository** — Phases 11–13 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–3) — SHIPPED 2026-04-15</summary>

- [x] Phase 1: Foundation & Layout (2/2 plans) — completed 2026-04-14
- [x] Phase 2: Editor, Parsing & Live Preview (2/2 plans) — completed 2026-04-15
- [x] Phase 3: Export & Storage (2/2 plans) — completed 2026-04-15

</details>

<details>
<summary>✅ v1.1.0 Support text styles & HTML (Phase 4) — SHIPPED 2026-04-24</summary>

- [x] Phase 4: Inline Styles & HTML Preview (2/2 plans) — completed 2026-04-16

</details>

<details>
<summary>✅ v1.2.0 Support render HTML with Tailwind classes (Phases 5–6) — SHIPPED 2026-04-26</summary>

- [x] Phase 5: Parser Simplification & Template Restructure (3/3 plans) — completed 2026-04-25
- [x] Phase 6: Tailwind-Powered Preview Rendering (2/2 plans) — completed 2026-04-26

</details>

<details>
<summary>✅ v1.3.0 Support preview with realistic page (Phases 7–10) — SHIPPED 2026-05-21</summary>

- [x] Phase 7: Page Chrome & Auto Pagination (3/3 plans) — completed 2026-05-18
- [x] Phase 8: Configurable Margins (2/2 plans) — completed 2026-05-18
- [x] Phase 9: Responsive Auto-Fit Zoom (2/2 plans) — completed 2026-05-19
- [x] Phase 10: Unified Pixel-Perfect PDF Pipeline (3/3 plans) — completed 2026-05-21

</details>

### v1.4.0 Support GitHub repository (Phases 11–13)

- [x] **Phase 11: GitHub Auth Foundation** - OAuth sign-in, token exchange serverless function, sign-out — completed 2026-07-05
- [ ] **Phase 12: Repo Sync & Toolbar** - Repo/branch picker, auto-pull, conflict prompt, commit, dirty indicator, toolbar regrouping
- [ ] **Phase 13: File Tree Sidebar** - Toggleable VS Code-style directory tree, click-to-open markdown files

## Phase Details

### Phase 11: GitHub Auth Foundation
**Goal**: Users can authenticate with GitHub to enable repo access
**Depends on**: Nothing (Phase 10 shipped; this starts v1.4.0)
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. User can click a sign-in button, complete the GitHub OAuth web flow, and return to the app in an authenticated state
  2. User sees their GitHub identity (avatar or username) in the UI after sign-in, confirming a valid token was obtained
  3. User can sign out / disconnect GitHub; the stored token is cleared and the app returns to an unauthenticated state
  4. The token-exchange endpoint URL is read from a config value so it can be changed without modifying app source code
**Plans**: 5 plans (4 waves)
Plans:
- [x] 11-01-PLAN.md — Serverless token-exchange function + env config (.env.example, .gitignore) [wave 1]
- [x] 11-02-PLAN.md — Pure OAuth web-flow lib + unit tests + Vite env typing [wave 1]
- [x] 11-03-PLAN.md — useGitHubAuth hook (callback handling, token persistence, sign-out) [wave 2]
- [x] 11-04-PLAN.md — Header auth UI (button/avatar/dropdown/toast) + App wiring [wave 3]
- [x] 11-05-PLAN.md — Human-verify checkpoint: end-to-end OAuth flow with real credentials [wave 4]
**UI hint**: yes

### Phase 12: Repo Sync & Toolbar
**Goal**: Users can pick a repo and keep the open file in sync with GitHub
**Depends on**: Phase 11
**Requirements**: SYNC-01, SYNC-02, SYNC-03, SYNC-04, SYNC-05, TOOL-01
**Success Criteria** (what must be TRUE):
  1. After sign-in, user can pick a repository and branch from their own GitHub repos and the app loads the configured file
  2. When the app opens with a repo configured, the current file is auto-pulled from GitHub; if local edits differ from remote the user is prompted to keep local or take remote
  3. User can click a commit button, type a commit message (sensible default pre-filled), and the current file is committed and pushed to GitHub via the API
  4. A dirty indicator is visible in the UI whenever the open file has uncommitted local changes
  5. The GitHub sync button is grouped with the import/export .md buttons in the toolbar; the PDF export button remains in its own separate group
**Plans**: 7 plans (5 waves)
Plans:
- [x] 12-01-PLAN.md — GitHub repo/content API module + unit tests [wave 1]
- [x] 12-02-PLAN.md — Dialog modal primitive + ConflictModal [wave 1]
- [x] 12-03-PLAN.md — useRepoSync hook (config, auto-pull, dirty, commit, conflict) [wave 2]
- [ ] 12-04-PLAN.md — PickerDialog (repo/branch/file) + CommitDialog [wave 3]
- [ ] 12-05-PLAN.md — Header File menu + dirty dot + repo caption + toast variants [wave 3]
- [ ] 12-06-PLAN.md — App.tsx wiring (hook, dialogs, toasts) [wave 4]
- [ ] 12-07-PLAN.md — Human-verify checkpoint: end-to-end sync against live GitHub [wave 5]
**UI hint**: yes

### Phase 13: File Tree Sidebar
**Goal**: Users can browse the repo directory structure and open any markdown file from a sidebar
**Depends on**: Phase 12
**Requirements**: TREE-01, TREE-02, TREE-03, TREE-04
**Success Criteria** (what must be TRUE):
  1. A left sidebar renders the connected repo's full directory tree with nested folders in VS Code style
  2. User can toggle the sidebar open and closed via a button; state persists across interactions
  3. Clicking a .md file in the tree opens it — editor and preview immediately display that file's content
  4. Opening a file from the tree replaces the currently open file; only one file is ever open at a time
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Layout | v1.0 | 2/2 | Complete | 2026-04-14 |
| 2. Editor, Parsing & Live Preview | v1.0 | 2/2 | Complete | 2026-04-15 |
| 3. Export & Storage | v1.0 | 2/2 | Complete | 2026-04-15 |
| 4. Inline Styles & HTML Preview | v1.1.0 | 2/2 | Complete | 2026-04-16 |
| 5. Parser Simplification & Template Restructure | v1.2.0 | 3/3 | Complete | 2026-04-25 |
| 6. Tailwind-Powered Preview Rendering | v1.2.0 | 2/2 | Complete | 2026-04-26 |
| 7. Page Chrome & Auto Pagination | v1.3.0 | 3/3 | Complete | 2026-05-18 |
| 8. Configurable Margins | v1.3.0 | 2/2 | Complete | 2026-05-18 |
| 9. Responsive Auto-Fit Zoom | v1.3.0 | 2/2 | Complete | 2026-05-19 |
| 10. Unified Pixel-Perfect PDF Pipeline | v1.3.0 | 3/3 | Complete | 2026-05-21 |
| 11. GitHub Auth Foundation | v1.4.0 | 0/5 | Not started | - |
| 12. Repo Sync & Toolbar | v1.4.0 | 3/7 | In Progress|  |
| 13. File Tree Sidebar | v1.4.0 | 0/? | Not started | - |
