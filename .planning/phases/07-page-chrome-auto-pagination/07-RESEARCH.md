# Phase 7: Page Chrome & Auto Pagination - Research

**Researched:** 2026-05-18
**Domain:** paged.js (W3C CSS Paged Media polyfill) integrated into a Vite 5 + React 18 + Tailwind v4 SPA
**Confidence:** HIGH

## Summary

paged.js is the right choice for this phase (locked in CONTEXT.md D-01) and the npm package `pagedjs@0.4.3` integrates cleanly with the existing Vite 5 + React 18 stack. The API is small: `import { Previewer } from 'pagedjs'`, instantiate, call `.preview(content, stylesheets, renderTo)`, and read the page count from the resolved Promise (`flow.total` / `flow.pages.length`).

The non-obvious risks are all about *interaction with the surrounding app*, not the API itself:
1. paged.js's default behavior when `stylesheets` is omitted is to **strip every `<style>` and `<link rel="stylesheet">` from `document` that does not have `media="screen"` or `data-pagedjs-ignore`** — which would nuke Tailwind, theme CSS, and break the un-paginated `#print-area` `<Preview>` sibling. The mitigation is to pass an explicit (possibly empty or inline-string) `stylesheets` argument every time.
2. `Chunker.setup()` *appends* a `pagedjs_pages` container into `renderTo` (it does not clear it). Calling `preview()` twice on the same `renderTo` without manual cleanup produces two stacks. The same Chunker reused via the same Previewer auto-clears via `removePages()`, but `Polisher.setup()` is called on every `.preview()` and injects a fresh `<style>` element into `document.head` each time — that accumulates.
3. paged.js ships **no TypeScript types**. We need a one-line `declare module 'pagedjs'` ambient.

**Primary recommendation:** Create a *fresh* `Previewer` per reflow, mount paged.js output into a dedicated `<div ref={…}>` inside `Preview.tsx`, clear that div before each `preview()` call, pass an inline `@page` CSS string as the `stylesheets` argument so document-level stylesheets are untouched, wrap the source HTML in a `<div class="theme-${template} ${TEMPLATE_STYLES.container}">…</div>` *before* paged.js consumes it (so theme cascade is preserved on the paginated output), and call `previewer.polisher.destroy()` + `previewer.chunker.destroy()` in the `useEffect` cleanup. The existing `#print-area` `<Preview>` sibling stays untouched and `window.print()` continues to work because paged.js never touches that subtree and never strips document stylesheets.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|--------------|----------------|-----------|
| Markdown → HTML string | Browser (existing `parseResume`) | — | Already locked Phase 5; no change |
| Sanitize HTML before render | Browser (existing `DOMPurify.sanitize`) | — | Already locked Phase 6; paged.js receives the sanitized output |
| Apply theme class scoping | Browser (DOM wrapper) | — | `.theme-${template}` must wrap the source HTML *before* paged.js, so `theme-*.css` `@apply` rules cascade onto paged.js's emitted `.pagedjs_pages > .pagedjs_page > .pagedjs_area > .pagedjs_page_content` subtree |
| Paginate / render A4 boxes | Browser (paged.js Previewer) | — | Pure client-side; no server involvement (matches CLAUDE.md "client-side only" constraint) |
| Read page count | Browser (resolved `flow.pages.length`) | — | Single source of truth = Chunker.total; surface via React state |
| Render Page-X-of-N pill | Browser (React) | — | Sticky/absolute overlay inside preview-pane viewport; lives in `Preview.tsx` per UI-SPEC |
| PDF export (this phase) | Browser (existing `window.print()` + `@page` in `index.css`) | — | Unchanged this phase; Phase 10 unifies |

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Use **paged.js polyfill** to render A4 page boxes on screen. It implements W3C CSS Paged Media (`@page`, `break-*`, `counter(page) / counter(pages)`) in the browser, so the preview uses the same paged-media model the existing print stylesheet already uses. This is also the strongest foundation for Phase 10 PDF parity.
- **D-02:** Page reflow runs on the **existing 150ms debounce** already used for `htmlContent` in `App.tsx` (`debounceRef`). Pagination is not put on a slower secondary cadence — same trigger as the current HTML update keeps the indicator within the ~150ms requirement in PREV-03.
- **D-03:** "Page X of N" reads from **paged.js's native page counters** (Previewer's emitted page count / `counter(pages)` value), not from counting DOM nodes by class. Single source of truth — the counter cannot drift from what paged.js actually rendered.
- **D-04:** Default page margin is **15mm on all four sides**, matching the existing `@page { margin: 15mm }` rule in `src/index.css`. Phase 8 makes this user-configurable; until then preview and print use the same value.
- **D-05:** **No `break-inside: avoid` rules.** Content breaks at whatever natural point paged.js chooses — an h3 entry, its bullets, or an h2 heading may split across pages.
- **D-06:** **No forced page-before on h2 sections.** Sections do not get pushed to a new page if room is tight — they break naturally where paged.js chooses.

### Claude's Discretion

- **Page chrome visual style** — color of the page background, gray surround color, drop shadow, gap between stacked pages. (Pinned by UI-SPEC: `bg-white` sheet, `bg-gray-100` surround, subtle two-layer shadow, 16px gap, 0 border-radius.)
- **Page X of N indicator placement and styling** — pinned by UI-SPEC: floating sticky pill, bottom-right, `bg-gray-900/85` text-white, `text-xs font-medium`, always visible (even at "Page 1 of 1").
- **paged.js integration shape** in `Preview.tsx` — exact API call shape, instance lifecycle, where the theme class is mounted, error handling.
- **Existing print path** in `src/index.css` (`@page`, `#print-area`, the hidden second `<Preview>`) — leave as-is for this phase if paged.js doesn't naturally take over print, or unify if it does. Phase 10 owns the final unification; this phase should not regress current PDF export.
- **Performance/reflow optimizations** — Previewer reuse vs fresh instance per render, abort-on-rapid-edits, etc.

### Deferred Ideas (OUT OF SCOPE)

