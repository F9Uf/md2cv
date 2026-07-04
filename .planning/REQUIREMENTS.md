# Requirements: md2cv — Milestone v1.4.0

**Defined:** 2026-07-05
**Core Value:** Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.
**Milestone:** v1.4.0 Support GitHub repository

## v1.4.0 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### GitHub Authentication

- [ ] **AUTH-01**: User can sign in with GitHub via OAuth web flow (token exchange through a Vercel serverless function)
- [ ] **AUTH-02**: Auth endpoint is abstracted behind config so the token-exchange host can move (Cloudflare Worker, Next.js, etc.) without app-code changes
- [ ] **AUTH-03**: User can sign out / disconnect GitHub, clearing the stored token

### Repo Sync

- [ ] **SYNC-01**: User can pick a repository and branch from their own GitHub repos after sign-in
- [ ] **SYNC-02**: App auto-pulls the latest content of the open file from the selected repo when the app loads
- [ ] **SYNC-03**: When uncommitted local edits differ from remote at pull time, user is prompted to keep local or take remote
- [ ] **SYNC-04**: User can commit the current file via a commit button — dialog prompts for a message (sensible default), then commits + pushes via the GitHub API
- [ ] **SYNC-05**: User can see whether the open file has uncommitted changes (dirty indicator)

### File Tree

- [ ] **TREE-01**: Left sidebar renders the selected repo's directory tree with nested folders, VS Code-style
- [ ] **TREE-02**: User can toggle the sidebar (show/hide)
- [ ] **TREE-03**: Clicking a markdown file in the tree opens it — editor and preview swap to that file's content
- [ ] **TREE-04**: Only one file is open at a time (opening a file replaces the current one)

### Toolbar

- [ ] **TOOL-01**: GitHub sync button is grouped/collapsed with the existing import/export .md buttons; PDF export stays a separate button

## Future Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Repo Sync

- **SYNC-F1**: Multi-file tabs (open more than one file at a time)
- **SYNC-F2**: Create/rename/delete files and folders in the repo from the app
- **SYNC-F3**: Diff view of local edits vs remote before committing

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Multi-file editing (tabs/splits) | Single-file scope confirmed for v1.4.0 — one open file at a time |
| GitHub OAuth Device Flow | Endpoints lack CORS headers; requires proxy with worse UX than web flow |
| PAT-based auth | Superseded by OAuth web flow decision (Vercel function for token exchange) |
| Full backend / Next.js migration | One serverless auth function is sufficient; app stays a static SPA |
| Branch creation / PR workflows | Personal tool — direct commit to the selected branch is enough |
| Non-markdown file editing | md2cv is a markdown resume tool; tree opens .md files only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| SYNC-01 | — | Pending |
| SYNC-02 | — | Pending |
| SYNC-03 | — | Pending |
| SYNC-04 | — | Pending |
| SYNC-05 | — | Pending |
| TREE-01 | — | Pending |
| TREE-02 | — | Pending |
| TREE-03 | — | Pending |
| TREE-04 | — | Pending |
| TOOL-01 | — | Pending |

**Coverage:**
- v1.4.0 requirements: 13 total
- Mapped to phases: 0
- Unmapped: 13 ⚠️ (roadmap pending)

---
*Requirements defined: 2026-07-05*
*Last updated: 2026-07-05 after initial definition*
