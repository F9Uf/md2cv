# Phase 7: Page Chrome & Auto Pagination - Pattern Map

**Mapped:** 2026-05-18
**Files analyzed:** 7 (5 modified, 2 created)
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/Preview.tsx` (MODIFY) | component | HTML string in → paged.js Previewer → DOM out; page-count up via callback | `src/components/Editor.tsx` (useEffect + useRef + async lib mount + cleanup) + current `Preview.tsx` (theme-class + DOMPurify path, preserved as fallback) | exact (combines two analogs) |
| `src/App.tsx` (MODIFY) | component (state owner) | child callback up → useState → consumer prop down | `src/App.tsx` itself (existing debounce + callback pattern, e.g. `handleTemplateChange`) | exact (self-pattern) |
| `src/index.css` (MODIFY) | styles (entry/import hub) | CSS import graph | `src/index.css` itself + `src/main.tsx` (`import './styles/themes.css'` pattern) | exact (self-pattern) |
| `src/styles/pages.css` (CREATE) | styles | class-keyed CSS rules under a parent class | `src/styles/theme-classic.css` (file shape, `@reference "tailwindcss"`) + `src/index.css` (`@page` + `@media print` blocks) | role-match (CSS-only) |
| `src/types/pagedjs.d.ts` (CREATE) | type-shim (ambient module declaration) | TS module type augmentation | `src/vite-env.d.ts` (only existing `.d.ts` in repo — triple-slash reference; pattern differs but file lives in same `src/**` glob the tsconfig already includes) | weak (no prior ambient-module declaration in codebase — RESEARCH.md §Example 2 is the authoritative shape) |
| `package.json` (MODIFY) | config | dependency add | `package.json` itself (existing deps like `dompurify`, `html2pdf.js`) | exact (self-pattern) |
| `index.html` (MODIFY only if CDN path chosen — NPM path preferred per RESEARCH) | config | script tag order | `index.html` itself (existing `<script src="https://cdn.tailwindcss.com">`) | N/A — RESEARCH.md §Standard Stack mandates npm path; this file is **not expected to change** |

## Pattern Assignments

### `src/components/Preview.tsx` (component, HTML → paged.js → DOM)

**Analog A (lifecycle / async mount / cleanup):** `src/components/Editor.tsx`
**Analog B (preserved fallback path, theme-class scoping):** existing `src/components/Preview.tsx`

This file is a **rewrite** that fuses two patterns: keep Analog B's theme-class + DOMPurify path verbatim as the `enablePagination={false}` and error-fallback branch; add Analog A's useEffect+useRef+async-init+cleanup shape for the paged.js path.

**Imports pattern** (from current `Preview.tsx` lines 1-3, extend with `useEffect`/`useRef`/`useState`):
```typescript
import DOMPurify from 'dompurify'
import { TEMPLATE_STYLES, type TemplateName } from '../lib/templateStyles'
import '../styles/themes.css'
```
Imports for paged.js (per RESEARCH.md §Example 1 — dynamic import keeps initial bundle small):
```typescript
import { useEffect, useRef, useState } from 'react'
// pagedjs is dynamically imported inside the effect: await import('pagedjs')
```

**Theme-class wrapping pattern** (current `Preview.tsx` lines 10-26 — PRESERVE for both branches):
```typescript
const styles = TEMPLATE_STYLES[template] ?? TEMPLATE_STYLES['classic']

if (!htmlContent.trim()) {
  return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
      Start typing markdown to see your resume preview
    </div>
  )
}

// Theme class + container class combined; sanitize with ADD_ATTR: ['class']
className={`theme-${template} ${styles.container}`}
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] }) }}
```
**Where to apply theme class in paged.js path:** wrap the *source* HTML in a `<div class="theme-${template} ${styles.container}">…</div>` *before* handing it to `Previewer.preview()`. Do NOT put theme class on the outer `renderTo` div. (RESEARCH.md §Pattern 1, Anti-Patterns §2.)

**Lifecycle / mount / cleanup pattern** (from `Editor.tsx` lines 14-54 — adapt shape):
```typescript
// Editor.tsx — analog for: useRef-held instance, mount-once useEffect, return cleanup
export default function Editor({ value, onChange }: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const extensions = [ /* … */ ]
    const state = EditorState.create({ doc: value, extensions })
    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // …
  return <div ref={containerRef} className="h-full w-full bg-[#282c34]" />
}
```

**Adaptation for paged.js (per RESEARCH.md §Pattern 2 / §Example 1):** the useEffect deps become `[htmlContent, template, enablePagination, styles.container]` (re-run on every reflow), and cleanup calls `activePreviewer.polisher?.destroy()` + `activePreviewer.chunker?.destroy()` instead of `view.destroy()`. Use a `cancelled` closure flag (RESEARCH.md §Pitfall 5) since paged.js has no abort.

**Critical pattern — stylesheets argument (RESEARCH.md §Pattern 3, §Pitfall 2):** ALWAYS pass an explicit `stylesheets` array — never `undefined`. Concretely:
```typescript
[{ pagedjs_inline: '@page { size: A4 portrait; margin: 15mm; }' }]
```
Omitting this strips Tailwind, theme CSS, and the print-area sibling — verified destructive behavior at `previewer.js` lines 187-189.

**Page count callback pattern** (props shape — new, no exact in-repo analog; closest is `Editor.tsx`'s `onChange` prop):
```typescript
interface PreviewProps {
  htmlContent: string
  template: TemplateName
  enablePagination?: boolean       // default true; false for #print-area instance
  onPageCountChange?: (n: number) => void
}
```
Resolve from `flow.pages.length` after `await previewer.preview(...)`, set local state, fire callback.

**Render-branch pattern (preserved exactly from current `Preview.tsx`):**
- Empty-content branch: unchanged (lines 13-19).
- `enablePagination={false}` OR `hasError`: render the current `dangerouslySetInnerHTML` div verbatim (lines 21-26).
- Default paginated branch: render `<div ref={previewerRootRef} />` inside the scroll viewport; paged.js mounts into it.

---

### `src/App.tsx` (component, state owner — wire callback)

**Analog:** `src/App.tsx` itself — the existing `handleTemplateChange` + debounce pattern is the pattern to copy.

**Existing debounce pattern (lines 44, 50-57) — REUSE, do not duplicate:**
```typescript
const debounceRef = useRef<ReturnType<typeof setTimeout>>()

