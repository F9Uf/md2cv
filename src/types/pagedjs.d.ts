// src/types/pagedjs.d.ts
// Minimal ambient declaration for `pagedjs` — covers only the API surface
// Preview.tsx (Plan 03) uses. Shape derived from verified upstream source at
// github.com/pagedjs/pagedjs/blob/main/src/polyfill/previewer.js
// (RESEARCH.md §Example 2, §Pitfall 7).
declare module 'pagedjs' {
  export interface PagedjsFlow {
    total: number
    pages: Array<unknown>
    performance: number
    size: {
      width: { value: number; unit: string }
      height: { value: number; unit: string }
      format?: string
      orientation?: string
    }
  }

  export class Previewer {
    constructor(options?: Record<string, unknown>)
    preview(
      content: HTMLElement | DocumentFragment | string,
      stylesheets: Array<string | Record<string, string>>,
      renderTo: HTMLElement | string,
    ): Promise<PagedjsFlow>
    polisher: { destroy(): void }
    chunker: { destroy(): void; total: number; pages: unknown[] }
    on(event: string, cb: (...args: unknown[]) => void): void
  }
}
