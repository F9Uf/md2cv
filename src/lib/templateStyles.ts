export type TemplateName = 'classic' | 'modern' | 'minimal'

export interface TemplateClasses {
  container: string  // layout + font + theme class prefix baked in by Preview.tsx
}

export const TEMPLATE_STYLES: Record<TemplateName, TemplateClasses> = {
  classic: {
    container: 'font-serif max-w-[800px] mx-auto p-8 leading-snug',
  },
  modern: {
    container: 'font-sans max-w-[800px] mx-auto p-8 leading-relaxed',
  },
  minimal: {
    container: 'font-sans max-w-[800px] mx-auto p-10 leading-loose font-light',
  },
}
