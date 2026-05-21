---
phase: 10-unified-pixel-perfect-pdf-pipeline
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - CLAUDE.md
  - README.md
  - package.json
  - package-lock.json
  - src/App.tsx
  - src/components/Preview.tsx
  - src/components/PrintMount.tsx
  - src/index.css
findings:
  critical: 0
  warning: 4
  info: 4
  total: 8
status: findings
---

# Phase 10: Code Review Report

**Reviewed:** 2026-05-21
**Depth:** standard
**Files Reviewed:** 8
**Status:** findings

## Summary

Phase 10 cleanly unifies the PDF export pipeline behind a single paged.js DOM and removes the `html2pdf.js` dependency. The new `<PrintMount/>` component is small, well-commented, and mirrors `<Preview/>`'s paged.js lifecycle pattern (fresh `Previewer` per reflow, `cancelled` flag, `polisher`/`chunker` destroy on cleanup), which is good for consistency.

`grep` across `src/` and `package.json` confirms **no surviving references** to `html2pdf.js`, `html2canvas`, or `jspdf` — the dependency removal is complete. No orphaned imports.

The print CSS is structured carefully (screen-side `position: fixed; visibility: hidden` cloak + `@media print` overrides) and `pages.css`'s defensive `@media print` rules (Phase 7/9) cooperate cleanly with the new `#print-area` selector — no specificity collisions found.

However, several real correctness issues warrant attention before this is considered done:

