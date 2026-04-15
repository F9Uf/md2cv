import type { TemplateName } from '../lib/templateStyles'

interface HeaderProps {
  selectedTemplate: TemplateName
  onTemplateChange: (template: TemplateName) => void
  onDownloadMd: () => void
  onExportPdf: () => void
  onImportMd: () => void
}

export default function Header({ selectedTemplate, onTemplateChange, onDownloadMd, onExportPdf, onImportMd }: HeaderProps) {
  return (
    <header className="h-12 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0">
      <h1 className="text-lg font-bold tracking-tight">md2cv</h1>
      <div className="flex items-center gap-2">
        {/* Template switcher dropdown */}
        <select
          value={selectedTemplate}
          onChange={(e) => onTemplateChange(e.target.value as TemplateName)}
          className="h-8 px-2 rounded bg-gray-700 text-white text-sm border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
          aria-label="Select resume template"
        >
          <option value="classic">Classic</option>
          <option value="modern">Modern</option>
          <option value="minimal">Minimal</option>
        </select>
        <button
          onClick={onImportMd}
          className="h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"
          aria-label="Import markdown file"
        >
          Import MD
        </button>
        <button
          onClick={onDownloadMd}
          className="h-8 px-3 rounded bg-gray-700 text-white text-sm border border-gray-600 hover:bg-gray-600 transition-colors"
          aria-label="Download markdown file"
        >
          Download MD
        </button>
        <button
          onClick={onExportPdf}
          className="h-8 px-3 rounded bg-blue-600 text-white text-sm border border-blue-500 hover:bg-blue-500 transition-colors"
          aria-label="Export resume as PDF"
        >
          Export PDF
        </button>
      </div>
    </header>
  )
}
