# Requirements: md2cv

**Defined:** 2026-04-14
**Core Value:** Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.

## v1 Requirements

### Editor

- [x] **EDIT-01**: User can type markdown in a CodeMirror editor with syntax highlighting
- [ ] **EDIT-02**: Editor updates the preview in real time as user types

### Preview

- [ ] **PREV-01**: Preview renders the markdown as a styled resume layout
- [ ] **PREV-02**: User can switch between Classic, Modern, and Minimal resume templates
- [ ] **PREV-03**: Template switch is reflected instantly in the preview

### Parsing

- [x] **PARS-01**: h1 parses as candidate name (rendered at top of resume)
- [x] **PARS-02**: h2 parses as section headers (e.g., Experience, Education)
- [x] **PARS-03**: h3 parses as entry titles within sections
- [x] **PARS-04**: Bullet lists under h3 entries parse as detail items

### Export

- [ ] **EXPRT-01**: User can export the current resume preview as a PDF (client-side, print-quality)
- [ ] **EXPRT-02**: User can download the current markdown content as a .md file

### Storage

- [ ] **STOR-01**: Editor content auto-saves to localStorage on change
- [ ] **STOR-02**: Content is restored from localStorage on page load
- [ ] **STOR-03**: User can import a .md file from disk into the editor

### Layout

- [ ] **LAYO-01**: Desktop layout shows editor and preview side-by-side
- [ ] **LAYO-02**: Mobile layout shows tabbed Editor / Preview with toggle
- [ ] **LAYO-03**: A draggable separator divides editor and preview panes; user can drag it to adjust the width ratio

## v2 Requirements

### Templates

- **TMPL-01**: Additional resume templates beyond Classic, Modern, Minimal
- **TMPL-02**: Custom template builder / style editor

### Storage

- **STOR-04**: Cloud sync / account-based persistence

### History

- **HIST-01**: Version history with undo to previous save states

## Out of Scope

| Feature | Reason |
|---------|--------|
| User accounts / auth | Personal tool — no backend needed |
| Server-side rendering | 100% client-side by design |
| Real-time collaboration | Single-user personal tool |
| Custom template builder | Three fixed templates sufficient for v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| LAYO-01 | Phase 1 | Pending |
| LAYO-02 | Phase 1 | Pending |
| LAYO-03 | Phase 1 | Pending |
| EDIT-01 | Phase 2 | Complete |
| EDIT-02 | Phase 2 | Pending |
| PARS-01 | Phase 2 | Complete |
| PARS-02 | Phase 2 | Complete |
| PARS-03 | Phase 2 | Complete |
| PARS-04 | Phase 2 | Complete |
| PREV-01 | Phase 2 | Pending |
| PREV-02 | Phase 2 | Pending |
| PREV-03 | Phase 2 | Pending |
| EXPRT-01 | Phase 3 | Pending |
| EXPRT-02 | Phase 3 | Pending |
| STOR-01 | Phase 3 | Pending |
| STOR-02 | Phase 3 | Pending |
| STOR-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-04-14*
*Last updated: 2026-04-14 after roadmap creation — traceability complete*
