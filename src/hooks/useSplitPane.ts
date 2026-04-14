import { useState, useCallback, useRef, useEffect } from 'react'

const STORAGE_KEY = 'md2cv-split-ratio'
const DEFAULT_RATIO = 0.5   // per D-07: 50/50 default
const MIN_RATIO = 0.2       // per D-08: 20% minimum each side
const MAX_RATIO = 0.8       // per D-08: 80% maximum (inverse of 20% min)

function loadRatio(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored !== null) {
      const val = parseFloat(stored)
      if (!isNaN(val) && val >= MIN_RATIO && val <= MAX_RATIO) return val
    }
  } catch { /* localStorage unavailable */ }
  return DEFAULT_RATIO
}

export function useSplitPane() {
  const [ratio, setRatio] = useState(loadRatio)
  const isDragging = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Persist ratio to localStorage on change (per D-09)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, ratio.toString())
    } catch { /* localStorage unavailable */ }
  }, [ratio])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const newRatio = (e.clientX - rect.left) / rect.width
      setRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, newRatio)))
    }

    const onMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }, [])

  return { ratio, containerRef, onMouseDown }
}