- **Smarter break behavior** (`break-inside: avoid` on h3 entries / h2 sections, orphan/widow control) — explicitly chosen to skip in this phase; revisit only if real resumes look bad.
- **Configurable margins via UI** — Phase 8 (already in roadmap).
- **Auto-fit-to-pane-width scaling** — Phase 9 (already in roadmap).
- **Unifying preview and PDF rendering / retiring `templateInlineStyles.ts` hack** — Phase 10 (already in roadmap). Note: `templateInlineStyles.ts` already appears to have been removed; Phase 10 will confirm and unify the print path.
- **Manual page-break syntax in markdown** (PAGEBREAK-01) — future requirement, not in v1.3.0.
- **Paper sizes other than A4** (PAPER-01/02) — future requirement.
- **Manual zoom controls** (ZOOM-02) — future requirement.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PREV-01 | User sees the preview rendered inside an A4-sized page rectangle (210×297mm) with visible margins | paged.js Chunker emits `.pagedjs_page` boxes whose size and inner padding come from `@page { size: A4; margin: 15mm }` — pass this rule via the `stylesheets` argument to `Previewer.preview()`. Page rectangle visuals (white sheet, border, shadow) come from new CSS in `src/styles/pages.css` targeting `.pagedjs_page`. |
| PREV-02 | User sees content overflowing one page automatically flow onto additional A4 page rectangles below | This is paged.js's primary job — Chunker measures content and creates additional `.pagedjs_page` siblings inside `.pagedjs_pages` until all content fits. Zero extra code beyond calling `.preview()`. |
| PREV-03 | User sees a "Page X of N" indicator that updates live as they type | Trigger reflow inside the existing `useEffect(()=>{…}, [htmlContent, template])` driven by the existing 150ms `debounceRef` (CONTEXT D-02). Resolve `await previewer.preview(...)` to get the final Chunker, read `.pages.length`, push to React state, render as the bottom-right pill (UI-SPEC). |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `pagedjs` | 0.4.3 | W3C CSS Paged Media polyfill — turns `@page` + content into laid-out A4 page boxes in the browser | Only mature, MIT-licensed in-browser pagination engine. The official choice locked in CONTEXT D-01. `[VERIFIED: npm view pagedjs version → 0.4.3, modified 2024-10-04]` `[VERIFIED: npm view pagedjs → license MIT]` |

**Installation:**
```bash
npm install pagedjs
```

`pagedjs@0.4.3` package.json `[VERIFIED: curl raw.githubusercontent.com/pagedjs/pagedjs/main/package.json]`:
- `main: "src/index.js"` (raw ES source — Vite handles this fine in dev because Vite pre-bundles deps via esbuild)
- `exports: { import: "./src/index.js", require: "./lib/index.cjs", browser: "./dist/paged.js", polyfill: "./dist/paged.polyfill.js", default: "./src/index.js" }`
- `license: "MIT"`
- `engines:` (not set — no Node version restriction)
- 5 transitive deps: `@babel/polyfill`, `@babel/runtime`, `clear-cut`, `css-tree`, `event-emitter`
- **No TypeScript types** — `.d.ts` not shipped, no `@types/pagedjs` on npm `[VERIFIED: npm view @types/pagedjs version → empty]`

**Bundle size:** `[VERIFIED: curl unpkg.com/pagedjs@0.4.3/dist/paged.js → 921 KB unminified; paged.polyfill.js → 922 KB unminified]`. Gzipped is roughly ~280 KB (estimated). This is significant but acceptable for a personal tool and the actual import via Vite (`import { Previewer } from 'pagedjs'`) pulls in only Previewer + its tree of Chunker, Polisher, Handler, css-tree — Vite/Rollup will tree-shake unused handlers (footnote, running-headers, etc.). Final app bundle increment is expected in the 200–300 KB gzipped range. `[ASSUMED: tree-shaken impact estimate — actual measurement should happen during plan-check or first build]`

