# Roadmap: md2cv

## Milestones

- ✅ **v1.0 MVP** — Phases 1–3 (shipped 2026-04-15) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1.0 Support text styles & HTML** — Phase 4 (shipped 2026-04-24) — [archive](milestones/v1.1.0-ROADMAP.md)
- 🔄 **v1.2.0 Support render HTML with Tailwind classes** — Phases 5–6 (active)

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

### v1.2.0 Support render HTML with Tailwind classes

- [ ] **Phase 5: Parser Simplification & Template Restructure** — Replace token-walker with md.render() and re-key template styles by HTML element tag
- [ ] **Phase 6: Tailwind-Powered Preview Rendering** — Apply element-level Tailwind classes in preview and enable Tailwind runtime for user-authored HTML classes

## Phase Details

### Phase 5: Parser Simplification & Template Restructure
**Goal**: The markdown-to-HTML pipeline is simplified and template styles are restructured so that any HTML element can be styled by tag
**Depends on**: Phase 4 (shipped)
**Requirements**: PARSER-01, PARSER-02, TMPL-01, TMPL-02
**Success Criteria** (what must be TRUE):
  1. User's markdown is rendered to an HTML string by md.render() — no token-walking code remains in the parser
  2. User can write raw HTML tags directly in markdown and see them appear in the preview
  3. A developer (or Claude) can look up the Tailwind classes for any element tag (h1, h2, ul, li, code, a, etc.) for each of the three templates
  4. All three templates (Classic, Modern, Minimal) are expressed in the new element-keyed format with no regressions in visual output
**Plans**: TBD
**UI hint**: yes

### Phase 6: Tailwind-Powered Preview Rendering
**Goal**: The live preview applies template Tailwind classes to rendered HTML elements and user-authored Tailwind utility classes work at runtime
**Depends on**: Phase 5
**Requirements**: PREV-01, PREV-02, PREV-03
**Success Criteria** (what must be TRUE):
  1. Switching templates visually changes element styling (heading size, colors, spacing) in the preview — driven by the element-keyed class map
  2. A user who writes `<div class="text-red-500">` in their markdown sees red text in the preview
  3. A user who writes `<span class="font-bold underline">` sees bold underlined text — arbitrary Tailwind utility classes work, not just build-time scanned ones
  4. The preview renders correctly for standard markdown content without visual regressions from previous milestone
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Foundation & Layout | v1.0 | 2/2 | Complete | 2026-04-14 |
| 2. Editor, Parsing & Live Preview | v1.0 | 2/2 | Complete | 2026-04-15 |
| 3. Export & Storage | v1.0 | 2/2 | Complete | 2026-04-15 |
| 4. Inline Styles & HTML Preview | v1.1.0 | 2/2 | Complete | 2026-04-16 |
| 5. Parser Simplification & Template Restructure | v1.2.0 | 0/? | Not started | - |
| 6. Tailwind-Powered Preview Rendering | v1.2.0 | 0/? | Not started | - |
