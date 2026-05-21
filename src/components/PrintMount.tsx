import { useRef } from 'react'
import { TEMPLATE_STYLES, type TemplateName } from '../lib/templateStyles'
import { type MarginValues } from './MarginControls'
import { DEFAULT_MARGINS } from '../lib/constants'
import { usePagedjsPreview } from '../hooks/usePagedjsPreview'
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

  usePagedjsPreview({
    rootRef,
    htmlContent,
    template,
    templateContainerClass: styles.container,
    margins,
    errorLogPrefix: 'paged.js print-mount render failed',
  })

  return <div ref={rootRef} />
}