const handleMarkdownChange = useCallback((value: string) => {
  setMarkdownContent(value)
  if (debounceRef.current) clearTimeout(debounceRef.current)
  debounceRef.current = setTimeout(() => {
    setHtmlContent(parseResume(value))
    try { localStorage.setItem('md2cv-content', value) } catch { /* ignore */ }
  }, 150)
}, [])
```
Per CONTEXT D-02 and RESEARCH.md §"User Constraints", the paged.js reflow piggybacks on `htmlContent` changes — **no new debounce, no new timer ref**.

**Existing prop-callback pattern (lines 102-105) — copy shape for `handlePageCountChange` if hoisting to App.tsx:**
```typescript
const handleTemplateChange = useCallback((template: TemplateName) => {
  setSelectedTemplate(template)
  try { localStorage.setItem('md2cv-template', template) } catch { /* ignore */ }
}, [])
```
> Note: RESEARCH.md §Open Question 1 recommends keeping the page-counter pill **inside `Preview.tsx`**, so `App.tsx` likely needs zero state changes — just pass `onPageCountChange?` as an unused-but-provided hook for future phases, OR omit it entirely. Planner's call.

**Two-instance `<Preview>` pattern (CRITICAL — preserve, but differentiate)** — current lines 113, 139-141:
```typescript
const preview = <Preview htmlContent={htmlContent} template={selectedTemplate} />
// …
{isDesktop ? <SplitPane left={editor} right={preview} /> : <MobileTabs … previewContent={preview} />}
// …
<div id="print-area">
  <Preview htmlContent={htmlContent} template={selectedTemplate} />
</div>
```
**Required change (RESEARCH.md §Pitfall 1):** pass `enablePagination={false}` to the `#print-area` instance only. The visible-pane instance keeps the default (`true`). Otherwise both instances spin up Previewers and the `window.print()` path double-paginates.
```typescript
const preview = <Preview htmlContent={htmlContent} template={selectedTemplate} />  // visible — paginated
// …
<div id="print-area">
  <Preview htmlContent={htmlContent} template={selectedTemplate} enablePagination={false} />
</div>
```