**Vite 5 / React 18 compatibility:** Works out of the box. The historical regression (Vite 2 beta.20, GitHub vitejs/vite#1488, 2021) was fixed years ago and pagedjs has since shipped a proper `exports` map. `[VERIFIED: package.json exports field has both `import` and `require` keys]` No `optimizeDeps.include` workaround needed for normal use; if Vite's dep pre-bundling complains during `npm run dev`, add `optimizeDeps: { include: ['pagedjs'] }` to `vite.config.ts` as a safety net.

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | — | — | No additional libraries required. DOMPurify, markdown-it, React 18 already in stack handle everything else. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `pagedjs` (manual Previewer) | `pagedjs/dist/paged.polyfill.js` via `<script>` tag in `index.html` | Polyfill auto-runs on DOMContentLoaded and paginates the *whole document*. That would conflict with the rest of our React UI (editor pane, header). The Previewer class is the only sane choice for an embedded preview pane. `[CITED: github.com/pagedjs/pagedjs README — "Use Previewer for programmatic control"]` |
| `pagedjs@0.4.3` | `pagedjs@0.5.0-beta.2` (dist-tag `beta`) | Beta — risk of regressions in a personal tool. Stay on stable. `[VERIFIED: npm view pagedjs dist-tags]` |
| `pagedjs` (upstream) | `@ggrossetie/pagedjs` (community fork) | Unknown maintenance status, smaller ecosystem, no obvious benefit over upstream for this use case. Stay on upstream. `[ASSUMED: based on lack of widely-cited migration guides]` |
| paged.js | Hand-rolled "measure content, slice at element boundaries, emit page divs" | See **Don't Hand-Roll** below — pagination at element/word/line granularity with `@page` margin boxes, named pages, counters, and float/widow/orphan handling is a year of work. paged.js is exactly the right scope. |

**Version verification:** `pagedjs@0.4.3` confirmed current latest stable on npm as of 2024-10-04. `[VERIFIED: npm view pagedjs version]`. The beta channel (`0.5.0-beta.2`) is not recommended for production.

---

## Architecture Patterns

### System Architecture Diagram

```
User types in CodeMirror editor
        │
        ▼
  App.tsx setMarkdownContent  ──── debounceRef (150ms, EXISTING) ────►  setHtmlContent(parseResume(value))
                                                                                    │
                                                                                    ▼
                                                                          Preview.tsx receives
                                                                          { htmlContent, template }
                                                                                    │
                                                                                    ▼
                                                       ┌──── htmlContent is empty? ─────┐
                                                       │ YES                        NO  │
                                                       ▼                                ▼
                                              Render placeholder              useEffect([htmlContent, template])
                                              (existing "Start typing…")             │
                                                                                     ▼
                                                                       1. Clear previewerRootRef
                                                                       2. Build source DOM:
                                                                          <div class="theme-${template} ${container}">
                                                                            ${DOMPurify.sanitize(htmlContent)}
                                                                          </div>
                                                                       3. new Previewer()
                                                                       4. previewer.preview(
                                                                            sourceDiv,
                                                                            [{ "<inline>": "@page { size: A4 portrait; margin: 15mm }" }],
                                                                            previewerRootRef.current
                                                                          )
                                                                       5. Await Promise → flow.pages.length
                                                                       6. setState(pageCount)
                                                                                     │
                                                                                     ▼
                                                                       paged.js emits DOM:
                                                                       <div class="pagedjs_pages">
                                                                         <div class="pagedjs_page">    ◄── styled by pages.css
                                                                           <div class="pagedjs_sheet">  (white, shadow, 16px gap)
                                                                             <div class="pagedjs_pagebox">
                                                                               <div class="pagedjs_area">
                                                                                 <div class="pagedjs_page_content">
                                                                                   ← user resume content here →   ◄── theme-${template}
                                                                                                                       cascade reaches
                                                                                                                       here (via wrapper
                                                                                                                       ancestor on the
                                                                                                                       *source* div)
                                                                                 </div>
                                                                               </div>
                                                                             </div>
                                                                           </div>
                                                                         </div>
                                                                         <div class="pagedjs_page"> … (page 2, if needed)
                                                                       </div>
                                                                                     │
                                                                                     ▼
                                                              "Page {X} of {pageCount}" pill (sticky overlay, bottom-right)
                                                                                     │
                                                                                     ▼
                                                                 useEffect cleanup on unmount/re-run:
                                                                   - previewer.polisher.destroy()  (removes injected <style>)
                                                                   - previewer.chunker.destroy()   (removes pagesArea)
                                                                   - previewerRootRef cleared on next run

Parallel un-changed path:
  App.tsx still renders <div id="print-area"><Preview ... /></div> with same { htmlContent, template }
                                                                                     │
                                                                                     ▼
                                                                  This <Preview> sees the same htmlContent;
                                                                  inside it, the empty branch test passes (non-empty),
                                                                  so the useEffect tries to spin up another Previewer.
                                                                  ⚠ ISSUE: two <Preview> instances would each
                                                                  create their own Previewer. See "Common Pitfalls" §1.
                                                                  Fix: pass an `enablePagination` prop, default true;
                                                                  set false for the #print-area instance so it keeps the
                                                                  plain dangerouslySetInnerHTML path.

@media print rules in src/index.css (UNCHANGED):
  - #app-shell { display:none }  ── hides paged.js pages
  - #print-area { display:block }
  - @page { size: A4 portrait; margin: 15mm }  ── browser print engine paginates from this
```

### Recommended Project Structure
```
src/
├── components/
│   └── Preview.tsx           # paged.js Previewer integration; receives enablePagination prop
├── lib/
│   └── templateStyles.ts     # unchanged — container class applied INSIDE the theme wrapper
├── styles/
│   ├── themes.css            # unchanged
│   ├── theme-classic.css     # unchanged
│   ├── theme-modern.css      # unchanged
│   ├── theme-minimal.css     # unchanged
│   └── pages.css             # NEW — page rectangle chrome + counter pill (imported from index.css)
├── types/
│   └── pagedjs.d.ts          # NEW — ambient module declaration (3 lines)
├── App.tsx                   # unchanged debounce logic; minor: page-count prop wiring (or counter lives inside Preview)
└── index.css                 # unchanged @page + #app-shell rules; add `@import "./styles/pages.css";`
```

### Pattern 1: Theme-class wrapping at the source

**What:** Wrap the sanitized HTML in a `<div class="theme-${template} ${TEMPLATE_STYLES[template].container}">…</div>` *before* handing it to `Previewer.preview()`. Do NOT put the theme class on the outer `previewerRootRef` div, and do NOT add it after paged.js renders.

**When to use:** Always, in this codebase. Theme CSS uses `.theme-{name} &` `@custom-variant` selectors and `@apply`, so it only cascades onto descendants of an element carrying `theme-{name}`. paged.js preserves the source content's classes when it lays it out — the wrapper ends up *inside* `.pagedjs_page_content`. As long as the wrapper sits as an ancestor of every rendered `<h1>` / `<p>` / `<li>`, the theme cascade works.

**Why not put the theme class on the outer mount div?** Because paged.js emits `<div class="pagedjs_pages">` AS A CHILD of the `renderTo` element. Selectors like `.theme-classic h2 { … }` would still match — BUT paged.js also adds its own internal chrome (`.pagedjs_margin`, `.pagedjs_bleed`, etc.) under `.pagedjs_page`, and you don't want theme rules accidentally hitting those. Scoping to the source-content subtree is precise and safe.

**Example:**
```typescript
// Source: derived from existing Preview.tsx + paged.js Previewer.preview signature
// (github.com/pagedjs/pagedjs/blob/main/src/polyfill/previewer.js — preview() method)
const wrapper = document.createElement('div')
wrapper.className = `theme-${template} ${TEMPLATE_STYLES[template].container}`
wrapper.innerHTML = DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] })

const previewer = new Previewer()
const flow = await previewer.preview(
  wrapper,
  [{ inline: '@page { size: A4 portrait; margin: 15mm; }' }],
  previewerRootRef.current!
)
setPageCount(flow.pages.length)
```

### Pattern 2: Fresh Previewer per reflow, manual cleanup

**What:** Each time `htmlContent` or `template` changes, instantiate a new `Previewer`, clear the renderTo div's `innerHTML`, run `.preview()`, store the instance on a ref so the next reflow can destroy it.

**When to use:** Always, in this codebase. We need consistent behavior across rapid typing and template switches.

**Why fresh vs reused:** `Previewer.preview()` `[VERIFIED: src/polyfill/previewer.js lines 178-205]` calls `this.polisher.setup()` and `this.initializeHandlers()` on every invocation. `polisher.setup()` appends a *fresh* `<style>` element to `document.head`. Reusing the same Previewer for N reflows accumulates N injected style elements in `document.head`. Creating a fresh Previewer makes each reflow's accumulation a one-shot leak that we clean up in `useEffect` cleanup via `previewer.polisher.destroy()` + `previewer.chunker.destroy()`. (Note: `Previewer` class itself has *no* destroy method `[VERIFIED: previewer.js — search for "destroy"]`; we call destroy on the constituent polisher and chunker.)

**Example:**
```typescript
// Source: derived from previewer.js + polisher.js (destroy at line 141) + chunker.js (destroy at line 821)
useEffect(() => {
  if (!htmlContent.trim()) return // empty branch — handled in render

  let cancelled = false
  let activePreviewer: any = null

  const root = previewerRootRef.current
  if (!root) return
  root.innerHTML = '' // clear leftovers from previous render

  ;(async () => {
    try {
      const { Previewer } = await import('pagedjs') // dynamic import → code-split paged.js
      if (cancelled) return

      const wrapper = document.createElement('div')
      wrapper.className = `theme-${template} ${TEMPLATE_STYLES[template].container}`
      wrapper.innerHTML = DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] })

      const previewer = new Previewer()
      activePreviewer = previewer

      const flow = await previewer.preview(
        wrapper,
        [{ inline: '@page { size: A4 portrait; margin: 15mm; }' }],
        root
      )
      if (cancelled) return
      setPageCount(flow.pages.length)
    } catch (err) {
      console.error('paged.js render failed', err)
      // fallback: render plain DOMPurify output into root
      if (!cancelled && root) {
        root.innerHTML = `<div class="theme-${template} ${TEMPLATE_STYLES[template].container}">${DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] })}</div>`
      }
    }
  })()

  return () => {
    cancelled = true
    if (activePreviewer) {
      try { activePreviewer.polisher?.destroy() } catch { /* swallow */ }
      try { activePreviewer.chunker?.destroy() } catch { /* swallow */ }
    }
  }
}, [htmlContent, template])
```

