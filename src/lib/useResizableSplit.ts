import { useState, useRef } from 'react'

/** 自研可拖拽左右分栏：返回左栏百分比、容器 ref 与拖拽手柄的事件处理器 */
export function useResizableSplit(initial = 26, min = 16, max = 42) {
  const [leftPct, setLeftPct] = useState(initial)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    const onMove = (ev: MouseEvent) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      let pct = ((ev.clientX - rect.left) / rect.width) * 100
      pct = Math.max(min, Math.min(max, pct))
      setLeftPct(pct)
    }
    const onUp = () => {
      dragging.current = false
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  return { leftPct, containerRef, onMouseDown }
}
