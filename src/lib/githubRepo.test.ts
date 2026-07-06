import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  listUserRepos,
  listBranches,
  listMdFiles,
  getFileContent,
  commitFile,
} from './githubRepo'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('listUserRepos', () => {
  it('returns repos with correct shape, sorted by pushed', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve([
          {
            full_name: 'me/a',
            owner: { login: 'me' },
            name: 'a',
            default_branch: 'main',
            pushed_at: '2026-01-01T00:00:00Z',
            private: false,
          },
        ]),
    })
    vi.stubGlobal('fetch', mockFetch)

    const repos = await listUserRepos('tok')
    expect(repos[0].owner).toBe('me')
    expect(repos[0].full_name).toBe('me/a')
    expect(repos[0].name).toBe('a')
    expect(repos[0].default_branch).toBe('main')
    expect(repos[0].pushed_at).toBe('2026-01-01T00:00:00Z')
    expect(repos[0].private).toBe(false)
  })

  it('calls fetch with sort=pushed URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', mockFetch)

    await listUserRepos('tok')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('sort=pushed'),
      expect.anything(),
    )
  })

  it('sends Authorization Bearer header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', mockFetch)

    await listUserRepos('mytoken')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mytoken',
        }),
      }),
    )
  })

  it('throws on non-ok response (401)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 401 })
    vi.stubGlobal('fetch', mockFetch)
    await expect(listUserRepos('bad')).rejects.toThrow()
  })
})

describe('listBranches', () => {
  it('returns all branch names', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ name: 'main' }, { name: 'dev' }]),
    })
    vi.stubGlobal('fetch', mockFetch)

    const branches = await listBranches('tok', 'me', 'myrepo')
    expect(branches.map((b) => b.name)).toEqual(['main', 'dev'])
  })

  it('calls the correct branches endpoint', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    })
    vi.stubGlobal('fetch', mockFetch)

    await listBranches('tok', 'owner', 'repo')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('repos/owner/repo/branches'),
      expect.anything(),
    )
  })

  it('throws on non-ok response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', mockFetch)
    await expect(listBranches('tok', 'me', 'repo')).rejects.toThrow()
  })
})

describe('listMdFiles', () => {
  it('returns only .md blobs, excluding other types', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          tree: [
            { type: 'blob', path: 'a.md' },
            { type: 'blob', path: 'b.txt' },
            { type: 'blob', path: 'docs/notes.md' },
            { type: 'tree', path: 'dir' },
            { type: 'blob', path: 'README' },
          ],
        }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const files = await listMdFiles('tok', 'me', 'repo', 'main')
    expect(files).toEqual([{ path: 'a.md' }, { path: 'docs/notes.md' }])
  })

  it('calls the git/trees endpoint with recursive=1', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ tree: [] }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await listMdFiles('tok', 'me', 'repo', 'main')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('git/trees'),
      expect.anything(),
    )
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('recursive=1'),
      expect.anything(),
    )
  })

  it('throws on non-ok response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', mockFetch)
    await expect(listMdFiles('tok', 'me', 'repo', 'main')).rejects.toThrow()
  })
})

describe('getFileContent', () => {
  it('decodes base64 content and returns sha', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ content: btoa('hello'), sha: 'abc' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await getFileContent('tok', 'me', 'repo', 'README.md', 'main')
    expect(result.content).toBe('hello')
    expect(result.sha).toBe('abc')
  })

  it('sends Authorization Bearer header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ content: btoa('x'), sha: 'sha1' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await getFileContent('mytoken', 'me', 'repo', 'f.md', 'main')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mytoken',
        }),
      }),
    )
  })

  it('calls URL with ?ref= for branch', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ content: btoa('x'), sha: 'sha1' }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await getFileContent('tok', 'me', 'repo', 'file.md', 'main')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('?ref='),
      expect.anything(),
    )
  })

  it('throws on non-ok response (404)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', mockFetch)
    await expect(getFileContent('tok', 'me', 'repo', 'README.md', 'main')).rejects.toThrow()
  })
})

describe('commitFile', () => {
  it('returns sha and commitSha on success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          content: { sha: 'newsha' },
          commit: { sha: 'commitsha' },
        }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const result = await commitFile('tok', 'me', 'repo', 'README.md', 'main', 'content', 'msg', 'oldsha')
    expect(result.sha).toBe('newsha')
    expect(result.commitSha).toBe('commitsha')
  })

  it('calls fetch with method: PUT', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ content: { sha: 's' }, commit: { sha: 'c' } }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await commitFile('tok', 'me', 'repo', 'f.md', 'main', 'body', 'msg', 'sha')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('sends base64-encoded content in body', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ content: { sha: 's' }, commit: { sha: 'c' } }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await commitFile('tok', 'me', 'repo', 'f.md', 'main', 'hello', 'msg', 'sha')
    const callArg = mockFetch.mock.calls[0][1] as { body: string }
    const body = JSON.parse(callArg.body)
    // btoa('hello') = 'aGVsbG8='
    expect(body.content).toBe(btoa('hello'))
  })

  it('sends Authorization Bearer header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ content: { sha: 's' }, commit: { sha: 'c' } }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await commitFile('mytoken', 'me', 'repo', 'f.md', 'main', 'body', 'msg', 'sha')
    expect(mockFetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer mytoken',
        }),
      }),
    )
  })

  it('throws on non-ok response (409 conflict)', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 409 })
    vi.stubGlobal('fetch', mockFetch)
    await expect(
      commitFile('tok', 'me', 'repo', 'README.md', 'main', 'content', 'msg', 'sha'),
    ).rejects.toThrow()
  })
})
