import { useMediaQuery } from '../hooks/useMediaQuery'
import FileTree from './FileTree'
import type { TreeNode } from '../lib/fileTree'

interface FileSidebarProps {
  open: boolean
  activePath: string | null    // repoConfig.filePath (or null)
  isDirty: boolean
  tree: TreeNode[]
  loading: boolean
  error: string | null
  truncated: boolean
  expandedPaths: Set<string>
  onToggleFolder: (path: string) => void
  onOpenFile: (path: string) => void
  onRefresh: () => void
}

// Refresh icon SVG — circular arrow, 16×16
function RefreshIcon({ spinning }: { spinning: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={spinning ? 'animate-spin' : ''}
    >
      <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
      <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
    </svg>
  )
}

export default function FileSidebar({
  open,
  activePath,
  isDirty,
  tree,
  loading,
  error,
  truncated,
  expandedPaths,
  onToggleFolder,
  onOpenFile,
  onRefresh,
}: FileSidebarProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')

  // Desktop: CSS-hidden (NOT unmounted) when closed, so tree fetch state survives toggling
  // Mobile: translate-based overlay drawer
  const asideClassName = isDesktop
    ? `w-60 shrink-0 flex flex-col bg-gray-900 border-r border-gray-700 ${open ? '' : 'hidden'}`
    : `fixed left-0 top-12 z-40 w-60 h-[calc(100vh-3rem)] flex flex-col bg-gray-900 border-r border-gray-700 transition-transform duration-200 ease-out ${open ? 'translate-x-0' : '-translate-x-full'}`

  return (
    <aside
      aria-label="File tree"
      aria-busy={loading}
      className={asideClassName}
    >
      {/* Header row */}
      <div className="h-12 shrink-0 flex items-center justify-between px-3 bg-gray-900 border-b border-gray-700">
        <span className="text-xs uppercase tracking-widest text-gray-500">EXPLORER</span>
        <button
          aria-label="Refresh file tree"
          onClick={onRefresh}
          className="h-6 w-6 flex items-center justify-center rounded text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
        >
          <RefreshIcon spinning={loading} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto py-1">
        {loading ? (
          // Skeleton rows while loading
          <>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} aria-hidden="true" className="h-7 flex items-center">
                <div className="bg-gray-700 rounded animate-pulse h-3 w-3/4 ml-8" />
              </div>
            ))}
          </>
        ) : error ? (
          // Error state with retry
          <div className="px-3 py-3 space-y-1">
            <p className="text-xs text-red-400">Couldn't load file tree</p>
            <p className="text-xs text-gray-500">Check your connection.</p>
            <button
              onClick={onRefresh}
              className="text-xs text-gray-400 underline cursor-pointer"
            >
              Refresh tree
            </button>
          </div>
        ) : tree.length === 0 ? (
          // Empty state (defensive; normally hidden by App gating on repoConfig !== null)
          <div>
            <p className="text-xs text-gray-500 text-center mt-8 px-4">No repository</p>
            <p className="text-xs text-gray-500 text-center px-4">Connect a repository from File → Connect repository…</p>
          </div>
        ) : (
          // Tree + optional truncated notice
          <>
            <FileTree
              nodes={tree}
              activePath={activePath}
              isDirty={isDirty}
              expandedPaths={expandedPaths}
              onToggleFolder={onToggleFolder}
              onOpenFile={onOpenFile}
            />
            {truncated && (
              <p className="text-xs text-amber-400 px-3 py-1">Repository too large — some folders may be missing.</p>
            )}
          </>
        )}
      </div>
    </aside>
  )
}
