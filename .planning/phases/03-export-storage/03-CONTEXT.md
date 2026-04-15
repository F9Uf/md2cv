# Phase 3: Export & Storage - Context

**Gathered:** 2026-04-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Add PDF export, markdown download, localStorage auto-save, and .md file import. The resume preview and editor from Phase 2 are complete — Phase 3 wires in persistence and file I/O. No new parsing or template changes.

Requirements: EXPRT-01, EXPRT-02, STOR-01, STOR-02, STOR-03

</domain>

<decisions>
## Implementation Decisions

### PDF Export (EXPRT-01)
- **D-01:** Use html2pdf.js for PDF generation — captures DOM, preserves CSS template styles
- **D-02:** Export from a hidden fixed-width render target (794px, A4 width), NOT the visible preview pane — splitter position has zero effect on PDF output
- **D-03:** Hidden render target renders the same resume data as the visible preview, using the currently selected template styles
- **D-04:** Print-polished export: explicit A4 margins (~15mm all sides), `page-break-inside: avoid` on entry-level elements (h3 + bullets), forced white background — suitable for job applications
- **D-05:** Export button lives in the header (the `w-20` placeholder slot reserved in Phase 1)

### Markdown Download (EXPRT-02)
- **D-06:** Download the current editor markdown content as a `.md` file
- **D-07:** Filename derived from the h1 name if present (e.g., `# John Smith` → `john-smith.md`), fallback to `resume.md` — Claude handles the slugification logic
- **D-08:** Trigger via a button in the header alongside the PDF export button

### LocalStorage Auto-Save (STOR-01, STOR-02)
- **D-09:** Piggyback on the existing 150ms debounce — save to localStorage after debounce fires (no separate interval)
- **D-10:** localStorage key: `md2cv-content` (follows existing pattern `md2cv-{feature}`)
- **D-11:** On page load, restore content from `md2cv-content` if present; otherwise use SAMPLE_RESUME default
- **D-12:** Silent fail on localStorage errors (full storage, private browsing) — no user notification in v1

### Import .md File (STOR-03)
- **D-13:** Import control lives in the header alongside export controls
- **D-14:** Clicking import opens a native file picker (`<input type="file" accept=".md">`)
- **D-15:** Imported file content replaces editor content immediately — no confirm prompt (localStorage auto-save means current content is already persisted before user can trigger import)

### Claude's Discretion
- Exact margin values within the ~15mm target (Claude picks values that look right in html2pdf.js)
- Which specific elements get `page-break-inside: avoid` (entries, sections, or both)
- Header layout for 3 controls (template switcher + import + export) — Claude arranges to fit the dark header bar
- Whether import and export are grouped or separated visually in the header

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Project vision, client-side-only constraint, core value
- `.planning/REQUIREMENTS.md` — EXPRT-01/02, STOR-01/02/03 definitions
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria

### Prior phase decisions (established patterns)
- `.planning/phases/01-foundation-layout/01-CONTEXT.md` — localStorage key pattern (`md2cv-{feature}`), header placeholder slots
- `.planning/phases/02-editor-parsing-live-preview/02-CONTEXT.md` — State in App.tsx, debounce pattern, template architecture, existing component structure

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/App.tsx` — holds `markdownContent` state and `handleMarkdownChange` (with 150ms debounce); localStorage save hooks in here; also holds `resumeData` (parsed) for the hidden export render target
- `src/components/Header.tsx` — has a `w-20` placeholder slot for the export button (Phase 1); Phase 3 replaces it with export + import controls
- `src/components/Preview.tsx` — receives `resumeData` + `template`; the hidden export div will reuse the same component or its template styles
- `src/lib/templateStyles.ts` — template CSS class maps; export render target uses the same classes

### Established Patterns
- localStorage key naming: `md2cv-{feature}` (e.g., `md2cv-split-ratio`, `md2cv-template`)
- State lifted to `App.tsx`, passed as props
- Tailwind utility classes only — no CSS modules
- Silent try/catch on all localStorage calls (established in Phase 1 + 2)
- Debounce via `useRef<ReturnType<typeof setTimeout>>` (established in Phase 2)

### Integration Points
- `App.tsx`: add localStorage save inside the existing debounce callback; add localStorage restore in the `markdownContent` useState initializer
- `Header.tsx`: replace the `w-20` export placeholder with real controls (export PDF, export .md, import .md)
- New hidden div: rendered in `App.tsx` or a dedicated `ExportTarget` component, always present in DOM at 794px width, visually hidden (`position: absolute; left: -9999px` or similar)

</code_context>

<specifics>
## Specific Ideas

- The hidden export render target should be off-screen (not `display: none` — html2pdf.js needs the element to be rendered to capture it correctly)
- Import uses a hidden `<input type="file">` triggered by a visible button click — no custom drag-and-drop UI
- The h1-derived filename should be URL-safe: lowercase, spaces → hyphens, strip special characters

</specifics>

<deferred>
## Deferred Ideas

- Drag-and-drop .md import onto editor — backlog
- "Replace current content?" confirm on import — could add later if users find accidental overwrites frustrating
- localStorage full/quota error notification — v2
- Multiple named resumes / file management — out of scope for v1 (personal tool)
- Page count / pagination control for multi-page resumes — backlog

</deferred>

---

*Phase: 03-export-storage*
*Context gathered: 2026-04-15*
