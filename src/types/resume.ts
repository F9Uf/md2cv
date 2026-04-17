export interface ResumeEntry {
  title: string        // from h3
  details: string[]    // from bullet list items under the h3
  extra: string        // any non-bullet content directly under h3 (paragraphs, inline markup), rendered as raw HTML
}

export interface ResumeSection {
  heading: string      // from h2
  entries: ResumeEntry[]
  extra: string        // any content directly under h2 that is not inside an h3 block, rendered as raw HTML
}

export interface ResumeData {
  name: string         // from h1 (first h1 only; empty string if none)
  sections: ResumeSection[]
  preamble: string     // any content between h1 and the first h2, rendered as raw HTML (e.g., contact info paragraph)
}
