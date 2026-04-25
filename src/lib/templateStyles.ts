export type TemplateName = 'classic' | 'modern' | 'minimal'

export interface TemplateClasses {
  container: string    // outermost wrapper div
  h1: string           // candidate name / first h1
  h2: string           // section heading
  h3: string           // entry title
  p: string            // paragraph
  ul: string           // unordered list wrapper
  ol: string           // ordered list wrapper
  li: string           // list item
  code: string         // inline code
  pre: string          // fenced code block wrapper
  a: string            // hyperlink
  blockquote: string   // blockquote
  hr: string           // horizontal rule
}

export const TEMPLATE_STYLES: Record<TemplateName, TemplateClasses> = {
  classic: {
    container: 'font-serif max-w-[800px] mx-auto p-8 leading-snug',
    h1: 'text-xl font-bold text-center mb-1',
    h2: 'text-base font-bold uppercase border-b border-black pb-1 mt-4 mb-3',
    h3: 'text-sm font-semibold mt-3',
    p: 'text-center text-xs text-gray-600 mb-4',
    ul: 'list-disc pl-2 mt-1 space-y-0.5',
    ol: 'list-decimal pl-2 mt-1 space-y-0.5',
    li: 'text-xs ml-4',
    code: 'font-mono text-xs bg-gray-100 px-0.5 rounded',
    pre: 'font-mono text-xs bg-gray-100 p-3 rounded mt-2 overflow-x-auto',
    a: 'text-blue-700 underline',
    blockquote: 'border-l-2 border-gray-400 pl-3 text-xs text-gray-600 italic my-2',
    hr: 'border-t border-gray-300 my-4',
  },
  modern: {
    container: 'font-sans max-w-[800px] mx-auto p-8 leading-relaxed',
    h1: 'text-2xl font-bold mb-1',
    h2: 'text-base font-bold border-l-4 border-gray-800 pl-3 mt-4 mb-2 uppercase tracking-wide',
    h3: 'text-base font-semibold mt-2',
    p: 'text-xs text-gray-500 mb-6',
    ul: 'list-disc pl-2 mt-1 space-y-1',
    ol: 'list-decimal pl-2 mt-1 space-y-1',
    li: 'text-xs ml-4 text-gray-700',
    code: 'font-mono text-xs bg-gray-100 px-0.5 rounded',
    pre: 'font-mono text-xs bg-gray-100 p-3 rounded mt-2 overflow-x-auto',
    a: 'text-blue-600 underline hover:text-blue-800',
    blockquote: 'border-l-4 border-gray-300 pl-3 text-xs text-gray-500 italic my-2',
    hr: 'border-t border-gray-200 my-4',
  },
  minimal: {
    container: 'font-sans max-w-[800px] mx-auto p-10 leading-loose font-light',
    h1: 'text-2xl font-extralight tracking-widest mb-2',
    h2: 'text-xs font-normal uppercase tracking-[0.25em] text-gray-700 mt-10 mb-4',
    h3: 'text-sm font-normal mt-4',
    p: 'text-xs text-gray-500 mb-10 tracking-wide',
    ul: 'list-disc pl-4 mt-1 space-y-1.5',
    ol: 'list-decimal pl-4 mt-1 space-y-1.5',
    li: 'text-sm ml-4 text-gray-700 font-light',
    code: 'font-mono text-xs bg-gray-50 px-0.5',
    pre: 'font-mono text-xs bg-gray-50 p-4 mt-2 overflow-x-auto',
    a: 'text-gray-800 underline underline-offset-2',
    blockquote: 'border-l border-gray-300 pl-4 text-sm text-gray-400 font-light italic my-3',
    hr: 'border-t border-gray-100 my-6',
  },
}
