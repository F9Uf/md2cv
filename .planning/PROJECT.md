# md2cv

## What This Is

md2cv is a personal single-page web application that lets you write your resume in Markdown and instantly see it rendered as a styled resume. It parses markdown structure (h1 = name, h2 = sections, h3 = entries, bullets = details) into a live preview with three switchable templates (Classic, Modern, Minimal), and exports the result as a PDF or .md file — all in the browser, no server needed. Bullet points and inline text support full markdown formatting (bold, italic, code, links) and arbitrary HTML.

## Core Value

Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.

## Current Milestone: v1.2.0 Support render HTML with Tailwind classes

**Goal:** Users can write HTML elements with Tailwind utility classes directly in their markdown and have them render correctly in the live preview.

**Target features:**
- `parseResume.ts` simplified to use `md.render()` — outputs raw HTML string
- `templateStyles.ts` re-keyed by HTML element tag (`h1`, `h2`, `h3`, `ul`, `li`, `code`, `a`, etc.)
- Preview updated to apply Tailwind classes to elements by tag type and render user-authored HTML with working Tailwind classes
- Tailwind available at runtime in the preview so arbitrary user-authored classes work correctly

## Current State

**Shipped:** v1.1.0 — Support text styles & HTML (2026-04-24)

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

- [ ] Use `md.render()` for HTML output instead of token-walking parser — v1.2.0
- [ ] Template styles keyed by HTML element tag (h1, h2, h3, ul, li, code, a, etc.) — v1.2.0
- [ ] Preview applies Tailwind classes to elements by tag type — v1.2.0
- [ ] Tailwind runtime support so user-authored HTML classes work in preview — v1.2.0

### Out of Scope

- User accounts / cloud sync — personal tool, no backend needed
- Server-side rendering — 100% client-side by design
- Custom template builder — three fixed templates is sufficient for v1
- Real-time collaboration — single-user personal tool
- Sanitizing/restricting HTML — personal tool, single user, no XSS concern
- PDF export correctness for inline styles/HTML (STYLE-05, HTML-03) — dropped with Phase 5

## Context

Shipped v1.1.0 with ~1,100 LOC TypeScript/TSX.

**Tech stack:** Vite 5, React 18, TypeScript, Tailwind CSS v4, CodeMirror 6, markdown-it, html2pdf.js

**Known technical debt:**
- html2pdf.js uses an old html2canvas that crashes on oklch color functions — worked around by creating a parallel `templateInlineStyles.ts` with hex/rgb CSSProperties for the ExportTarget component. If Tailwind or the template styles change significantly, ExportTarget must be kept in sync manually.
- Dark mode for CodeMirror editor — quick task dropped from v1.1.0, carry forward if desired.

## Constraints

- **Client-side only**: No server, no backend — everything runs in the browser
- **No auth**: Personal tool — no login, no user management
- **Node.js**: Project machine runs v20.11.0 — use Vite 5 (not 6+) which requires ^20.19.0

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| markdown-it for parsing | Specified by user; well-maintained, extensible | ✓ Good — token walker works cleanly |
| CodeMirror 6 for editor | Specified by user; syntax highlighting, markdown-aware | ✓ Good — controlled-ish pattern with isInternalChange ref works well |
| Client-side PDF via html2pdf.js | No server dependency; mature option | ⚠ Revisit — oklch crash required inline style workaround; consider alternatives for v2 |
| LocalStorage + import/export | Best of both worlds — auto-persists and allows .md portability | ✓ Good |
| Mobile: tabbed layout | Cleaner UX than vertical stack on small screens | ✓ Good — Editor default tab is correct |
| Tailwind CSS v4 via @tailwindcss/vite | No postcss.config.js needed | ✓ Good — clean setup |
| Three templates as Tailwind class maps | Simpler than separate component files | ✓ Good — but ExportTarget needs parallel inline-style map |
| Vite 5 (not latest) | Node.js v20.11.0 engine constraint | ✓ Correct — stable LTS-track version |
| html: true on MarkdownIt | Enable inline HTML and proper inline style rendering | ✓ Good — XSS accepted (personal tool) |
| md.renderInline() for bullet details | Converts inline markdown to HTML without wrapping `<p>` tags | ✓ Good — clean output for list items |
| dangerouslySetInnerHTML for detail `<li>` | Consistent with existing `extra` field pattern in Preview/ExportTarget | ✓ Good |

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
*Last updated: 2026-04-24 after v1.1.0 milestone*
