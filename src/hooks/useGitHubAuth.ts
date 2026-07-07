import { useState, useEffect, useCallback } from 'react'
import {
  buildAuthorizeUrl,
  generateState,
  parseCallbackParams,
  exchangeCodeForToken,
  fetchGitHubUser,
  type GitHubUser,
} from '../lib/githubAuth'

const TOKEN_KEY = 'md2cv-github-token'
const STATE_KEY = 'md2cv-oauth-state'

const ERR_DENIED = 'GitHub access was denied. Click Sign in to try again.'
const ERR_FAILED = 'Sign-in failed. Please try again.'

export interface GitHubAuthState {
  token: string | null
  user: GitHubUser | null
  loading: boolean
  error: string | null
}

export interface UseGitHubAuthResult extends GitHubAuthState {
  signIn: () => void
  signOut: () => void
  dismissError: () => void
}

function loadToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function useGitHubAuth(): UseGitHubAuthResult {
  const [token, setToken] = useState<string | null>(loadToken)
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Persist / clear token (D-05)
  useEffect(() => {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
    } catch { /* ignore */ }
  }, [token])

  // Mount: handle OAuth callback, then validate/hydrate identity (D-02, D-06)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await Promise.resolve()
      if (cancelled) return

      const { code, state, error: cbError } = parseCallbackParams(window.location.search)
      const cleanUrl = () => window.history.replaceState({}, '', window.location.pathname)

      let activeToken = loadToken()

      if (cbError) {
        cleanUrl()
        if (!cancelled) setError(ERR_DENIED)
      } else if (code && state) {
        let expected: string | null = null
        try { expected = sessionStorage.getItem(STATE_KEY) } catch { /* ignore */ }
        try { sessionStorage.removeItem(STATE_KEY) } catch { /* ignore */ }
        cleanUrl()
        if (!expected || expected !== state) {
          if (!cancelled) setError(ERR_FAILED)
          activeToken = null
        } else {
          if (!cancelled) setLoading(true)
          try {
            const endpoint = import.meta.env.VITE_AUTH_ENDPOINT
            if (!endpoint) throw new Error('VITE_AUTH_ENDPOINT not configured')
            const newToken = await exchangeCodeForToken(code, endpoint)
            if (cancelled) return
            activeToken = newToken
            setToken(newToken)
          } catch {
            if (!cancelled) { setError(ERR_FAILED); setLoading(false); activeToken = null }
          }
        }
      }

      if (activeToken) {
        if (!cancelled) setLoading(true)
        try {
          const u = await fetchGitHubUser(activeToken)
          if (!cancelled) { setUser(u); setError(null) }
        } catch {
          // 401 / invalid token -> clear silently (D-06)
          if (!cancelled) { setToken(null); setUser(null) }
        }
      }
      if (!cancelled) setLoading(false)
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signIn = useCallback(() => {
    const state = generateState()
    try { sessionStorage.setItem(STATE_KEY, state) } catch { /* ignore */ }
    setError(null)
    const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID
    if (!clientId) { setError(ERR_FAILED); return }
    window.location.href = buildAuthorizeUrl(
      clientId,
      state,
      window.location.origin + '/',
    )
  }, [])

  const signOut = useCallback(() => {
    setToken(null)
    setUser(null)
    setError(null)
    try { sessionStorage.removeItem(STATE_KEY) } catch { /* ignore */ }
  }, [])

  const dismissError = useCallback(() => setError(null), [])

  return { token, user, loading, error, signIn, signOut, dismissError }
}
