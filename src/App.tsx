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

  // Debounced HTML content for preview — initialized from same source as markdownContent
  const [htmlContent, setHtmlContent] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('md2cv-content')
      if (stored !== null) return parseResume(stored)
    } catch { /* ignore */ }
    return parseResume(SAMPLE_RESUME)
  })

  // Debounce timer ref
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  // Hidden file input ref for Import MD
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle markdown changes with ~150ms debounce
  const handleMarkdownChange = useCallback((value: string) => {
    setMarkdownContent(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setHtmlContent(parseResume(value))
      try { localStorage.setItem('md2cv-content', value) } catch { /* ignore */ }
    }, 150)
  }, [])

  // Download current markdown content as a .md file (per D-06, D-07, D-08)
  const handleDownloadMd = useCallback(() => {
    const filename = 'resume.md'
    const blob = new Blob([markdownContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [markdownContent])

  // Export PDF via browser print dialog — @media print CSS hides everything except preview
  const handleExportPdf = useCallback(() => {
    window.print()
  }, [])

  // Import .md file via native file picker (per D-13, D-14, D-15)
  const handleImportMd = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        handleMarkdownChange(text)
      }
    }
    reader.readAsText(file)
    // Reset input so same file can be re-imported
    e.target.value = ''
  }, [handleMarkdownChange])

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
  const preview = <Preview htmlContent={htmlContent} template={selectedTemplate} />

  return (
    <>
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden" id="app-shell">
        <Header
          selectedTemplate={selectedTemplate}
          onTemplateChange={handleTemplateChange}
          onDownloadMd={handleDownloadMd}
          onExportPdf={handleExportPdf}
          onImportMd={handleImportMd}
        />
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
      <div id="print-area">
        <Preview htmlContent={htmlContent} template={selectedTemplate} />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".md"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
    </>
  )
}

export default App
