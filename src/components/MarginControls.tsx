export interface MarginValues {
  top: number
  right: number
  bottom: number
  left: number
}

interface MarginControlsProps {
  margins: MarginValues
  onMarginsChange: (side: keyof MarginValues, value: number) => void
}

export default function MarginControls({ margins, onMarginsChange }: MarginControlsProps) {
  const handleChange = (side: keyof MarginValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const parsed = Number(e.target.value)
    if (!e.target.value || isNaN(parsed)) return
    const clamped = Math.min(50, Math.max(0, parsed))
    onMarginsChange(side, clamped)
  }

  const handleReset = () => {
    ;(['top', 'right', 'bottom', 'left'] as const).forEach(side => onMarginsChange(side, 15))
  }

  const sides: { key: keyof MarginValues; label: string }[] = [
    { key: 'top', label: 'Top' },
    { key: 'bottom', label: 'Bottom' },
    { key: 'left', label: 'Left' },
    { key: 'right', label: 'Right' },
  ]

  return (
    <div className="h-9 bg-gray-900 border-b border-gray-700 flex items-center px-4 shrink-0">
      <div role="group" aria-label="Page margins" className="flex items-center gap-2">
        {sides.map(({ key, label }) => (
          <label key={key} className="flex flex-col items-center gap-1 cursor-pointer">
            <span className="text-xs font-medium text-gray-300 leading-tight">{label}</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="50"
                step="1"
                value={margins[key]}
                onChange={handleChange(key)}
                className="h-7 w-14 px-2 rounded bg-gray-700 text-white text-[13px] border border-gray-600 focus:outline-none focus:ring-1 focus:ring-blue-400 text-center"
                aria-label={`${label} margin in millimetres`}
              />
              <span className="text-xs text-gray-400 leading-tight">mm</span>
            </div>
          </label>
        ))}
      </div>
      <button
        onClick={handleReset}
        className="h-7 px-2 rounded bg-gray-700 text-white text-xs font-medium border border-gray-600 hover:bg-gray-600 transition-colors ml-auto"
        aria-label="Reset margins to default (15mm)"
      >
        Reset
      </button>
    </div>
  )
}
