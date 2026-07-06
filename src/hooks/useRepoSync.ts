import { useState, useEffect, useCallback, useRef } from 'react'
import { getFileContent } from '../lib/githubRepo'

const REPO_CONFIG_KEY = 'md2cv-repo-config'
const SYNC_STATE_KEY = 'md2cv-sync-state'

export interface RepoConfig {
  owner: string
  repo: string
  branch: string
  defaultBranch: string
  filePath: string
}

export interface SyncState {
  sha: string             // last-synced blob sha
  contentSnapshot: string // last-synced remote content
}

export interface ConflictState {
  remoteContent: string
  remoteSha: string
  source: 'pull' | 'commit'
}

export interface UseSyncResult {
  repoConfig: RepoConfig | null
  isDirty: boolean
  pulling: boolean
  committing: boolean
  syncError: string | null
  successMessage: string | null
  conflict: ConflictState | null
  connectRepo: (config: RepoConfig) => void
  commit: (message: string) => void
  resolveConflict: (choice: 'local' | 'remote') => void
  clearRepo: () => void
  dismissSyncError: () => void
  dismissSuccess: () => void
}

function loadRepoConfig(): RepoConfig | null {
  try {
    const raw = localStorage.getItem(REPO_CONFIG_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (
      typeof p.owner === 'string' &&
      typeof p.repo === 'string' &&
      typeof p.branch === 'string' &&
      typeof p.defaultBranch === 'string' &&
      typeof p.filePath === 'string'
    ) return p as RepoConfig
  } catch { /* ignore */ }
  return null
}

function loadSyncState(): SyncState | null {
  try {
    const raw = localStorage.getItem(SYNC_STATE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw)
    if (typeof p.sha === 'string' && typeof p.contentSnapshot === 'string') return p as SyncState
  } catch { /* ignore */ }
  return null
}

export function useRepoSync(
  token: string | null,
  currentContent: string,
  applyRemoteContent: (content: string) => void,
): UseSyncResult {
  const [repoConfig, setRepoConfig] = useState<RepoConfig | null>(loadRepoConfig)
  const [syncState, setSyncState] = useState<SyncState | null>(loadSyncState)
  const [pulling, setPulling] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [conflict, setConflict] = useState<ConflictState | null>(null)

  // Refs for stable callbacks — updated every render
  const contentRef = useRef(currentContent)
  const configRef = useRef(repoConfig)
  const syncRef = useRef(syncState)
  const conflictRef = useRef(conflict)

  contentRef.current = currentContent
  configRef.current = repoConfig
  syncRef.current = syncState
  conflictRef.current = conflict

  // Persist repoConfig to localStorage
  useEffect(() => {
    try {
      if (repoConfig) localStorage.setItem(REPO_CONFIG_KEY, JSON.stringify(repoConfig))
      else localStorage.removeItem(REPO_CONFIG_KEY)
    } catch { /* ignore */ }
  }, [repoConfig])

  // Persist syncState to localStorage
  useEffect(() => {
    try {
      if (syncState) localStorage.setItem(SYNC_STATE_KEY, JSON.stringify(syncState))
      else localStorage.removeItem(SYNC_STATE_KEY)
    } catch { /* ignore */ }
  }, [syncState])

  // isDirty: true when a repo is connected and local content differs from last-synced snapshot
  const isDirty = !!repoConfig && (!syncState || currentContent !== syncState.contentSnapshot)

  // Auto-pull-on-open: fires once per token change (i.e. when auth hydrates)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await Promise.resolve()
      if (cancelled) return
      const cfg = loadRepoConfig()
      if (!cfg || !token) return           // nothing configured or not signed in
      if (!cancelled) setPulling(true)
      try {
        const remote = await getFileContent(token, cfg.owner, cfg.repo, cfg.filePath, cfg.branch)
        if (cancelled) return
        const snap = loadSyncState()
        const local = contentRef.current
        if (!snap || local === snap.contentSnapshot) {
          // no local edits since last sync → take remote silently (D-07)
          if (!cancelled) applyRemoteContent(remote.content)
          if (!cancelled) setSyncState({ sha: remote.sha, contentSnapshot: remote.content })
        } else if (remote.content === local) {
          // identical content, just refresh sha/snapshot
          if (!cancelled) setSyncState({ sha: remote.sha, contentSnapshot: remote.content })
        } else {
          // local edited AND differs from remote → conflict (D-08)
          if (!cancelled) setConflict({ remoteContent: remote.content, remoteSha: remote.sha, source: 'pull' })
        }
      } catch {
        if (!cancelled) setSyncError("Couldn't sync with GitHub — working locally")
        // Note: 401 token-clearing is handled by useGitHubAuth on its own fetch; do not clear here.
      } finally {
        if (!cancelled) setPulling(false)
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // connectRepo: set config, then fetch the chosen file and apply remote content
  const connectRepo = useCallback((config: RepoConfig) => {
    setRepoConfig(config)
    if (!token) return
    setPulling(true)
    ;(async () => {
      try {
        const remote = await getFileContent(token, config.owner, config.repo, config.filePath, config.branch)
        applyRemoteContent(remote.content)
        setSyncState({ sha: remote.sha, contentSnapshot: remote.content })
      } catch {
        setSyncError("Couldn't sync with GitHub — working locally")
      } finally {
        setPulling(false)
      }
    })()
  }, [token, applyRemoteContent])

  const clearRepo = useCallback(() => {
    setRepoConfig(null)
    setSyncState(null)
    setConflict(null)
    setSyncError(null)
  }, [])

  const dismissSyncError = useCallback(() => setSyncError(null), [])
  const dismissSuccess = useCallback(() => setSuccessMessage(null), [])

  // commit and resolveConflict stubs — filled in Task 2
  const commit = useCallback((_message: string) => {
    setCommitting(false) // placeholder — real impl in Task 2
  }, [])
  const resolveConflict = useCallback((_choice: 'local' | 'remote') => {}, [])

  return {
    repoConfig,
    isDirty,
    pulling,
    committing,
    syncError,
    successMessage,
    conflict,
    connectRepo,
    commit,
    resolveConflict,
    clearRepo,
    dismissSyncError,
    dismissSuccess,
  }
}
