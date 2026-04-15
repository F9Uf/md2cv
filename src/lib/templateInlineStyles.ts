/**
 * Inline style maps for ExportTarget — hex/rgb only, no Tailwind/oklch.
 * These mirror the visual appearance of TEMPLATE_STYLES but use safe CSS values
 * that html2pdf.js / html2canvas can parse without errors.
 */

import type { CSSProperties } from 'react'
import type { TemplateName } from './templateStyles'

export interface TemplateInlineStyles {
  container: CSSProperties
  name: CSSProperties
  preamble: CSSProperties
  sectionHeading: CSSProperties
  entryTitle: CSSProperties
  detailList: CSSProperties
  entryDetail: CSSProperties
  extra: CSSProperties
}

export const TEMPLATE_INLINE_STYLES: Record<TemplateName, TemplateInlineStyles> = {
  classic: {
    container: {
      fontFamily: 'Georgia, "Times New Roman", Times, serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '32px',
      lineHeight: '1.375',
      color: '#111111',
      backgroundColor: '#ffffff',
    },
    name: {
      fontSize: '1.5rem',
      fontWeight: 700,
      textAlign: 'center',
      marginBottom: '4px',
    },
    preamble: {
      textAlign: 'center',
      fontSize: '0.875rem',
      color: '#4b5563',
      marginBottom: '24px',
    },
    sectionHeading: {
      fontSize: '1.125rem',
      fontWeight: 700,
      textTransform: 'uppercase',
      borderBottom: '1px solid #000000',
      paddingBottom: '4px',
      marginTop: '24px',
      marginBottom: '12px',
    },
    entryTitle: {
      fontSize: '1rem',
      fontWeight: 600,
      marginTop: '12px',
    },
    detailList: {
      listStyleType: 'disc',
      paddingLeft: '24px',
      marginTop: '4px',
    },
    entryDetail: {
      fontSize: '0.875rem',
      marginLeft: '16px',
    },
    extra: {
      fontSize: '0.875rem',
      color: '#374151',
      marginTop: '4px',
    },
  },

  modern: {
    container: {
      fontFamily: 'Arial, Helvetica, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '32px',
      lineHeight: '1.625',
      color: '#111111',
      backgroundColor: '#ffffff',
    },
    name: {
      fontSize: '1.875rem',
      fontWeight: 700,
      marginBottom: '4px',
    },
    preamble: {
      fontSize: '0.875rem',
      color: '#6b7280',
      marginBottom: '32px',
    },
    sectionHeading: {
      fontSize: '1rem',
      fontWeight: 700,
      borderLeft: '4px solid #1f2937',
      paddingLeft: '12px',
      marginTop: '32px',
      marginBottom: '16px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    entryTitle: {
      fontSize: '1rem',
      fontWeight: 600,
      marginTop: '16px',
    },
    detailList: {
      listStyleType: 'disc',
      paddingLeft: '24px',
      marginTop: '4px',
    },
    entryDetail: {
      fontSize: '0.875rem',
      marginLeft: '16px',
      color: '#374151',
    },
    extra: {
      fontSize: '0.875rem',
      color: '#4b5563',
      marginTop: '4px',
    },
  },

  minimal: {
    container: {
      fontFamily: 'Arial, Helvetica, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '40px',
      lineHeight: '2',
      fontWeight: 300,
      color: '#111111',
      backgroundColor: '#ffffff',
    },
    name: {
      fontSize: '1.5rem',
      fontWeight: 200,
      letterSpacing: '0.1em',
      marginBottom: '8px',
    },
    preamble: {
      fontSize: '0.75rem',
      color: '#9ca3af',
      marginBottom: '40px',
      letterSpacing: '0.05em',
    },
    sectionHeading: {
      fontSize: '0.75rem',
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.25em',
      color: '#6b7280',
      marginTop: '40px',
      marginBottom: '16px',
    },
    entryTitle: {
      fontSize: '0.875rem',
      fontWeight: 400,
      marginTop: '16px',
    },
    detailList: {
      listStyleType: 'none',
      paddingLeft: '16px',
      marginTop: '4px',
    },
    entryDetail: {
      fontSize: '0.875rem',
      marginLeft: '16px',
      color: '#6b7280',
      fontWeight: 300,
    },
    extra: {
      fontSize: '0.875rem',
      color: '#9ca3af',
      marginTop: '4px',
      fontWeight: 300,
    },
  },
}
