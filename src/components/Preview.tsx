import DOMPurify from 'dompurify'
import { TEMPLATE_STYLES, type TemplateName } from '../lib/templateStyles'
import '../styles/themes.css'

interface PreviewProps {
  htmlContent: string
  template: TemplateName
}

export default function Preview({ htmlContent, template }: PreviewProps) {
  const styles = TEMPLATE_STYLES[template] ?? TEMPLATE_STYLES['classic']

  if (!htmlContent.trim()) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Start typing markdown to see your resume preview
      </div>
    )
  }

  return (
    <div
      className={`theme-${template} ${styles.container}`}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }}
    />
  )
}
