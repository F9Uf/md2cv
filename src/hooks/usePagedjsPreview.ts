import { useEffect, useState, type RefObject } from 'react'
import DOMPurify from 'dompurify'
import { Previewer } from 'pagedjs'
import { type TemplateName } from '../lib/templateStyles'
import { type MarginValues } from '../components/MarginControls'

interface UsePagedjsPreviewArgs {
  rootRef: RefObject<HTMLDivElement | null>
  htmlContent: string
  template: TemplateName
  templateContainerClass: string
  margins: MarginValues
  enabled?: boolean
  onPageCount?: (n: number) => void
  errorLogPrefix?: string
}

export interface UsePagedjsPreviewResult {
  pageCount: number | null
  hasError: boolean
}

export function usePagedjsPreview({
  rootRef,
  htmlContent,
  template,
  templateContainerClass,
  margins,
  enabled = true,
  onPageCount,
  errorLogPrefix,
}: UsePagedjsPreviewArgs): UsePagedjsPreviewResult {
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [hasError, setHasError] = useState(false)

  // Paged.js render effect — runs only when pagination is enabled AND htmlContent is non-empty.
  // Reflow trigger: [htmlContent, template] per CONTEXT.md D-02 (piggybacks on App.tsx's existing 150ms debounce).
  // Lifecycle pattern: fresh Previewer per reflow + manual mount-clear + polisher.destroy + chunker.destroy in cleanup.
  // Stylesheets argument MUST be non-null (RESEARCH.md §Pitfall 2 — default behavior strips document stylesheets).
  useEffect(() => {
    if (!enabled) return
    if (!htmlContent.trim()) return
    const root = rootRef.current
    if (!root) return

    let cancelled = false
    let activePreviewer: Previewer | null = null

    root.innerHTML = '' // clear leftover pagesArea from previous render (RESEARCH.md §Pitfall 3)
    setHasError(false)
    // NOTE: Do NOT reset pageCount to null here. Keeping the previous count means
    // `zoomReady` stays true and `zoomStyle` keeps the current fit-zoom applied
    // through the reflow — eliminates the scale-snap blink (content visibly jumping
    // from fitted → 100% → fitted on each edit). The pill label briefly shows the
    // stale count until the new render resolves.

    ;(async () => {
      // StrictMode dev double-mount safety. The async IIFE otherwise runs synchronously
      // up to `await previewer.preview(...)` — past `new Previewer()` and past the point
      // where paged.js starts mounting `.pagedjs_pages` — *before* React has a chance to
      // invoke cleanup. By yielding here first we let the full setup → cleanup → setup
      // cycle complete; only then do we check `cancelled` and bail. The earlier (now-
      // discarded) run sees `cancelled === true` and exits without ever touching the DOM,
      // leaving the surviving run as the sole previewer that mounts.
      await Promise.resolve()
      if (cancelled) return
      try {
        // Wrap content in a div that carries the theme class so the .theme-X ancestor
        // selector survives inside each .pagedjs_page paged.js emits.
        const safeHtml = DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] })
        const wrapper = document.createElement('div')
        wrapper.innerHTML = `<div class="theme-${template} ${templateContainerClass}">${safeHtml}</div>`

        const previewer = new Previewer()
        activePreviewer = previewer

        // Explicit non-null stylesheets argument — passing undefined here would strip
        // every <style> and <link> in the document (RESEARCH.md §Pitfall 2, verified
        // in pagedjs src/polyfill/previewer.js lines 187-189).
        const flow = await previewer.preview(
          wrapper,
          [{ pagedjs_inline: `@page { size: A4 portrait; margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm; }` }],
          root,
        )
        if (cancelled) return

        const count = flow.pages.length
        setPageCount(count)
        onPageCount?.(count)
      } catch (err) {
        console.error(errorLogPrefix ?? 'paged.js render failed', err)
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
  }, [htmlContent, template, templateContainerClass, margins, enabled, onPageCount, errorLogPrefix])

  return { pageCount, hasError }
}
