import { useState, useEffect, useCallback, useRef } from 'react'
import { listTreeEntries } from '../lib/githubRepo'
import { buildFileTree, pathsToExpand, type TreeNode } from '../lib/fileTree'
import type { RepoConfig } from './useRepoSync'

export interface UseRepoTreeResult {
  tree: TreeNode[]
  loading: boolean
  error: string | null
  truncated: boolean
  expandedPaths: Set<string>
  toggleFolder: (path: string) => void
  refresh: () => void
}

export function useRepoTree(
  token: string | null,
  repoConfig: RepoConfig | null,
): UseRepoTreeResult {
  const [tree, setTree] = useState<TreeNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set())
  const [refreshTick, setRefreshTick] = useState(0)

  const configRef = useRef(repoConfig)
  configRef.current = repoConfig

  const toggleFolder = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev)
      if (next.has(path)) next.delete(path)
      else next.add(path)
      return next
    })
  }, [])

  const refresh = useCallback(() => setRefreshTick(t => t + 1), [])

  // Fetch on repo connect / branch change / manual refresh. No polling.
  useEffect(() => {
    let cancelled = false
    const cfg = repoConfig
    if (!token || !cfg) {
      setTree([]); setError(null); setTruncated(false); setExpandedPaths(new Set())
      return
    }
    ;(async () => {
      await Promise.resolve()
      if (cancelled) return
      setLoading(true)
      setError(null)
      try {
        const result = await listTreeEntries(token, cfg.owner, cfg.repo, cfg.branch)
        if (cancelled) return
        setTree(buildFileTree(result.entries))
        setTruncated(result.truncated)
        // auto-expand the path leading to the currently open file (D-12)
        setExpandedPaths(new Set(pathsToExpand(cfg.filePath)))
      } catch {
        if (!cancelled) setError("Couldn't load file tree")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
    // re-fetch when token, owner, repo, or branch change, or on manual refresh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, repoConfig?.owner, repoConfig?.repo, repoConfig?.branch, refreshTick])

  // When the active file changes (openFile), expand its ancestor folders without
  // re-fetching the tree. Merges into the existing set so manual toggles are preserved.
  useEffect(() => {
    if (!repoConfig?.filePath) return
    setExpandedPaths(prev => {
      const next = new Set(prev)
      for (const p of pathsToExpand(repoConfig.filePath)) next.add(p)
      return next
    })
  }, [repoConfig?.filePath])

  return { tree, loading, error, truncated, expandedPaths, toggleFolder, refresh }
}