### Pattern 3: Explicit stylesheets argument (CRITICAL safety)

**What:** Always pass a non-empty array (even just `[{ inline: '@page {…}' }]`) as the second argument to `Previewer.preview()`. **NEVER** call `.preview(content, undefined, target)` or `.preview(content)`.

**When to use:** Always, in this codebase. This is the single most important guardrail.

**Why:** `[VERIFIED: src/polyfill/previewer.js lines 187-189]`:
```js
if (!stylesheets) {
    stylesheets = this.removeStyles();
}
```
`removeStyles()` queries `document` for all `<link rel="stylesheet">` and `<style>` elements that are NOT `media="screen"` and NOT marked `data-pagedjs-ignore`, **removes them from the document**, and returns their hrefs/inline text as the stylesheets array. In our app that would strip the Tailwind Play CDN tag, the Vite-injected stylesheets, and the theme CSS — breaking the editor pane, the header chrome, and the un-paginated `#print-area` `<Preview>` simultaneously. Passing `[]` is technically safe because `!stylesheets` is `false` for an empty array `[VERIFIED: node -e exercise]`, but we *want* the `@page` rule processed so we pass it as inline CSS.

The inline-CSS object form `[{ '<key>': 'css-string' }]` is the documented way to feed CSS without an HTTP fetch. `[VERIFIED: src/polisher/polisher.js lines 59-72 — when source is an object, it treats each key as URL and value as CSS string]`.

### Anti-Patterns to Avoid