1. `PrintMount` is **silent on render failure** — if paged.js throws, `#print-area` stays empty and the user gets a blank PDF with no feedback (Preview has a `hasError` fallback path; PrintMount doesn't).
2. `PrintMount` has a **stale-DOM bug**: clearing all content then printing prints the *previous* resume (the early-return skips `root.innerHTML = ''`).
3. `handleExportPdf` in `App.tsx` restores `document.title` immediately after `window.print()`, which races against asynchronous print dialogs (Safari, some Chromium configs) and can produce the wrong PDF filename.
4. There is **no signal back to App** when `PrintMount`'s initial paged.js render finishes — a user who clicks Export PDF in the first ~100ms gets an empty print mount.

The codebase otherwise looks healthy, the lifecycle/cleanup logic is sound, and DOMPurify sanitization is consistently applied in both mount points.

## Warnings

### WR-01: PrintMount silently swallows paged.js failures — produces blank PDF with no user feedback

**File:** `src/components/PrintMount.tsx:53-55`
**Issue:** When paged.js throws inside the IIFE, the error is logged to console but the user gets no signal. `#print-area` stays empty, and the next `window.print()` produces a blank PDF. `Preview.tsx` handles the same failure mode by tracking `hasError` and falling back to a non-paginated DOM render (`Preview.tsx:140-147`). `PrintMount` should mirror that fallback so the user still gets *something* printable.

**Fix:**
```tsx
// In PrintMount.tsx — track error state and render fallback DOM on failure
const [hasError, setHasError] = useState(false)

useEffect(() => {
  // ...existing setup...
  setHasError(false)
  ;(async () => {
    // ...
    try {
      // ...existing paged.js render...
    } catch (err) {
      console.error('paged.js print-mount render failed', err)
      if (!cancelled) setHasError(true)
    }
  })()
  // ...
}, [...])

if (hasError) {
  return (
    <div
      className={`theme-${template} ${styles.container}`}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] }) }}
    />
  )
}
return <div ref={rootRef} />
```

### WR-02: PrintMount stale DOM — clearing content then printing emits the previous resume

**File:** `src/components/PrintMount.tsx:27-30`
**Issue:** The effect early-returns when `htmlContent.trim()` is empty (line 28), **before** clearing `root.innerHTML`. If the user has a non-empty resume that paged.js rendered into `rootRef`, then deletes all markdown so `htmlContent` becomes empty, the prior paged.js output is left mounted. A subsequent `window.print()` will print the stale, previously-rendered resume — not an empty page. This is a real data-leak / wrong-output bug for the "clear & print" path.

**Fix:**
```tsx
useEffect(() => {
  const root = rootRef.current
  if (!root) return

  // Always clear stale paged.js output first, *then* early-return on empty.
  root.innerHTML = ''
  if (!htmlContent.trim()) return

  let cancelled = false
  let activePreviewer: Previewer | null = null
  // ...rest unchanged...
}, [...])
```

### WR-03: `document.title` restored synchronously after `window.print()` — race produces wrong PDF filename

**File:** `src/App.tsx:91-97`
**Issue:** `handleExportPdf` sets `document.title` to the resume name, calls `window.print()`, then immediately restores the original title on the next statement. In Chromium on desktop, `window.print()` blocks until the print dialog closes, so this works. But in Safari (desktop and iOS) and some Chromium configurations, `window.print()` returns immediately and the dialog opens asynchronously — by the time the browser reads `document.title` to populate the default "Save as PDF" filename, it has already been restored to "md2cv" (or whatever the original was). Users see the wrong filename and have to retype it. The robust fix is to restore on the `afterprint` event, not synchronously.

**Fix:**
```tsx
const handleExportPdf = useCallback(() => {
  const nameMatch = markdownContent.match(/^#\s+(.+)/m)
  const originalTitle = document.title
  if (nameMatch) document.title = nameMatch[1].trim()

  const restore = () => {
    document.title = originalTitle
    window.removeEventListener('afterprint', restore)
  }
  window.addEventListener('afterprint', restore)
  window.print()
  // Note: don't restore here — afterprint fires after the dialog closes,
  // covering both synchronous (Chromium) and async (Safari) print() variants.
}, [markdownContent])
```

### WR-04: No readiness signal from PrintMount — early Export click produces empty PDF

**File:** `src/App.tsx:91-97`, `src/components/PrintMount.tsx`
**Issue:** When `htmlContent` or `margins` change, `PrintMount`'s effect schedules an async paged.js reflow that takes 50–500ms to complete (depending on resume length). During that window `#print-area` is empty (the effect clears `innerHTML` on line 35 before the async work resolves). A user who clicks the "Export PDF" button during this window — for example, after switching templates and immediately exporting — gets a blank PDF. `Preview` exposes `onPageCountChange` for exactly this purpose; `PrintMount` accepts no equivalent callback.

**Fix:** Either (a) plumb `onPageCountChange` through `PrintMount` and have `App` gate the export button on a "print mount ready" boolean, or (b) make `handleExportPdf` await print-mount readiness before calling `window.print()`. Option (b) is simpler:

```tsx
// In PrintMount.tsx — expose a ready signal
interface PrintMountProps {
  htmlContent: string
  template: TemplateName
  margins?: MarginValues
  onReady?: () => void
}
// inside the effect, after `await previewer.preview(...)` resolves:
if (!cancelled) onReady?.()

// In App.tsx — gate export on the latest ready signal
const printReadyRef = useRef(false)
// pass <PrintMount ... onReady={() => { printReadyRef.current = true }} />
// invalidate on content change: in handleMarkdownChange, set printReadyRef.current = false
// handleExportPdf can then poll/await readiness (with a max timeout) before window.print().
```

## Info

### IN-01: `PrintMount` doubles paged.js CPU cost — two reflows per debounce tick

**File:** `src/App.tsx:139,167`, `src/components/PrintMount.tsx:27-65`
**Issue:** `Preview` and `PrintMount` each maintain an independent paged.js `Previewer` and both reflow on every change to `htmlContent`, `template`, or `margins`. That means every 150ms-debounced keystroke triggers **two** full paged.js renders (visible + hidden). This is correctness-adjacent on low-power devices: paged.js reflows are CPU-heavy (~50–500ms per run), and doubling them noticeably affects mobile typing latency and battery. Performance is explicitly out of v1 scope per the review charter, so this is informational — but it's worth a tracking note. Possible future mitigations: lazy-mount `PrintMount` only when the user hovers/focuses the Export button, or share the paged.js result between Preview and PrintMount via a portal.
**Fix:** Track as a follow-up; consider deferring `PrintMount` reflow with `requestIdleCallback` or lazy-mounting on Export click.

### IN-02: `debounceRef` type omits explicit `| undefined`

**File:** `src/App.tsx:62`
**Issue:** `useRef<ReturnType<typeof setTimeout>>()` with no initial argument resolves `.current` to `ReturnType<typeof setTimeout> | undefined` in TypeScript's lib types, but the generic parameter doesn't reflect that. Reading `debounceRef.current` later requires the `if (debounceRef.current)` guard (which the code does, correctly). Functionally fine; just a minor strictness gap that becomes a TS error under `--exactOptionalPropertyTypes` or stricter `useRef` overloads in React 19.
**Fix:** `const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)`

### IN-03: `@types/dompurify` is a deprecated stub — dompurify v3 ships its own types

**File:** `package.json:32`
**Issue:** While we're auditing dependencies post-`html2pdf.js` removal: `dompurify@^3.4.1` (line 23) ships TypeScript declarations in-package since 3.x, which makes `@types/dompurify@^3.2.0` (line 32) a deprecated DefinitelyTyped stub. Keeping it doesn't break the build (the types are compatible), but it's an orphan dev dep that adds install time and can cause subtle type mismatches if the upstream stub drifts from the in-package types.
**Fix:** `npm rm @types/dompurify` and verify the build still type-checks (it should, since `dompurify`'s shipped types cover the API surface used in `Preview.tsx:64,144` and `PrintMount.tsx:41`).

### IN-04: `#print-area` width 210mm exceeds small mobile viewports — potential phantom horizontal scroll

**File:** `src/index.css:67-76`
**Issue:** The screen-side cloak sets `#print-area { position: fixed; width: 210mm; height: auto; visibility: hidden; }`. 210mm ≈ 793.7px, which exceeds many mobile viewports (e.g. iPhone SE at 375px). `position: fixed` removes the box from normal flow so `document.body.scrollWidth` shouldn't see it, and `visibility: hidden` keeps it unpainted — but some browser combinations (older Safari, Android Chrome with overlay scrollbars) can still expose the fixed box to viewport-overflow calculations, producing a phantom horizontal scrollbar on the main viewport. The current `pointer-events: none; z-index: -1` mitigations are good. Worth verifying on a physical iPhone before shipping.
**Fix:** Test on iOS Safari (iPhone SE viewport) and Android Chrome. If a phantom scrollbar appears, gate the cloak via `overflow: hidden` on `html, body` or clip with `clip-path: inset(100%)` instead of (or in addition to) `visibility: hidden`.

---

_Reviewed: 2026-05-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
