import { DEFAULT_MARGINS } from '../lib/constants'

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
    ;(['top', 'right', 'bottom', 'left'] as const).forEach(side => onMarginsChange(side, DEFAULT_MARGINS[side]))
  }

  const sides: { key: keyof MarginValues; label: string }[] = [
    { key: 'top', label: 'TOP' },
    { key: 'right', label: 'RIGHT' },
    { key: 'bottom', label: 'BOTTOM' },
    { key: 'left', label: 'LEFT' },
  ]

  return (
    <div className="bg-gray-700 border-b border-gray-600 px-4 py-2 shrink-0">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-teal-400 tracking-wide">Margin</span>
        <span className="text-xs text-gray-400">mm</span>
      </div>

      {/* Inputs row */}
      <div className="flex items-stretch" role="group" aria-label="Page margins">
        {sides.map(({ key, label }, i) => (
          <div key={key} className={`flex-1 flex flex-col ${i > 0 ? 'border-l border-gray-500' : ''}`}>
            <input
              type="number"
              min="0"
              max="50"
              step="1"
              value={margins[key]}
              onChange={handleChange(key)}
              className="w-full h-9 px-2 bg-gray-600 text-white text-sm text-center border-0 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-blue-400"
              aria-label={`${label} margin in millimetres`}
            />
            <span className="text-[10px] text-gray-400 text-center leading-tight py-0.5 tracking-widest">
              {label}
            </span>
          </div>
        ))}

        {/* Reset icon button */}
        <div className="border-l border-gray-500 flex items-center px-2">
          <button
            onClick={handleReset}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Reset margins to default (15mm)"
            title="Reset to 15mm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
