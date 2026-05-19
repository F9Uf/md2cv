# Phase 10: Unified Pixel-Perfect PDF Pipeline - Pattern Map

**Mapped:** 2026-05-20
**Files analyzed:** 6 (all modified, none created)
**Analogs found:** 6 / 6 (every file's analog is its own current state — this is a refactor of existing surfaces)

## File Classification

| Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---------------|------|-----------|----------------|---------------|
| `src/App.tsx` | React component (root) | request-response (props plumbing) | `src/App.tsx` (current) | self (refactor in place) |
| `src/components/Preview.tsx` | React component | event-driven (paged.js reflow) | `src/components/Preview.tsx` (current) | self (no logic change; second instance) |
| `src/index.css` | global CSS | declarative print rules | `src/index.css` (current `@media print` block) | self (refactor in place) |
| `src/styles/pages.css` | global CSS (paged.js chrome) | declarative print rules | `src/styles/pages.css` (current `@media print` block) | self (additive print rule) |
| `package.json` | package manifest | n/a | `package.json` (current) | self (dep removal) |
| `README.md` | docs | n/a | `README.md` line 32 | self (single-line edit) |
| `CLAUDE.md` | docs | n/a | `CLAUDE.md` line 14 (PROJECT block) | self (single-line edit) |

## Pattern Assignments

### `src/App.tsx` (React component, request-response)

**Analog:** `src/App.tsx` (current state — refactor in place)

**Margins state pattern** (lines 36-49) — already typed, already validated on read, already persisted. Flows unchanged into BOTH `<Preview>` instances:

```typescript
const [margins, setMargins] = useState<MarginValues>(() => {
  try {
    const stored = localStorage.getItem('md2cv-margins')
    if (stored) {
      const parsed = JSON.parse(stored) as Record<string, unknown>
      const top    = typeof parsed.top    === 'number' && parsed.top    >= 0 && parsed.top    <= 50 ? parsed.top    : 15
      const right  = typeof parsed.right  === 'number' && parsed.right  >= 0 && parsed.right  <= 50 ? parsed.right  : 15
      const bottom = typeof parsed.bottom === 'number' && parsed.bottom >= 0 && parsed.bottom <= 50 ? parsed.bottom : 15
      const left   = typeof parsed.left   === 'number' && parsed.left   >= 0 && parsed.left   <= 50 ? parsed.left   : 15
      return { top, right, bottom, left }
    }
  } catch { /* ignore */ }
  return DEFAULT_MARGINS
})
```

**On-screen Preview invocation** (line 138) — UNCHANGED in this phase:

```typescript
const preview = <Preview htmlContent={htmlContent} template={selectedTemplate} margins={margins} />
```

**`handleExportPdf` pattern** (lines 90-96) — KEEP VERBATIM. The h1 → document.title trick stays as the default-PDF-filename mechanism; only `window.print()` semantics change (because the print-mount is now paged.js-rendered):

```typescript
const handleExportPdf = useCallback(() => {
  const nameMatch = markdownContent.match(/^#\s+(.+)/m)
  const originalTitle = document.title
  if (nameMatch) document.title = nameMatch[1].trim()
  window.print()
  document.title = originalTitle
}, [markdownContent])
```

**Current `#print-area` mount** (lines 165-167) — THIS IS WHAT CHANGES. Flip `enablePagination` from `false` to `true`; optionally add `aria-hidden`:

```typescript
<div id="print-area">
  <Preview htmlContent={htmlContent} template={selectedTemplate} enablePagination={false} margins={margins} />
</div>
```

After Phase 10 (target pattern — `enablePagination` flipped, `onPageCountChange` deliberately omitted per CONTEXT.md "Reusable Assets"):

```typescript
<div id="print-area" aria-hidden="true">
  <Preview htmlContent={htmlContent} template={selectedTemplate} enablePagination={true} margins={margins} />
</div>
```

Note: `enablePagination` defaults to `true` in `Preview.tsx:21` — the prop can be omitted entirely if preferred. Same effect either way.

---

### `src/components/Preview.tsx` (React component, event-driven)

**Analog:** `src/components/Preview.tsx` (current state — NO LOGIC CHANGE; the print-mount uses the existing code path)

**Component contract** (lines 10-24) — no signature change is required for this phase. D-06 explicitly rejected a `forPrint` prop. Keep as-is:

```typescript
interface PreviewProps {
  htmlContent: string
  template: TemplateName
  enablePagination?: boolean
  onPageCountChange?: (n: number) => void
  margins?: MarginValues
}

export default function Preview({
  htmlContent,
  template,
  enablePagination = true,
  onPageCountChange,
  margins = DEFAULT_MARGINS,
}: PreviewProps) {
```

**Paged.js render effect — the shared code path both Previewers go through** (lines 38-97). This is the load-bearing block: the print-mount instance reaches this code via `enablePagination={true}`. NO EDITS HERE — Phase 10 simply exercises this path twice (once per `<Preview>` instance):

```typescript
useEffect(() => {
  if (!enablePagination) return
  if (!htmlContent.trim()) return
  const root = previewerRootRef.current
  if (!root) return

  let cancelled = false
  let activePreviewer: Previewer | null = null

  root.innerHTML = '' // clear leftover pagesArea from previous render (RESEARCH.md §Pitfall 3)
  setHasError(false)
  setPageCount(null) // reset so scaleReady gates re-arm on content change

  ;(async () => {
    // StrictMode dev double-mount safety. ... (full comment preserved)
    await Promise.resolve()
    if (cancelled) return
    try {
      const safeHtml = DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] })
      const wrapper = document.createElement('div')
      wrapper.innerHTML = `<div class="theme-${template} ${styles.container}">${safeHtml}</div>`

      const previewer = new Previewer()
      activePreviewer = previewer

      const flow = await previewer.preview(
        wrapper,
        [{ pagedjs_inline: `@page { size: A4 portrait; margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm; }` }],
        root,
      )
      if (cancelled) return

      const count = flow.pages.length
      setPageCount(count)
      onPageCountChange?.(count)
    } catch (err) {
      console.error('paged.js render failed', err)
      if (!cancelled) setHasError(true)
    }
  })()

  return () => {
    cancelled = true
    if (activePreviewer) {
      try { activePreviewer.polisher?.destroy() } catch { /* ignore */ }
      try { activePreviewer.chunker?.destroy() } catch { /* ignore */ }
    }
  }
}, [htmlContent, template, enablePagination, styles.container, onPageCountChange, margins])
```

Key reuse facts the planner relies on:
- Line 76 — the `pagedjs_inline` stylesheet injects the dynamic `@page` rule built from `margins`. The print-mount uses this same line via the second invocation (D-04).
- Line 59 — `await Promise.resolve()` StrictMode yield works independently per instance (CONTEXT.md "StrictMode dev double-mount" constraint).
- Lines 93-94 — `polisher.destroy() / chunker.destroy()` cleanup runs per-instance.
- Dependency list at line 97 — never includes `scale`, never includes zoom state (Phase 9 D-08 inheritance).

**Mobile zoom path** (lines 158-162) — the print-mount inherits this via the same component. The Phase 9 `@media print { .pagedjs-scale-wrapper { zoom: 1 !important } }` rule in `pages.css` defeats the inline `zoom: 0.5` at print time. KEEP this code; the `!important` cascade rule keeps it harmless during print (D-06):

```typescript
const effectiveZoom = isMobile ? 0.5 : scale
const zoomReady = pageCount !== null
const zoomStyle = zoomReady && effectiveZoom < 1
  ? { zoom: effectiveZoom, marginLeft: 'auto', marginRight: 'auto' }
  : undefined

return (
  <div ref={scrollContainerRef} className="relative h-full overflow-auto bg-gray-100 px-4 py-6">
    <div className="pagedjs-scale-wrapper" style={zoomStyle}>
      <div ref={previewerRootRef} />
    </div>
    <div
      className="sticky bottom-4 right-4 ml-auto inline-block bg-gray-900/85 text-white text-xs font-medium leading-tight px-2 py-1 rounded-md"
      aria-live="polite"
    >
      {pillLabel}
    </div>
  </div>
)
```

The "Page X of N" pill (lines 169-174) and `bg-gray-100` scroll container (line 165) emit into the print-mount too — but the print-mount lives inside `#print-area`, which the print engine views *without* `#app-shell` chrome. D-07 confirms no extra rules are required to hide these.

**Non-paginated fallback path** (lines 140-147) — IMPORTANT: when Phase 10 flips the print-mount to `enablePagination={true}`, this branch is no longer the print-mount's primary code path. It remains as the silent fallback when paged.js throws (`hasError === true`). Preserve verbatim:

```typescript
if (!enablePagination || hasError) {
  return (
    <div
      className={`theme-${template} ${styles.container}`}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] }) }}
    />
  )
}
```

---

### `src/index.css` (global CSS, declarative print rules)

**Analog:** `src/index.css` (current state — lines 3-38)

**Current `@media print` block + screen-side hide rule** (full file, lines 1-38):

```css
@import "tailwindcss";

@media print {
  /* Hide the entire app shell (header, editor, splitter) */
  #app-shell {
    display: none !important;
  }

  /* Hide the hidden file input */
  input[type="file"] {
    display: none !important;
  }

  /* Show only the print area */
  #print-area {
    display: block !important;
    width: 100%;
    margin: 0;
    padding: 0;
  }

  /* Reset page for A4 */
  @page {
    size: A4 portrait;
    margin: 15mm;
  }

  body {
    background: white !important;
    margin: 0;
    padding: 0;
  }
}

/* Hide print area from screen */
#print-area {
  display: none;
}
```

**Edits Phase 10 makes (per D-03, D-04, D-04a):**

1. **DELETE** lines 22-26 — the static `@page { size: A4 portrait; margin: 15mm }` rule. Per D-04 this collides with the dynamic value paged.js manages.
2. **REPLACE** the deletion with `@page { size: A4 portrait; margin: 0 }` inside the same `@media print` block (D-04a) so the browser print engine doesn't add a second physical gutter over the margins paged.js already baked inside each `.pagedjs_page`.
3. **REPLACE** screen rule `#print-area { display: none }` (lines 36-38) with off-screen positioning so paged.js has real layout to measure (D-03). Target shape:
   ```css
   #print-area {
     position: absolute;
     left: -9999px;
     top: 0;
     width: 210mm;
   }
   ```
4. **ADD** inside the `@media print` block — neutralize the off-screen offset for the print engine (D-03):
   ```css
   #print-area {
     /* existing display: block !important; etc remain */
     position: static;
     left: auto;
   }
   ```
   (Merge with the existing `#print-area { display: block !important; width: 100%; margin: 0; padding: 0 }` rule rather than declaring a second rule for the same selector.)

Note (Claude's Discretion per CONTEXT.md): planner may also place the new `@page { margin: 0 }` rule inside `pages.css` instead of `index.css` if it keeps related CSS coherent. CONTEXT.md "Established Patterns" recommends keeping the rule in `index.css` "alongside its `#app-shell { display: none }` neighbour."

---

### `src/styles/pages.css` (global CSS, paged.js chrome)

**Analog:** `src/styles/pages.css` (current state — lines 33-50, the `@media print` defensive block)

**Current `@media print` block** (lines 33-50) — this is the load-bearing rule for mobile PDF parity (D-06). DO NOT WEAKEN. The Phase 10 addition is just the `margin-bottom: 0` line, which is already present (line 37):

```css
@media print {
  .pagedjs_page {
    box-shadow: none;
    border: none;
    margin-bottom: 0;
  }

  /* Phase 9 (ZOOM-01) defensive reset: if the on-screen scale wrapper ever
   * reaches a print context, strip the transform and computed height so the
   * page prints at 1:1. The inline transform is applied by Preview.tsx only
   * when scale < 1 (i.e. only on screen during pane resize), so this rule
   * is purely defensive. */
  .pagedjs-scale-wrapper {
    zoom: 1 !important;
    transform: none !important;
    height: auto !important;
  }
}
```

**Edits Phase 10 makes:** Per D-07 the `.pagedjs_page { margin-bottom: 0 }` line is "the only new piece" — but it is **already present** on line 37. Re-verify it survives the refactor; no rewrite needed. If the planner consolidates CSS, ensure the Phase 9 `.pagedjs-scale-wrapper` rule (lines 45-49) is preserved verbatim — D-06 says it is the load-bearing mechanism for mobile PDF parity.

---

### `package.json` (package manifest)

**Analog:** `package.json` (current state — lines 24, 34)

**Dependencies to remove** (D-05):

```json
// Line 24 in "dependencies":
"html2pdf.js": "^0.14.0",
```

```json
// Line 34 in "devDependencies":
"@types/html2pdf.js": "^0.10.0",
```

After removal, regenerate `package-lock.json` via `npm install` (no version bumps to any other deps).

**Adjacent dependency pattern preserved** — the `dompurify` (line 23) and `pagedjs` (line 26) entries flank the removed `html2pdf.js` entry; preserve their alphabetic ordering after deletion.

---

### `README.md` (docs)

**Analog:** `README.md` line 32

**Current line:**

```markdown
- **html2pdf.js / jsPDF** — client-side PDF export
```

**Replace with** (CONTEXT.md D-05; exact wording is Claude's Discretion — target a short phrase reflecting "browser-native print over paged.js DOM"). Sample shape:

```markdown
- **paged.js + browser print** — paginated DOM rendered in-browser, exported via the browser's native Save-as-PDF
```

Surrounding tech-stack block (lines 25-32) preserved verbatim:

```markdown
## Tech stack

- **React + Vite** — UI framework and build tool
- **TypeScript** — type safety throughout
- **Tailwind CSS** — utility-first styling
- **CodeMirror** — in-browser Markdown editor
- **markdown-it** — Markdown parsing
- **html2pdf.js / jsPDF** — client-side PDF export    ← only this bullet edits
```

---

### `CLAUDE.md` (docs)

**Analog:** `CLAUDE.md` line 14 (inside the `<!-- GSD:project-start source:PROJECT.md -->` block)

**Current line:**

```markdown
- **Tech stack**: markdown-it for parsing, CodeMirror for editor, html2pdf.js or jsPDF for PDF export
```

**Replace `html2pdf.js or jsPDF for PDF export`** with a phrase matching the README.md rewrite. Sample shape:

```markdown
- **Tech stack**: markdown-it for parsing, CodeMirror for editor, paged.js for pagination, browser print for PDF export
```

Note (CONTEXT.md "Claude's Discretion"): `CLAUDE.md` is managed by GSD content blocks (`<!-- GSD:project-start source:PROJECT.md -->` … `<!-- GSD:project-end -->`). The source of truth for this block is `.planning/PROJECT.md`, so the planner should edit `PROJECT.md` rather than `CLAUDE.md` directly if the GSD block regeneration tool is the standard path. CONTEXT.md D-05 explicitly defers `PROJECT.md` updates to the end-of-phase transition step — so the immediate plan should either (a) edit `CLAUDE.md` directly inside the GSD block and accept it may be overwritten on next sync, or (b) update `PROJECT.md` now and regenerate `CLAUDE.md`. Planner picks; both align with D-05's intent.

---

## Shared Patterns

### Print-mode CSS discipline (cross-cuts `src/index.css` + `src/styles/pages.css`)

**Source:** existing split between the two files
**Applies to:** every CSS edit in this phase

CONTEXT.md "Established Patterns": "print-only rules live in `src/index.css` (app-shell hiding / area swap) and `src/styles/pages.css` (paged.js chrome resets)." Phase 10 keeps this split:
- `index.css` owns: `#app-shell { display: none }`, `#print-area { display: block; position: static }`, the new `@page { size: A4 portrait; margin: 0 }` rule.
- `pages.css` owns: `.pagedjs_page` chrome resets and the Phase 9 `.pagedjs-scale-wrapper` defensive reset.

### Margins → `@page` → paged.js (cross-cuts `App.tsx` + `Preview.tsx`)

**Source:** `src/components/Preview.tsx` line 76 (the only place an `@page` rule is built from runtime margins state)
**Applies to:** both `<Preview>` instances after Phase 10

Single source of truth for dynamic margins:

```typescript
[{ pagedjs_inline: `@page { size: A4 portrait; margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm; }` }],
```

The print-mount reaches this line via the second `<Preview>` invocation. No new code path. The static `@page { margin: 15mm }` in `index.css` is removed precisely because it would override this dynamic rule (D-04).

### `theme-${template}` wrapper convention (cross-cuts `Preview.tsx`)

**Source:** `src/components/Preview.tsx` line 66 and line 143
**Applies to:** both `<Preview>` instances after Phase 10

Both the paginated and non-paginated code paths wrap content in a div carrying the theme class so the `.theme-X` ancestor selector survives into every emitted `.pagedjs_page`. The print-mount inherits this for free by sharing the component.

```typescript
// Paginated (line 66):
wrapper.innerHTML = `<div class="theme-${template} ${styles.container}">${safeHtml}</div>`

// Non-paginated fallback (line 143):
<div className={`theme-${template} ${styles.container}`} ... />
```

### Phase 9 mobile-print safety rule (cross-cuts `pages.css` + `Preview.tsx`)

**Source:** `src/styles/pages.css` lines 45-49
**Applies to:** any change that touches the Preview rendering chain on mobile

```css
.pagedjs-scale-wrapper {
  zoom: 1 !important;
  transform: none !important;
  height: auto !important;
}
```

D-06: "do not delete it during refactoring." This rule is the entire mechanism by which mobile users (whose on-screen preview renders at `zoom: 0.5`) get a 1:1 A4 PDF. Any planner who consolidates `pages.css` or moves rules between files MUST preserve this verbatim including all three `!important`s.

---

## No Analog Found

None. Every file in this phase is being modified in place; the "analog" for each is its own current state.

This is expected for a refactor-style phase. The planner should not synthesize new patterns from elsewhere — every concrete excerpt above already exists in the codebase and is the literal source the planner copies from.

---

## Metadata

**Analog search scope:** `src/`, `package.json`, `README.md`, `CLAUDE.md`, `src/styles/`
**Files scanned:** 6 source files (all read in full or at the line ranges flagged by CONTEXT.md)
**Pattern extraction date:** 2026-05-20
**Notable upstream contract:** CONTEXT.md `<canonical_refs>` lists exact files + line numbers; no additional codebase exploration was needed beyond those refs.