**Print path (lines 73-79, 117, 139-141) — DO NOT MODIFY:**
```typescript
const handleExportPdf = useCallback(() => {
  const nameMatch = markdownContent.match(/^#\s+(.+)/m)
  const originalTitle = document.title
  if (nameMatch) document.title = nameMatch[1].trim()
  window.print()
  document.title = originalTitle
}, [markdownContent])
// …
<div className="h-screen bg-gray-50 flex flex-col overflow-hidden" id="app-shell">
// …
<div id="print-area">
```
Per CONTEXT D-04, UI-SPEC §"Print / PDF path (UNCHANGED)", and the phase-success criterion "must not regress current PDF export" — leave the `#app-shell` / `#print-area` / `handleExportPdf` triangle exactly as-is.

---

### `src/index.css` (styles, import hub) — MODIFY

**Analog:** the existing file itself.

**Existing structure (preserve):**
```css
@import "tailwindcss";

@media print {
  #app-shell { display: none !important; }
  input[type="file"] { display: none !important; }
  #print-area { display: block !important; width: 100%; margin: 0; padding: 0; }
  @page { size: A4 portrait; margin: 15mm; }
  body { background: white !important; margin: 0; padding: 0; }
}

#print-area { display: none; }
```

**Pattern to copy from `src/main.tsx` line 4 — sibling stylesheet import:**
```typescript
import './index.css'
import './styles/themes.css'
```
…and from `src/styles/themes.css` lines 1-3 — `@import` chain:
```css
@import "./theme-classic.css";
@import "./theme-modern.css";
@import "./theme-minimal.css";
```

**Required addition:** one `@import` line for the new `pages.css`. Either:
- (a) Add `@import "./styles/pages.css";` to `src/index.css` after the `@import "tailwindcss";` line. (Mirrors how `themes.css` chains its sub-themes.)
- (b) OR add `import './styles/pages.css'` to `src/main.tsx` next to the existing `import './styles/themes.css'` line. Either is consistent with prior phases — planner picks.

**Do NOT touch:** the `@media print { … }` block (lines 3-33) and the `#print-area { display: none; }` rule (lines 36-38). These are the print path's single source of truth and Phase 10's territory.

---

### `src/styles/pages.css` (CREATE — styles, class-keyed under paged.js's emitted classes)

**Analog:** `src/styles/theme-classic.css` (file shape — short, element-keyed, `@reference "tailwindcss"` at top if Tailwind utilities are used inside; plain CSS otherwise).

**File-shape pattern from `theme-classic.css` lines 1-3:**
```css
@reference "tailwindcss";

@custom-variant theme-classic (.theme-classic &);
```
> Note: `pages.css` styles **paged.js's own emitted classes** (`.pagedjs_page`, `.pagedjs_pages`) — not theme-scoped content. So the `@custom-variant` line is **NOT** copied. The `@reference "tailwindcss"` line is only needed if `@apply` directives are used inside `pages.css`; the values in UI-SPEC §"Visual Style Tokens" are plain CSS, so the `@reference` line is also optional.

**`@page` rule pattern from `src/index.css` lines 22-26 (existing — provides the print analog for `@page` syntax):**
```css
@page {
  size: A4 portrait;
  margin: 15mm;
}
```
> Note: this `@page` rule is for the browser's native print engine. The **screen** `@page` rule for paged.js is passed as an **inline stylesheet argument** to `Previewer.preview()` (RESEARCH.md §Example 1) — NOT placed in `pages.css`. This split is intentional: paged.js's Polisher must own the `@page` it processes, separated from the browser-print one.

**`@media print` cleanup pattern from `src/index.css` lines 3-33 (existing — copy structure for hiding paged.js chrome on print):**
```css
@media print {
  /* Hide on-screen chrome during print */
  #app-shell { display: none !important; }
  /* … */
}
```
**Apply to `pages.css`** (per UI-SPEC §"Print / PDF path"): inside `@media print`, neutralize the on-screen page chrome (box-shadow / border / margin) so if `.pagedjs_*` elements ever leak into a print context they don't carry preview chrome. Belt-and-suspenders — the existing `#app-shell { display: none }` already hides them.

**Concrete rules to author (from UI-SPEC §"Visual Style Tokens" + RESEARCH.md §Example 3):**
```css
.pagedjs_pages {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pagedjs_page {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.pagedjs_page:last-child { margin-bottom: 0; }

@media print {
  .pagedjs_page {
    box-shadow: none;
    border: none;
    margin-bottom: 0;
  }
}
```
(Border-radius intentionally 0 — real paper has square corners per UI-SPEC.)

---

### `src/types/pagedjs.d.ts` (CREATE — type-shim, ambient module declaration)

