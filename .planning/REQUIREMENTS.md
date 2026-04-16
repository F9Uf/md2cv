# Requirements: md2cv v1.1.0

**Milestone:** v1.1.0 — Support text styles & HTML
**Status:** Active
**Last updated:** 2026-04-16

---

## v1 Requirements

### Inline Styles in Bullets

- [ ] **STYLE-01**: User can write `**bold**` in a bullet point and see it rendered bold in the preview
- [ ] **STYLE-02**: User can write `*italic*` in a bullet point and see it rendered italic in the preview
- [ ] **STYLE-03**: User can write `` `code` `` in a bullet point and see it rendered as inline code in the preview
- [ ] **STYLE-04**: User can write `[text](url)` in a bullet point and see it rendered as a clickable link in the preview
- [ ] **STYLE-05**: All inline styles in bullets (bold, italic, inline code, links) render correctly in the exported PDF

### HTML Support

- [ ] **HTML-01**: User can write inline HTML (e.g. `<br>`, `<span>`) anywhere in the markdown and see it rendered in the preview
- [ ] **HTML-02**: User can write block HTML (e.g. `<div>`, `<table>`) anywhere in the markdown and see it rendered in the preview
- [ ] **HTML-03**: HTML content renders correctly in the exported PDF

---

## Future Requirements

*(None identified)*

---

## Out of Scope

- Sanitizing/restricting HTML — personal tool, single user, no XSS concern
- Syntax highlighting for inline code blocks — out of scope for v1.1
- Custom CSS injection — not needed for resume use cases

---

## Traceability

| REQ-ID | Phase | Plan |
|--------|-------|------|
| STYLE-01 | TBD | TBD |
| STYLE-02 | TBD | TBD |
| STYLE-03 | TBD | TBD |
| STYLE-04 | TBD | TBD |
| STYLE-05 | TBD | TBD |
| HTML-01 | TBD | TBD |
| HTML-02 | TBD | TBD |
| HTML-03 | TBD | TBD |
