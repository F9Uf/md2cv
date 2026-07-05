import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  buildAuthorizeUrl,
  generateState,
  parseCallbackParams,
  exchangeCodeForToken,
  fetchGitHubUser,
} from './githubAuth'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('buildAuthorizeUrl', () => {
  it('returns a GitHub authorize URL with correct params', () => {
    const url = buildAuthorizeUrl('cid', 'st8', 'https://app/')
    expect(url).toContain('https://github.com/login/oauth/authorize?')
    expect(url).toContain('client_id=cid')
    expect(url).toContain('scope=repo')
    expect(url).toContain('state=st8')
    expect(url).toContain(encodeURIComponent('https://app/'))
  })
})

describe('generateState', () => {
  it('returns a 32-char lowercase hex string', () => {
    const state = generateState()
    expect(state).toHaveLength(32)
    expect(state).toMatch(/^[0-9a-f]{32}$/)
  })

  it('two calls return different values', () => {
    const s1 = generateState()
    const s2 = generateState()
    expect(s1).not.toBe(s2)
  })
})

describe('parseCallbackParams', () => {
  it('parses ?code=abc&state=xyz correctly', () => {
    const result = parseCallbackParams('?code=abc&state=xyz')
    expect(result).toEqual({ code: 'abc', state: 'xyz', error: null })
  })

  it('parses ?error=access_denied correctly', () => {
    const result = parseCallbackParams('?error=access_denied')
    expect(result).toEqual({ code: null, state: null, error: 'access_denied' })
  })

  it('parses empty string correctly', () => {
    const result = parseCallbackParams('')
    expect(result).toEqual({ code: null, state: null, error: null })
  })
})

describe('exchangeCodeForToken', () => {
  it('returns access_token when fetch is ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ access_token: 'tok' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const token = await exchangeCodeForToken('c', 'https://ep')
    expect(token).toBe('tok')
    expect(mockFetch).toHaveBeenCalledWith('https://ep', expect.objectContaining({
      method: 'POST',
      body: expect.stringContaining('c'),
    }))
  })

  it('throws when fetch response is not ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
    })
    vi.stubGlobal('fetch', mockFetch)

    await expect(exchangeCodeForToken('c', 'https://ep')).rejects.toThrow()
  })

  it('throws when json contains error field', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ error: 'bad_verification_code' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await expect(exchangeCodeForToken('c', 'https://ep')).rejects.toThrow()
  })
})

describe('fetchGitHubUser', () => {
  it('returns login and avatar_url when fetch is ok', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ login: 'me', avatar_url: 'http://a' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const user = await fetchGitHubUser('tok')
    expect(user).toEqual({ login: 'me', avatar_url: 'http://a' })
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.github.com/user',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer tok',
        }),
      }),
    )
  })

  it('throws when fetch response is not ok (401)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
    })
    vi.stubGlobal('fetch', mockFetch)

    await expect(fetchGitHubUser('bad-tok')).rejects.toThrow()
  })
})
