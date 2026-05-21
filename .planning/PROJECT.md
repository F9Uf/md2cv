# md2cv

## What This Is

md2cv is a personal single-page web application that lets you write your resume in Markdown and instantly see it rendered as a styled resume. It parses markdown structure (h1 = name, h2 = sections, h3 = entries, bullets = details) into a live preview with three switchable templates (Classic, Modern, Minimal), and exports the result as a PDF or .md file — all in the browser, no server needed. Bullet points and inline text support full markdown formatting (bold, italic, code, links) and arbitrary HTML.

## Core Value

Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.

## Current State

**Shipped:** v1.3.0 — Support preview with realistic page (2026-05-21). Phases 7–10 complete. Preview renders as paged.js-driven A4 pages with configurable margins, live "Page X of N", responsive auto-fit zoom on desktop and mobile; PDF export uses the same DOM the user sees via browser-native print over paged.js.

**Next milestone:** Not yet defined. Run `/gsd-new-milestone` to scope v1.4.0.

## Requirements

### Validated

- ✓ CodeMirror markdown editor with syntax highlighting — v1.0
- ✓ Live resume preview (updates in real time as user types) — v1.0
- ✓ markdown-it parsing: h1 = name, h2 = sections, h3 = entries, bullets = details — v1.0
- ✓ Three switchable resume templates: Classic, Modern, Minimal — v1.0
- ✓ Client-side PDF export (html2pdf.js, print-quality) — v1.0
- ✓ LocalStorage auto-save with 150ms debounce (persist content between sessions) — v1.0
- ✓ Import .md file from disk into editor — v1.0
- ✓ Export current markdown as .md file (h1-derived filename) — v1.0
- ✓ Responsive layout: side-by-side on desktop, tabbed Editor/Preview on mobile — v1.0
- ✓ Draggable split pane separator with localStorage ratio persistence — v1.0
- ✓ Inline markdown styles in bullet points (bold, italic, inline code, links) rendered in preview — v1.1.0
- ✓ Full HTML rendering everywhere via `html: true` on markdown-it — v1.1.0

### Active

(No active requirements — v1.3.0 shipped 2026-05-21. Next milestone requirements will land here.)

### Validated in Phase 10: unified-pixel-perfect-pdf-pipeline

- ✓ Exported PDF visually matches preview pixel-for-pixel (page size, margins, page break positions, fonts, colors) — v1.3.0
- ✓ Unified rendering path — both preview and PDF export consume the same paged.js DOM; `templateInlineStyles.ts` parallel-map workaround retired — v1.3.0

### Validated in Phase 07–09 (v1.3.0)

- ✓ Preview pane renders content inside A4-sized page rectangle(s) with visible margins — Phase 07
- ✓ Multi-page preview: content overflowing one page auto-flows onto additional page rectangles — Phase 07
- ✓ UI shows current page count ("Page X of N") that updates live as user types — Phase 07
- ✓ User can configure page margins via four numeric inputs (top/bottom/left/right); persisted to localStorage — Phase 08
- ✓ Responsive auto-fit zoom for the preview pane on desktop and mobile — Phase 09

### Validated in Phase 06: tailwind-powered-preview-rendering

- ✓ Preview applies Tailwind classes to elements by tag type (via @custom-variant scoped CSS) — v1.2.0
- ✓ Tailwind runtime support so user-authored HTML classes work in preview (Play CDN + DOMPurify with ADD_ATTR: ['class']) — v1.2.0

### Validated in Phase 05: parser-simplification-template-restructure

- ✓ Use `md.render()` for HTML output instead of token-walking parser — v1.2.0
- ✓ Template styles keyed by HTML element tag (h1, h2, h3, ul, li, code, a, etc.) — v1.2.0

### Out of Scope

- User accounts / cloud sync — personal tool, no backend needed
- Server-side rendering — 100% client-side by design
- Custom template builder — three fixed templates is sufficient for v1
- Real-time collaboration — single-user personal tool
- Sanitizing/restricting HTML — personal tool, single user, no XSS concern
- PDF export correctness for inline styles/HTML (STYLE-05, HTML-03) — dropped with Phase 5

## Context

Shipped v1.3.0 with ~990 LOC TS/TSX (1,184 LOC including CSS). v1.3.0 added `<MarginControls/>` + `<PrintMount/>` and rewired Preview/App/index.css/pages.css around the unified paged.js path; net codebase growth ≈360 LOC over v1.2.0.

