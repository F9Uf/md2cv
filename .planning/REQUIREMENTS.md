# Requirements: md2cv v1.2.0

**Milestone:** v1.2.0 — Support render HTML with Tailwind classes
**Status:** Active
**Last updated:** 2026-04-25

---

## Requirements

### Parser

- [ ] **PARSER-01**: User's markdown is converted to an HTML string via `md.render()`, replacing the token-walking parser
- [ ] **PARSER-02**: User can write raw HTML elements in markdown and see them rendered in the preview

### Template Styles

- [ ] **TMPL-01**: Template styles are defined as a map keyed by HTML element tag (`h1`, `h2`, `h3`, `ul`, `li`, `p`, `a`, `code`, `blockquote`, etc.) with Tailwind class strings per template
- [ ] **TMPL-02**: All three templates (Classic, Modern, Minimal) are re-expressed in the new element-keyed format

### Preview Rendering

- [ ] **PREV-01**: Preview applies the active template's Tailwind classes to matching HTML elements in the rendered output
- [ ] **PREV-02**: User-authored HTML elements in markdown receive the same element-level Tailwind styling as markdown-generated elements
- [ ] **PREV-03**: User-authored Tailwind utility classes on HTML elements in markdown render correctly at runtime (not limited to build-time scanned classes)

---

## Future Requirements (deferred)

- ExportTarget / PDF export updated for new style system — deferred to a future milestone

## Out of Scope

- ExportTarget.tsx changes — unchanged in this milestone
- PDF export correctness for user HTML — not addressed here

---

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| PARSER-01 | Phase 5 | pending |
| PARSER-02 | Phase 5 | pending |
| TMPL-01 | Phase 5 | pending |
| TMPL-02 | Phase 5 | pending |
| PREV-01 | Phase 6 | pending |
| PREV-02 | Phase 6 | pending |
| PREV-03 | Phase 6 | pending |
