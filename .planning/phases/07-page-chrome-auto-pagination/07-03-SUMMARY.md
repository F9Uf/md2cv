---
phase: 07-page-chrome-auto-pagination
plan: "03"
subsystem: preview
tags: [pagedjs, react, integration, page-counter, fallback]
dependency_graph:
  requires: ["07-01", "07-02"]
  provides: ["PREV-01", "PREV-02", "PREV-03"]
  affects: ["src/components/Preview.tsx", "src/App.tsx"]
tech_stack:
  added: ["pagedjs@^0.4.3 (npm install — was in package.json but not installed)"]
  patterns:
    - "Fresh Previewer per reflow + manual mount clear + polisher/chunker destroy"
    - "Static ESM import of Previewer from pagedjs"
    - "cancelled closure flag for async effect cleanup"
    - "Theme class on source wrapper div (not renderTo mount)"
    - "enablePagination prop to bypass paged.js on hidden #print-area instance"
key_files:
  created: []
  modified:
    - src/components/Preview.tsx
    - src/App.tsx
decisions:
  - "Static import chosen over dynamic import (await import) — bundle size acceptable for personal tool per RESEARCH.md A1"
  - "pillLabel shows Page X of X (total count, not current viewport page) per UI-SPEC §Copywriting Contract"
  - "enablePagination defaults to true; only #print-area instance overrides to false"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-18"
  tasks_completed: 2
  files_modified: 2
---

# Phase 07 Plan 03: Paged.js React Integration Summary

Integrated paged.js `Previewer` into `src/components/Preview.tsx` to render the resume as one or more A4 page rectangles with a live "Page X of N" counter pill, while preserving the plain `dangerouslySetInnerHTML` path for the `#print-area` sibling and as a silent error fallback.

## What Was Built

### Task 1: Preview.tsx rewrite with paged.js integration

`src/components/Preview.tsx` was rewritten to support an `enablePagination?: boolean` prop (default `true`) and an `onPageCountChange?: (n: number) => void` callback.

Key implementation details:
- **Static import**: `import { Previewer } from 'pagedjs'` at file top (not dynamic import)
- **Fresh Previewer per reflow**: `new Previewer()` inside the `useEffect` body, NOT in a ref
- **Manual mount clear**: `root.innerHTML = ''` before each `preview()` call (avoids Chunker.setup append accumulation)
- **Explicit stylesheets arg**: `[{ pagedjs_inline: '@page { size: A4 portrait; margin: 15mm; }' }]` — prevents paged.js destructive `removeStyles()` default that would strip Tailwind and theme CSS
- **Theme class on source wrapper**: `wrapper.className = \`theme-\${template} \${styles.container}\`` applied to the content div handed to `previewer.preview()`, NOT on the `previewerRootRef` mount (prevents margin-box style bleed)
- **cancelled flag**: short-circuits `setPageCount`/`onPageCountChange` after re-render or unmount
- **Cleanup**: `polisher.destroy()` + `chunker.destroy()` both wrapped in try/catch to prevent `document.head` `<style>` accumulation
- **Page counter pill**: always visible with `sticky bottom-4 right-4`; shows `Page – of –` before first paged.js resolve, then `Page N of N`
- **Fallback paths**: returns plain `dangerouslySetInnerHTML` when `!enablePagination` OR `hasError === true`
- **Empty state**: preserved verbatim from Phase 6

### Task 2: App.tsx — wire enablePagination={false} on #print-area

Exactly one prop added to `<Preview>` inside `<div id="print-area">`:
```
enablePagination={false}
```
Prevents double paged.js instantiation on every keystroke. The visible pane `<Preview>` (line 113) is unchanged — it uses the default `enablePagination={true}`.

## Deviations from Plan

**[Rule 3 - Blocking] npm install required before build**

- **Found during**: Task 1 verification (`npm run build`)
- **Issue**: `pagedjs` was listed in `package.json` (installed by Plan 01) but `node_modules/pagedjs` was absent in this worktree — build failed with "Rollup failed to resolve import pagedjs"
- **Fix**: Ran `npm install` to materialize the dependency
- **Files modified**: `package-lock.json` (not committed separately — lockfile state)
- **Commit**: part of worktree setup

All other plan acceptance criteria passed without deviation.

## Build Output

`npm run build` exits 0. pagedjs adds ~1.3MB to the largest chunk (index-Y08MYUst.js at 1,317 kB minified / 391 kB gzip). This is consistent with RESEARCH.md A1 — bundle size is an acceptable tradeoff for a personal tool. A future optimization would be switching to `await import('pagedjs')` for code-splitting, but that is explicitly deferred per plan notes.

## Known Stubs

None. All data paths are wired: `flow.pages.length` drives the page counter pill live.

## Threat Flags

None. All threats in the plan's threat model (T-07-10 through T-07-19) are mitigated by the implementation. DOMPurify sanitization appears at every DOM-write site; explicit stylesheets arg is present; polisher/chunker cleanup is implemented; cancelled flag is present; enablePagination={false} prevents double pagination.

## Self-Check: PASSED

- `src/components/Preview.tsx` exists and contains all required strings
- `src/App.tsx` contains `enablePagination={false}` exactly once
- Two task commits exist: 472179c and b25c7ac
- `npm run build` exits 0
