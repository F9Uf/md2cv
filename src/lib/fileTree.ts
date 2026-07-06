import type { GitHubTreeEntry } from './githubRepo'

export interface TreeNode {
  name: string          // last path segment
  path: string          // full repo-relative path
  type: 'file' | 'folder'
  isMarkdown: boolean   // files only; folders are always false
  children: TreeNode[]  // folders only; empty for files
}

// Build a nested, ordered tree from GitHub's flat recursive listing.
// Order at every level: folders first, then files, each alphabetical (case-insensitive).
export function buildFileTree(entries: GitHubTreeEntry[]): TreeNode[] {
  const root: TreeNode = { name: '', path: '', type: 'folder', isMarkdown: false, children: [] }

  const ensureFolder = (parent: TreeNode, name: string, path: string): TreeNode => {
    let node = parent.children.find((c) => c.type === 'folder' && c.name === name)
    if (!node) {
      node = { name, path, type: 'folder', isMarkdown: false, children: [] }
      parent.children.push(node)
    }
    return node
  }

  for (const entry of entries) {
    const segments = entry.path.split('/')
    let parent = root
    // walk/create every intermediate folder
    for (let i = 0; i < segments.length - 1; i++) {
      const name = segments[i]
      const path = segments.slice(0, i + 1).join('/')
      parent = ensureFolder(parent, name, path)
    }
    const leafName = segments[segments.length - 1]
    if (entry.type === 'tree') {
      ensureFolder(parent, leafName, entry.path)
    } else {
      // avoid duplicate file nodes if listed twice
      if (!parent.children.some((c) => c.type === 'file' && c.path === entry.path)) {
        parent.children.push({
          name: leafName,
          path: entry.path,
          type: 'file',
          isMarkdown: entry.path.toLowerCase().endsWith('.md'),
          children: [],
        })
      }
    }
  }

  const sortLevel = (nodes: TreeNode[]): TreeNode[] => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    })
    for (const n of nodes) if (n.type === 'folder') sortLevel(n.children)
    return nodes
  }

  return sortLevel(root.children)
}

// Ancestor folder paths leading to a file, for auto-expand. 'a/b/c.md' -> ['a','a/b'].
export function pathsToExpand(filePath: string): string[] {
  if (!filePath) return []
  const segments = filePath.split('/')
  if (segments.length <= 1) return []
  const out: string[] = []
  for (let i = 1; i < segments.length; i++) out.push(segments.slice(0, i).join('/'))
  return out
}
