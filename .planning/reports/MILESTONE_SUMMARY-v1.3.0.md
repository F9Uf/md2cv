# Milestone v1.3.0 — Project Summary

**Generated:** 2026-07-04
**Purpose:** Team onboarding and project review
**Milestone:** Support preview with realistic page — SHIPPED 2026-05-21

---

## 1. Project Overview

**md2cv** is a personal single-page web application: write your resume in Markdown, see it rendered live as a styled resume, and export it as a PDF — 100% in the browser, no server, no auth.

Markdown structure maps to resume structure (h1 = name, h2 = sections, h3 = entries, bullets = details), rendered through three switchable templates (Classic, Modern, Minimal). Bullets and inline text support full markdown formatting and arbitrary HTML.

**Core value:** Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.

**What v1.3.0 delivered:** Replaced the continuous flowing preview div with a paged.js-driven render path that shows the resume as real A4 page rectangles with configurable margins, a live "Page X of N" indicator, and responsive auto-fit zoom. Crucially, it unified the preview and PDF export pipelines — the exported PDF is produced from the *same DOM* the user sees, retiring `html2pdf.js` and the `templateInlineStyles.ts` parallel-map workaround entirely.

All 4 phases (7–10) and all 10 plans are complete. Milestone audit: **PASSED** (9/9 requirements, 4/4 phases, 4/4 integration edges, 4/4 E2E flows).

## 2. Architecture & Technical Decisions

**Tech stack:** Vite 5, React 18, TypeScript, Tailwind CSS v4 (`@tailwindcss/vite`), CodeMirror 6, markdown-it (`html: true`), DOMPurify, paged.js 0.4.3 (pagination), browser-native print (PDF export).

Key architectural decisions from this milestone:

- **Decision:** paged.js polyfill for on-screen A4 pagination
  - **Why:** Implements W3C CSS Paged Media (`@page`, `break-*`, page counters) in the browser — the same paged-media model print already uses, making it the strongest foundation for pixel-perfect PDF parity.
  - **Phase:** 7

- **Decision:** PDF export = `window.print()` over the paged.js-rendered DOM (no library)
  - **Why:** paged.js has already laid content into A4 `.pagedjs_page` boxes; the browser's Save-as-PDF just rasterizes pages that already exist. Page count, break positions, margins, and styling *cannot* drift from the preview because there is no second render. Retired html2pdf.js's canvas-rasterization path, which forced a parallel hex-color map to dodge oklch crashes and could never reach parity.
  - **Phase:** 10

- **Decision:** Two-Previewer pattern — on-screen `<Preview/>` (full chrome) + dedicated off-screen `<PrintMount/>` (minimal mount), each running its own paged.js `Previewer`
  - **Why:** Reusing full `<Preview/>` for the print mount bled its `overflow: auto` scroll container and sticky pill into the PDF (fragmentation container → blank pages). A minimal mount with zero on-screen chrome eliminates the bug class entirely.
  - **Phase:** 10 (regression fix during verification, commit `738bea4`)

- **Decision:** `position: fixed; visibility: hidden` cloak for `#print-area` (not `left: -9999px`)
  - **Why:** The negative-offset technique removed the element from the print engine's flow → blank PDF. The cloak keeps the element in real layout (paged.js can measure) and reachable by print; flipped to `position: static; visibility: visible` in `@media print`.
  - **Phase:** 10 (regression fix during verification)

- **Decision:** `@page { size: A4 portrait; margin: 0 }` in `@media print`
  - **Why:** paged.js bakes per-page margins *inside* each `.pagedjs_page`; any browser-level print margin would double-gutter. The old static `@page { margin: 15mm }` was deleted — it contradicted the dynamic user margins.
  - **Phase:** 10

- **Decision:** CSS `zoom` (not `transform: scale`) for auto-fit preview scaling
  - **Why:** `zoom` affects layout, not just paint — `transform: scale` caused desktop blink on resize and clipped pages 4+ on multi-page content. A hardcoded A4 reference width (793.7px) breaks the ResizeObserver feedback loop.
  - **Phase:** 9 (mid-phase rework after first attempt with `transform`)

- **Decision:** Zoom application gated behind `pageCount !== null`
  - **Why:** paged.js must measure the natural A4 size before any layout-affecting scale is applied; discovered during human UAT, resolved both desktop blink and mobile feedback loop.
  - **Phase:** 9

- **Decision:** User margins injected as a dynamic `@page { margin: Tmm Rmm Bmm Lmm }` rule via paged.js's `pagedjs_inline` stylesheet, with `margins` in the paged.js `useEffect` dependency array
  - **Why:** Single source of truth for "reflow when margins change" — both preview and print mount receive the same `margins` prop and emit the same rule.
  - **Phase:** 8

