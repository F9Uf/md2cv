# Phase 6: Tailwind-Powered Preview Rendering - Context

**Gathered:** 2026-04-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Apply element-level styling to the rendered HTML preview using scoped CSS selectors per theme, and enable Tailwind Play CDN at runtime so user-authored Tailwind utility classes work in the preview.

</domain>

<decisions>
## Implementation Decisions

### Styling Architecture (replaces class-injection approach)
- **D-01:** Template styles are moved from TypeScript class strings to CSS files using scoped selectors + `@apply`. Example: `.theme-classic h1 { @apply text-xl font-bold text-center mb-1; }`.
- **D-02:** `templateStyles.ts` is simplified to hold only the container class string per template (e.g., `container: 'theme-classic max-w-[800px] mx-auto p-8'`). The element-keyed strings (`h1`, `h2`, `h3`, etc.) added in Phase 5 are removed from the TS file and re-expressed in CSS.
- **D-03:** Preview.tsx applies the container class (including the theme class) to the wrapper div. The CSS cascade handles all element styling — no DOM walking, no class injection in JavaScript.

### CSS File Structure
- **D-04:** One CSS file per theme (e.g., `theme-classic.css`, `theme-modern.css`, `theme-minimal.css`), or a single file with scoped blocks — planner's choice based on what's cleanest to maintain.
- **D-05:** Template element styles are wrapped in `@layer base` so Tailwind utility classes (from the Play CDN or build-time) always win in the cascade, regardless of selector specificity.

### Tailwind Runtime (user-authored classes)
- **D-06:** Add the Tailwind Play CDN script to `index.html`: `<script src="https://cdn.tailwindcss.com"></script>`. This enables arbitrary user-authored classes (e.g., `<div class="text-red-500">`) to render correctly at runtime without requiring build-time scanning of user content.

### Style Priority
- **D-07:** User-authored Tailwind utility classes WIN over template element styles. This is achieved structurally by wrapping template styles in `@layer base` (D-05) — the Play CDN outputs utilities in `@layer utilities` which is higher in the cascade. No additional specificity tricks needed.

### Regression Strategy
- **D-08:** Update Phase 5 snapshot tests if the HTML string output from `parseResume()` changes in this phase (unlikely, but check). Visual correctness is verified by spot-checking the sample resume in the browser across all three templates after implementation. Unit-testing CSS output is impractical and not required.

### Claude's Discretion
- Whether to use one combined CSS file or separate files per theme.
- Exact container class name convention for the theme class (e.g., `theme-classic` vs `preview-classic` vs `md2cv-classic`).
- Whether `templateStyles.ts` is kept as a TS file (with just the container string) or converted to a simple mapping object inline in Preview.tsx.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing Implementation
- `src/components/Preview.tsx` — current stub (renders HTML via dangerouslySetInnerHTML, applies only `styles.container`)
- `src/lib/templateStyles.ts` — current element-keyed TS class map (element keys `h1`–`hr` to be migrated to CSS)
- `src/App.tsx` — passes `htmlContent` + `template` to Preview
- `index.html` — where the Play CDN script tag goes

### Tests
- `src/lib/parseResume.test.ts` — snapshot tests from Phase 5 (update if HTML output changes)

### Requirements
- `.planning/REQUIREMENTS.md` §PREV-01, PREV-02, PREV-03

### Phase 5 Context (prior decisions)
- `.planning/phases/05-parser-simplification-template-restructure/05-CONTEXT.md` — D-03 established Preview as HTML stub; D-05/D-06/D-07 defined the element-keyed TS format that Phase 6 now migrates to CSS

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `TEMPLATE_STYLES` in `templateStyles.ts` — container string remains; element keys (`h1`–`hr`) migrate to CSS `@apply` rules
- `TemplateName` type (`'classic' | 'modern' | 'minimal'`) — unchanged, used to select the theme class on the container

### Established Patterns
- `dangerouslySetInnerHTML` already in use in Preview.tsx — no change needed; CSS cascade does the work
- Tailwind v4 via `@tailwindcss/vite` already set up — `@layer base` / `@layer utilities` are supported natively

### Integration Points
- Preview.tsx container div: add `theme-{templateName}` class alongside container layout classes
- `index.html`: add Play CDN `<script>` tag
- `templateStyles.ts`: strip element keys, keep container string only

</code_context>

<specifics>
## Specific Ideas

- The Play CDN script should be added with `defer` or after the app bundle to avoid conflicting with Vite's build-time Tailwind processing for the editor UI.
- The `@layer base` wrapper ensures predictable cascade behavior without any `!important` hacks.
- Theme CSS class naming (e.g., `theme-classic`) should avoid colliding with existing app Tailwind classes.

</specifics>

<deferred>
## Deferred Ideas

- ExportTarget / PDF export updated for the new CSS-based style system — deferred to a future milestone (already noted in REQUIREMENTS.md Out of Scope)
- Dark mode for CodeMirror editor — carried forward from v1.1.0, not in this milestone

</deferred>

---

*Phase: 06-tailwind-powered-preview-rendering*
*Context gathered: 2026-04-25*
