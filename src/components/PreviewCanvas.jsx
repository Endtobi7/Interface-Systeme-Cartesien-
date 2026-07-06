/**
 * PreviewCanvas — shared canvas used on all mode pages.
 *
 * KEY BEHAVIOURS
 * ──────────────
 * • FIXED reference frame — the canvas always shows the full work area
 *   (workspace.width × workspace.height, e.g. 300 × 300 mm) at a constant
 *   1:1 mm scale.  The drawing is NOT auto-zoomed to fit, so a 50 mm square
 *   always looks the same size regardless of the rest of the path.  X and Y
 *   share the same scale so nothing is ever stretched.
 * • Before execution : full planned path drawn in light gray.
 * • During execution : executed portion drawn in blue, line by line as each
 *   ACK arrives.  Red dot tracks the real machine position from the COM port.
 * • Machine position dot updates every 250 ms from the GRBL ? poll —
 *   it reflects the coordinates shown in CoordBar exactly.
 */
import { useEffect, useRef, useMemo } from 'react'
import { motion } from 'framer-motion'

/* Canvas internal resolution — square so X/Y share one scale */
const CW = 700
const CH = 700
const PAD = 44   /* Padding in canvas pixels around the work area */

/**
 * Build a fixed transform for a work area of `w` × `h` mm.
 * The work area is centred in the canvas with equal margins.
 *
 *   canvasX = left + u * w * scale
 *   canvasY = top  + v * h * scale
 *
 * where (u, v) is the point's normalised position inside the work area
 * (0,0 = top-left of the area, 1,1 = bottom-right), computed from the
 * selected reference frame.
 */
function computeFixedTransform(w, h, referenceFrame) {
  const scale = Math.min((CW - 2 * PAD) / w, (CH - 2 * PAD) / h)
  const left = (CW - w * scale) / 2
  const top = (CH - h * scale) / 2

  const toCanvas = (p) => {
    let u
    let v
    if (referenceFrame === 'center') {
      u = (p.x + w / 2) / w
      v = 1 - (p.y + h / 2) / h
    } else if (referenceFrame === 'top-left') {
      u = p.x / w
      v = p.y / h
    } else {
      /* bottom-left (default) */
      u = p.x / w
      v = 1 - p.y / h
    }
    return { cx: left + u * w * scale, cy: top + v * h * scale }
  }

  return { scale, left, top, w, h, toCanvas }
}