- **Calling `paged.preview()` without a `stylesheets` argument** — `removeStyles()` is destructive. Always pass at least `[]` or an inline-CSS object.
- **Putting `.theme-${template}` on the renderTo / mount root div** — works for theme rules (Tailwind `@apply` cascades through `.pagedjs_*` containers) but means paged.js's own internal margin boxes (`.pagedjs_margin`, `.pagedjs_marks-*`) inherit theme styles unintentionally. Wrap the *source content* instead.
- **Mounting the Tailwind Play CDN script *after* paged.js runs** — order matters. The CDN `<script>` in `index.html` is fine where it is; paged.js content (user's resume HTML) needs Tailwind utility classes resolved at the moment paged.js measures content. Tailwind Play CDN observes DOM mutations and re-resolves automatically `[ASSUMED: known Play CDN behavior; verify during execution if classes look unstyled inside .pagedjs_page]`.
- **Reusing the same `Previewer` instance across reflows** — leaks `<style>` elements in `document.head` (one per reflow). Fresh instance + cleanup is simpler than tracking shared state.
- **Adding `break-inside: avoid` rules opportunistically** — CONTEXT D-05/D-06 explicitly says don't. Resist suggesting these even if a sample resume looks chunky.
- **Forced page-break at h2** — same, CONTEXT D-06 says no.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Measure rendered HTML height and slice at page boundaries | Custom JS that walks the DOM, sums `offsetHeight`, splits the tree at 297mm boundaries | `Previewer.preview()` | Pagination across `<p>`, `<li>`, and inline content involves word/line-level break decisions, float/figure handling, table-row overflow, widow/orphan control, named pages, running headers, `@page` margin boxes, and CSS counters — all spec'd in W3C CSS Paged Media. paged.js is an 8-year-old MIT polyfill implementing this. Re-doing it is a year of work and will be worse than paged.js on real content. |
| A4 page rectangles with @page-like inner margin | Hand-coded `width: 210mm; height: 297mm; padding: 15mm; overflow: hidden` divs | `Previewer.preview()` + `@page { size: A4; margin: 15mm }` | Hand-coded fixed-height divs *clip* content that overflows — they don't paginate. They produce one big rectangle, not multiple A4 pages. Defeats PREV-02. |
| Page counter | DOM node counting via `document.querySelectorAll('.pagedjs_page').length` | `flow.pages.length` (Chunker.total) from the resolved `preview()` Promise | CONTEXT D-03 explicitly mandates the native counter as single source of truth. Also: DOM node counting before paged.js finishes async layout would race and return a stale count. |
| Multi-page break detection | "If `htmlContent.length > 5000` show two pages" or similar heuristic | `Previewer.preview()` (it measures real rendered content) | Heuristics break for any non-standard font, theme, or content density. The whole point of paged.js is this is a measured operation. |
| Print path replacement | New PDF library swap (puppeteer, pdfmake, react-pdf) | (do nothing this phase) | `window.print()` + `@page` already works for current PDF export. Phase 10 unifies preview and print on top of paged.js. Don't touch this phase. |

**Key insight:** paged.js exists *exactly* because in-browser pagination is a hard problem with a published W3C spec and no native browser implementation (browsers honor `@page` only during their own print pipeline, not for on-screen layout). For an embedded "preview as paginated A4" feature, paged.js is the right and only mature tool. Re-implementing any of it inside this project is wasted effort and a maintenance liability for a one-developer personal tool.

---

## Runtime State Inventory

> Not applicable — this is a greenfield phase (adding a new dependency and rendering path). No rename / refactor / migration involved. No stored data, live service config, OS-registered state, secrets, or build artifacts change names. Skipping the inventory.

---

## Common Pitfalls

### Pitfall 1: Two `<Preview>` instances both try to paginate

**What goes wrong:** `App.tsx` renders `<Preview>` twice — once inside `<SplitPane>/<MobileTabs>` and a sibling inside `<div id="print-area">`. If paged.js integration is wholesale-replacing the current rendering path inside `Preview.tsx`, both instances mount Previewers and each appends a `.pagedjs_pages` container into its own root. The `#print-area` instance is `display: none` during normal browsing, but paged.js will still run a full async pagination cycle inside it (CPU + DOM churn × 2 on every keystroke), AND inject duplicate `<style>` elements into `document.head` (the polisher injects to `document.head`, not to `renderTo`), AND when `window.print()` fires, the `#print-area` paged.js output competes with the browser's native print pagination.

**Why it happens:** `Preview.tsx` is currently a pure component with no awareness of *where* it's mounted. The sibling-in-print-area pattern was added for the export-PDF flow.

**How to avoid:** Add an `enablePagination?: boolean` prop to `Preview` (default `true`). In `App.tsx`, pass `enablePagination={false}` to the `#print-area` instance. The off-pagination branch renders the existing `dangerouslySetInnerHTML` path. The on-pagination branch runs the paged.js useEffect. This is also the natural fallback path when paged.js fails (UI-SPEC failure behavior).

**Warning signs:** During dev, inspect `document.head` and look for multiple `<style data-pagedjs-inserted-styles>` elements. Inspect `#print-area > .pagedjs_pages` — it shouldn't exist.

### Pitfall 2: `Previewer.preview(content, undefined, target)` strips document stylesheets

**What goes wrong:** Tailwind, theme CSS, app shell styles all vanish on the first `.preview()` call. Editor pane goes unstyled. Header becomes plain HTML.

**Why it happens:** `[VERIFIED: src/polyfill/previewer.js lines 187-189]` — when `stylesheets` is omitted (falsy), `removeStyles()` is invoked and sweeps the document.

**How to avoid:** Always pass an explicit `stylesheets` argument. For this phase, pass `[{ inline: '@page { size: A4 portrait; margin: 15mm; }' }]`. Passing `[]` also works (suppresses the sweep) but then `@page` won't be processed — we want the inline rule.

**Warning signs:** After first paint, app chrome looks like unstyled HTML; Tailwind classes don't apply; rerunning the dev server doesn't fix it (because the stylesheets were ripped at runtime, not at build).

### Pitfall 3: `Chunker.setup(renderTo)` appends, doesn't replace

**What goes wrong:** Multiple `.pagedjs_pages` containers stack inside the mount div across re-renders. After 5 keystrokes you have 5 stacks of pages.

**Why it happens:** `[VERIFIED: src/chunker/chunker.js setup() method ~line 175 — `renderTo.appendChild(this.pagesArea)`]`. paged.js does not assume control of the renderTo's children. It appends, full stop. On the *same Previewer's* second `.preview()` call, `Chunker.flow()` detects the pre-existing `pagesArea` and calls `removePages()` — but that only clears pages within its own pagesArea, not other content in renderTo.

**How to avoid:** Pattern 2 above — fresh Previewer per reflow, and `previewerRootRef.current.innerHTML = ''` before each preview call.

**Warning signs:** Page count grows unboundedly; preview pane shows multiple "Page 1"s stacked.

### Pitfall 4: Tailwind Play CDN runs *after* paged.js measures content

**What goes wrong:** Theme classes (`text-xl`, `font-bold`, etc.) are emitted in the HTML but not yet resolved to CSS when paged.js starts measuring. Content gets paginated with default browser metrics → wrong page count, wrong break positions. Then Tailwind CDN resolves classes → preview reflows visually but page count is already in React state from the bad measurement.

**Why it happens:** Tailwind Play CDN observes DOM mutations and asynchronously injects CSS. paged.js's `Chunker.flow()` runs `await this.loadFonts()` `[VERIFIED: chunker.js line 289]` but doesn't wait for arbitrary "external stylesheet resolution".

**How to avoid (Plan A — preferred):** Phase 7 keeps Tailwind Play CDN as-is. Tailwind v4 with `@tailwindcss/vite` is the *primary* CSS pipeline; Play CDN is only there for user-authored utility classes inside markdown HTML. Template/theme classes are NOT served by Play CDN — they're served by Vite's compiled CSS (because they're written as `@apply` rules in `theme-*.css` and processed at build time). So paged.js measurement should be accurate for the theme styles that determine the bulk of layout.

**How to avoid (Plan B — backup if measurement is off):** Wrap `previewer.preview(...)` in a one-paint `requestAnimationFrame` delay so Play CDN has time to flush. Empirically test.

**Warning signs:** First-paint page count doesn't match what's visible after 200ms; user-authored Tailwind classes in markdown HTML look unstyled inside `.pagedjs_page` boxes.

### Pitfall 5: Calling `.preview()` while a previous call is still in flight

**What goes wrong:** Fast typing → debounce fires, calls `.preview()` → mid-render the next debounce fires, calls `.preview()` again. Now two async chunkers race; the second's pagesArea is appended *to the same renderTo* (because the `useEffect` cleanup hasn't run yet — only the next render's effect body runs *after* the previous cleanup, and effects run *after* paint). Result: duplicate pagesArea OR interleaved DOM mutation.

**Why it happens:** paged.js has no built-in abort. The Chunker has `stop()` `[VERIFIED: chunker.js line 360 — sets `this.stopped = true`]` but it's not documented and works at the layout-loop granularity, not as a clean cancel.

**How to avoid:** The existing 150ms `debounceRef` in `App.tsx` (CONTEXT D-02) *already coalesces fast typing into one `setHtmlContent` per ~150ms* — so `useEffect([htmlContent, template])` in `Preview.tsx` only fires per debounced batch. Within `useEffect`, use a `cancelled` flag in closure (`Pattern 2` above) so when the effect re-runs (or the component unmounts), the in-flight preview's `setPageCount` is a no-op. The destroyed Previewer's DOM is removed by `chunker.destroy()` in cleanup.

**Why a `cancelled` flag is enough (not a full abort):** A typical 1–3 page resume renders in 100–500ms on a modern laptop `[ASSUMED — paged.js perf depends on content size; for short docs it's fast]`. Even if a "stale" preview finishes after a new one started, the cleanup of the *previous* Previewer already removed its pagesArea, and the `cancelled` flag prevents stale state updates. The cost is a few hundred ms of wasted CPU per orphaned render — acceptable.

**Warning signs:** Console shows "Rendered N pages" twice in quick succession; transient flicker as old pagesArea is removed before new one appears (acceptable per UI-SPEC "previous count remains displayed during reflow").

### Pitfall 6: paged.js does not auto-cleanup the injected `document.head` `<style>` element

**What goes wrong:** After 100 reflows, `document.head` contains 100 `<style data-pagedjs-inserted-styles>` elements. The DOM gets heavy. Tools like React DevTools show a slowly bloating head.

**Why it happens:** `[VERIFIED: src/polisher/polisher.js setup() method ~line 47]` — every `polisher.setup()` `document.head.appendChild(this.styleEl)`. No automatic removal unless `polisher.destroy()` is called.

**How to avoid:** The `useEffect` cleanup function in Pattern 2 above. Call `previewer.polisher.destroy()` (which removes the styleEl + inserted sheets) AND `previewer.chunker.destroy()` (which removes the pagesArea).

**Warning signs:** Open DevTools → Elements → expand `<head>` after typing for 30s. Should see at most 1–2 `<style data-pagedjs-inserted-styles>` (the current render's, plus possibly the previous one mid-cleanup). If you see dozens, cleanup isn't running.

### Pitfall 7: paged.js does NOT ship TypeScript types

**What goes wrong:** `import { Previewer } from 'pagedjs'` → TS2307: "Cannot find module 'pagedjs' or its corresponding type declarations."

**Why it happens:** `[VERIFIED: pagedjs@0.4.3 package.json — no `types` field; npm view @types/pagedjs version → not published]`. Upstream issue: `[CITED: github.com/pagedjs/pagedjs/issues/97 — "Add types"]`.

**How to avoid:** Create `src/types/pagedjs.d.ts`:
```typescript
declare module 'pagedjs' {
  export class Previewer {
    constructor(options?: object)
    preview(
      content: HTMLElement | DocumentFragment | string,
      stylesheets: Array<string | Record<string, string>>,
      renderTo: HTMLElement | string
    ): Promise<{
      total: number
      pages: Array<{ /* paged.js Page object */ }>
      performance: number
      size: { width: { value: number, unit: string }, height: { value: number, unit: string } }
    }>
    polisher: { destroy(): void }
    chunker: { destroy(): void, total: number, pages: any[] }
    on(event: string, cb: (...args: any[]) => void): void
  }
}
```
Reference it from `tsconfig.json` (Vite reads `src/**/*.d.ts` automatically if `include` covers it — verify in this project). Alternatively, sprinkle `// @ts-expect-error` next to the import. The ambient declaration is one-time work and gives autocomplete; recommended.

**Warning signs:** Red squiggle on `import { Previewer } from 'pagedjs'`, `Previewer` typed as `any`.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build (npm install pagedjs) | ✓ | v20.11.0 (per CLAUDE.md / PROJECT.md) | — |
| npm | Install pagedjs | ✓ | 10.2.4 | — |
| Vite | Bundle pagedjs into dev/build | ✓ | 5.4.10 | — |
| `pagedjs` (npm) | Pagination engine | ✗ (not yet installed) | will be 0.4.3 | No fallback — phase blocked without it. CDN `<script>` tag in `index.html` is a worse alternative (auto-runs polyfill on whole document, breaks app). |
| Existing browser APIs (`document.createElement`, `URL`, `performance.now`, `requestIdleCallback`) | paged.js internals | ✓ | — | — |

**Missing dependencies with no fallback:**
- `pagedjs` npm package — must be installed via `npm install pagedjs` as part of Plan execution. No equivalent.

**Missing dependencies with fallback:**
- (none)

---

## Code Examples

### Example 1: Full Preview.tsx skeleton with paged.js + fallback + page-count callback

```typescript
// Source: derived from
//   - github.com/pagedjs/pagedjs/blob/main/src/polyfill/previewer.js (preview() signature, lines 178-205)
//   - github.com/pagedjs/pagedjs/blob/main/src/chunker/chunker.js (flow() returns Chunker with .pages and .total)
//   - github.com/pagedjs/pagedjs/blob/main/src/polisher/polisher.js (destroy() at line 141)
//   - existing src/components/Preview.tsx (theme class + container pattern)
//   - existing src/App.tsx (debounceRef pattern)
//
// Note: this is a reference shape for the planner — exact structure is the planner's call.
import { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { TEMPLATE_STYLES, type TemplateName } from '../lib/templateStyles'
import '../styles/themes.css'

interface PreviewProps {
  htmlContent: string
  template: TemplateName
  enablePagination?: boolean  // default true; pass false for the #print-area sibling
  onPageCountChange?: (n: number) => void
}

export default function Preview({
  htmlContent,
  template,
  enablePagination = true,
  onPageCountChange,
}: PreviewProps) {
  const styles = TEMPLATE_STYLES[template] ?? TEMPLATE_STYLES['classic']
  const previewerRootRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!enablePagination) return
    if (!htmlContent.trim()) return
    if (!previewerRootRef.current) return

    let cancelled = false
    let activePreviewer: any = null
    const root = previewerRootRef.current
    root.innerHTML = ''
    setHasError(false)

    ;(async () => {
      try {
        const { Previewer } = await import('pagedjs')
        if (cancelled) return

        const wrapper = document.createElement('div')
        wrapper.className = `theme-${template} ${styles.container}`
        wrapper.innerHTML = DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] })

        const previewer = new Previewer()
        activePreviewer = previewer

        const flow = await previewer.preview(
          wrapper,
          [{ pagedjs_inline: '@page { size: A4 portrait; margin: 15mm; }' }],
          root
        )
        if (cancelled) return

        setPageCount(flow.pages.length)
        onPageCountChange?.(flow.pages.length)
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
  }, [htmlContent, template, enablePagination, styles.container, onPageCountChange])

  if (!htmlContent.trim()) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Start typing markdown to see your resume preview
      </div>
    )
  }

  // Plain (non-paginated) path — used by #print-area sibling AND as paged.js failure fallback
  if (!enablePagination || hasError) {
    return (
      <div
        className={`theme-${template} ${styles.container}`}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] }) }}
      />
    )
  }

  // Paginated path — paged.js mounts inside previewerRootRef
  return (
    <div className="relative h-full overflow-auto bg-gray-100 px-4 py-6">
      <div ref={previewerRootRef} />
      <div
        className="sticky bottom-4 right-4 ml-auto inline-block bg-gray-900/85 text-white text-xs font-medium leading-tight px-2 py-1 rounded-md"
        // Placement / styling per UI-SPEC §"Page counter placement"
      >
        Page {pageCount ?? '–'} of {pageCount ?? '–'}
      </div>
    </div>
  )
}
```

### Example 2: TypeScript ambient declaration

```typescript
// Source: derived from observation that pagedjs ships no .d.ts (verified via npm view + GitHub
// pagedjs/pagedjs issue #97). Shape mirrors the verified Previewer source at
// github.com/pagedjs/pagedjs/blob/main/src/polyfill/previewer.js
//
// File: src/types/pagedjs.d.ts
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
      renderTo: HTMLElement | string
    ): Promise<PagedjsFlow>
    polisher: { destroy(): void }
    chunker: { destroy(): void; total: number; pages: unknown[] }
    on(event: 'page' | 'rendering' | 'rendered' | 'size' | 'atpages', cb: (...args: unknown[]) => void): void
  }

  export class Handler {
    constructor(chunker: unknown, polisher: unknown, caller: unknown)
  }

  export function registerHandlers(...handlers: unknown[]): void
}
```

### Example 3: CSS for page rectangle chrome (sketch)

```css
/* Source: derived from UI-SPEC §"Visual Style Tokens" + paged.js emitted class names verified in
 * github.com/pagedjs/pagedjs/blob/main/src/chunker/chunker.js TEMPLATE const.
 *
 * File: src/styles/pages.css (imported from index.css)
 */

/* Pane surround: handled at the React layer via bg-gray-100 on the scroll viewport */

/* The page sheet itself — paged.js emits <div class="pagedjs_page"> per page */
.pagedjs_page {
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
  /* width/height come from @page rule in the inline stylesheet passed to Previewer.preview() */
}

.pagedjs_page:last-child {
  margin-bottom: 0;
}

/* paged.js emits its outer container as <div class="pagedjs_pages"> */
.pagedjs_pages {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Print path: hide on-screen chrome during print (the existing #app-shell { display: none }
 * rule already hides the entire preview pane, so this is belt-and-suspenders).
 * Phase 10 will unify; this phase keeps existing print path intact.
 */
@media print {
  .pagedjs_page {
    box-shadow: none;
    border: none;
    margin-bottom: 0;
  }
}
```

### Example 4: package.json patch

```json
// Source: derived from npm view pagedjs version (verified 0.4.3 as of 2024-10-04)
{
  "dependencies": {
    "pagedjs": "^0.4.3"
  }
}
```

### Example 5: vite.config.ts safety net (only if dep pre-bundling complains)

```typescript
// Source: vite.dev/config/dep-optimization-options + WebSearch on Vite + pagedjs
// integration patterns. Add only if `npm run dev` errors on the pagedjs import.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['pagedjs'],
  },
})
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Fixed-height div + `overflow: hidden` to "look like a page" | paged.js (W3C CSS Paged Media polyfill) | ~2018 (paged.js initial release) | Real pagination — content actually flows across pages instead of being clipped. |
| `<script src="paged.polyfill.js">` from CDN (auto-runs on document load) | `import { Previewer } from 'pagedjs'` (manual control) | ~v0.3 (~2020) | Embeddable in SPAs; doesn't paginate the whole document. Required for our use case. |
| Counting `.pagedjs_page` DOM nodes from outside paged.js | Reading `flow.pages.length` from the resolved `preview()` Promise | (always preferred since paged.js exposed the Flow object) | Single source of truth, no race against paged.js's async layout. CONTEXT D-03 codifies this for our project. |
| Hand-rolled "measure offsetHeight, slice at 1123px" | `Previewer.preview()` | — | Word-level and line-level break decisions, float handling, named pages, counters — all spec-defined paged-media features come for free. |

**Deprecated/outdated:**
- `pagedjs@0.5.0-beta.2` is published but not the `latest` tag; treat as experimental. Use `^0.4.3`.
- `@types/pagedjs` does NOT exist on npm — don't try to install it. Use ambient declaration.
- The historical Vite 2 beta.20 regression `[CITED: github.com/vitejs/vite/issues/1488]` is irrelevant to Vite 5.4.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Vite/Rollup tree-shakes paged.js to ~200–300 KB gzipped (vs 280 KB gzipped for full polyfill) | Standard Stack | Bundle size grows somewhat; not a functional risk. Mitigate by measuring after first `npm run build`. |
| A2 | Tailwind Play CDN resolves utility classes inside paged.js's emitted DOM before/synchronously with paged.js's measurement (Pitfall 4 Plan A) | Common Pitfalls | If wrong, page-break positions are computed against unstyled content → wrong page count on first paint. Mitigate by adding a `requestAnimationFrame` delay before `.preview()` (Plan B). User can validate manually after first build. |
| A3 | `previewer.polisher.destroy()` + `previewer.chunker.destroy()` is sufficient cleanup (no other leaks) | Common Pitfalls #6 | If wrong, memory grows slowly across hours of editing. Personal tool, low risk. Detect via DevTools head inspection. |
| A4 | `@ggrossetie/pagedjs` community fork has no compelling advantage over upstream | Alternatives Considered | If wrong, we miss out on Vite-friendly ESM build. Mitigate by switching forks if upstream causes friction. |
| A5 | Typical 1–3 page resume paginates in 100–500ms on a modern laptop | Common Pitfalls #5 | If much slower, the "previous count stays displayed during reflow" UX may feel laggy and PREV-03's "~150ms" target slips. Validate empirically on first build. |
| A6 | paged.js does not need to know about Tailwind/theme CSS via its `stylesheets` argument — those styles are already in the document and cascade through paged.js's emitted DOM | Architecture Patterns | If wrong, themed text inside `.pagedjs_page_content` is unstyled. Mitigate by passing theme CSS file references in the stylesheets array as a Plan B. |

If user wants to validate any of these before locking the plan, that's the right point to confirm.

---

## Open Questions

1. **Where does the page-counter pill live in the React tree — inside `Preview.tsx` or hoisted to `App.tsx`?**
   - What we know: UI-SPEC §"Page counter placement" says "sticky / absolute inside the preview-pane viewport". Both arrangements satisfy this.
   - What's unclear: whether `App.tsx` needs the page count for anything else (it does not, as of now).
   - Recommendation: keep the pill **inside `Preview.tsx`**. The page count is local state of the paginated preview; only `Preview` knows when it updates (when paged.js resolves). Lifting it would require an extra prop callback and add no value. If a future phase needs it elsewhere, lift then. Provide an `onPageCountChange?: (n: number) => void` prop as a hook for the future.

2. **Should paged.js be loaded statically (`import { Previewer } from 'pagedjs'`) or dynamically (`await import('pagedjs')`)?**
   - What we know: pagedjs is ~280 KB gzipped (estimated). Static import means it sits in the main bundle. Dynamic import code-splits it.
   - What's unclear: how critical the first-paint perf is for a personal tool.
   - Recommendation: **dynamic import** (`await import('pagedjs')` inside the useEffect). Three benefits: (a) initial bundle smaller, (b) editor pane loads + interactive before paged.js downloads, (c) paged.js code only fetched when preview is actually rendered. Trivial complexity cost (one extra `await`). Already incorporated in Example 1.

3. **What's the right inline-CSS key for the stylesheet object passed to `Previewer.preview()`?**
   - What we know: `polisher.add(...)` accepts objects shaped `{ url: cssText }` `[VERIFIED: polisher.js lines 59-72]`. The key is used as the "source URL" for downstream processing (e.g., `@import` URL resolution).
   - What's unclear: whether the key matters at all for inline CSS with no `@import`.
   - Recommendation: use a meaningless-but-stable key like `'pagedjs_inline'` or `window.location.href` (the source code itself does the latter for `<style>` tags `[VERIFIED: previewer.js line 156]`). Either works for our `@page`-only inline rule.

4. **Does the page rectangle need any horizontal centering inside the preview pane?**
   - What we know: A4 width 794px @ 96dpi; preview pane is typically 400–900px wide.
   - What's unclear: UI-SPEC §"Page rectangle layout" shows the page indented inside a viewport with `px-4` (16px gutters) and centered via `align-items: center`. But when pane < 826px, page exceeds pane width → horizontal scroll (UI-SPEC accepts this, Phase 9 fixes).
   - Recommendation: Use `display: flex; flex-direction: column; align-items: center;` on `.pagedjs_pages` per Example 3. This centers when there's room and lets horizontal scroll engage when there isn't.

5. **What does `preview()` do if called with whitespace-only content?**
   - What we know: UI-SPEC says skip paged.js entirely on empty content — already handled by the existing empty-state branch in `Preview.tsx`.
   - What's unclear: behavior on `"   \n  \n"`. Most likely renders 1 empty page.
   - Recommendation: guard with `if (!htmlContent.trim()) return` in the useEffect (Example 1). Same as existing empty-state guard. Don't trust paged.js to be graceful on empty input.

---

## Sources

### Primary (HIGH confidence)
- **paged.js source** (canonical API, verified by direct file read):
  - `https://raw.githubusercontent.com/pagedjs/pagedjs/main/src/polyfill/previewer.js` — Previewer class, preview() signature, removeStyles() behavior, stylesheets default fallback
  - `https://raw.githubusercontent.com/pagedjs/pagedjs/main/src/chunker/chunker.js` — Chunker.flow() return shape, .pages array, .total property, setup() appendChild semantics, removePages(), destroy()
  - `https://raw.githubusercontent.com/pagedjs/pagedjs/main/src/polisher/polisher.js` — Polisher.setup() injects to document.head, add() accepts URL or `{url: cssText}` objects, destroy()
  - `https://raw.githubusercontent.com/pagedjs/pagedjs/main/src/index.js` — public exports (Chunker, Polisher, Previewer, Handler, registerHandlers, registeredHandlers, initializeHandlers)
  - `https://raw.githubusercontent.com/pagedjs/pagedjs/main/package.json` — version, license, exports map, no types
- **npm registry** — `npm view pagedjs` confirmed version 0.4.3 latest (modified 2024-10-04), MIT, no `engines` constraint
- **paged.js docs**:
  - `https://pagedjs.org/devdocs/` — JSDoc-generated API reference (Previewer methods, handler hooks)
  - `https://pagedjs.org/en/documentation/10-handlers-hooks-and-custom-javascript/` — registerHandlers + afterRendered hook documentation
  - `https://pagedjs.org/en/documentation/7-generated-content-in-margin-boxes/` — counter(pages) CSS counter usage

### Secondary (MEDIUM confidence)
- **Vite + pagedjs integration**:
  - `https://github.com/vitejs/vite/issues/1488` — historical regression (Vite 2 beta.20) confirming pagedjs + Vite has historical hiccups; fixed by current `exports` map in pagedjs@0.4.x
  - `https://doc.doppio.sh/article/using-pagedjs-with-react` — minimal React+pagedjs example (third-party blog, 2024 timeframe)
  - `https://doppio.sh/blog/using-pagedjs-with-next-js` — Next.js client-component pattern (same author)
- **DeepWiki pagedjs entry** — `https://deepwiki.com/pagedjs/pagedjs/2.5-polisher-and-css-processing` — confirms Polisher's @page rule handling
- **GitHub issues**:
  - `https://github.com/pagedjs/pagedjs/issues/22` — feature request about incremental rerender (confirms maintainer is aware of perf concern; no built-in solution)
  - `https://github.com/pagedjs/pagedjs/issues/97` — confirms no TypeScript types

### Tertiary (LOW confidence)
- WebSearch result mentioning `flow.total` as the canonical page count — corroborated by direct source-code read, so promoted to HIGH for that specific claim.
- WebSearch claims about pagedjs bundle size and performance — uncorroborated, marked as `[ASSUMED]` above; user should measure empirically.

---

## Project Constraints (from CLAUDE.md)

| Directive | How Phase 7 honors it |
|-----------|------------------------|
| **Client-side only — no server, no backend** | paged.js runs entirely in the browser. Zero server involvement. ✓ |
| **No auth, no user management** | N/A — this phase adds no users/sessions/credentials. ✓ |
| **Tech stack: markdown-it for parsing, CodeMirror for editor, html2pdf.js or jsPDF for PDF export** | paged.js is a new dependency. CONTEXT D-01 locked it as the chosen pagination engine, which is additive to (not replacing) the listed stack. The PDF export path (`window.print()` + `@page`) is unchanged this phase. Phase 10 will revisit PDF parity. ✓ |
| **GSD Workflow Enforcement — start work through a GSD command** | This research was spawned by `/gsd-plan-phase 7` (per STATE.md `next_action`). Plan execution will be through `/gsd-execute-phase`. ✓ |

No constraints in CLAUDE.md conflict with the recommended approach.

---

## Metadata

**Confidence breakdown:**
- Standard stack: **HIGH** — pagedjs version, license, package shape verified directly via npm CLI and raw GitHub source.
- Architecture / API surface: **HIGH** — Previewer.preview() signature, return shape, default behaviors all verified by reading `src/polyfill/previewer.js` and `src/chunker/chunker.js` directly. Not relying on training data.
- Pitfalls: **HIGH** for #1-#3, #6, #7 (verified in source). **MEDIUM** for #4 (Tailwind Play CDN timing — depends on runtime behavior). **MEDIUM** for #5 (concurrent preview — pattern derived from source + general async hygiene, no maintainer doc).
- Code examples: **HIGH** — derived from verified API surface + existing Preview.tsx pattern.
- Bundle size / perf estimates: **MEDIUM** — file sizes verified via direct fetch; gzipped + tree-shaken estimate is reasoned, not measured. User should validate during first build.

**Research date:** 2026-05-18
**Valid until:** 2026-06-17 (~30 days; pagedjs is stable, slow-moving — last release 2024-10. Tailwind v4 and Vite 5 are also stable.)

---

*Phase: 07-page-chrome-auto-pagination*
*Research generated: 2026-05-18*