- **Decision:** Margins persisted as JSON under localStorage key `md2cv-margins`, validated on load (numbers in [0, 50], else defaults)
  - **Why:** Follows existing `md2cv-*` key convention and the project's validate-on-read localStorage pattern.
  - **Phase:** 8

## 3. Phases Delivered

| Phase | Name | Status | One-Liner |
|-------|------|--------|-----------|
| 7 | Page Chrome & Auto Pagination | ✅ Complete (human UAT 5/5 pass) | Preview renders as real A4 sheets via paged.js with auto multi-page flow and a live "Page X of N" pill |
| 8 | Configurable Margins | ✅ Complete (functional reqs SATISFIED; cosmetic deviations accepted by shipping) | Four-input margin strip (top/bottom/left/right, mm) with localStorage persistence and live `@page` reflow |
| 9 | Responsive Auto-Fit Zoom | ✅ Complete (5/5 truths human-verified) | ResizeObserver-driven CSS `zoom` auto-fit — preview always fully visible, desktop and mobile, no horizontal scroll |
| 10 | Unified Pixel-Perfect PDF Pipeline | ✅ Complete (UAT matrix all-pass: 3 templates × multi-page × mobile × margins) | PDF export runs browser print over the same paged.js DOM as the preview; html2pdf.js and 21 transitive packages removed |

## 4. Requirements Coverage

All 9 v1.3.0 requirements satisfied (milestone audit 2026-05-21: PASSED):

- ✅ **PREV-01** — Preview rendered inside A4 page rectangle (210×297mm) with visible margins (Phase 7)
- ✅ **PREV-02** — Overflowing content auto-flows onto additional A4 pages (Phase 7)
- ✅ **PREV-03** — Live "Page X of N" indicator updating as the user types (Phase 7)
- ✅ **MARG-01** — Page margins settable via four numeric inputs (Phase 8)
- ✅ **MARG-02** — Margin values persist across sessions via localStorage `md2cv-margins` (Phase 8)
- ✅ **MARG-03** — Margin changes update preview (and PDF) in real time, no reload (Phase 8)
- ✅ **ZOOM-01** — Preview auto-fits pane width; full page visible without horizontal scroll (Phase 9)
- ✅ **PDFX-01** — Exported PDF matches preview pixel-for-pixel: page size, margins, breaks, fonts, colors (Phase 10)
- ✅ **PDFX-02** — Single rendering path; `templateInlineStyles.ts` workaround eliminated (Phase 10)

**Deferred to future milestones** (tracked in requirements archive): PAPER-01/02 (Letter / custom paper sizes), PAGEBREAK-01 (manual page-break markers), ZOOM-02 (manual zoom controls).

## 5. Key Decisions Log

Aggregated from phase CONTEXT.md files and the milestone roadmap:

| ID | Decision | Phase | Rationale |
|----|----------|-------|-----------|
| D-PDF-1 | Retire html2pdf.js in favor of paged.js + browser print | 10 | Canvas path forced parallel hex-color map (oklch crash) and could never reach pixel parity |
| 07-D-01 | paged.js polyfill for on-screen pagination | 7 | W3C Paged Media in-browser; strongest foundation for Phase 10 parity |
| 07-D-02 | Reflow on existing 150ms debounce | 7 | Keeps "Page X of N" within PREV-03's latency requirement, no second cadence |
| 07-D-03 | Page count read from paged.js's native counters | 7 | Single source of truth — cannot drift from what was actually rendered |
| 07-D-05/06 | No `break-inside: avoid`, no forced breaks before h2 | 7 | Ship the simplest thing; revisit only if a real resume looks bad |
| 08-D-01 | Margin inputs in a compact toolbar strip below the header | 8 | Always visible, consistent with existing header treatment |
| 08-D-05 | Margins injected via `pagedjs_inline` `@page` rule | 8 | Reuses Phase 7's stylesheet mechanism; reflow via useEffect dep array |
| 08-D-06 | localStorage `md2cv-margins` JSON, validated on read | 8 | Existing key convention + validate-on-read pattern |
| 09 rework | CSS `zoom` over `transform: scale` | 9 | `zoom` affects layout; `transform` is paint-only → blink + page clipping |
| 09 gate | Scale gated behind `pageCount !== null` | 9 | Let paged.js measure natural A4 size before applying zoom |
| 10-D-02 | Print mount runs its own always-mounted Previewer | 10 | Isolated from on-screen mount; real layout available for chunking on every reflow |
| 10-D-04a | `@page { margin: 0 }` in `@media print` | 10 | paged.js margins already inside `.pagedjs_page`; browser margin would double-gutter |
| 10-D-06 | No `forPrint` prop; Phase 9's `@media print` zoom reset neutralizes mobile zoom | 10 | `!important` cascade beats inline zoom — PDF captured at 100% on every device (load-bearing rule in `pages.css`) |
| 10 fix | `<PrintMount/>` extraction + `fixed/hidden` cloak | 10 | Two UAT regressions (bleeding chrome → blank pages; `-9999px` → out of print flow), fixed inline in `738bea4` |

