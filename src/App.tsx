import './App.css'
import { useState, useCallback, useEffect, useRef } from 'react'
import Header from './components/Header'
import SplitPane from './components/SplitPane'
import MobileTabs from './components/MobileTabs'
import Editor from './components/Editor'
import Preview from './components/Preview'
import { useMediaQuery } from './hooks/useMediaQuery'
import { useGitHubAuth } from './hooks/useGitHubAuth'
import { useRepoSync } from './hooks/useRepoSync'
import { parseResume } from './lib/parseResume'
import { SAMPLE_RESUME } from './lib/sampleResume'
import type { TemplateName } from './lib/templateStyles'
import MarginControls, { type MarginValues } from './components/MarginControls'
import { DEFAULT_MARGINS } from './lib/constants'
import PickerDialog from './components/PickerDialog'
import CommitDialog from './components/CommitDialog'
import ConflictModal from './components/ConflictModal'
import FileSidebar from './components/FileSidebar'
import DirtySwitchDialog from './components/DirtySwitchDialog'
import { useRepoTree } from './hooks/useRepoTree'

function App() {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const auth = useGitHubAuth()

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

  const [margins, setMargins] = useState<MarginValues>(() => {
    try {
      const stored = localStorage.getItem('md2cv-margins')
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, unknown>
        const top    = typeof parsed.top    === 'number' && parsed.top    >= 0 && parsed.top    <= 50 ? parsed.top    : 15
        const right  = typeof parsed.right  === 'number' && parsed.right  >= 0 && parsed.right  <= 50 ? parsed.right  : 15
        const bottom = typeof parsed.bottom === 'number' && parsed.bottom >= 0 && parsed.bottom <= 50 ? parsed.bottom : 15
        const left   = typeof parsed.left   === 'number' && parsed.left   >= 0 && parsed.left   <= 50 ? parsed.left   : 15
        return { top, right, bottom, left }
      }
    } catch { /* ignore */ }
    return DEFAULT_MARGINS
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

  // Apply remote content immediately (no debounce) — used by useRepoSync on pull/connect
  const applyRemoteContent = useCallback((content: string) => {
    setMarkdownContent(content)
    setHtmlContent(parseResume(content))
    try { localStorage.setItem('md2cv-content', content) } catch { /* ignore */ }
  }, [])

  const repoSync = useRepoSync(auth.token, markdownContent, applyRemoteContent)
  const repoTree = useRepoTree(auth.token, repoSync.repoConfig)

  const [pickerOpen, setPickerOpen] = useState(false)
  const [commitOpen, setCommitOpen] = useState(false)

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    try { return localStorage.getItem('md2cv-sidebar') !== 'false' } catch { return true }
  })
  const [pendingSwitchPath, setPendingSwitchPath] = useState<string | null>(null)
  const awaitingCommitRef = useRef(false)

  // Persist sidebar open/closed state
  useEffect(() => {
    try { localStorage.setItem('md2cv-sidebar', sidebarOpen ? 'true' : 'false') } catch { /* ignore */ }
  }, [sidebarOpen])

  const handleOpenFilePicker = useCallback(() => setPickerOpen(true), [])
  const handleOpenCommitDialog = useCallback(() => setCommitOpen(true), [])

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

  // Export PDF via browser print dialog — sets document.title to name from markdown so the
  // browser uses it as the default PDF filename, then restores the original title after print.
  const handleExportPdf = useCallback(() => {
    const nameMatch = markdownContent.match(/^#\s+(.+)/m)
    const originalTitle = document.title
    if (nameMatch) document.title = nameMatch[1].trim()
    window.print()
    document.title = originalTitle
  }, [markdownContent])

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

  const handleMarginChange = useCallback((side: keyof MarginValues, value: number) => {
    setMargins(prev => {
      const next = { ...prev, [side]: value }
      try { localStorage.setItem('md2cv-margins', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  // Click a .md file in the tree. On mobile, close the drawer immediately (UI-SPEC §2).
  const handleTreeOpenFile = useCallback((path: string) => {
    if (!isDesktop) setSidebarOpen(false)
    if (repoSync.repoConfig && path === repoSync.repoConfig.filePath) return // already open
    if (repoSync.isDirty) {
      setPendingSwitchPath(path) // opens DirtySwitchDialog
    } else {
      repoSync.openFile(path)
    }
  }, [isDesktop, repoSync])

  const currentFilename = repoSync.repoConfig
    ? (repoSync.repoConfig.filePath.split('/').pop() ?? 'file')
    : 'file'

  // DirtySwitchDialog actions
  const handleDirtyDiscard = useCallback(() => {
    const path = pendingSwitchPath
    setPendingSwitchPath(null)
    if (path) repoSync.openFile(path) // openFile replaces content with remote → discards local edits
  }, [pendingSwitchPath, repoSync])

  const handleDirtyCommit = useCallback(() => {
    awaitingCommitRef.current = true  // effect below performs the switch after a successful commit
    setPendingSwitchPath(prev => prev) // keep pending path
    setCommitOpen(true)               // open the Phase 12 commit dialog
  }, [])

  const handleDirtyCancel = useCallback(() => setPendingSwitchPath(null), [])

  // Auto-switch after a commit initiated from the dirty prompt
  useEffect(() => {
    if (!awaitingCommitRef.current) return
    if (repoSync.committing) return           // still committing
    if (repoSync.syncError) {                 // commit failed → abort switch
      awaitingCommitRef.current = false
      setPendingSwitchPath(null)
      return
    }
    if (!repoSync.isDirty && pendingSwitchPath) { // commit succeeded → switch now
      const path = pendingSwitchPath
      awaitingCommitRef.current = false
      setPendingSwitchPath(null)
      repoSync.openFile(path)
    }
  }, [repoSync.committing, repoSync.isDirty, repoSync.syncError, pendingSwitchPath, repoSync])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [])

  const editor = <Editor value={markdownContent} onChange={handleMarkdownChange} />
  const preview = <Preview htmlContent={htmlContent} template={selectedTemplate} margins={margins} />

  return (
    <>
      <div className="h-screen bg-gray-50 flex flex-col overflow-hidden" id="app-shell">
        <Header
          selectedTemplate={selectedTemplate}
          onTemplateChange={handleTemplateChange}
          onDownloadMd={handleDownloadMd}
          onExportPdf={handleExportPdf}
          onImportMd={handleImportMd}
          authState={auth}
          onSignIn={auth.signIn}
          onSignOut={auth.signOut}
          onDismissError={auth.dismissError}
          repoConfig={repoSync.repoConfig}
          isDirty={repoSync.isDirty}
          onOpenFilePicker={handleOpenFilePicker}
          onOpenCommitDialog={handleOpenCommitDialog}
          onToggleSidebar={() => setSidebarOpen(o => !o)}
          syncError={repoSync.syncError === "Couldn't sync with GitHub — working locally" ? null : repoSync.syncError}
          syncSuccess={repoSync.successMessage}
          syncWarning={repoSync.syncError === "Couldn't sync with GitHub — working locally" ? repoSync.syncError : null}
          onDismissSyncError={repoSync.dismissSyncError}
          onDismissSyncSuccess={repoSync.dismissSuccess}
          onDismissSyncWarning={repoSync.dismissSyncError}
        />
        <MarginControls margins={margins} onMarginsChange={handleMarginChange} />
        <div className="flex flex-1 min-h-0">
          <FileSidebar
            open={sidebarOpen && !!repoSync.repoConfig}
            activePath={repoSync.repoConfig?.filePath ?? null}
            isDirty={repoSync.isDirty}
            tree={repoTree.tree}
            loading={repoTree.loading}
            error={repoTree.error}
            truncated={repoTree.truncated}
            expandedPaths={repoTree.expandedPaths}
            onToggleFolder={repoTree.toggleFolder}
            onOpenFile={handleTreeOpenFile}
            onRefresh={repoTree.refresh}
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
        {!isDesktop && sidebarOpen && repoSync.repoConfig && (
          <div className="fixed inset-0 top-12 bg-black/40 z-30" aria-hidden="true" onClick={() => setSidebarOpen(false)} />
        )}
      </div>
      {/* Browser-print mount. Populated by Preview, which mirrors its rendered
          paged.js pages here after every reflow — the PDF is guaranteed to
          paginate exactly like the on-screen preview. */}
      <div id="print-area" aria-hidden="true" />
      <input
        ref={fileInputRef}
        type="file"
        accept=".md"
        onChange={handleFileChange}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      {auth.token && (
        <PickerDialog
          open={pickerOpen}
          token={auth.token}
          onClose={() => setPickerOpen(false)}
          onConnect={(config) => { repoSync.connectRepo(config); setPickerOpen(false) }}
        />
      )}
      <CommitDialog
        open={commitOpen}
        filename={repoSync.repoConfig ? (repoSync.repoConfig.filePath.split('/').pop() ?? 'resume.md') : 'resume.md'}
        committing={repoSync.committing}
        onClose={() => { setCommitOpen(false); awaitingCommitRef.current = false; setPendingSwitchPath(null) }}
        onCommit={(message) => { repoSync.commit(message); setCommitOpen(false) }}
      />
      <DirtySwitchDialog
        open={pendingSwitchPath !== null}
        currentFilename={currentFilename}
        committing={repoSync.committing}
        onCommit={handleDirtyCommit}
        onDiscard={handleDirtyDiscard}
        onCancel={handleDirtyCancel}
      />
      <ConflictModal
        open={repoSync.conflict !== null}
        onKeepLocal={() => repoSync.resolveConflict('local')}
        onUseRemote={() => repoSync.resolveConflict('remote')}
      />
    </>
  )
}

export default App