**Tech stack:** Vite 5, React 18, TypeScript, Tailwind CSS v4, CodeMirror 6, markdown-it, DOMPurify, paged.js (pagination), browser-native print (PDF export)

**Known technical debt:**
- Dark mode for CodeMirror editor — quick task dropped from v1.1.0, carry forward if desired.
- `PrintMount` lacks a `hasError` fallback path (parity with `Preview.tsx`) — a paged.js render failure produces a silent blank PDF; surfaced in Phase 10 code review (WR-01). Track for follow-up.
- Bundle size: pagedjs adds ~1.3MB to the largest chunk (`index-*.js: 1,320 kB minified / 391 kB gzip`). Acceptable for personal-tool scope; revisit with `await import('pagedjs')` code-split if first-paint matters later.
- Phase 8 UI-SPEC cosmetic deviations (margin strip uses `bg-gray-700` vs spec `bg-gray-900`; UPPERCASE labels; SVG Reset icon vs text button) — accepted by shipping; only relevant if a future phase touches the margin strip visuals.

## Constraints

- **Client-side only**: No server, no backend — everything runs in the browser
- **No auth**: Personal tool — no login, no user management
- **Node.js**: Project machine runs v20.11.0 — use Vite 5 (not 6+) which requires ^20.19.0

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| markdown-it for parsing | Specified by user; well-maintained, extensible | ✓ Good — token walker works cleanly |
| CodeMirror 6 for editor | Specified by user; syntax highlighting, markdown-aware | ✓ Good — controlled-ish pattern with isInternalChange ref works well |
| Client-side PDF via html2pdf.js | No server dependency; mature option | ✗ Retired in v1.3.0 — replaced with paged.js + browser print over the same DOM the preview uses |
| paged.js + browser print for PDF export (v1.3.0) | Same DOM the user sees ⇒ pixel-perfect preview/PDF parity; no canvas rasterization, no oklch crash | ✓ Good — Phase 10 ships single rendering path; `templateInlineStyles.ts` workaround retired |
| Dedicated `<PrintMount/>` for #print-area (Phase 10) | Reusing full `<Preview/>` for the off-screen print mount bled scroll-container / pill chrome into the PDF | ✓ Good — minimal mount with zero on-screen chrome avoids the bleeding-chrome bug class entirely |
| `position: fixed; visibility: hidden` cloak for #print-area (Phase 10) | `position: absolute; left: -9999px` removed the element from the print engine's flow → blank PDF | ✓ Good — element stays in real layout for paged.js measurement and reachable for print |
| LocalStorage + import/export | Best of both worlds — auto-persists and allows .md portability | ✓ Good |
| Mobile: tabbed layout | Cleaner UX than vertical stack on small screens | ✓ Good — Editor default tab is correct |
| Tailwind CSS v4 via @tailwindcss/vite | No postcss.config.js needed | ✓ Good — clean setup |
| Three templates as Tailwind class maps | Simpler than separate component files | ✓ Good — but ExportTarget needs parallel inline-style map |
| Vite 5 (not latest) | Node.js v20.11.0 engine constraint | ✓ Correct — stable LTS-track version |
| html: true on MarkdownIt | Enable inline HTML and proper inline style rendering | ✓ Good — XSS accepted (personal tool) |
| md.renderInline() for bullet details | Converts inline markdown to HTML without wrapping `<p>` tags | ✓ Good — clean output for list items |
| dangerouslySetInnerHTML for detail `<li>` | Consistent with existing `extra` field pattern in Preview/ExportTarget | ✓ Good |
| md.render() replaces token-walker (v1.2.0) | Dramatically simpler pipeline; HTML string as the single data format eliminates ResumeData type | ✓ Good — parseResume.ts went from ~120 to 5 lines |
| Tailwind v4 `@custom-variant` for theme CSS (v1.2.0) | Discovered during build as valid alternative to `@layer base`; scopes element styles to `.theme-{template}` container | ✓ Good — production verified |
| Play CDN for runtime Tailwind (v1.2.0) | Enables arbitrary user-authored utility classes without build-time scanning | ✓ Good — required for user-authored HTML classes |
| DOMPurify `ADD_ATTR: ['class']` (v1.2.0) | Required to let user class attributes survive sanitization before CDN resolves them | ✓ Good — PREV-03 blocker fix |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-21 after v1.3.0 milestone close*
