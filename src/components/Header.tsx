import { useState, useEffect, useRef } from 'react'
import type { TemplateName } from '../lib/templateStyles'
import type { GitHubAuthState } from '../hooks/useGitHubAuth'

interface HeaderProps {
  selectedTemplate: TemplateName
  onTemplateChange: (template: TemplateName) => void
  onDownloadMd: () => void
  onExportPdf: () => void
  onImportMd: () => void
  authState: GitHubAuthState
  onSignIn: () => void
  onSignOut: () => void
  onDismissError: () => void
}

export default function Header({
  selectedTemplate,
  onTemplateChange,
  onDownloadMd,
  onExportPdf,
  onImportMd,
  authState,
  onSignIn,
  onSignOut,
  onDismissError,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [imgFailed, setImgFailed] = useState(false)

  // Reset imgFailed when user changes
  useEffect(() => {
    setImgFailed(false)
  }, [authState.user?.login])

  // Close dropdown on outside click (mousedown) or Escape key
  useEffect(() => {
    if (!menuOpen) return

    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  return (
    <>
      <header className="h-12 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0">
        <h1 className="text-lg font-bold tracking-tight flex items-center">
          md
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="#f9d855"
            className="size-4 inline-block"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M14.615 1.595a.75.75 0 0 1 .359.852L12.982 9.75h7.268a.75.75 0 0 1 .548 1.262l-10.5 11.25a.75.75 0 0 1-1.272-.71l1.992-7.302H3.75a.75.75 0 0 1-.548-1.262l10.5-11.25a.75.75 0 0 1 .913-.143Z"
              clipRule="evenodd"
            />
          </svg>
          cv
        </h1>
        <div className="flex items-center gap-2">
          {/* Template switcher dropdown */}
          <select
            value={selectedTemplate}
            onChange={(e) => onTemplateChange(e.target.value as TemplateName)}
            className="h-8 px-2 rounded bg-gray-700 text-white text-sm border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
            aria-label="Select resume template"
          >
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="minimal">Minimal</option>
          </select>
          <button
            onClick={onImportMd}
            className="h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"
            aria-label="Import markdown file"
          >
            Import MD
          </button>
          <button
            onClick={onDownloadMd}
            className="h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"
            aria-label="Download markdown file"
          >
            Download MD
          </button>
          <button
            onClick={onExportPdf}
            className="h-8 px-3 rounded bg-blue-600 text-white text-sm border border-blue-500 hover:bg-blue-500 transition-colors"
            aria-label="Export resume as PDF"
          >
            Export PDF
          </button>

          {/* Auth UI — appended after Export PDF */}
          {authState.loading && !authState.user ? (
            <button
              className="h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 opacity-75 cursor-not-allowed flex items-center gap-1"
              disabled
              aria-label="Signing in, please wait"
              aria-busy="true"
            >
              <span className="border-2 border-white border-t-transparent rounded-full w-4 h-4 animate-spin" />
              Signing in...
            </button>
          ) : authState.user ? (
            <div ref={wrapperRef} className="relative">
              <button
                className="h-8 w-8 rounded-full overflow-hidden cursor-pointer ring-1 ring-gray-600 hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 hover:ring-offset-gray-900 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="GitHub account menu"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(o => !o)}
              >
                {imgFailed ? (
                  <span className="h-8 w-8 bg-gray-600 flex items-center justify-center text-white text-xs font-semibold">
                    {authState.user.login.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <img
                    src={authState.user.avatar_url}
                    alt=""
                    className="h-8 w-8 object-cover"
                    onError={() => setImgFailed(true)}
                  />
                )}
              </button>
              {menuOpen && (
                <div role="menu" className="absolute right-0 top-full mt-1 min-w-[160px] z-50 bg-gray-900 border border-gray-600 rounded shadow-lg">
                  <div className="px-3 py-2 text-sm font-semibold text-white border-b border-gray-700">
                    {authState.user.login}
                  </div>
                  <button
                    role="menuitem"
                    aria-label="Sign out of GitHub"
                    onClick={() => { setMenuOpen(false); onSignOut() }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer rounded-b"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors flex items-center gap-1"
              onClick={onSignIn}
              aria-label="Sign in with GitHub"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="white" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              Sign in with GitHub
            </button>
          )}
        </div>
      </header>

      {/* Error toast — floats below header without expanding it */}
      {authState.error && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed top-12 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded bg-red-950 border border-red-800 text-red-400 text-sm shadow-md max-w-[320px]"
        >
          {authState.error}
          <button
            aria-label="Dismiss error"
            onClick={onDismissError}
            className="ml-auto pl-2 text-red-400 hover:text-white cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}
