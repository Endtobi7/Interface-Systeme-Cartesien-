export const DEFAULT_BAUD_RATES = [115200, 57600, 38400, 19200, 9600]

export const GRBL_PARAMETERS = [
  { id: '0', name: 'Step pulse (µs)', defaultValue: '10', description: 'Largeur de l’impulsion step.' },
  { id: '1', name: 'Step idle delay (ms)', defaultValue: '25', description: 'Délai avant désactivation moteurs.' },
  { id: '2', name: 'Step port invert mask', defaultValue: '0', description: 'Inversion des signaux step.' },
  { id: '3', name: 'Direction port invert mask', defaultValue: '0', description: 'Inversion des directions axes.' },
  { id: '4', name: 'Step enable invert', defaultValue: '0', description: 'Inverse enable drivers.' },
  { id: '5', name: 'Limit pins invert', defaultValue: '0', description: 'Inverse l’état des fins de course.' },
  { id: '6', name: 'Probe pin invert', defaultValue: '0', description: 'Inverse l’entrée de palpeur.' },
  { id: '10', name: 'Status report mask', defaultValue: '1', description: 'Champs renvoyés par ?.' },
  { id: '11', name: 'Junction deviation', defaultValue: '0.010', description: 'Lissage des jonctions.' },
  { id: '12', name: 'Arc tolerance', defaultValue: '0.002', description: 'Tolérance interpolation arcs.' },
  { id: '13', name: 'Report inches', defaultValue: '0', description: 'Rapports en pouces.' },
  { id: '20', name: 'Soft limits', defaultValue: '0', description: 'Activation limites logicielles.' },
  { id: '21', name: 'Hard limits', defaultValue: '0', description: 'Activation fins de course matérielles.' },
  { id: '22', name: 'Homing cycle', defaultValue: '1', description: 'Active homing $H.' },
  { id: '23', name: 'Homing dir invert mask', defaultValue: '0', description: 'Sens homing par axe.' },
  { id: '24', name: 'Homing feed (mm/min)', defaultValue: '25.000', description: 'Vitesse fine homing.' },
  { id: '25', name: 'Homing seek (mm/min)', defaultValue: '500.000', description: 'Vitesse rapide homing.' },
  { id: '26', name: 'Homing debounce (ms)', defaultValue: '250', description: 'Anti-rebond switch.' },
  { id: '27', name: 'Homing pull-off (mm)', defaultValue: '1.000', description: 'Retrait post-homing.' },
  { id: '30', name: 'Max spindle speed', defaultValue: '1000', description: 'Valeur max spindle/PWM.' },
  { id: '31', name: 'Min spindle speed', defaultValue: '0', description: 'Valeur min spindle/PWM.' },
  { id: '32', name: 'Laser mode', defaultValue: '0', description: 'Mode laser continu.' },
  { id: '100', name: 'X steps/mm', defaultValue: '250.000', description: 'Calibration axe X.' },
  { id: '101', name: 'Y steps/mm', defaultValue: '250.000', description: 'Calibration axe Y.' },
  { id: '102', name: 'Z steps/mm', defaultValue: '250.000', description: 'Calibration axe Z/servo.' },
  { id: '110', name: 'X max rate (mm/min)', defaultValue: '500.000', description: 'Vitesse max X.' },
  { id: '111', name: 'Y max rate (mm/min)', defaultValue: '500.000', description: 'Vitesse max Y.' },
  { id: '112', name: 'Z max rate (mm/min)', defaultValue: '300.000', description: 'Vitesse max Z.' },
  { id: '120', name: 'X accel (mm/s²)', defaultValue: '10.000', description: 'Accélération X.' },
  { id: '121', name: 'Y accel (mm/s²)', defaultValue: '10.000', description: 'Accélération Y.' },
  { id: '122', name: 'Z accel (mm/s²)', defaultValue: '10.000', description: 'Accélération Z.' },
  { id: '130', name: 'X max travel (mm)', defaultValue: '300.000', description: 'Course utile X.' },
  { id: '131', name: 'Y max travel (mm)', defaultValue: '300.000', description: 'Course utile Y.' },
  { id: '132', name: 'Z max travel (mm)', defaultValue: '45.000', description: 'Course utile Z.' },
]

