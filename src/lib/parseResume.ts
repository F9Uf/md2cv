import MarkdownIt from 'markdown-it'
import type Token from 'markdown-it/lib/token.mjs'
import type { ResumeData, ResumeSection, ResumeEntry } from '../types/resume'

// Singleton MarkdownIt instance — html: true enabled for v1.1.0 (personal tool, single user, T-04-01 accepted)
const md = new MarkdownIt({ html: true })

export function parseResume(markdownText: string): ResumeData {
  const tokens = md.parse(markdownText, {})

  const result: ResumeData = {
    name: '',
    sections: [],
    preamble: '',
  }

  let nameFound = false
  let currentSection: ResumeSection | null = null
  let currentEntry: ResumeEntry | null = null

  // Track context for extra content rendering
  // 'preamble' | 'section' | 'entry'
  type Context = 'preamble' | 'section' | 'entry'
  let context: Context = 'preamble'

  let i = 0

  // Helper: render a group of tokens as HTML for extra fields
  const renderTokens = (tokenGroup: Token[]): string => {
    return md.renderer.render(tokenGroup, md.options, {})
  }

  while (i < tokens.length) {
    const token = tokens[i]

    if (token.type === 'heading_open') {
      const tag = token.tag
      const inlineToken = tokens[i + 1]
      const content = inlineToken?.content ?? ''

      if (tag === 'h1' && !nameFound) {
        // First h1 becomes the name
        result.name = content
        nameFound = true
        context = 'preamble'
        i += 3 // skip heading_open, inline, heading_close
        continue
      } else if (tag === 'h1' && nameFound) {
        // Subsequent h1s treated as regular content — render as extra
        const headingTokens = [tokens[i], tokens[i + 1], tokens[i + 2]]
        const rendered = renderTokens(headingTokens)
        if (context === 'preamble') {
          result.preamble += rendered
        } else if (context === 'section' && currentSection) {
          currentSection.extra += rendered
        } else if (context === 'entry' && currentEntry) {
          currentEntry.extra += rendered
        }
        i += 3
        continue
      } else if (tag === 'h2') {
        // Start a new section
        if (currentEntry) {
          // Close current entry into current section
          currentSection!.entries.push(currentEntry)
          currentEntry = null
        }
        if (currentSection) {
          result.sections.push(currentSection)
        }
        currentSection = {
          heading: content,
          entries: [],
          extra: '',
        }
        currentEntry = null
        context = 'section'
        i += 3
        continue
      } else if (tag === 'h3') {
        // Start a new entry within the current section
        if (currentEntry && currentSection) {
          currentSection.entries.push(currentEntry)
        }
        currentEntry = {
          title: content,
          details: [],
          extra: '',
        }
        context = 'entry'
        i += 3
        continue
      }
    }

    // Handle bullet lists
    if (token.type === 'bullet_list_open') {
      // Collect all tokens until matching bullet_list_close
      const listTokens: Token[] = [token]
      let depth = 1
      i++
      while (i < tokens.length && depth > 0) {
        const t = tokens[i]
        listTokens.push(t)
        if (t.type === 'bullet_list_open') depth++
        if (t.type === 'bullet_list_close') depth--
        i++
      }

      if (context === 'entry' && currentEntry) {
        // Extract list item text into details[]
        for (const t of listTokens) {
          if (t.type === 'inline' && (t.level === 2 || t.level === 3)) {
            // level 2 = tight list (list_item > inline)
            // level 3 = loose list (list_item > paragraph > inline)
            currentEntry.details.push(md.renderInline(t.content))
          }
        }
      } else {
        // Not inside an entry — render as extra HTML
        const rendered = renderTokens(listTokens)
        if (context === 'preamble') {
          result.preamble += rendered
        } else if (context === 'section' && currentSection) {
          currentSection.extra += rendered
        }
      }
      continue
    }

    // Handle all other block tokens (paragraphs, blockquotes, hr, etc.)
    // Collect open/close pairs or self-closing tokens and render as extra
    if (
      token.type === 'paragraph_open' ||
      token.type === 'blockquote_open' ||
      token.type === 'fence' ||
      token.type === 'code_block' ||
      token.type === 'hr'
    ) {
      let blockTokens: Token[]

      if (token.type === 'hr' || token.type === 'fence' || token.type === 'code_block') {
        // Self-contained token
        blockTokens = [token]
        i++
      } else {
        // Collect until matching close tag
        const openType = token.type
        const closeType = openType.replace('_open', '_close')
        blockTokens = [token]
        let depth = 1
        i++
        while (i < tokens.length && depth > 0) {
          const t = tokens[i]
          blockTokens.push(t)
          if (t.type === openType) depth++
          if (t.type === closeType) depth--
          i++
        }
      }

      const rendered = renderTokens(blockTokens)

      if (context === 'preamble') {
        result.preamble += rendered
      } else if (context === 'section' && currentSection) {
        currentSection.extra += rendered
      } else if (context === 'entry' && currentEntry) {
        currentEntry.extra += rendered
      }
      continue
    }

    i++
  }

  // Flush any remaining open entry/section
  if (currentEntry && currentSection) {
    currentSection.entries.push(currentEntry)
  }
  if (currentSection) {
    result.sections.push(currentSection)
  }

  return result
}
