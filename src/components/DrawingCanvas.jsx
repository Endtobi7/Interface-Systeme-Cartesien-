import { useRef, useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'

/* Fixed square drawing surface representing the full work area.
   Exported so the page can map canvas pixels → machine mm consistently. */
export const DRAW_SIZE = 600

export default function DrawingCanvas({
  label = 'Plan de dessin',
  allowDraw = false,
  className = '',
  machinePosition = { x: 0, y: 0 },
  workspace = { width: 300, height: 300, referenceFrame: 'bottom-left' },
  onPathChange,
  clearTrigger = 0,
  undoTrigger = 0,
}) {
  const canvasRef = useRef(null)
  const drawingRef = useRef(false)
  /* strokes: array of strokes; each stroke is an array of {x,y} canvas points.
     A new stroke is started on every pen-down, so the drawing can be made of
     several disconnected free-hand strokes (pen lifts between them). */
  const [strokes, setStrokes] = useState([])

  // Clear everything when parent increments clearTrigger
  useEffect(() => {
    setStrokes([])
  }, [clearTrigger])

  // Remove the last stroke when parent increments undoTrigger
  const firstUndo = useRef(true)
  useEffect(() => {
    if (firstUndo.current) { firstUndo.current = false; return }
    setStrokes((prev) => prev.slice(0, -1))
  }, [undoTrigger])

  // Get canvas-space position from mouse or touch event
  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const x = (clientX - rect.left) * (canvas.width / rect.width)
    const y = (clientY - rect.top) * (canvas.height / rect.height)
    return { x: Math.max(0, Math.min(canvas.width, x)), y: Math.max(0, Math.min(canvas.height, y)) }
  }

  // Machine dot in canvas pixels — uses the same fixed mapping as the work area
  const machinePreview = useMemo(() => {
    const w = workspace.width || 300
    const h = workspace.height || 300
    const frame = workspace.referenceFrame || 'bottom-left'
    let u
    let v
    if (frame === 'center') {
      u = (machinePosition.x + w / 2) / w
      v = 1 - (machinePosition.y + h / 2) / h
    } else if (frame === 'top-left') {
      u = machinePosition.x / w
      v = machinePosition.y / h
    } else {
      u = machinePosition.x / w
      v = 1 - machinePosition.y / h
    }
    return {
      x: Math.max(0, Math.min(DRAW_SIZE, u * DRAW_SIZE)),
      y: Math.max(0, Math.min(DRAW_SIZE, v * DRAW_SIZE)),
    }
  }, [machinePosition.x, machinePosition.y, workspace.width, workspace.height, workspace.referenceFrame])

  function drawAll(ctx, strokesArg) {
    ctx.clearRect(0, 0, DRAW_SIZE, DRAW_SIZE)
    const w = workspace.width || 300
    const h = workspace.height || 300

    // Background
    ctx.fillStyle = '#fafafa'
    ctx.fillRect(0, 0, DRAW_SIZE, DRAW_SIZE)

    // Minor grid every 10 mm
    ctx.strokeStyle = '#f3f4f6'
    ctx.lineWidth = 1
    for (let mm = 0; mm <= w; mm += 10) {
      const x = (mm / w) * DRAW_SIZE
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, DRAW_SIZE); ctx.stroke()
    }
    for (let mm = 0; mm <= h; mm += 10) {
      const y = (mm / h) * DRAW_SIZE
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(DRAW_SIZE, y); ctx.stroke()
    }
    // Major grid every 50 mm
    ctx.strokeStyle = '#e5e7eb'
    for (let mm = 0; mm <= w; mm += 50) {
      const x = (mm / w) * DRAW_SIZE
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, DRAW_SIZE); ctx.stroke()
    }
    for (let mm = 0; mm <= h; mm += 50) {
      const y = (mm / h) * DRAW_SIZE
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(DRAW_SIZE, y); ctx.stroke()
    }
    // Border
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1.5
    ctx.strokeRect(0.5, 0.5, DRAW_SIZE - 1, DRAW_SIZE - 1)

    // Drawn strokes — each one is independent (discontinuous drawing)
    ctx.strokeStyle = '#2563eb'
    ctx.fillStyle = '#2563eb'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    for (const stroke of strokesArg) {
      if (stroke.length === 1) {
        // a single tap — draw a small dot so it is visible
        ctx.beginPath()
        ctx.arc(stroke[0].x, stroke[0].y, 1.6, 0, Math.PI * 2)
        ctx.fill()
      } else if (stroke.length >= 2) {
        ctx.beginPath()
        ctx.moveTo(stroke[0].x, stroke[0].y)
        for (let i = 1; i < stroke.length; i++) ctx.lineTo(stroke[i].x, stroke[i].y)
        ctx.stroke()
      }
    }

    // Machine position dot
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(machinePreview.x, machinePreview.y, 5, 0, Math.PI * 2)
    ctx.fill()

    // Dimension labels
    ctx.fillStyle = '#9ca3af'
    ctx.font = '13px system-ui, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${w} mm`, DRAW_SIZE / 2, DRAW_SIZE - 8)
    ctx.textAlign = 'left'
  }

  useEffect(() => {
    if (!allowDraw) return
    const canvas = canvasRef.current
    if (!canvas) return
    drawAll(canvas.getContext('2d'), strokes)
  }, [strokes, allowDraw, machinePreview, workspace.width, workspace.height])

  useEffect(() => {
    onPathChange?.(strokes)
  }, [onPathChange, strokes])

  function onStart(e) {
    if (!allowDraw) return
    const pos = getPos(e, canvasRef.current)
    drawingRef.current = true
    // begin a NEW stroke (keeps previous strokes → discontinuous drawing)
    setStrokes((prev) => [...prev, [pos]])
  }

  function onMove(e) {
    if (!drawingRef.current || !allowDraw) return
    e.preventDefault()
    const pos = getPos(e, canvasRef.current)
    setStrokes((prev) => {
      if (!prev.length) return [[pos]]
      const copy = prev.slice()
      copy[copy.length - 1] = [...copy[copy.length - 1], pos]
      return copy
    })
  }

  function onEnd() { drawingRef.current = false }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`relative bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex items-center justify-center ${className}`}
      style={{ minHeight: '320px' }}
    >
      {allowDraw ? (
        <canvas
          ref={canvasRef}
          width={DRAW_SIZE}
          height={DRAW_SIZE}
          className="touch-none cursor-crosshair"
          style={{ display: 'block', width: 'auto', height: '100%', maxWidth: '100%', aspectRatio: '1 / 1' }}
          onMouseDown={onStart}
          onMouseMove={onMove}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
          onTouchStart={onStart}
          onTouchMove={onMove}
          onTouchEnd={onEnd}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-gray-400 text-sm font-medium">{label}</span>
        </div>
      )}
    </motion.div>
  )
}
