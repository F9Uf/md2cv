# Roadmap: md2cv

## Milestones

- ✅ **v1.0 MVP** — Phases 1–3 (shipped 2005-04-15) — [archive](.planning/milestones/v1.0-ROADMAP.md)
- 🔄 **v1.1.0 Support text styles & HTML** — Phases 4–5 (active)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1–3) — SHIPPED 2005-04-15</summary>

- [x] Phase 1: Foundation & Layout (2/2 plans) — completed 2005-04-14
- [x] Phase 2: Editor, Parsing & Live Preview (2/2 plans) — completed 2005-04-15
- [x] Phase 3: Export & Storage (2/2 plans) — completed 2005-04-15

</details>

### v1.1.0 — Support text styles & HTML

- [ ] **Phase 4: Inline Styles & HTML Preview** — Parser updated to render inline styles in bullets and full HTML in preview

## Phase Details

### Phase 4: Inline Styles & HTML Preview
**Goal**: Users can write rich inline markdown and HTML anywhere in their resume and see it rendered correctly in the preview
**Depends on**: Phase 3 (v1.0 complete)
**Requirements**: STYLE-01, STYLE-02, STYLE-03, STYLE-04, HTML-01, HTML-02
**Success Criteria** (what must be TRUE):
  1. User writes `**bold**` or `*italic*` in a bullet and sees formatted text in the preview (not raw markdown syntax)
  2. User writes `` `code` `` in a bullet and sees it rendered as inline code in the preview
  3. User writes `[text](url)` in a bullet and sees a rendered link in the preview
  4. User writes inline HTML (e.g. `<br>`, `<span style="...">`) and sees it rendered — not escaped — in the preview
  5. User writes block HTML (e.g. `<div>`, `<table>`) and sees it rendered in the preview
**Plans**: 2 plans
Plans:
- [x] 04-01-PLAN.md — Enable html:true in parser and render bullet details as inline HTML
- [x] 04-02-PLAN.md — Wire dangerouslySetInnerHTML in Preview and ExportTarget for detail items
**UI hint**: yes
