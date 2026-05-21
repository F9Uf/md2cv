import { useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import { Previewer } from 'pagedjs'
import { TEMPLATE_STYLES, type TemplateName } from '../lib/templateStyles'
import { type MarginValues } from './MarginControls'
import { DEFAULT_MARGINS } from '../lib/constants'
import '../styles/themes.css'

interface PrintMountProps {
  htmlContent: string
  template: TemplateName
  margins?: MarginValues
}

// Off-screen paged.js mount that the browser-print pipeline rasterizes.
// Renders ONLY the paged.js output — no scroll container, no scale wrapper,
// no "Page X of N" pill. Those screen-only chrome elements bled into the
// print canvas when #print-area reused <Preview/>, producing blank PDF pages.
export default function PrintMount({
  htmlContent,
  template,
  margins = DEFAULT_MARGINS,
}: PrintMountProps) {
  const styles = TEMPLATE_STYLES[template] ?? TEMPLATE_STYLES['classic']
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!htmlContent.trim()) return
    const root = rootRef.current
    if (!root) return

    let cancelled = false
    let activePreviewer: Previewer | null = null

    root.innerHTML = ''

    ;(async () => {
      await Promise.resolve()
      if (cancelled) return
      try {
        const safeHtml = DOMPurify.sanitize(htmlContent, { ADD_ATTR: ['class'] })
        const wrapper = document.createElement('div')
        wrapper.innerHTML = `<div class="theme-${template} ${styles.container}">${safeHtml}</div>`

        const previewer = new Previewer()
        activePreviewer = previewer

        await previewer.preview(
          wrapper,
          [{ pagedjs_inline: `@page { size: A4 portrait; margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm; }` }],
          root,
        )
      } catch (err) {
        console.error('paged.js print-mount render failed', err)
      }
    })()

    return () => {
      cancelled = true
      if (activePreviewer) {
        try { activePreviewer.polisher?.destroy() } catch { /* ignore */ }
        try { activePreviewer.chunker?.destroy() } catch { /* ignore */ }
      }
    }
  }, [htmlContent, template, styles.container, margins])

  return <div ref={rootRef} />
}
