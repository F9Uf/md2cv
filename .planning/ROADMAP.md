# Roadmap: md2cv

## Milestones

- ✅ **v1.0 MVP** — Phases 1–3 (shipped 2026-04-15) — [archive](milestones/v1.0-ROADMAP.md)
- ✅ **v1.1.0 Support text styles & HTML** — Phase 4 (shipped 2026-04-24) — [archive](milestones/v1.1.0-ROADMAP.md)
- ✅ **v1.2.0 Support render HTML with Tailwind classes** — Phases 5–6 (shipped 2026-04-26) — [archive](milestones/v1.2.0-ROADMAP.md)
- 🚧 **v1.3.0 Support preview with realistic page** — Phases 7–10 (in flight)

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

<details open>
<summary>🚧 v1.3.0 Support preview with realistic page (Phases 7–10) — IN FLIGHT</summary>

- [ ] **Phase 7: Page Chrome & Auto Pagination** — A4 page rectangle(s) with margins, multi-page auto-flow, live "Page X of N" indicator
- [ ] **Phase 8: Configurable Margins** — Four numeric margin inputs with localStorage persistence and real-time update
- [ ] **Phase 9: Responsive Auto-Fit Zoom** — Preview page auto-fits to pane width when pane is narrower than page
- [ ] **Phase 10: Unified Pixel-Perfect PDF Pipeline** — Single rendering path so exported PDF matches preview 1:1; retire `templateInlineStyles.ts`

</details>

## Phase Details

### Phase 7: Page Chrome & Auto Pagination
**Goal**: Preview pane shows the resume as one or more real A4 pages with visible margins and a live page count, replacing today's continuous flowing div.
**Depends on**: Phase 6 (Tailwind-Powered Preview Rendering)
**Requirements**: PREV-01, PREV-02, PREV-03
**Success Criteria** (what must be TRUE):
  1. User sees the preview rendered inside one or more A4-sized page rectangles (210×297mm) with visible inner margins instead of a continuous div.
  2. As the user types past one page worth of content, a second A4 page rectangle appears below and additional content flows into it automatically.
  3. The UI displays a "Page X of N" indicator that updates live (within ~150ms debounce) as the user types and content reflows across pages.
  4. Removing content so it fits a single page collapses the preview back to one page rectangle and the indicator updates to "Page 1 of 1".
**Plans**: 3 plans
  - [x] 07-01-PLAN.md — Install pagedjs dependency + minimal TS ambient declaration (Wave 1)
  - [x] 07-02-PLAN.md — Create src/styles/pages.css page chrome + import from main.tsx (Wave 1)
  - [x] 07-03-PLAN.md — Preview.tsx paged.js integration + Page X of N pill + App.tsx enablePagination wiring (Wave 2)
**UI hint**: yes

### Phase 8: Configurable Margins
**Goal**: User can set and persist page margins (top / bottom / left / right) through a control surface in the UI, and the preview reflects the values immediately.
**Depends on**: Phase 7
**Requirements**: MARG-01, MARG-02, MARG-03
**Success Criteria** (what must be TRUE):
  1. User sees four numeric inputs (top, bottom, left, right) for page margins in the UI and can edit each independently.
  2. Changing a margin value updates the visible margin band of every A4 page rectangle in real time, without a page reload, and pagination re-flows accordingly.
  3. After a browser refresh, the previously entered margin values are restored from localStorage and applied to the preview.
**Plans**: TBD
**UI hint**: yes

### Phase 9: Responsive Auto-Fit Zoom
**Goal**: The A4 preview page is always fully visible within the preview pane, scaling down when the pane is narrower than the page so no horizontal scroll is needed.
**Depends on**: Phase 7
**Requirements**: ZOOM-01
**Success Criteria** (what must be TRUE):
  1. When the preview pane is narrower than the A4 page width, the page rectangle scales down to fit the pane width and the full page is visible with no horizontal scrollbar.
  2. When the preview pane is wider than the A4 page width, the page is shown at 1:1 (100%) and is not enlarged beyond actual size.
  3. Dragging the split-pane separator to resize the preview pane updates the auto-fit scale smoothly without clipping content or introducing horizontal scroll.
**Plans**: TBD
**UI hint**: yes

### Phase 10: Unified Pixel-Perfect PDF Pipeline
**Goal**: The exported PDF is produced from the same DOM the user sees, matching the preview 1:1 across page size, margins, page-break positions, fonts, and colors — eliminating the `templateInlineStyles.ts` parallel workaround.
**Depends on**: Phase 7, Phase 8, Phase 9
**Requirements**: PDFX-01, PDFX-02
**Success Criteria** (what must be TRUE):
  1. Exporting a multi-page resume produces a PDF whose page count, page-break positions, margins, and visible layout are visually identical to the preview at 100% zoom.
  2. Colors, fonts, headings, bullet styles, and any user-authored Tailwind classes shown in the preview render identically (no color shifts, font fallback, or layout drift) in the exported PDF.
  3. Switching between the three templates (Classic, Modern, Minimal) before export results in PDFs that match each template's preview without any per-template inline-style adjustments.
  4. The codebase contains a single rendering path for preview and export — the `templateInlineStyles.ts` parallel hex-color map and the hidden `ExportTarget` workaround have been retired (or replaced by a single shared component).
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
| 7. Page Chrome & Auto Pagination | v1.3.0 | 0/0 | Not started | — |
| 8. Configurable Margins | v1.3.0 | 0/0 | Not started | — |
| 9. Responsive Auto-Fit Zoom | v1.3.0 | 0/0 | Not started | — |
| 10. Unified Pixel-Perfect PDF Pipeline | v1.3.0 | 0/0 | Not started | — |
