import type { TreeNode } from '../lib/fileTree'

interface FileTreeProps {
  nodes: TreeNode[]
  activePath: string | null      // repoConfig.filePath
  isDirty: boolean
  expandedPaths: Set<string>
  onToggleFolder: (path: string) => void
  onOpenFile: (path: string) => void  // called only for .md file rows
  depth?: number                 // default 0, used for indentation
}

// Chevron SVG — right-pointing triangle, rotates 90° when expanded
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={`transition-transform duration-150 ${expanded ? 'rotate-90' : ''} shrink-0 text-gray-400`}
    >
      <path d="M6 4l5 4-5 4V4z" />
    </svg>
  )
}

// Folder icon — simple folder glyph
function FolderIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0 text-gray-400"
    >
      <path d="M1.5 2A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h13a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 14.5 4H8.414l-1.707-1.707A1 1 0 0 0 6 2H1.5z" />
    </svg>
  )
}

// File icon — simple document glyph
function FileIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className="shrink-0 text-gray-400"
    >
      <path d="M4 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.414A2 2 0 0 0 13.414 3L11 .586A2 2 0 0 0 9.586 0H4zm5 1.5v2A1.5 1.5 0 0 0 10.5 5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5z" />
    </svg>
  )
}

// Renders a list of tree nodes. Used both at the top level and recursively.
function TreeNodes({
  nodes,
  activePath,
  isDirty,
  expandedPaths,
  onToggleFolder,
  onOpenFile,
  depth,
}: Required<FileTreeProps>) {
  const paddingLeft = depth * 12 + 8

  return (
    <>
      {nodes.map((node) => {
        const isActive = node.path === activePath
        const isExpanded = node.type === 'folder' && expandedPaths.has(node.path)

        if (node.type === 'folder') {
          return (
            <li key={node.path} role="treeitem" aria-expanded={isExpanded}>
              <button
                onClick={() => onToggleFolder(node.path)}
                style={{ paddingLeft }}
                className={`flex items-center h-7 max-[767px]:h-11 w-full text-left gap-1 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer${isActive ? ' bg-gray-700' : ''}`}
              >
                <ChevronIcon expanded={isExpanded} />
                <FolderIcon />
                <span className={`ml-1 truncate${isActive ? ' text-white font-semibold' : ''}`}>
                  {node.name}
                </span>
              </button>
              {isExpanded && (
                <ul role="group">
                  <TreeNodes
                    nodes={node.children}
                    activePath={activePath}
                    isDirty={isDirty}
                    expandedPaths={expandedPaths}
                    onToggleFolder={onToggleFolder}
                    onOpenFile={onOpenFile}
                    depth={depth + 1}
                  />
                </ul>
              )}
            </li>
          )
        }

        // .md file — interactive
        if (node.isMarkdown) {
          return (
            <li key={node.path} role="treeitem" aria-selected={isActive}>
              <button
                onClick={() => onOpenFile(node.path)}
                style={{ paddingLeft }}
                className={`flex items-center h-7 max-[767px]:h-11 w-full text-left gap-1 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer${isActive ? ' bg-gray-700' : ''}`}
                aria-selected={isActive}
              >
                {/* 12px spacer where chevron would be, so file icon aligns with folder icon */}
                <span className="shrink-0" style={{ width: 12 }} />
                <FileIcon />
                <span className={`ml-1 truncate${isActive ? ' text-white font-semibold' : ''}`}>
                  {node.name}
                </span>
                {isActive && isDirty && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-amber-400 ml-auto mr-2 shrink-0"
                    aria-hidden="true"
                  />
                )}
              </button>
            </li>
          )
        }

        // Non-.md file — not interactive
        return (
          <li key={node.path} role="treeitem">
            <div
              aria-disabled="true"
              style={{ paddingLeft }}
              className="flex items-center h-7 max-[767px]:h-11 w-full text-left gap-1 text-sm text-gray-500 cursor-not-allowed"
            >
              {/* 12px spacer — no chevron for files */}
              <span className="shrink-0" style={{ width: 12 }} />
              <FileIcon />
              <span className="ml-1 truncate">{node.name}</span>
            </div>
          </li>
        )
      })}
    </>
  )
}

// Top-level export: renders role="tree" wrapper; children use role="group" for nested folders.
export default function FileTree({
  nodes,
  activePath,
  isDirty,
  expandedPaths,
  onToggleFolder,
  onOpenFile,
  depth = 0,
}: FileTreeProps) {
  return (
    <ul role="tree" aria-label="File tree">
      <TreeNodes
        nodes={nodes}
        activePath={activePath}
        isDirty={isDirty}
        expandedPaths={expandedPaths}
        onToggleFolder={onToggleFolder}
        onOpenFile={onOpenFile}
        depth={depth}
      />
    </ul>
  )
}
