import './App.css'
import { useState, useCallback, useEffect, useRef } from 'react'
import Header from './components/Header'
import SplitPane from './components/SplitPane'
import MobileTabs from './components/MobileTabs'
import Editor from './components/Editor'
import Preview from './components/Preview'
import { useMediaQuery } from './hooks/useMediaQuery'
import { parseResume } from './lib/parseResume'
import { SAMPLE_RESUME } from './lib/sampleResume'
import type { TemplateName } from './lib/templateStyles'
import type { ResumeData } from './types/resume'

function App() {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // Template state with localStorage persistence (per D-09)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateName>(() => {
    try {
      const stored = localStorage.getItem('md2cv-template')
      if (stored === 'classic' || stored === 'modern' || stored === 'minimal') return stored
    } catch { /* ignore */ }
    return 'classic'
  })

  // Markdown content state — restored from localStorage on init, fallback to sample (per D-11)
  const [markdownContent, setMarkdownContent] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('md2cv-content')
      if (stored !== null) return stored
    } catch { /* ignore */ }
    return SAMPLE_RESUME
  })

  // Debounced resume data for preview — initialized from same source as markdownContent
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    try {
      const stored = localStorage.getItem('md2cv-content')
      if (stored !== null) return parseResume(stored)
    } catch { /* ignore */ }
    return parseResume(SAMPLE_RESUME)
  })

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Handle markdown changes with ~150ms debounce
  const handleMarkdownChange = useCallback((value: string) => {
    setMarkdownContent(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setResumeData(parseResume(value))
      try { localStorage.setItem('md2cv-content', value) } catch { /* ignore */ }
    }, 150)
  }, [])

  // Download current markdown content as a .md file (per D-06, D-07, D-08)
  const handleDownloadMd = useCallback(() => {
    const slug = resumeData.name
      ? resumeData.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      : 'resume'
    const filename = (slug || 'resume') + '.md'
    const blob = new Blob([markdownContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [markdownContent, resumeData.name])

  // Persist template selection (per D-09)
  const handleTemplateChange = useCallback((template: TemplateName) => {
    setSelectedTemplate(template)
    try { localStorage.setItem('md2cv-template', template) } catch { /* ignore */ }
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const editor = <Editor value={markdownContent} onChange={handleMarkdownChange} />
  const preview = <Preview resumeData={resumeData} template={selectedTemplate} />

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header selectedTemplate={selectedTemplate} onTemplateChange={handleTemplateChange} onDownloadMd={handleDownloadMd} />
      <main className="flex-1 flex min-h-0">
        {isDesktop ? (
          <SplitPane
            left={editor}
            right={preview}
          />
        ) : (
          <MobileTabs
            editorContent={editor}
            previewContent={preview}
          />
        )}
      </main>
    </div>
  )
}

export default App
