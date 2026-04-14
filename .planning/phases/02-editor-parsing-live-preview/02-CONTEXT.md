# Phase 2: Editor, Parsing & Live Preview - Context

**Gathered:** 2026-04-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the CodeMirror editor into the left pane and a live resume preview into the right pane. Parsing maps h1/h2/h3/bullets to resume structure. Three switchable templates (Classic, Modern, Minimal) restyle the preview instantly. Export and file storage are Phase 3.

Requirements: EDIT-01, EDIT-02, PARS-01, PARS-02, PARS-03, PARS-04, PREV-01, PREV-02, PREV-03

</domain>

<decisions>
## Implementation Decisions

### Editor
- **D-01:** CodeMirror (as specified in CLAUDE.md) for the editor — markdown syntax highlighting enabled
- **D-02:** Default starter content is a pre-filled sample resume so users immediately see the parsing in action (name, two sections, entries with bullets)
- **D-03:** Word wrap enabled — resume markdown lines often exceed screen width; horizontal scrolling would be painful

### Parsing
- **D-04:** Parser reads the markdown AST from markdown-it, then walks it to extract structured resume data: h1 → name, h2 → section, h3 → entry title, bullet list items directly under h3 → details
- **D-05:** Unrecognized markdown (plain paragraphs, bold/italic inline, blockquotes, hr) renders as-is inside whatever section it appears in — no content is silently dropped

### Live Preview
- **D-06:** Preview updates on every editor change (real-time) — debounce is Claude's call (a short delay like 100–150ms prevents thrashing on fast typing while still feeling instant)
- **D-07:** Editor and preview scroll independently — no scroll sync in Phase 2

### Template Switcher
- **D-08:** Dropdown select in the header (replaces the placeholder div from Phase 1) — options: Classic, Modern, Minimal
- **D-09:** Selected template persists to localStorage under key `md2cv-template`; defaults to Classic on first load

### Template Visual Vocabulary
- **D-10:** **Classic** — Serif typeface (Georgia or similar), formal layout, dense line spacing, section headers with an underline rule, black/white only
- **D-11:** **Modern** — Clean sans-serif (system-ui or Inter), more whitespace between sections, section headers bolded with a subtle left border or spacing rather than underline, still monochrome (no accent color)
- **D-12:** **Minimal** — Ultra-sparse whitespace, very light typography weights, section headers in all-caps small text, maximum breathing room — feels like a design portfolio CV

### Claude's Discretion
- Exact CodeMirror extensions to enable (line numbers, history, etc.)
- Debounce delay value (target: instant-feeling, 100–150ms range)
- Exact font stack within each template's vocabulary (Claude picks appropriate web-safe or system fonts)
- Preview empty state (before any h1 is present — Claude picks something clean)
- Tailwind class decisions within each template

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Project vision, core value, client-side-only constraint
- `.planning/REQUIREMENTS.md` — Full v1 requirements; EDIT-01/02, PARS-01–04, PREV-01–03 definitions
- `.planning/ROADMAP.md` — Phase 2 goal, success criteria, dependency on Phase 1

### Phase 1 decisions (established patterns)
- `.planning/phases/01-foundation-layout/01-CONTEXT.md` — Framework choices (React/Vite/Tailwind), split pane layout, localStorage usage pattern, header placeholder locations

No external specs — requirements fully captured in decisions above.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/App.tsx` — `editorPlaceholder` and `previewPlaceholder` divs are the mount targets; Phase 2 replaces these with real components
- `src/components/Header.tsx` — Has two placeholder divs: first (`w-24`) is the template switcher slot; second (`w-20`) is the export button slot (Phase 3). Phase 2 replaces the first with a real `<select>` dropdown
- `src/hooks/useMediaQuery.ts` — Already in use; can be reused if needed in editor/preview components
- `src/components/SplitPane.tsx` — Accepts `left` and `right` props; Phase 2 passes `<Editor>` and `<Preview>` components

### Established Patterns
- localStorage key naming: `md2cv-{feature}` (established by `md2cv-split-ratio` in Phase 1)
- State is lifted to `App.tsx` and passed down as props — follow same pattern for markdown content and selected template
- Tailwind utility classes only — no CSS modules or external CSS files

### Integration Points
- `App.tsx` will hold `markdownContent` (string state) and `selectedTemplate` (string state)
- Editor receives `markdownContent` + `onChange` handler
- Preview receives `markdownContent` + `selectedTemplate`
- Header dropdown receives `selectedTemplate` + `onTemplateChange` handler

</code_context>

<specifics>
## Specific Ideas

- Sample resume starter content should demonstrate all parsed elements: an h1 name, at least two h2 sections (e.g., Experience and Education), h3 entries with bullet details under each — so the preview immediately shows a full resume on first load
- Template switcher is a `<select>` element, not a custom widget — it should fit the dark header bar (white text or styled to match)
- The three templates are implemented as separate CSS class sets (or Tailwind class maps) applied to the preview container — not separate component files per template

</specifics>

<deferred>
## Deferred Ideas

- Scroll sync between editor cursor position and preview section — Phase 3 or backlog
- Spell check in editor — backlog
- Editor keyboard shortcuts (bold, italic shortcuts) — backlog
- Template color accent customization — out of scope for v1

</deferred>

---

*Phase: 02-editor-parsing-live-preview*
*Context gathered: 2026-04-14*