## 6. Tech Debt & Deferred Items

From the milestone audit, VERIFICATION files, and RETROSPECTIVE:

**Code-level:**
- `PrintMount` lacks a `hasError` fallback path (parity with `Preview.tsx`) — a paged.js render failure produces a silent blank PDF (Phase 10 code review WR-01). Track for follow-up.
- Bundle size: paged.js adds ~1.3MB to the largest chunk (1,320 kB minified / 391 kB gzip). Acceptable for a personal tool; code-split via `await import('pagedjs')` if first-paint ever matters.
- Dark mode for the CodeMirror editor — dropped from v1.1.0, still open if desired.

**Cosmetic (accepted by shipping):**
- Phase 8 margin strip deviates from UI-SPEC: `bg-gray-700` header (spec `bg-gray-900`), UPPERCASE labels (spec Title-case), SVG Reset icon (spec text button). Only relevant if a future phase touches the strip.

**Planning hygiene (noted at audit, mostly resolved at close):**
- Phase 10 has no phase-level `10-VERIFICATION.md` — sign-off lives in plan-scoped `10-03-VERIFICATION.md` (matrix unambiguous, naming breaks convention).
- Phase 7 frontmatter/body status mismatch (`complete` vs `human_needed`) — resolved by 07-HUMAN-UAT.md all-pass, body never reconciled.
- REQUIREMENTS.md checkbox drift recurred for the **third milestone** (v1.0, v1.2.0, v1.3.0) — retrospective flags this as a workflow gap (checkboxes should sync at plan-completion time), not a memory issue.

**Key retrospective lessons:**
1. **Verify the full path that ships** — preview-looks-right ≠ PDF-looks-right; both Phase 10 regressions only surfaced when a real PDF was generated and opened.
2. **Decouple "off-screen for the print engine" from "off-screen for the user"** — different requirements; one CSS technique can satisfy one while breaking the other.
3. **Spike `zoom` vs `transform: scale` before committing** — a 10-minute spike would have saved Phase 9's first-attempt rewrite.
4. **Inline fix-during-verification is fine** when the fix is small, clearly belongs to the plan under verification, and the full matrix is re-run after (~25 min vs ~1 hr for a gap-closure phase).

**Post-milestone quick tasks** (2026-05-21 → 2026-07-04, after ship): trailing-blank-page fix on single-page export (`61253f8`), `usePagedjsPreview` hook extraction (`e598bc2`), pagination-under-zoom mismatch fix (`7266a96`), and print-mirrors-preview single-pagination refactor (`98f3a3f`).

## 7. Getting Started

- **Run the project:** `npm install && npm run dev` (Vite dev server). **Note:** project machine runs Node.js v20.11.0 — Vite is pinned to v5 (Vite 6+ requires ^20.19.0).
- **Key directories:**
  - `src/App.tsx` — app shell, state wiring (markdown content, template, margins, split ratio), print-area mount
  - `src/components/Preview.tsx` — on-screen paged.js preview with zoom auto-fit and "Page X of N" pill
  - `src/components/PrintMount.tsx` — minimal off-screen paged.js mount that the print engine captures
  - `src/components/MarginControls.tsx` — four-input margin toolbar strip
  - `src/hooks/usePagedjsPreview.ts` — shared paged.js lifecycle (extracted post-milestone)
  - `src/styles/pages.css` — page chrome (A4 sheets, shadows) + load-bearing `@media print` resets
  - `src/index.css` — `#print-area` cloak/reveal + `@page { margin: 0 }` print rule
- **Tests:** `npm test` (15 tests, Vitest — primarily the parser HTML-contract tests from v1.2.0)
- **Where to look first:** Follow the render path — CodeMirror editor → 150ms debounce in `App.tsx` → `md.render()` + DOMPurify → paged.js `Previewer` in Preview/PrintMount → `window.print()` for PDF. `.planning/milestones/v1.3.0-ROADMAP.md` has the full phase-by-phase story.

---

## Stats

- **Timeline:** 2026-04-26 → 2026-05-21 (~3.5 weeks; ~5 working sessions)
- **Phases:** 4 / 4 complete (10 / 10 plans)
- **Commits:** 6 on main between v1.2.0 and v1.3.0 tags (squash-merged PRs)
- **Files changed:** 19 (+744 / −218), of which 15 in src/package files (+623 / −216); 21 transitive packages removed from the lockfile
- **Contributors:** F9Uf
- **Codebase size at ship:** ~990 LOC TS/TSX (1,184 incl. CSS); net +~360 LOC over v1.2.0
