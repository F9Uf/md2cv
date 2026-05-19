export type TemplateName = 'classic' | 'modern' | 'minimal'

export interface TemplateClasses {
  container: string  // layout + font + theme class prefix baked in by Preview.tsx
}

export const TEMPLATE_STYLES: Record<TemplateName, TemplateClasses> = {
  classic: {
    container: 'font-serif leading-snug',
  },
  modern: {
    container: 'font-sans leading-relaxed',
  },
  minimal: {
    container: 'font-sans leading-loose font-light',
  },
}