**Closest in-repo analog:** `src/vite-env.d.ts` — the only existing `.d.ts` in the repo. Its pattern is a triple-slash reference, NOT an ambient module declaration, so the file is a **structural analog (lives in `src/`)** only, not a content analog.

**Existing analog (full file):**
```typescript
/// <reference types="vite/client" />
```

**Required content (authoritative source is RESEARCH.md §Example 2, derived from verified `previewer.js` source — no in-repo precedent for ambient module declarations):**
```typescript
declare module 'pagedjs' {
  export interface PagedjsFlow {
    total: number
    pages: Array<unknown>
    performance: number
    size: {
      width: { value: number; unit: string }
      height: { value: number; unit: string }
      format?: string
      orientation?: string
    }
  }

  export class Previewer {
    constructor(options?: Record<string, unknown>)
    preview(
      content: HTMLElement | DocumentFragment | string,
      stylesheets: Array<string | Record<string, string>>,
      renderTo: HTMLElement | string,
    ): Promise<PagedjsFlow>
    polisher: { destroy(): void }
    chunker: { destroy(): void; total: number; pages: unknown[] }
    on(event: string, cb: (...args: unknown[]) => void): void
  }
}
```

**tsconfig coverage (verified at `tsconfig.app.json` line 25):**
```json
"include": ["src"]
```
The `src/types/pagedjs.d.ts` path is already covered by the `include`. No tsconfig change needed.

---

### `package.json` (MODIFY — config, dep add)

**Analog:** the existing `package.json` itself.

**Dependencies block pattern (lines 14-29) — copy shape:**
```json
"dependencies": {
  "@codemirror/commands": "^6.10.3",
  /* … */
  "dompurify": "^3.4.1",
  "html2pdf.js": "^0.14.0",
  "markdown-it": "^14.1.1",
  "react": "^18.3.1",
  /* … */
  "tailwindcss": "^4.2.2"
}
```

**Required addition** (per RESEARCH.md §Standard Stack — verified `pagedjs@0.4.3` latest stable):
```json
"pagedjs": "^0.4.3"
```
Install via `npm install pagedjs` (which updates both `package.json` and `package-lock.json`).

**No `@types/pagedjs`** — not published; ambient `.d.ts` (above) is the substitute. (RESEARCH.md §Pitfall 7.)

---

### `index.html` (NOT MODIFIED in expected path)

**Analog:** existing `index.html` lines 1-17 — note the existing CDN script tag for Tailwind Play CDN at line 10:
```html
<script src="https://cdn.tailwindcss.com"></script>
```
**Why no change:** RESEARCH.md §Standard Stack and §Alternatives Considered explicitly recommend the npm import path over a CDN `<script>` tag (the CDN paged.polyfill.js auto-runs on whole-document load and would conflict with the React app). Listed here only so the planner knows: if for any reason the npm path is rejected, the CDN script tag pattern to copy is the existing Tailwind one at line 10 — but this should not be the chosen path.

---

## Shared Patterns

### Theme-class scoping (CRITICAL cross-cutting pattern)

**Source:** existing `src/components/Preview.tsx` line 23, `src/styles/theme-classic.css` line 3 (`@custom-variant theme-classic (.theme-classic &);`).

**Apply to:** all branches inside the new `Preview.tsx` (paginated branch, plain-render fallback, and `enablePagination={false}` branch) MUST place `theme-${template}` as an ancestor of rendered content.

```typescript
// Existing pattern — preserve in both branches of new Preview.tsx
<div className={`theme-${template} ${styles.container}`}>
  {/* sanitized HTML here */}
</div>
```
For the paged.js branch, this wrapper is built imperatively and handed to `Previewer.preview()`:
```typescript
const wrapper = document.createElement('div')
wrapper.className = `theme-${template} ${TEMPLATE_STYLES[template].container}`
wrapper.innerHTML = DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] })
// then: previewer.preview(wrapper, stylesheets, previewerRootRef.current)
```
(RESEARCH.md §Pattern 1, UI-SPEC §"Theme-class scoping (CRITICAL)".)

### DOMPurify sanitization

**Source:** current `Preview.tsx` line 24.
**Apply to:** every place the new `Preview.tsx` writes `htmlContent` into the DOM (paged.js source wrapper, plain-render fallback, error fallback).

```typescript
DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] })
```
The `ADD_ATTR: ['class']` flag is required so Tailwind utility classes inside user-authored markdown HTML survive sanitization — preserved from Phase 6 contract.

### Empty-state branch

