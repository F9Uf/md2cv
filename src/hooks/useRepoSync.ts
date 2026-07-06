import { useState, useEffect, useCallback, useRef } from 'react'
import { getFileContent, commitFile } from '../lib/githubRepo'

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
  openFile: (path: string) => void
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

  // openFile: pull a different file into the editor and re-anchor sync state to it (Phase 13).
  // Caller MUST have resolved any dirty-switch prompt before calling this.
  const openFile = useCallback((path: string) => {
    const cfg = configRef.current
    if (!token || !cfg) return
    setPulling(true)
    setSyncError(null)
    ;(async () => {
      try {
        const remote = await getFileContent(token, cfg.owner, cfg.repo, path, cfg.branch)
        // Only replace content + re-anchor config AFTER the fetch succeeds (D-07)
        applyRemoteContent(remote.content)
        setSyncState({ sha: remote.sha, contentSnapshot: remote.content })
        setRepoConfig(prev => prev ? { ...prev, filePath: path } : prev)
      } catch {
        setSyncError("Couldn't open file — check your connection and try again.")
        // current file + edits remain untouched (D-07)
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

  // commit: PUT current content against stored sha; re-raise conflict on sha mismatch (D-13)
  const commit = useCallback((message: string) => {
    if (!token || !configRef.current || !syncRef.current) return
    setCommitting(true)
    setSyncError(null)
    ;(async () => {
      try {
        const content = contentRef.current
        const cfg = configRef.current!
        const snap = syncRef.current!
        const result = await commitFile(token, cfg.owner, cfg.repo, cfg.filePath, cfg.branch, content, message, snap.sha)
        setSyncState({ sha: result.sha, contentSnapshot: content }) // dirty clears: content === snapshot
        setSuccessMessage(`Committed to ${cfg.branch}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : ''
        if (msg.includes('commit_failed_409') || msg.includes('commit_failed_422')) {
          // sha mismatch — someone changed remote; fetch fresh remote and re-raise conflict (D-13)
          try {
            const cfg = configRef.current!
            const remote = await getFileContent(token, cfg.owner, cfg.repo, cfg.filePath, cfg.branch)
            setConflict({ remoteContent: remote.content, remoteSha: remote.sha, source: 'commit' })
          } catch {
            setSyncError('Commit failed — check your connection and try again')
          }
        } else {
          setSyncError('Commit failed — check your connection and try again')
        }
      } finally {
        setCommitting(false)
      }
    })()
  }, [token])

  // resolveConflict: handle keep-local/take-remote for both pull and commit sources
  const resolveConflict = useCallback((choice: 'local' | 'remote') => {
    const c = conflictRef.current
    if (!c) return
    setConflict(null)
    if (choice === 'remote') {
      // discard local, take remote (D-08 take-remote; D-13 commit-source take-remote)
      applyRemoteContent(c.remoteContent)
      setSyncState({ sha: c.remoteSha, contentSnapshot: c.remoteContent })
      return
    }
    // choice === 'local'
    if (c.source === 'pull') {
      // keep local, mark dirty (D-09). Adopt the fresh remote sha so a later commit targets it,
      // but keep the OLD snapshot so isDirty stays true.
      setSyncState((prev) => ({ sha: c.remoteSha, contentSnapshot: prev ? prev.contentSnapshot : '' }))
    } else {
      // source === 'commit': "keep local" == overwrite remote — re-commit with the fresh sha (D-13)
      if (!token || !configRef.current) return
      setCommitting(true)
      ;(async () => {
        try {
          const content = contentRef.current
          const cfg = configRef.current!
          const result = await commitFile(token, cfg.owner, cfg.repo, cfg.filePath, cfg.branch, content, `Update ${cfg.filePath.split('/').pop()}`, c.remoteSha)
          setSyncState({ sha: result.sha, contentSnapshot: content })
          setSuccessMessage(`Committed to ${cfg.branch}`)
        } catch {
          setSyncError('Commit failed — check your connection and try again')
        } finally {
          setCommitting(false)
        }
      })()
    }
  }, [token, applyRemoteContent])

  return {
    repoConfig,
    isDirty,
    pulling,
    committing,
    syncError,
    successMessage,
    conflict,
    connectRepo,
    openFile,
    commit,
    resolveConflict,
    clearRepo,
    dismissSyncError,
    dismissSuccess,
  }
}
