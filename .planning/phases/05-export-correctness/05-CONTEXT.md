# Phase 5: Export Correctness - Context

**Gathered:** 2026-04-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix PDF export (via `window.print()`) so that:
- Inline styles in bullet points (bold, italic, inline code, links) render correctly in the exported PDF — STYLE-05
- HTML content (inline and block) renders correctly in the exported PDF — HTML-03

The export mechanism is `window.print()` which prints the `#print-area` div containing `<Preview>`. Phase 4 already wired bullet details to use `dangerouslySetInnerHTML` in Preview.tsx, so HTML tags are already in the DOM. Phase 5 adds print-specific CSS and cleans up dead code.

</domain>

<decisions>
## Implementation Decisions

### Link display in exported PDF
- **D-01:** Suppress URL display in print — add `a[href]::after { content: none !important; }` (or equivalent) to the `@media print` block in `src/index.css`. Both plain URL links and Markdown-formatted `[text](url)` links render as `<a href>` tags, so this covers both cases. No href-detection logic needed — just suppress the URL suffix for all links in the print area.

### Inline code print styling
- **D-02:** `<code>` elements inside the print area should render with monospace font + subtle gray background in the PDF. Add print CSS targeting `#print-area code` with `font-family: monospace`, `background-color: #f3f4f6` (light gray, safe for print), and `padding: 1px 3px`. This applies across all three templates.

### ExportTarget component disposition
- **D-03:** Delete `src/components/ExportTarget.tsx` and `src/lib/templateInlineStyles.ts`. These are orphaned dead code — the actual PDF export uses `window.print()` via `Preview`, not html2pdf.js via ExportTarget. Remove any imports referencing these files.

### Claude's Discretion
- Whether to add any additional print CSS for `<strong>`, `<em>`, `<a>` (beyond URL suppression) — these use browser UA defaults which are appropriate (bold, italic, underlined)
- Whether to verify HTML rendering correctness via test markdown or trust the existing print CSS + Phase 4 wiring

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Export mechanism
- `src/App.tsx` — `handleExportPdf` uses `window.print()` (line ~76); `#print-area` div wraps Preview (line ~138)
- `src/index.css` — `@media print` block: hides app shell, shows `#print-area`, sets A4 page size

### Components to modify/delete
- `src/components/Preview.tsx` — Primary render component used in print area; uses Tailwind classes + `dangerouslySetInnerHTML` for bullet details
- `src/components/ExportTarget.tsx` — **DELETE** (orphaned, not used in export flow)
- `src/lib/templateInlineStyles.ts` — **DELETE** (only consumed by ExportTarget)

### Template styles
- `src/lib/templateStyles.ts` — Tailwind class maps for Preview; no print-specific inline element styles

### Requirements
- `.planning/REQUIREMENTS.md` — STYLE-05 (bullets in PDF), HTML-03 (HTML in PDF)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/index.css` `@media print` block: already hides app shell and shows `#print-area` — extend this block with new inline element styles
- `src/components/Preview.tsx`: already renders bullet details via `dangerouslySetInnerHTML={{ __html: detail }}` — no changes needed to rendering logic

### Established Patterns
- Print export is purely CSS-based (`window.print()`) — all fixes go in `@media print` in `src/index.css`
- Template styles use Tailwind classes in `templateStyles.ts` — print CSS should target elements by type (e.g., `#print-area code`) rather than Tailwind class names

### Integration Points
- `src/index.css` `@media print` is the only place to add print-specific styles
- No changes needed to React components for STYLE-05/HTML-03 — Phase 4 already wired the HTML rendering correctly

</code_context>

<specifics>
## Specific Ideas

- Link URL suppression: `#print-area a[href]::after { content: '' !important; }` or simply targeting `a::after` within print context
- Code styling: `#print-area code { font-family: monospace; background-color: #f3f4f6; padding: 1px 3px; border-radius: 2px; }`
- Deletion targets: `src/components/ExportTarget.tsx`, `src/lib/templateInlineStyles.ts`

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-export-correctness*
*Context gathered: 2026-04-16*
