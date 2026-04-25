# Phase 5: Parser Simplification & Template Restructure - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the token-walking parser with `md.render()` returning a raw HTML string, and restructure `templateStyles.ts` to be keyed by HTML element tag. Preview.tsx becomes a thin stub in this phase — element-level class application is deferred to Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Parser Output Shape
- **D-01:** `parseResume()` returns a raw HTML string — `md.render(markdown)` directly. The `ResumeData` type and structured parsing are removed entirely.
- **D-02:** `App.tsx` passes the HTML string to `Preview.tsx` (not `ResumeData`). The `resume.ts` types file can be removed if no other consumers exist.

### Preview.tsx Changes (Phase 5)
- **D-03:** Preview.tsx becomes a minimal stub — renders the HTML string in a container div via `dangerouslySetInnerHTML`. Only `container` key from the template map is applied in Phase 5.
- **D-04:** Element-level class application (applying h1/h2/li etc. classes from the new template map) is NOT done in Phase 5 — that is Phase 6 work.

### Template Style Keys
- **D-05:** `templateStyles.ts` is restructured to a map keyed by HTML element tag. Required keys: `container`, `h1`, `h2`, `h3`, `p`, `ul`, `ol`, `li`, `code` (inline), `pre` (fenced block), `a`, `blockquote`, `hr`.
- **D-06:** The old semantic keys (`name`, `sectionHeading`, `entryTitle`, `entryDetail`, `detailList`, `preamble`, `extra`) are removed and replaced with the element-keyed format.
- **D-07:** All three templates (Classic, Modern, Minimal) must be expressed in the new format. The Tailwind class values should be chosen to preserve the existing visual output as closely as possible (e.g., old `name` → new `h1`, old `sectionHeading` → new `h2`).

### Regression Strategy
- **D-08:** Update `parseResume.test.ts` to expect an HTML string output instead of `ResumeData`. Use existing test cases where possible.
- **D-09:** Create snapshot tests for each template's rendered output before implementing the changes (test-first). Snapshots serve as the regression baseline.

### Claude's Discretion
- Exact Tailwind class values for the new element keys — map old semantic values to the closest tag equivalents, preserving visual intent.
- Whether `parseResume.ts` keeps its filename or is renamed (e.g., `renderResume.ts`) to reflect the new return type.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Implementation
- `src/lib/parseResume.ts` — current token-walking parser to be replaced
- `src/lib/templateStyles.ts` — current semantic-keyed styles to be restructured
- `src/components/Preview.tsx` — current JSX-tree renderer, becomes HTML stub
- `src/types/resume.ts` — ResumeData type (likely removed in this phase)
- `src/App.tsx` — wires parseResume → Preview, needs API update

### Tests
- `src/lib/parseResume.test.ts` — existing unit tests, must be updated to expect HTML string

### Requirements
- `.planning/REQUIREMENTS.md` §PARSER-01, PARSER-02, TMPL-01, TMPL-02

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MarkdownIt` singleton in `parseResume.ts` (with `html: true`) — keep as-is, just call `.render()` instead of `.parse()` + token-walking
- `TEMPLATE_STYLES` export shape — rename/restructure the interface and object, same export name is fine

### Established Patterns
- `dangerouslySetInnerHTML` already used in `Preview.tsx` for `preamble`, `extra`, and `entry.extra` fields — consistent with switching the whole preview to it
- Tailwind classes are already used throughout — no new tooling needed for Phase 5

### Integration Points
- `App.tsx` calls `parseResume(markdown)` and passes result to `<Preview resumeData={...} />` — both the function signature and the prop name change in this phase
- `parseResume.test.ts` — currently tests `ResumeData` structure; needs to be rewritten to test HTML string output

</code_context>

<specifics>
## Specific Ideas

- The mapping from old keys to new element tags: `name → h1`, `sectionHeading → h2`, `entryTitle → h3`, `entryDetail → li`, `detailList → ul`, `preamble/extra → p` (or let Phase 6 handle fine-grained preamble styling)
- Snapshot tests should be created for each of the three templates against the sample resume content before any implementation begins

</specifics>

<deferred>
## Deferred Ideas

- Applying element-level Tailwind classes in the Preview DOM — Phase 6 (PREV-01, PREV-02)
- Tailwind runtime for user-authored classes — Phase 6 (PREV-03)
- None of the discussion surfaced out-of-scope ideas

</deferred>

---

*Phase: 05-parser-simplification-template-restructure*
*Context gathered: 2026-04-25*
