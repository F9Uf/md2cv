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

// RED: minimal interface tests to drive the implementation
describe('listUserRepos', () => {
  it('returns repos sorted by pushed (shape check)', async () => {
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
  })

  it('throws on non-ok response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 401 })
    vi.stubGlobal('fetch', mockFetch)
    await expect(listUserRepos('bad')).rejects.toThrow()
  })
})

describe('listBranches', () => {
  it('returns branch names', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([{ name: 'main' }, { name: 'dev' }]),
    })
    vi.stubGlobal('fetch', mockFetch)

    const branches = await listBranches('tok', 'me', 'repo')
    expect(branches.map((b) => b.name)).toEqual(['main', 'dev'])
  })

  it('throws on non-ok response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 })
    vi.stubGlobal('fetch', mockFetch)
    await expect(listBranches('tok', 'me', 'repo')).rejects.toThrow()
  })
})

describe('listMdFiles', () => {
  it('filters to only .md blobs', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () =>
        Promise.resolve({
          tree: [
            { type: 'blob', path: 'a.md' },
            { type: 'blob', path: 'b.txt' },
            { type: 'tree', path: 'dir' },
          ],
        }),
    })
    vi.stubGlobal('fetch', mockFetch)

    const files = await listMdFiles('tok', 'me', 'repo', 'main')
    expect(files).toEqual([{ path: 'a.md' }])
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

  it('throws on non-ok response', async () => {
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

  it('throws on non-ok response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 409 })
    vi.stubGlobal('fetch', mockFetch)
    await expect(
      commitFile('tok', 'me', 'repo', 'README.md', 'main', 'content', 'msg', 'sha'),
    ).rejects.toThrow()
  })
})