export function parseStatusReport(line) {
  if (!line) return null
  const raw = String(line).trim()

  /* Accept a bracketed GRBL report (<...>) OR any line that carries a
     position field, so custom firmwares that drop the brackets still work. */
  const hasBracket = raw.startsWith('<')
  const hasPos = /[MW]Pos\s*:/i.test(raw)
  if (!hasBracket && !hasPos) return null

  let content = raw
  if (content.startsWith('<')) content = content.slice(1)
  if (content.endsWith('>')) content = content.slice(0, -1)

  /* Machine state = leading word, but never mistake a position key for it. */
  let machineState = ''
  const stateMatch = content.match(/^\s*([A-Za-z]+)(?=[\s|,:]|$)/)
  if (stateMatch && !/^(MPos|WPos|WCO)$/i.test(stateMatch[1])) {
    machineState = stateMatch[1]
  }

  /* Pull MPos / WPos / WCO regardless of the | or , delimiter, 2 or 3 axes. */
  const grab = (key) => {
    const re = new RegExp(
      `${key}\\s*:\\s*(-?\\d*\\.?\\d+)\\s*,\\s*(-?\\d*\\.?\\d+)(?:\\s*,\\s*(-?\\d*\\.?\\d+))?`,
      'i',
    )
    const m = content.match(re)
    if (!m) return null
    return {
      x: parseFloat(m[1]),
      y: parseFloat(m[2]),
      z: m[3] !== undefined ? parseFloat(m[3]) : 0,
    }
  }

  const out = {
    machineState,
    mpos: grab('MPos'),
    wpos: grab('WPos'),
    wco: grab('WCO'),
    limits: '',
    feedSpindle: '',
  }

  const pn = content.match(/Pn\s*:\s*([A-Za-z]+)/i)
  if (pn) out.limits = pn[1]
  const fs = content.match(/FS\s*:\s*([-\d.,]+)/i)
  if (fs) out.feedSpindle = fs[1]

  return out
}

export function sanitizeGcodeLine(raw) {
  if (!raw) return ''
  let line = String(raw).trim()
  if (!line) return ''
  line = line.split(';', 1)[0]
  line = line.replace(/\([^)]*\)/g, '').trim()
  if (!line || line === '%') return ''
  return line
}

export function parseFirmwareParameter(line) {
  const match = line.match(/^\$(\d+)=([-+]?\d*\.?\d+)$/)
  if (!match) return null
  return { id: match[1], value: match[2] }
}

export function toHBotBelts(x, y) {
  return { a: x + y, b: x - y }
}

export function fromHBotBelts(a, b) {
  return { x: (a + b) / 2, y: (a - b) / 2 }
}

export function shapeToGcode(shapeId, geometry, options = {}) {
  const {
    feed = 600,
    penUpZ = 5,
    penDownZ = 0,
    repeat = 1,
    center = { x: 0, y: 0 },
    rotation = 0,
  } = options

  const path = []
  const addPoint = (x, y) => path.push({ x, y })

  switch (shapeId) {
    case 'carre': {
      const w = geometry.width ?? 80
      const h = geometry.height ?? 80
      addPoint(center.x - w / 2, center.y - h / 2)
      addPoint(center.x + w / 2, center.y - h / 2)
      addPoint(center.x + w / 2, center.y + h / 2)
      addPoint(center.x - w / 2, center.y + h / 2)
      addPoint(center.x - w / 2, center.y - h / 2)
      break
    }
    case 'cercle': {
      const r = geometry.radius ?? 40
      const segments = 72
      for (let i = 0; i <= segments; i += 1) {
        const t = (Math.PI * 2 * i) / segments
        addPoint(center.x + r * Math.cos(t), center.y + r * Math.sin(t))
      }
      break
    }
    case 'triangle': {
      const b = geometry.base ?? 100
      const h = geometry.height ?? 80
      addPoint(center.x, center.y + h / 2)
      addPoint(center.x - b / 2, center.y - h / 2)
      addPoint(center.x + b / 2, center.y - h / 2)
      addPoint(center.x, center.y + h / 2)
      break
    }
    case 'ligne': {
      const len = geometry.length ?? 120
      const angle = ((geometry.angle ?? 45) * Math.PI) / 180
      const dx = (len / 2) * Math.cos(angle)
      const dy = (len / 2) * Math.sin(angle)
      addPoint(center.x - dx, center.y - dy)
      addPoint(center.x + dx, center.y + dy)
      break
    }
    case 'etoile': {
      const points = Math.max(3, Number(geometry.points ?? 5))
      const outer = Number(geometry.outer ?? ((geometry.inner ?? 30) * 1.8))
      const inner = Number(geometry.inner ?? 30)
      for (let i = 0; i <= points * 2; i += 1) {
        const radius = i % 2 === 0 ? outer : inner
        const angle = (-Math.PI / 2) + (Math.PI * i) / points
        addPoint(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle))
      }
      break
    }
    case 'spiral': {
      const turns = Number(geometry.turns ?? 3)
      const spacing = Number(geometry.spacing ?? 12)
      const segments = Math.max(40, Math.floor(turns * 120))
      for (let i = 0; i <= segments; i += 1) {
        const t = i / segments
        const angle = t * turns * Math.PI * 2
        const radius = t * turns * spacing
        addPoint(center.x + radius * Math.cos(angle), center.y + radius * Math.sin(angle))
      }
      break
    }
    default:
      return []
  }

  /* Apply rotation (degrees) around the shape centre */
  if (rotation) {
    const a = (rotation * Math.PI) / 180
    const cos = Math.cos(a)
    const sin = Math.sin(a)
    for (let i = 0; i < path.length; i += 1) {
      const dx = path[i].x - center.x
      const dy = path[i].y - center.y
      path[i] = {
        x: center.x + dx * cos - dy * sin,
        y: center.y + dx * sin + dy * cos,
      }
    }
  }

  const lines = ['G21', 'G90', `G0 Z${penUpZ}`]
  for (let r = 0; r < repeat; r += 1) {
    if (!path.length) continue
    lines.push(`G0 X${path[0].x.toFixed(3)} Y${path[0].y.toFixed(3)}`)
    lines.push(`G1 Z${penDownZ} F${feed}`)
    for (let i = 1; i < path.length; i += 1) {
      lines.push(`G1 X${path[i].x.toFixed(3)} Y${path[i].y.toFixed(3)} F${feed}`)
    }
    lines.push(`G0 Z${penUpZ}`)
  }
  return lines
}

