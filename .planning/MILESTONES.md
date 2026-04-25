# Milestones

## v1.0 MVP (Shipped: 2026-04-15)

**Phases completed:** 3 phases, 6 plans, 5 tasks

**Key accomplishments:**

- Vite 5 + React 18 + TypeScript + Tailwind CSS v4 app shell scaffolded with full-height layout and branded header
- Responsive split-pane layout with drag-to-resize desktop view and mobile tabbed Editor/Preview toggle
- markdown-it token-walking parser + CodeMirror 6 editor with real-time onChange and typed ResumeData structure
- Three-template (Classic/Modern/Minimal) live preview system with debounced parsing and localStorage template persistence
- localStorage auto-save/restore (150ms debounce) with Blob-based markdown file download
- PDF export (html2pdf.js from hidden ExportTarget) and .md file import via FileReader API

---

## v1.1.0 Support text styles & HTML (Shipped: 2026-04-24)

**Phases completed:** 1 phase, 2 plans, 2 tasks

**Key accomplishments:**

- MarkdownIt configured with `html: true` and bullet details stored as rendered HTML strings via `md.renderInline()` — supports bold, italic, code, and link formatting in bullet points
- Preview.tsx and ExportTarget.tsx updated to render bullet detail items using `dangerouslySetInnerHTML`, consuming HTML strings from the parser

**Known deferred items at close: 4 (see STATE.md Deferred Items)**

---

## v1.2.0 Support render HTML with Tailwind classes (Shipped: 2026-04-26)

**Phases completed:** 2 phases, 5 plans

**Key accomplishments:**

- Token-walking parser replaced with `md.render()` — parseResume.ts reduced from ~120 lines to 5; ResumeData type eliminated entirely
- Template styles restructured from semantic keys to HTML element tags (h1, h2, h3, ul, li, code, a, etc.) across all three templates
- CSS theme architecture using Tailwind v4 `@custom-variant` — per-template scoped element styles in three CSS files
- Tailwind Play CDN added for runtime utility class resolution; DOMPurify configured with `ADD_ATTR: ['class']` to preserve user-authored classes
- Full browser verification: Classic/Modern/Minimal templates visually distinct; user-authored Tailwind classes render correctly

**Known deferred items at close: 1 (false positive — see STATE.md Deferred Items)**

---
