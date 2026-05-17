# Requirements: md2cv — Milestone v1.3.0

**Defined:** 2026-05-18
**Core Value:** Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.

**Milestone goal:** Preview the resume as a real A4 page with margins, auto page breaks, and a page count — and have the exported PDF match the preview pixel-for-pixel.

## v1.3.0 Requirements

Requirements for this milestone. Each maps to roadmap phases.

### Preview Page Layout

- [ ] **PREV-01**: User sees the preview rendered inside an A4-sized page rectangle (210×297mm) with visible margins (replaces today's continuous flowing div)
- [ ] **PREV-02**: User sees content overflowing one page automatically flow onto additional A4 page rectangles below (multi-page rendering with auto page breaks)
- [ ] **PREV-03**: User sees a "Page X of N" indicator in the UI that updates live as they type

### Margins

- [ ] **MARG-01**: User can set page margins via four numeric inputs (top, bottom, left, right)
- [ ] **MARG-02**: User's margin values persist across browser sessions via localStorage
- [ ] **MARG-03**: User's margin changes update the preview (and PDF output) in real time without reload

### Responsive Zoom

- [ ] **ZOOM-01**: User sees the preview page auto-fit to the width of the preview pane when the pane is narrower than the page (full page visible without horizontal scroll)

### PDF Parity

- [ ] **PDFX-01**: User's exported PDF visually matches the preview pixel-for-pixel (at 1:1) — page size, margins, content positioning, fonts, and colors are identical
- [ ] **PDFX-02**: Preview and PDF export share a single rendering path — the `templateInlineStyles.ts` parallel hex-color map workaround is eliminated

## Future Requirements

Deferred beyond v1.3.0. Tracked but not in current roadmap.

### Paper sizes

- **PAPER-01**: User can choose between A4 and Letter paper sizes
- **PAPER-02**: User can configure custom paper dimensions

### Authoring controls

- **PAGEBREAK-01**: User can insert manual page-break markers in markdown to force a break at a specific position
- **ZOOM-02**: User can manually zoom the preview in/out via UI controls

## Out of Scope

Explicitly excluded for v1.3.0. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Letter / other paper sizes (this milestone) | A4-only by explicit user decision; revisit if demand emerges |
| Manual page-break syntax (this milestone) | Auto page break at boundary is sufficient for v1.3.0 |
| Manual zoom in/out controls (this milestone) | Auto-fit-to-width covers the responsive use case without adding UI |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PREV-01 | TBD | Pending |
| PREV-02 | TBD | Pending |
| PREV-03 | TBD | Pending |
| MARG-01 | TBD | Pending |
| MARG-02 | TBD | Pending |
| MARG-03 | TBD | Pending |
| ZOOM-01 | TBD | Pending |
| PDFX-01 | TBD | Pending |
| PDFX-02 | TBD | Pending |

**Coverage:**
- v1.3.0 requirements: 9 total
- Mapped to phases: 0 (roadmap pending)
- Unmapped: 9 ⚠️ (will be resolved by roadmapper)

---
*Requirements defined: 2026-05-18*
*Last updated: 2026-05-18 — milestone v1.3.0 initial definition*
