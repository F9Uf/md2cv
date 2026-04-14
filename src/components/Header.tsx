import type { TemplateName } from '../lib/templateStyles'

interface HeaderProps {
  selectedTemplate: TemplateName
  onTemplateChange: (template: TemplateName) => void
}

export default function Header({ selectedTemplate, onTemplateChange }: HeaderProps) {
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
        {/* Placeholder: export button (Phase 3) */}
        <div className="h-8 w-20 rounded bg-gray-700" aria-label="Export button placeholder" />
      </div>
    </header>
  )
}
