import type { ResumeData } from '../types/resume'
import type { TemplateName } from '../lib/templateStyles'
import { TEMPLATE_INLINE_STYLES } from '../lib/templateInlineStyles'

interface ExportTargetProps {
  resumeData: ResumeData
  template: TemplateName
}

export default function ExportTarget({ resumeData, template }: ExportTargetProps) {
  const s = TEMPLATE_INLINE_STYLES[template]

  return (
    <div
      id="export-target"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '794px',
        backgroundColor: '#ffffff',
        visibility: 'hidden',
        pointerEvents: 'none',
        zIndex: -1,
      }}
    >
      <div style={s.container}>
        {resumeData.name && (
          <h1 style={{ ...s.name, margin: 0, marginBottom: '4px' }}>{resumeData.name}</h1>
        )}
        {resumeData.preamble && (
          <div
            style={s.preamble}
            dangerouslySetInnerHTML={{ __html: resumeData.preamble }}
          />
        )}
        {resumeData.sections.map((section, si) => (
          <div key={si} style={{ pageBreakInside: 'avoid' }}>
            <h2 style={{ ...s.sectionHeading, margin: 0, marginTop: si === 0 ? '24px' : s.sectionHeading.marginTop, marginBottom: s.sectionHeading.marginBottom }}>
              {section.heading}
            </h2>
            {section.extra && (
              <div
                style={s.extra}
                dangerouslySetInnerHTML={{ __html: section.extra }}
              />
            )}
            {section.entries.map((entry, ei) => (
              <div key={ei} style={{ pageBreakInside: 'avoid' }}>
                <h3 style={{ ...s.entryTitle, margin: 0, marginTop: s.entryTitle.marginTop }}>{entry.title}</h3>
                {entry.extra && (
                  <div
                    style={s.extra}
                    dangerouslySetInnerHTML={{ __html: entry.extra }}
                  />
                )}
                {entry.details.length > 0 && (
                  <ul style={{ ...s.detailList, margin: 0, marginTop: '4px', padding: 0, paddingLeft: s.detailList.paddingLeft }}>
                    {entry.details.map((detail, di) => (
                      <li key={di} style={s.entryDetail}>{detail}</li>
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
