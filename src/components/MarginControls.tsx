import { useState, useEffect } from 'react'
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
  const [inputValues, setInputValues] = useState<Record<keyof MarginValues, string>>({
    top: String(margins.top),
    right: String(margins.right),
    bottom: String(margins.bottom),
    left: String(margins.left),
  })

  // Sync local display state when external margins change (e.g. after reset)
  useEffect(() => {
    setInputValues({
      top: String(margins.top),
      right: String(margins.right),
      bottom: String(margins.bottom),
      left: String(margins.left),
    })
  }, [margins])

  const handleChange = (side: keyof MarginValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValues(prev => ({ ...prev, [side]: e.target.value }))
  }

  const handleBlur = (side: keyof MarginValues) => () => {
    const raw = inputValues[side]
    const parsed = Number(raw)
    if (raw === '' || isNaN(parsed)) {
      // Reset display to the current committed value
      setInputValues(prev => ({ ...prev, [side]: String(margins[side]) }))
      return
    }
    const clamped = Math.min(50, Math.max(0, parsed))
    onMarginsChange(side, clamped)
  }

  const handleReset = () => {
    ;(['top', 'right', 'bottom', 'left'] as const).forEach(side =>
      onMarginsChange(side, DEFAULT_MARGINS[side])
    )
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
              value={inputValues[key]}
              onChange={handleChange(key)}
              onBlur={handleBlur(key)}
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
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
