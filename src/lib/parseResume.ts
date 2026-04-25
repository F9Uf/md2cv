import MarkdownIt from 'markdown-it'

// Singleton MarkdownIt instance — html: true enabled (personal tool, single user, XSS accepted per D-10)
const md = new MarkdownIt({ html: true })

export function parseResume(markdownText: string): string {
  return md.render(markdownText)
}
