import type { ResumeData } from '../types/resume'
import { TEMPLATE_STYLES, type TemplateName } from '../lib/templateStyles'

interface ExportTargetProps {
  resumeData: ResumeData
  template: TemplateName
}

export default function ExportTarget({ resumeData, template }: ExportTargetProps) {
  const styles = TEMPLATE_STYLES[template]

  return (
    <div
      id="export-target"
      style={{
        position: 'absolute',
        left: '-9999px',
        top: 0,
        width: '794px',
        backgroundColor: 'white',
      }}
    >
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
          <div key={si} style={{ pageBreakInside: 'avoid' }}>
            <h2 className={styles.sectionHeading}>{section.heading}</h2>
            {section.extra && (
              <div
                className={styles.extra}
                dangerouslySetInnerHTML={{ __html: section.extra }}
              />
            )}
            {section.entries.map((entry, ei) => (
              <div key={ei} style={{ pageBreakInside: 'avoid' }}>
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
    </div>
  )
}
