# md2cv

## What This Is

md2cv is a personal single-page web application that lets you write your resume in Markdown and instantly see it rendered as a styled resume. It parses markdown structure (h1 = name, h2 = sections, h3 = entries, bullets = details) into a live preview with three switchable templates, and exports the result as a PDF — all in the browser, no server needed.

## Core Value

Write your resume in plain Markdown, see it rendered beautifully in real time, export to PDF — zero friction, zero backend.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] CodeMirror markdown editor in left pane
- [ ] Live resume preview in right pane (updates as you type)
- [ ] markdown-it parsing: h1 = name, h2 = sections, h3 = entries, bullets = details
- [ ] Three switchable resume templates: Classic, Modern, Minimal
- [ ] Client-side PDF export (html2pdf.js or jsPDF)
- [ ] LocalStorage auto-save (persist content between sessions)
- [ ] Import .md file from disk
- [ ] Export current markdown as .md file
- [ ] Responsive layout: tabs (Editor / Preview) on mobile

### Out of Scope

- User accounts / cloud sync — personal tool, no backend needed
- Server-side rendering — 100% client-side by design
- Custom template builder — three fixed templates is sufficient for v1
- Real-time collaboration — single-user personal tool

## Context

- Personal website project, built for the author's own use
- Entirely client-side (SPA) — no backend, no auth, no database
- Markdown parsing convention is fixed: h1 = name, h2 = section headers, h3 = entry titles, bullet lists = detail items
- PDF export must be print-quality (suitable for job applications)
- Three templates cover the spectrum: Classic (traditional), Modern (design-forward), Minimal (clean/simple)

## Constraints

- **Client-side only**: No server, no backend — everything runs in the browser
- **No auth**: Personal tool — no login, no user management
- **Tech stack**: markdown-it for parsing, CodeMirror for editor, html2pdf.js or jsPDF for PDF export

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| markdown-it for parsing | Specified by user; well-maintained, extensible | — Pending |
| CodeMirror for editor | Specified by user; syntax highlighting, markdown-aware | — Pending |
| Client-side PDF export | No server dependency; html2pdf.js/jsPDF are mature options | — Pending |
| LocalStorage + import/export | Best of both worlds — auto-persists and allows .md portability | — Pending |
| Mobile: tab layout | Cleaner UX than vertical stack on small screens | — Pending |

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
*Last updated: 2026-04-14 after initialization*
