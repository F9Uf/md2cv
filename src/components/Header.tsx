export default function Header() {
  return (
    <header className="h-12 bg-gray-900 text-white flex items-center justify-between px-4 shrink-0">
      <h1 className="text-lg font-bold tracking-tight">md2cv</h1>
      <div className="flex items-center gap-2">
        {/* Placeholder: template switcher (Phase 2) */}
        <div className="h-8 w-24 rounded bg-gray-700" aria-label="Template switcher placeholder" />
        {/* Placeholder: export button (Phase 3) */}
        <div className="h-8 w-20 rounded bg-gray-700" aria-label="Export button placeholder" />
      </div>
    </header>
  )
}
