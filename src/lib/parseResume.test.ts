import { describe, it, expect } from 'vitest'
import { parseResume } from './parseResume'
import { TEMPLATE_STYLES } from './templateStyles'

describe('parseResume — Phase 5: HTML string output', () => {

  it('returns a string type', () => {
    const result = parseResume('# Jane Doe\n')
    expect(typeof result).toBe('string')
  })

  it('h1 produces <h1> element', () => {
    const result = parseResume('# Jane Doe\n')
    expect(result).toContain('<h1>')
    expect(result).toContain('Jane Doe')
  })

  it('renders **bold** as <strong> (STYLE-01)', () => {
    const result = parseResume('**bold text**\n')
    expect(result).toContain('<strong>bold text</strong>')
  })

  it('renders *italic* as <em> (STYLE-02)', () => {
    const result = parseResume('*italic text*\n')
    expect(result).toContain('<em>italic text</em>')
  })

  it('renders `code` as <code> (STYLE-03)', () => {
    const result = parseResume('`inline code`\n')
    expect(result).toContain('<code>inline code</code>')
  })

  it('renders [text](url) as <a href> (STYLE-04)', () => {
    const result = parseResume('[click here](https://example.com)\n')
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('click here')
  })

  it('passes through inline HTML without escaping (HTML-01 / PARSER-02)', () => {
    const result = parseResume('<span style="color:red">x</span>\n')
    expect(result).toContain('<span style="color:red">x</span>')
    expect(result).not.toContain('&lt;span')
  })

  it('h2 produces <h2> element', () => {
    const result = parseResume('## Experience\n')
    expect(result).toContain('<h2>')
    expect(result).toContain('Experience')
  })

  it('h3 produces <h3> element', () => {
    const result = parseResume('### Job A\n')
    expect(result).toContain('<h3>')
    expect(result).toContain('Job A')
  })

  it('bullet list produces <ul> and <li>', () => {
    const result = parseResume('- item one\n- item two\n')
    expect(result).toContain('<ul>')
    expect(result).toContain('<li>')
    expect(result).toContain('item one')
  })

  it('empty string returns a string', () => {
    const result = parseResume('')
    expect(typeof result).toBe('string')
  })

})

describe('template snapshot baseline — container class exists', () => {

  it('classic has a non-empty container class', () => {
    expect(TEMPLATE_STYLES['classic'].container).toBeTruthy()
    expect(typeof TEMPLATE_STYLES['classic'].container).toBe('string')
  })

  it('modern has a non-empty container class', () => {
    expect(TEMPLATE_STYLES['modern'].container).toBeTruthy()
  })

  it('minimal has a non-empty container class', () => {
    expect(TEMPLATE_STYLES['minimal'].container).toBeTruthy()
  })

  it('classic has element keys: h1, h2, h3, p, ul, li', () => {
    const s = TEMPLATE_STYLES['classic']
    expect(s).toHaveProperty('h1')
    expect(s).toHaveProperty('h2')
    expect(s).toHaveProperty('h3')
    expect(s).toHaveProperty('p')
    expect(s).toHaveProperty('ul')
    expect(s).toHaveProperty('li')
  })

})
