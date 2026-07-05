export interface GitHubUser {
  login: string
  avatar_url: string
}

export interface CallbackParams {
  code: string | null
  state: string | null
  error: string | null
}

const OAUTH_SCOPE = 'repo' // D-11: read/write private + public repos for Phase 12 commits

export function buildAuthorizeUrl(clientId: string, state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: OAUTH_SCOPE,
    state,
  })
  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

export function generateState(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function parseCallbackParams(search: string): CallbackParams {
  const params = new URLSearchParams(search)
  return {
    code: params.get('code'),
    state: params.get('state'),
    error: params.get('error'),
  }
}

export async function exchangeCodeForToken(code: string, endpoint: string): Promise<string> {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  })
  if (!res.ok) throw new Error(`exchange_failed_${res.status}`)
  const data = (await res.json()) as { access_token?: string; error?: string }
  if (!data.access_token) throw new Error(data.error || 'exchange_failed')
  return data.access_token
}

export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) throw new Error(`user_fetch_failed_${res.status}`)
  const data = (await res.json()) as GitHubUser
  return { login: data.login, avatar_url: data.avatar_url }
}
