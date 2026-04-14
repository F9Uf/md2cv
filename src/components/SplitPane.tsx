import { type ReactNode } from 'react'
import { useSplitPane } from '../hooks/useSplitPane'

interface SplitPaneProps {
  left: ReactNode
  right: ReactNode
}

export default function SplitPane({ left, right }: SplitPaneProps) {
  const { ratio, containerRef, onMouseDown } = useSplitPane()

  return (
    <div ref={containerRef} className="flex flex-1 min-h-0">
      {/* Left pane (editor) */}
      <div
        className="overflow-auto bg-white"
        style={{ width: `${ratio * 100}%` }}
      >
        {left}
      </div>

      {/* Draggable separator — visible handle for discoverability */}
      <div
        onMouseDown={onMouseDown}
        className="w-2 bg-gray-200 hover:bg-blue-400 active:bg-blue-500 cursor-col-resize flex items-center justify-center shrink-0 transition-colors"
        role="separator"
        aria-label="Drag to resize panes"
      >
        <div className="w-0.5 h-8 bg-gray-400 rounded-full" />
      </div>

      {/* Right pane (preview) */}
      <div
        className="overflow-auto bg-white"
        style={{ width: `${(1 - ratio) * 100}%` }}
      >
        {right}
      </div>
    </div>
  )
}
