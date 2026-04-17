import { describe, it, expect } from 'vitest'
import { parseResume } from './parseResume'

describe('parseResume — Phase 4: Inline Styles & HTML Preview', () => {

  // Test 1: h1 → name
  it('extracts the first h1 as the resume name', () => {
    const result = parseResume('# Jane Doe\n')
    expect(result.name).toBe('Jane Doe')
  })

  // Test 2: bold → <strong>
  it('renders **bold** in bullet details as <strong> HTML (STYLE-01)', () => {
    const md = '# Name\n\n## Work\n\n### Job\n\n- **bold text**\n'
    const result = parseResume(md)
    const detail = result.sections[0].entries[0].details[0]
    expect(detail).toContain('<strong>bold text</strong>')
  })

  // Test 3: italic → <em>
  it('renders *italic* in bullet details as <em> HTML (STYLE-02)', () => {
    const md = '# Name\n\n## Work\n\n### Job\n\n- *italic text*\n'
    const result = parseResume(md)
    const detail = result.sections[0].entries[0].details[0]
    expect(detail).toContain('<em>italic text</em>')
  })

  // Test 4: inline code → <code>
  it('renders `code` in bullet details as <code> HTML (STYLE-03)', () => {
    const md = '# Name\n\n## Work\n\n### Job\n\n- `inline code`\n'
    const result = parseResume(md)
    const detail = result.sections[0].entries[0].details[0]
    expect(detail).toContain('<code>inline code</code>')
  })

  // Test 5: link → <a>
  it('renders [text](url) in bullet details as <a href> HTML (STYLE-04)', () => {
    const md = '# Name\n\n## Work\n\n### Job\n\n- [click here](https://example.com)\n'
    const result = parseResume(md)
    const detail = result.sections[0].entries[0].details[0]
    expect(detail).toContain('<a href="https://example.com">')
    expect(detail).toContain('click here')
  })

  // Test 6: inline HTML not escaped (HTML-01)
  it('passes through inline HTML in bullet details without escaping (HTML-01)', () => {
    const md = '# Name\n\n## Work\n\n### Job\n\n- <span style="color:red">x</span>\n'
    const result = parseResume(md)
    const detail = result.sections[0].entries[0].details[0]
    expect(detail).toContain('<span style="color:red">x</span>')
    expect(detail).not.toContain('&lt;span')
  })

  // Test 7: block HTML in entry.extra (HTML-02)
  it('renders block HTML after h3 into entry.extra without escaping (HTML-02)', () => {
    const md = '# Name\n\n## Work\n\n### Job\n\n<div>block content</div>\n'
    const result = parseResume(md)
    const extra = result.sections[0].entries[0].extra
    expect(extra).toContain('<div>block content</div>')
    expect(extra).not.toContain('&lt;div')
  })

  // Test 8: h2 → section heading
  it('extracts h2 headings as section headings', () => {
    const md = '# Name\n\n## Experience\n\n## Education\n'
    const result = parseResume(md)
    expect(result.sections).toHaveLength(2)
    expect(result.sections[0].heading).toBe('Experience')
    expect(result.sections[1].heading).toBe('Education')
  })

  // Test 9: h3 → entry grouped into section
  it('groups h3 entries under the correct h2 section', () => {
    const md = '# Name\n\n## Work\n\n### Job A\n\n### Job B\n'
    const result = parseResume(md)
    expect(result.sections[0].entries).toHaveLength(2)
    expect(result.sections[0].entries[0].title).toBe('Job A')
    expect(result.sections[0].entries[1].title).toBe('Job B')
  })

  // Test 10: empty string → empty result
  it('returns empty structure for empty input', () => {
    const result = parseResume('')
    expect(result.name).toBe('')
    expect(result.sections).toHaveLength(0)
    expect(result.preamble).toBe('')
  })

})
