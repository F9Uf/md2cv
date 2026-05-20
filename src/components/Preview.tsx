import { useEffect, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import { Previewer } from 'pagedjs'
import { TEMPLATE_STYLES, type TemplateName } from '../lib/templateStyles'
import { type MarginValues } from './MarginControls'
import { DEFAULT_MARGINS } from '../lib/constants'
import { useMediaQuery } from '../hooks/useMediaQuery'
import '../styles/themes.css'
import { sleep } from '../lib/time'

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
    setPageCount(null) // reset so scaleReady gates re-arm on content change

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

        // sleep to wait dom mount
        await sleep(10)

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

  // Auto-fit zoom for desktop: ResizeObserver watches the scroll container width.
  // A4 page width is fixed at 210mm = 793.7px (CSS pixels at 96dpi reference) — we use
  // this constant instead of measuring offsetWidth to avoid any feedback loop with zoom.
  // Dependency list intentionally EXCLUDES htmlContent/template/margins (D-08: never retrigger paged.js).
  useEffect(() => {
    if (!enablePagination) return
    const container = scrollContainerRef.current
    if (!container) return

    const recompute = () => {
      if (!scrollContainerRef.current) return
      const availableWidth = scrollContainerRef.current.getBoundingClientRect().width - 32 // px-4 × 2
      setScale(Math.min(availableWidth / 793.7, 1))
    }

    recomputeRef.current = recompute

    const observer = new ResizeObserver(recompute)
    observer.observe(container)
    recompute()

    return () => observer.disconnect()
  }, [enablePagination])

  // Trigger recompute after paged.js finishes (fixes mobile fixed-height container).
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

  // Plain (non-paginated) path: silent fallback if paged.js throws (hasError === true)
  // or when a caller opts out of pagination via enablePagination={false}.
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
  // The pill is ALWAYS visible (UI-SPEC §"Copywriting Contract" — even at "Page 1 of 1"; "Page – of –" before first flow resolves).
  const pillLabel = pageCount === null ? 'Page – of –' : `Page ${pageCount} of ${pageCount}`

  // Scale is applied via CSS `zoom` (not transform) so it affects layout dimensions.
  // This prevents: (a) horizontal overflow/scrollbar-bounce on desktop, (b) clip container
  // cutting off pages 4+ when overflow:hidden is paired with transform-based scaling.
  // zoom is applied only AFTER paged.js finishes rendering (pageCount !== null) so paged.js
  // measures the natural A4 container and paginates correctly before the zoom is applied.
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
}