function drawWorkArea(ctx, tf) {
  /* Filled work-area background */
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(tf.left, tf.top, tf.w * tf.scale, tf.h * tf.scale)

  /* Minor grid every 10 mm */
  ctx.strokeStyle = '#f3f4f6'
  ctx.lineWidth = 1
  for (let mm = 0; mm <= tf.w; mm += 10) {
    const x = tf.left + (mm / tf.w) * tf.w * tf.scale
    ctx.beginPath(); ctx.moveTo(x, tf.top); ctx.lineTo(x, tf.top + tf.h * tf.scale); ctx.stroke()
  }
  for (let mm = 0; mm <= tf.h; mm += 10) {
    const y = tf.top + (mm / tf.h) * tf.h * tf.scale
    ctx.beginPath(); ctx.moveTo(tf.left, y); ctx.lineTo(tf.left + tf.w * tf.scale, y); ctx.stroke()
  }

  /* Major grid every 50 mm */
  ctx.strokeStyle = '#e5e7eb'
  ctx.lineWidth = 1
  for (let mm = 0; mm <= tf.w; mm += 50) {
    const x = tf.left + (mm / tf.w) * tf.w * tf.scale
    ctx.beginPath(); ctx.moveTo(x, tf.top); ctx.lineTo(x, tf.top + tf.h * tf.scale); ctx.stroke()
  }
  for (let mm = 0; mm <= tf.h; mm += 50) {
    const y = tf.top + (mm / tf.h) * tf.h * tf.scale
    ctx.beginPath(); ctx.moveTo(tf.left, y); ctx.lineTo(tf.left + tf.w * tf.scale, y); ctx.stroke()
  }

  /* Work-area border */
  ctx.strokeStyle = '#d1d5db'
  ctx.lineWidth = 1.5
  ctx.strokeRect(tf.left, tf.top, tf.w * tf.scale, tf.h * tf.scale)

  /* Dimension labels */
  ctx.fillStyle = '#9ca3af'
  ctx.font = '12px system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText(`${tf.w} mm`, tf.left + (tf.w * tf.scale) / 2, tf.top + tf.h * tf.scale + 22)
  ctx.save()
  ctx.translate(tf.left - 18, tf.top + (tf.h * tf.scale) / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(`${tf.h} mm`, 0, 0)
  ctx.restore()
  ctx.textAlign = 'left'
}

export default function PreviewCanvas({
  plannedPoints = [],
  machinePos = { x: 0, y: 0 },
  ackedCount = 0,
  totalCount = 0,
  isRunning = false,
  workspace = { width: 300, height: 300, referenceFrame: 'bottom-left' },
  className = '',
}) {
  const canvasRef = useRef(null)

  const tf = useMemo(
    () => computeFixedTransform(
      workspace.width || 300,
      workspace.height || 300,
      workspace.referenceFrame || 'bottom-left',
    ),
    [workspace.width, workspace.height, workspace.referenceFrame],
  )

  /* How many planned points count as "done" */
  const doneCount = useMemo(() => {
    if (!totalCount || !plannedPoints.length) return 0
    return Math.floor((ackedCount / totalCount) * plannedPoints.length)
  }, [ackedCount, totalCount, plannedPoints.length])

  const machineDot = useMemo(
    () => tf.toCanvas({ x: machinePos.x, y: machinePos.y }),
    [machinePos.x, machinePos.y, tf],
  )

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, CW, CH)

    drawWorkArea(ctx, tf)

    /* Origin marker */
    const origin = tf.toCanvas({ x: 0, y: 0 })
    ctx.strokeStyle = '#9ca3af'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(origin.cx - 7, origin.cy); ctx.lineTo(origin.cx + 7, origin.cy); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(origin.cx, origin.cy - 7); ctx.lineTo(origin.cx, origin.cy + 7); ctx.stroke()
    ctx.fillStyle = '#9ca3af'
    ctx.font = '11px system-ui, sans-serif'
    ctx.fillText('O', origin.cx + 6, origin.cy + 14)

    if (!plannedPoints.length) {
      ctx.fillStyle = '#d1d5db'
      ctx.font = '16px system-ui, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Aperçu du tracé', CW / 2, PAD - 16 > 16 ? PAD - 16 : 22)
      ctx.textAlign = 'left'
    } else {
      const pts = plannedPoints.map((p) => ({ ...tf.toCanvas(p), move: !!p.move }))

      /* Stroke a polyline, breaking it wherever a point is flagged move:true
         (pen-up between discontinuous strokes). */
      const strokeBroken = (color, width, count) => {
        ctx.strokeStyle = color
        ctx.lineWidth = width
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.beginPath()
        let started = false
        for (let i = 0; i < count; i += 1) {
          const p = pts[i]
          if (!started || p.move) {
            ctx.moveTo(p.cx, p.cy)
            started = true
          } else {
            ctx.lineTo(p.cx, p.cy)
          }
        }
        ctx.stroke()
      }

      /* Full planned path — light gray preview */
      if (pts.length >= 2) strokeBroken('#cbd5e1', 1.5, pts.length)

      /* Executed portion — blue */
      if (doneCount >= 2) strokeBroken('#2563eb', 2, doneCount)
    }

    /* Machine position dot — red, from live COM coordinates */
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(
      Math.max(5, Math.min(CW - 5, machineDot.cx)),
      Math.max(5, Math.min(CH - 5, machineDot.cy)),
      5, 0, Math.PI * 2,
    )
    ctx.fill()

    if (isRunning) {
      ctx.strokeStyle = '#ef444488'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(
        Math.max(9, Math.min(CW - 9, machineDot.cx)),
        Math.max(9, Math.min(CH - 9, machineDot.cy)),
        9, 0, Math.PI * 2,
      )
      ctx.stroke()
    }
  }, [plannedPoints, doneCount, machineDot, isRunning, tf])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`relative bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden ${className}`}
      style={{ minHeight: '320px' }}
    >
      <canvas
        ref={canvasRef}
        width={CW}
        height={CH}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </motion.div>
  )
}
