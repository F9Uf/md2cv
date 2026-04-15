---
phase: 02-editor-parsing-live-preview
plan: "02"
subsystem: preview-templates
tags: [react, tailwind, template-switcher, live-preview, localstorage, debounce]
dependency_graph:
  requires: [src/types/resume.ts, src/lib/parseResume.ts, src/lib/sampleResume.ts, src/components/Editor.tsx]
  provides: [src/lib/templateStyles.ts, src/components/Preview.tsx]
  affects: [src/App.tsx, src/components/Header.tsx]
tech_stack:
  added: []
  patterns: [Tailwind class map per template, debounced state update (150ms useRef timer), localStorage allowlist validation]
key_files:
  created:
    - src/lib/templateStyles.ts
    - src/components/Preview.tsx
  modified:
    - src/components/Header.tsx
    - src/App.tsx
key_decisions:
  - "Three templates implemented as Tailwind class maps (not separate component files) keyed by TemplateName union type"
  - "debounceRef uses ReturnType<typeof setTimeout> to stay environment-agnostic (works in both browser and Node)"
  - "localStorage template value validated against explicit allowlist ('classic'|'modern'|'minimal') before use — T-02-07 mitigation"
  - "dangerouslySetInnerHTML used for extra/preamble fields — safe because markdown-it html:false (T-02-06 mitigation confirmed)"
metrics:
  duration: ~2 minutes
  completed: 2026-04-14T17:00:02Z
  tasks_completed: 3
  files_created: 2
  files_modified: 2
---

# Phase 02 Plan 02: Template Styles, Preview Component & App Wiring Summary

**One-liner:** Three-template Tailwind class map system with live Preview component wired through debounced parseResume into App.tsx, with template persistence via localStorage.

---

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create template styles and Preview component | 0cbb74c | src/lib/templateStyles.ts, src/components/Preview.tsx |
| 2 | Wire App.tsx state, Header template selector, and editor-parser-preview pipeline | 4164d15 | src/App.tsx, src/components/Header.tsx |
| 3 | Verify end-to-end editor-preview flow | (human-verify) | Visual approval — all EDIT/PARS/PREV requirements confirmed |

---

## Task 3: Human Verification — Approved

User visually verified the complete editor-to-preview pipeline and approved. All requirements confirmed:
- EDIT-01/02: CodeMirror editor with syntax highlighting and real-time updates
- PARS-01 through PARS-04: Markdown parsed correctly (name, sections, entries, bullets)
- PREV-01 through PREV-03: Styled resume, 3 distinct templates, instant switching
- Template persistence across page reload confirmed
- Mobile tabs functional with real content

---

## What Was Built

### Task 1: Template Styles + Preview Component

**`src/lib/templateStyles.ts`:** Defines `TemplateName` union type and `TemplateClasses` interface. `TEMPLATE_STYLES` record maps three templates to Tailwind class strings:
- **Classic:** `font-serif`, dense `leading-snug`, section headers with `border-b border-black` underline rule
- **Modern:** `font-sans`, relaxed `leading-relaxed`, section headers with `border-l-4 border-gray-800` left border and `uppercase tracking-wide`
- **Minimal:** `font-sans font-light`, `leading-loose`, section headers with `text-xs uppercase tracking-[0.25em]` in muted gray

**`src/components/Preview.tsx`:** Renders `ResumeData` using the selected template's class map:
- Empty state (`name === '' && sections.length === 0`) shows centered gray message "Start typing markdown to see your resume preview"
- `name` rendered in `<h1>`, `section.heading` in `<h2>`, `entry.title` in `<h3>`, bullet details as `<li>` items
- `preamble`, `section.extra`, `entry.extra` rendered via `dangerouslySetInnerHTML` (safe per T-02-06)

### Task 2: App Wiring + Header Dropdown

**`src/components/Header.tsx`:** Template switcher placeholder replaced with `<select>` dropdown. Accepts `selectedTemplate` and `onTemplateChange` props. Export button placeholder kept for Phase 3.

**`src/App.tsx`:**
- `markdownContent` state initialized with `SAMPLE_RESUME`
- `resumeData` state initialized with `parseResume(SAMPLE_RESUME)` (no flash of empty state on load)
- `debounceRef` (150ms) prevents rapid-fire parsing on fast typing
- `selectedTemplate` reads from localStorage with allowlist validation, defaults to `'classic'`
- `handleTemplateChange` persists to `localStorage.setItem('md2cv-template', template)`
- `Editor` + `Preview` wired into `SplitPane` (desktop) and `MobileTabs` (mobile)
- All Phase 2 placeholder divs removed

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Threat Surface Scan

No new network endpoints introduced. All code is client-side only.

- T-02-06 (XSS via dangerouslySetInnerHTML): Mitigated — `MarkdownIt()` called without `html: true` (confirmed in 02-01). Extra fields contain only markdown-it escaped output.
- T-02-07 (localStorage tampering): Mitigated — stored value validated against explicit `=== 'classic' || === 'modern' || === 'minimal'` allowlist in `useState` initializer.

---

## Known Stubs

None — Preview renders real data from the parser. Template switcher is functional.

---

## Self-Check: PASSED

Files verified present:
- src/lib/templateStyles.ts — FOUND
- src/components/Preview.tsx — FOUND
- src/components/Header.tsx (modified) — FOUND
- src/App.tsx (modified) — FOUND

Commits verified:
- 0cbb74c — Task 1 (feat(02-02): create template styles and Preview component)
- 4164d15 — Task 2 (feat(02-02): wire App.tsx state, Header template selector, and editor-parser-preview pipeline)

Build: `npm run build` exits 0 (chunk size warning from CodeMirror — expected, not an error)
TypeScript: `tsc -p tsconfig.app.json --noEmit` exits 0
