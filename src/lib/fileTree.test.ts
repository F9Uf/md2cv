import { describe, it, expect } from 'vitest'
import { buildFileTree, pathsToExpand } from './fileTree'
import type { GitHubTreeEntry } from './githubRepo'

describe('buildFileTree', () => {
  it('returns [] for empty input', () => {
    expect(buildFileTree([])).toEqual([])
  })

  it('puts folders first, then files alphabetical at the top level', () => {
    const entries: GitHubTreeEntry[] = [
      { type: 'tree', path: 'docs' },
      { type: 'blob', path: 'docs/resume.md' },
      { type: 'blob', path: 'README.md' },
      { type: 'blob', path: 'logo.png' },
    ]
    const result = buildFileTree(entries)
    expect(result).toHaveLength(3)
    // folders first
    expect(result[0].type).toBe('folder')
    expect(result[0].name).toBe('docs')
    expect(result[0].path).toBe('docs')
    // files alphabetical (case-insensitive: 'l' < 'r', so logo.png before README.md)
    expect(result[1].type).toBe('file')
    expect(result[1].name).toBe('logo.png')
    expect(result[2].type).toBe('file')
    expect(result[2].name).toBe('README.md')
  })

  it('nests children inside folder', () => {
    const entries: GitHubTreeEntry[] = [
      { type: 'tree', path: 'docs' },
      { type: 'blob', path: 'docs/resume.md' },
      { type: 'blob', path: 'README.md' },
      { type: 'blob', path: 'logo.png' },
    ]
    const result = buildFileTree(entries)
    const docsNode = result[0]
    expect(docsNode.children).toHaveLength(1)
    expect(docsNode.children[0].name).toBe('resume.md')
    expect(docsNode.children[0].path).toBe('docs/resume.md')
    expect(docsNode.children[0].type).toBe('file')
  })

  it('node.name is the last path segment, node.path is the full path', () => {
    const entries: GitHubTreeEntry[] = [
      { type: 'blob', path: 'a/b/file.md' },
    ]
    const result = buildFileTree(entries)
    const a = result[0]
    expect(a.name).toBe('a')
    expect(a.path).toBe('a')
    const b = a.children[0]
    expect(b.name).toBe('b')
    expect(b.path).toBe('a/b')
    const file = b.children[0]
    expect(file.name).toBe('file.md')
    expect(file.path).toBe('a/b/file.md')
  })

  it('isMarkdown is true for .md files (case-insensitive), false for other files and all folders', () => {
    const entries: GitHubTreeEntry[] = [
      { type: 'tree', path: 'docs' },
      { type: 'blob', path: 'docs/resume.md' },
      { type: 'blob', path: 'README.MD' },
      { type: 'blob', path: 'A.MD' },
      { type: 'blob', path: 'logo.png' },
    ]
    const result = buildFileTree(entries)
    // folder
    const folder = result.find((n) => n.type === 'folder')!
    expect(folder.isMarkdown).toBe(false)
    // .md file (lowercase)
    const resumeMd = folder.children.find((n) => n.name === 'resume.md')!
    expect(resumeMd.isMarkdown).toBe(true)
    // .MD (uppercase)
    const readmeMd = result.find((n) => n.name === 'README.MD')!
    expect(readmeMd.isMarkdown).toBe(true)
    const aMd = result.find((n) => n.name === 'A.MD')!
    expect(aMd.isMarkdown).toBe(true)
    // non-md
    const png = result.find((n) => n.name === 'logo.png')!
    expect(png.isMarkdown).toBe(false)
  })

  it('sorts case-insensitively — folders always before files regardless of name', () => {
    const entries: GitHubTreeEntry[] = [
      { type: 'blob', path: 'apple.md' },
      { type: 'tree', path: 'Zebra' },
      { type: 'tree', path: 'apple-dir' },
    ]
    const result = buildFileTree(entries)
    expect(result[0].type).toBe('folder')
    expect(result[1].type).toBe('folder')
    expect(result[2].type).toBe('file')
    // 'apple-dir' < 'Zebra' case-insensitively
    expect(result[0].name).toBe('apple-dir')
    expect(result[1].name).toBe('Zebra')
  })

  it('creates implied intermediate folders for deep blob paths with no explicit tree entry', () => {
    const entries: GitHubTreeEntry[] = [
      { type: 'blob', path: 'a/b/c.md' },
    ]
    const result = buildFileTree(entries)
    expect(result).toHaveLength(1)
    const a = result[0]
    expect(a.name).toBe('a')
    expect(a.type).toBe('folder')
    expect(a.children).toHaveLength(1)
    const b = a.children[0]
    expect(b.name).toBe('b')
    expect(b.type).toBe('folder')
    expect(b.children).toHaveLength(1)
    const c = b.children[0]
    expect(c.name).toBe('c.md')
    expect(c.type).toBe('file')
    expect(c.isMarkdown).toBe(true)
  })

  it('does not duplicate file nodes if a blob is listed after its tree entry', () => {
    const entries: GitHubTreeEntry[] = [
      { type: 'tree', path: 'src' },
      { type: 'blob', path: 'src/index.ts' },
    ]
    const result = buildFileTree(entries)
    const src = result[0]
    expect(src.children).toHaveLength(1)
    expect(src.children[0].name).toBe('index.ts')
  })
})

describe('pathsToExpand', () => {
  it('returns ancestor folder paths, not the file itself', () => {
    expect(pathsToExpand('a/b/c.md')).toEqual(['a', 'a/b'])
  })

  it('returns [] for a top-level file with no ancestors', () => {
    expect(pathsToExpand('README.md')).toEqual([])
  })

  it('returns [] for empty string', () => {
    expect(pathsToExpand('')).toEqual([])
  })

  it('returns one ancestor for a single-level nested file', () => {
    expect(pathsToExpand('docs/resume.md')).toEqual(['docs'])
  })

  it('returns three ancestors for a four-level deep file', () => {
    expect(pathsToExpand('a/b/c/d.md')).toEqual(['a', 'a/b', 'a/b/c'])
  })
})