**Source:** current `Preview.tsx` lines 13-19.
**Apply to:** new `Preview.tsx` — keep as the FIRST conditional return, before the pagination useEffect, exactly as today.

```typescript
if (!htmlContent.trim()) {
  return (
    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
      Start typing markdown to see your resume preview
    </div>
  )
}
```
UI-SPEC §"Empty state" pins this verbatim. Also avoids RESEARCH.md §Open Question 5 (paged.js behavior on whitespace input).

### Async-mount + cleanup useEffect

**Source:** `src/components/Editor.tsx` lines 21-54.
**Apply to:** new pagination effect inside `Preview.tsx`.

```typescript
// Editor.tsx pattern — shape to copy
useEffect(() => {
  if (!containerRef.current) return
  // …construct instance…
  return () => {
    view.destroy()
    viewRef.current = null
  }
}, [])
```
Adaptation (per RESEARCH.md §Pattern 2):
- Deps become `[htmlContent, template, enablePagination, styles.container]` (re-run on reflow).
- Use a local `let cancelled = false; let activePreviewer: any = null` closure so the async `await import('pagedjs')` and `await previewer.preview(...)` can short-circuit setState after unmount/re-run.
- Cleanup calls `activePreviewer?.polisher?.destroy()` + `activePreviewer?.chunker?.destroy()` (wrap each in try/catch — paged.js destroy is brittle).
- Use try/catch around the whole async body; on catch, set `hasError` to flip to the plain-render fallback (UI-SPEC §"Failure behavior").

### Existing 150ms debounce — REUSE, do not duplicate

**Source:** `src/App.tsx` lines 44, 50-57.
**Apply to:** pagination triggering — explicitly locked by CONTEXT D-02 and UI-SPEC §"Reflow trigger". Pagination re-runs whenever `htmlContent` changes; `htmlContent` is already debounced upstream. No new timer/debounce in `Preview.tsx`.

### useCallback for prop callbacks

**Source:** `src/App.tsx` lines 50-105 (every handler is `useCallback`-wrapped).
**Apply to:** if/when `App.tsx` needs to receive `onPageCountChange`, wrap it with `useCallback` so `Preview.tsx`'s useEffect doesn't re-run on every render due to identity changes. (Or omit the callback prop entirely per RESEARCH.md §Open Question 1 — keep page count local to `Preview.tsx`.)

```typescript
// Pattern shape from App.tsx
const handleTemplateChange = useCallback((template: TemplateName) => {
  setSelectedTemplate(template)
  try { localStorage.setItem('md2cv-template', template) } catch { /* ignore */ }
}, [])
```

## No Analog Found

| File | Role | Data Flow | Reason / Source to use instead |
|------|------|-----------|---------------------------------|
| `src/types/pagedjs.d.ts` | type-shim (ambient module) | TS module declaration | Repo has no prior `declare module '…'` ambient. `src/vite-env.d.ts` is a triple-slash reference, structurally different. **Use RESEARCH.md §Example 2 verbatim** as authoritative shape — it is derived from verified `previewer.js` source. |
| The paged.js `Previewer` lifecycle itself (instantiate, preview, polisher.destroy, chunker.destroy) | external lib lifecycle | async setup with cleanup | No in-repo precedent for an async-import-of-side-effect-library inside a React effect with destroy-cleanup pair. **Use RESEARCH.md §Example 1 verbatim** as the authoritative shape — `Editor.tsx`'s shape is the closest analog and informs the React skeleton, but the body (`await import('pagedjs')`, `new Previewer()`, `await previewer.preview(...)`, dual destroy in cleanup) is paged.js-specific. |
| The `Page X of N` sticky pill (DOM element + styling) | UI element | derived state → JSX | No existing sticky/floating overlay in the codebase. **Use UI-SPEC §"Page counter placement" + §"Visual Style Tokens" verbatim** — Tailwind classes `sticky bottom-4 right-4 ml-auto inline-block bg-gray-900/85 text-white text-xs font-medium leading-tight px-2 py-1 rounded-md`. Mount inside `Preview.tsx`'s paginated branch, after the `<div ref={previewerRootRef} />`. |

## Metadata

**Analog search scope:** `src/components/`, `src/lib/`, `src/styles/`, `src/hooks/`, `src/`, `./` (project root for `index.html`, `package.json`, `vite.config.ts`, `tsconfig.app.json`).
**Files scanned:** 14 (all relevant source files in `src/` + project root config files).
**Pattern extraction date:** 2026-05-18
