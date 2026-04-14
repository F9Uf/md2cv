# Roadmap: md2cv

**Milestone:** v1 — Markdown-to-Resume SPA
**Granularity:** Coarse
**Coverage:** 17/17 v1 requirements mapped

---

## Phases

- [x] **Phase 1: Foundation & Layout** - App shell and pane layout that all features live inside
- [ ] **Phase 2: Editor, Parsing & Live Preview** - The core loop: type markdown, see a styled resume instantly
- [ ] **Phase 3: Export & Storage** - PDF export, markdown download, auto-save, and file import

---

## Phase Details

### Phase 1: Foundation & Layout
**Goal**: A functional two-pane app shell exists that users can navigate on both desktop and mobile
**Depends on**: Nothing (first phase)
**Requirements**: LAYO-01, LAYO-02, LAYO-03
**Success Criteria** (what must be TRUE):
  1. On desktop, user sees editor pane and preview pane side by side with no overlap
  2. User can drag the separator between panes to widen or narrow either side
  3. On mobile, user sees tab controls and can toggle between Editor and Preview tabs
**Plans:** 2 plans

Plans:
- [x] 01-01-PLAN.md — Scaffold Vite + React + Tailwind CSS project and create app shell with header
- [x] 01-02-PLAN.md — Build responsive split pane layout with draggable splitter and mobile tabs

**UI hint**: yes

### Phase 2: Editor, Parsing & Live Preview
**Goal**: Users can write markdown in the editor and immediately see it rendered as a styled resume with switchable templates
**Depends on**: Phase 1
**Requirements**: EDIT-01, EDIT-02, PARS-01, PARS-02, PARS-03, PARS-04, PREV-01, PREV-02, PREV-03
**Success Criteria** (what must be TRUE):
  1. User can type in the editor and the preview updates without any manual action
  2. The resume preview correctly renders h1 as the candidate name at the top of the resume
  3. The resume preview correctly renders h2 as section headers, h3 as entry titles, and bullet lists as detail items
  4. User can switch between Classic, Modern, and Minimal templates and sees the preview restyle instantly
**Plans**: TBD
**UI hint**: yes

### Phase 3: Export & Storage
**Goal**: Users can export their resume as PDF or markdown, and their content persists between sessions
**Depends on**: Phase 2
**Requirements**: EXPRT-01, EXPRT-02, STOR-01, STOR-02, STOR-03
**Success Criteria** (what must be TRUE):
  1. User can click Export PDF and download a print-quality PDF of the current resume preview
  2. User can download the current editor content as a .md file
  3. After closing and reopening the app, the editor content from the previous session is restored automatically
  4. User can import a .md file from disk and the editor is populated with its contents

**Plans**: TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Layout | 2/2 | Complete | 2026-04-14 |
| 2. Editor, Parsing & Live Preview | 1/2 | In Progress|  |
| 3. Export & Storage | 0/? | Not started | - |

---

*Created: 2026-04-14*
*Last updated: 2026-04-14 after phase 1 planning*
