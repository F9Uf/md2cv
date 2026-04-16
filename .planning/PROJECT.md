# md2cv

## What This Is

md2cv is a personal single-page web application that lets you write your resume in Markdown and instantly see it rendered as a styled resume. It parses markdown structure (h1 = name, h2 = sections, h3 = entries, bullets = details) into a live preview with three switchable templates (Classic, Modern, Minimal), and exports the result as a PDF or .md file — all in the browser, no server needed.

## Core Value

Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.

## Current Milestone: v1.1.0 Support text styles & HTML

**Goal:** Enable inline markdown styles in bullet points and full HTML rendering throughout the resume markdown.

**Target features:**
- Inline styles in bullets: bold, italic, inline code, links rendered in preview and PDF export
- Full HTML support everywhere: enable `html: true` on markdown-it so any inline or block HTML renders in preview and export
- ExportTarget (PDF path) updated to handle HTML content correctly

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

### Active

- Inline markdown styles in bullet points (bold, italic, inline code, links) rendered in preview and PDF export — v1.1.0
- Full HTML rendering everywhere via `html: true` on markdown-it — v1.1.0
- ExportTarget (PDF path) updated to handle HTML content correctly — v1.1.0

### Out of Scope

- User accounts / cloud sync — personal tool, no backend needed
- Server-side rendering — 100% client-side by design
- Custom template builder — three fixed templates is sufficient for v1
- Real-time collaboration — single-user personal tool

## Context

Shipped v1.0 MVP with ~1,050 LOC TypeScript/TSX.

**Tech stack:** Vite 5, React 18, TypeScript, Tailwind CSS v4, CodeMirror 6, markdown-it, html2pdf.js

**Known technical debt:**
- html2pdf.js uses an old html2canvas that crashes on oklch color functions — worked around by creating a parallel `templateInlineStyles.ts` with hex/rgb CSSProperties for the ExportTarget component. If Tailwind or the template styles change significantly, ExportTarget must be kept in sync manually.
- Plan 02-02 has `**Plans**: TBD` in the ROADMAP archive (was set before planning ran) — cosmetic only.

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
*Last updated: 2026-04-16 — Milestone v1.1.0 started*
