import { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { Previewer } from 'pagedjs'
import { TEMPLATE_STYLES, type TemplateName } from '../lib/templateStyles'
import { type MarginValues } from './MarginControls'
import { DEFAULT_MARGINS } from '../lib/constants'
import { useMediaQuery } from '../hooks/useMediaQuery'
import '../styles/themes.css'

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
  const styles = TEMPLATE_STYLES[template] ?? TEMPLATE_STYLES['classic']
  const previewerRootRef = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)
  const [hasError, setHasError] = useState(false)
  const isMobile = useMediaQuery('(max-width: 767px)')
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [naturalHeightPx, setNaturalHeightPx] = useState(0)
  const recomputeRef = useRef<() => void>(() => {})

  // Paged.js render effect — runs only when pagination is enabled AND htmlContent is non-empty.
  // Reflow trigger: [htmlContent, template] per CONTEXT.md D-02 (piggybacks on App.tsx's existing 150ms debounce).
  // Lifecycle pattern: fresh Previewer per reflow + manual mount-clear + polisher.destroy + chunker.destroy in cleanup.
  // Stylesheets argument MUST be non-null (RESEARCH.md §Pitfall 2 — default behavior strips document stylesheets).
  useEffect(() => {
    if (!enablePagination) return
    if (!htmlContent.trim()) return
    const root = previewerRootRef.current
    if (!root) return

    let cancelled = false
    let activePreviewer: Previewer | null = null

    root.innerHTML = '' // clear leftover pagesArea from previous render (RESEARCH.md §Pitfall 3)
    setHasError(false)

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
        wrapper.innerHTML = `<div class="theme-${template} ${styles.container}">${safeHtml}</div>`

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

  // Auto-fit zoom: ResizeObserver watches the scroll container width; also re-runs after
  // paged.js finishes (via pageCount effect below) so mobile gets the correct scale on
  // first render without needing a drag event.
  useEffect(() => {
    if (!enablePagination) return
    const container = scrollContainerRef.current
    if (!container) return

    const recompute = () => {
      if (!scrollContainerRef.current) return
      const containerRect = scrollContainerRef.current.getBoundingClientRect()
      const availableWidth = containerRect.width - 32 // px-4 left + right
      const firstPage = scrollContainerRef.current.querySelector('.pagedjs_page') as HTMLElement | null
      // offsetWidth is unaffected by CSS transforms on ancestor elements.
      // getBoundingClientRect().width would return the SCALED visual width
      // after the scale wrapper transform is applied, creating a feedback loop
      // where recompute() reads a scaled width and computes scale≈1 each time.
      const pageWidth = firstPage ? firstPage.offsetWidth || 793.7 : 793.7
      if (pageWidth <= 0) return
      const nextScale = Math.min(availableWidth / pageWidth, 1)

      // offsetHeight is unaffected by CSS transforms on parent elements, so this
      // gives the true layout height regardless of any scale already applied.
      const pagesEl = scrollContainerRef.current.querySelector('.pagedjs_pages') as HTMLElement | null
      const naturalH = pagesEl ? pagesEl.offsetHeight : 0

      setScale(nextScale)
      setNaturalHeightPx(naturalH)
    }

    recomputeRef.current = recompute

    const observer = new ResizeObserver(recompute)
    observer.observe(container)
    recompute()

    return () => observer.disconnect()
  }, [enablePagination])

  // Trigger recompute after paged.js finishes rendering (pageCount updates when flow resolves).
  // Fixes mobile: the scroll container has fixed height so ResizeObserver never re-fires
  // after paged.js mounts its pages — this effect bridges that gap.
  useEffect(() => {
    recomputeRef.current()
  }, [pageCount])

  // Empty state — preserved verbatim from prior Preview.tsx
  if (!htmlContent.trim()) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Start typing markdown to see your resume preview
      </div>
    )
  }

  // Plain (non-paginated) path: used for the #print-area sibling (enablePagination={false})
  // AND as the silent fallback if paged.js throws (hasError === true).
  // This branch is the existing Phase 6 rendering path — preserved verbatim.
  if (!enablePagination || hasError) {
    return (
      <div
        className={`theme-${template} ${styles.container}`}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] }) }}
      />
    )
  }

  // Paginated path — paged.js mounts into previewerRootRef.
  // Pane background, scroll viewport, and the sticky page-counter pill live here.
  // The pill is ALWAYS visible (UI-SPEC §"Copywriting Contract" — even at "Page 1 of 1"; "Page – of –" before first flow resolves).
  const pillLabel = pageCount === null ? 'Page – of –' : `Page ${pageCount} of ${pageCount}`

  // Apply mobile scale only after paged.js has finished rendering (pageCount !== null).
  // Applying scale(0.5) before paged.js renders causes it to measure a scaled container
  // and flow all content into 1 page instead of the correct page count.
  const mobileScaleReady = isMobile && pageCount !== null

  // Mobile: apply scale directly — no clip container so paged.js absolute-positioned
  // pages are not clipped. overflow-x:hidden on the scroll container suppresses the
  // horizontal scrollbar caused by the 794px layout width at scale 0.5.
  if (isMobile) {
    return (
      <div ref={scrollContainerRef} className="relative h-full overflow-y-auto overflow-x-hidden bg-gray-100 px-4 py-6">
        <div
          className="pagedjs-scale-wrapper"
          style={mobileScaleReady ? { transform: 'scale(0.5)', transformOrigin: 'top left' } : undefined}
        >
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
  }

  // Desktop: clip container (overflow:hidden + flex-center) prevents horizontal scrollbar
  // bounce caused by CSS transform not affecting layout width.
  return (
    <div ref={scrollContainerRef} className="relative h-full overflow-auto bg-gray-100 px-4 py-6">
      <div
        style={
          scale < 1
            ? {
                width: '100%',
                height: naturalHeightPx > 0 ? `${naturalHeightPx * scale}px` : undefined,
                overflow: 'hidden',
                display: 'flex',
                justifyContent: 'center',
              }
            : undefined
        }
      >
        <div
          className="pagedjs-scale-wrapper"
          style={
            scale < 1
              ? { transform: `scale(${scale})`, transformOrigin: 'top center', flexShrink: 0 }
              : undefined
          }
        >
          <div ref={previewerRootRef} />
        </div>
      </div>
      <div
        className="sticky bottom-4 right-4 ml-auto inline-block bg-gray-900/85 text-white text-xs font-medium leading-tight px-2 py-1 rounded-md"
        aria-live="polite"
      >
        {pillLabel}
      </div>
    </div>
  )
}