export function svgToGcode(svgText, options = {}) {
  const {
    feed = 600,
    penUpZ = 5,
    penDownZ = 0,
    workspace = { width: 200, height: 200 },
    referenceFrame = 'bottom-left',
  } = options

  const parser = new DOMParser()
  const doc = parser.parseFromString(svgText, 'image/svg+xml')
  const svg = doc.querySelector('svg')
  if (!svg) return []

  const vb = (svg.getAttribute('viewBox') || '').trim().split(/\s+/).map(Number)
  const vbX = Number.isFinite(vb[0]) ? vb[0] : 0
  const vbY = Number.isFinite(vb[1]) ? vb[1] : 0
  const vbW = Number.isFinite(vb[2]) && vb[2] > 0 ? vb[2] : Number(svg.getAttribute('width')) || workspace.width
  const vbH = Number.isFinite(vb[3]) && vb[3] > 0 ? vb[3] : Number(svg.getAttribute('height')) || workspace.height

  const sx = workspace.width / vbW
  const sy = workspace.height / vbH
  const scale = Math.min(sx, sy)

  const toMachine = (x, y) => {
    const nx = (x - vbX) * scale
    const ny = (y - vbY) * scale
    if (referenceFrame === 'top-left') return { x: nx, y: ny }
    if (referenceFrame === 'center') return { x: nx - workspace.width / 2, y: workspace.height / 2 - ny }
    return { x: nx, y: workspace.height - ny }
  }

  const pathElements = [
    ...doc.querySelectorAll('path, polyline, polygon, line, rect, circle, ellipse'),
  ]

  const lines = ['G21', 'G90', `G0 Z${penUpZ}`]

  pathElements.forEach((el) => {
    const d = elementToPathData(el)
    if (!d) return

    const tmpPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    tmpPath.setAttribute('d', d)
    const total = tmpPath.getTotalLength?.()
    if (!total || !Number.isFinite(total)) return

    const sampleStep = Math.max(1.5, total / 120)
    const pts = []
    for (let l = 0; l <= total; l += sampleStep) {
      const pt = tmpPath.getPointAtLength(l)
      pts.push(toMachine(pt.x, pt.y))
    }
    if (!pts.length) return

    lines.push(`G0 X${pts[0].x.toFixed(3)} Y${pts[0].y.toFixed(3)}`)
    lines.push(`G1 Z${penDownZ} F${feed}`)
    for (let i = 1; i < pts.length; i += 1) {
      lines.push(`G1 X${pts[i].x.toFixed(3)} Y${pts[i].y.toFixed(3)} F${feed}`)
    }
    lines.push(`G0 Z${penUpZ}`)
  })

  return lines
}

function elementToPathData(el) {
  const tag = el.tagName.toLowerCase()
  if (tag === 'path') return el.getAttribute('d') || ''
  if (tag === 'polyline' || tag === 'polygon') {
    const points = (el.getAttribute('points') || '').trim()
    if (!points) return ''
    const closed = tag === 'polygon'
    return `M ${points}${closed ? ' Z' : ''}`
  }
  if (tag === 'line') {
    const x1 = Number(el.getAttribute('x1') || 0)
    const y1 = Number(el.getAttribute('y1') || 0)
    const x2 = Number(el.getAttribute('x2') || 0)
    const y2 = Number(el.getAttribute('y2') || 0)
    return `M ${x1} ${y1} L ${x2} ${y2}`
  }
  if (tag === 'rect') {
    const x = Number(el.getAttribute('x') || 0)
    const y = Number(el.getAttribute('y') || 0)
    const w = Number(el.getAttribute('width') || 0)
    const h = Number(el.getAttribute('height') || 0)
    return `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`
  }
  if (tag === 'circle') {
    const cx = Number(el.getAttribute('cx') || 0)
    const cy = Number(el.getAttribute('cy') || 0)
    const r = Number(el.getAttribute('r') || 0)
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy}`
  }
  if (tag === 'ellipse') {
    const cx = Number(el.getAttribute('cx') || 0)
    const cy = Number(el.getAttribute('cy') || 0)
    const rx = Number(el.getAttribute('rx') || 0)
    const ry = Number(el.getAttribute('ry') || 0)
    return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}`
  }
  return ''
}
