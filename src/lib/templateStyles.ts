export type TemplateName = 'classic' | 'modern' | 'minimal'

export interface TemplateClasses {
  container: string       // outermost wrapper
  name: string            // h1 / candidate name
  preamble: string        // content between name and first section
  sectionHeading: string  // h2
  entryTitle: string      // h3
  entryDetail: string     // bullet item (li)
  detailList: string      // ul wrapper
  extra: string           // rendered extra HTML blocks
}

export const TEMPLATE_STYLES: Record<TemplateName, TemplateClasses> = {
  classic: {
    container: 'font-serif max-w-[800px] mx-auto p-8 leading-snug',
    name: 'text-xl font-bold text-center mb-1',
    preamble: 'text-center text-xs text-gray-600 mb-4',
    sectionHeading: 'text-base font-bold uppercase border-b border-black pb-1 mt-4 mb-3',
    entryTitle: 'text-sm font-semibold mt-3',
    entryDetail: 'text-xs ml-4',
    detailList: 'list-disc pl-2 mt-1 space-y-0.5',
    extra: 'text-xs text-gray-700 mt-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
  },
   modern: {
    container: 'font-sans max-w-[800px] mx-auto p-8 leading-relaxed',
    name: 'text-2xl font-bold mb-1',
    preamble: 'text-xs text-gray-500 mb-6',
    sectionHeading: 'text-base font-bold border-l-4 border-gray-800 pl-3 mt-4 mb-2 uppercase tracking-wide',
    entryTitle: 'text-base font-semibold mt-2',
    entryDetail: 'text-xs ml-4 text-gray-700',
    detailList: 'list-disc pl-2 mt-1 space-y-1',
    extra: 'text-xs text-gray-600 mt-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
  },
  minimal: {
    container: 'font-sans max-w-[800px] mx-auto p-10 leading-loose font-light',
    name: 'text-2xl font-extralight tracking-widest mb-2',
    preamble: 'text-xs text-gray-400 mb-10 tracking-wide',
    sectionHeading: 'text-xs font-normal uppercase tracking-[0.25em] text-gray-500 mt-10 mb-4',
    entryTitle: 'text-sm font-normal mt-4',
    entryDetail: 'text-sm ml-4 text-gray-500 font-light',
    detailList: 'list-none pl-4 mt-1 space-y-1.5',
    extra: 'text-sm text-gray-400 mt-1 font-light [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
  },
}
