import type { ResumeData } from '../types/resume'
import { TEMPLATE_STYLES, type TemplateName } from '../lib/templateStyles'

interface PreviewProps {
  resumeData: ResumeData
  template: TemplateName
}

export default function Preview({ resumeData, template }: PreviewProps) {
  const styles = TEMPLATE_STYLES[template]

  const isEmpty = resumeData.name === '' && resumeData.sections.length === 0

  if (isEmpty) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Start typing markdown to see your resume preview
      </div>
    )
  }

  return (
    <div className={styles.container}>
      {resumeData.name && (
        <h1 className={styles.name}>{resumeData.name}</h1>
      )}
      {resumeData.preamble && (
        <div
          className={styles.preamble}
          dangerouslySetInnerHTML={{ __html: resumeData.preamble }}
        />
      )}
      {resumeData.sections.map((section, si) => (
        <div key={si}>
          <h2 className={styles.sectionHeading}>{section.heading}</h2>
          {section.extra && (
            <div
              className={styles.extra}
              dangerouslySetInnerHTML={{ __html: section.extra }}
            />
          )}
          {section.entries.map((entry, ei) => (
            <div key={ei}>
              <h3 className={styles.entryTitle}>{entry.title}</h3>
              {entry.extra && (
                <div
                  className={styles.extra}
                  dangerouslySetInnerHTML={{ __html: entry.extra }}
                />
              )}
              {entry.details.length > 0 && (
                <ul className={styles.detailList}>
                  {entry.details.map((detail, di) => (
                    <li key={di} className={styles.entryDetail}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
