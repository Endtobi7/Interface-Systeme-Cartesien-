import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import CoordBar from '../components/CoordBar'
import CalibrationButton from '../components/CalibrationButton'
import PreviewCanvas from '../components/PreviewCanvas'
import { useGrbl } from '../context/GrblContext'
import { shapeToGcode } from '../lib/grbl'

const shapes = [
  { id: 'carre', label: 'Carré', icon: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8"><rect x="5" y="5" width="30" height="30" rx="1" /></svg>) },
  { id: 'cercle', label: 'Cercle', icon: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8"><circle cx="20" cy="20" r="15" /></svg>) },
  { id: 'triangle', label: 'Triangle', icon: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8"><polygon points="20,4 36,36 4,36" /></svg>) },
  { id: 'ligne', label: 'Ligne', icon: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-8 h-8"><line x1="4" y1="36" x2="36" y2="4" /></svg>) },
  { id: 'etoile', label: 'Étoile', icon: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8"><polygon points="20,3 24,14 36,14 26,21 30,33 20,26 10,33 14,21 4,14 16,14" /></svg>) },
  { id: 'spiral', label: 'Spirale', icon: (<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2" className="w-8 h-8"><path d="M20 20 Q26 14 32 20 Q38 28 20 34 Q4 38 4 20 Q4 6 20 6 Q34 6 34 20" /></svg>) },
]

const shapeParams = {
  carre: [
    { key: 'width', label: 'Largeur', min: 5, max: 300, unit: 'mm' },
    { key: 'height', label: 'Hauteur', min: 5, max: 300, unit: 'mm' },
  ],
  cercle: [{ key: 'radius', label: 'Rayon', min: 5, max: 150, unit: 'mm' }],
  triangle: [
    { key: 'base', label: 'Base', min: 5, max: 300, unit: 'mm' },
    { key: 'height', label: 'Hauteur', min: 5, max: 300, unit: 'mm' },
  ],
  ligne: [
    { key: 'length', label: 'Longueur', min: 5, max: 300, unit: 'mm' },
    { key: 'angle', label: 'Angle', min: 0, max: 360, unit: '°' },
  ],
  etoile: [
    { key: 'points', label: 'Pointes', min: 3, max: 16, unit: '' },
    { key: 'outer', label: 'Rayon externe', min: 10, max: 150, unit: 'mm' },
    { key: 'inner', label: 'Rayon interne', min: 5, max: 140, unit: 'mm' },
  ],
  spiral: [
    { key: 'turns', label: 'Tours', min: 1, max: 16, unit: '' },
    { key: 'spacing', label: 'Espacement', min: 2, max: 40, unit: 'mm' },
  ],
}

// Extract XY points from generated gcode for PreviewCanvas
function gcodeToPoints(lines) {
  const pts = []
  let cx = 0; let cy = 0
  for (const line of lines) {
    const upper = line.toUpperCase()
    if (!upper.startsWith('G0') && !upper.startsWith('G1')) continue
    const xm = upper.match(/X([-\d.]+)/)
    const ym = upper.match(/Y([-\d.]+)/)
    if (xm) cx = parseFloat(xm[1])
    if (ym) cy = parseFloat(ym[1])
    if (xm || ym) pts.push({ x: cx, y: cy })
  }
  return pts
}

export default function FormesPredefinies() {
  const [selected, setSelected] = useState(null)
  const [size, setSize] = useState(50)
  const [repeat, setRepeat] = useState(1)
  const [position, setPosition] = useState(null)   // { x, y } in mm, null = auto-centre
  const [rotation, setRotation] = useState(0)
  const [geometry, setGeometry] = useState({
    carre: { width: 80, height: 80 },
    cercle: { radius: 60 },
    triangle: { base: 100, height: 80 },
    ligne: { length: 140, angle: 45 },
    etoile: { points: 5, outer: 60, inner: 30 },
    spiral: { turns: 3, spacing: 12 },
  })

  const {
    connected, alarm, unlock,
    coords: machineCoords,
    senderState, lastError,
    startStream, pauseStream, resumeStream, stopStream, emergencyStop,
    workspace,
  } = useGrbl()

  const currentParams = selected ? shapeParams[selected] : []
  const currentGeometry = useMemo(() => (selected ? geometry[selected] : {}), [geometry, selected])

  function updateParam(key, value) {
    if (!selected) return
    setGeometry((prev) => ({ ...prev, [selected]: { ...prev[selected], [key]: value } }))
  }

  const defaultCenter = useMemo(() => (
    workspace.referenceFrame === 'center'
      ? { x: 0, y: 0 }
      : { x: workspace.width / 2, y: workspace.height / 2 }
  ), [workspace])

  const center = position ?? defaultCenter

  const gcode = useMemo(() => {
    if (!selected) return []
    return shapeToGcode(selected, currentGeometry, {
      feed: Math.min(workspace.maxFeed || 2000, Math.max(300, size * 10)),
      penUpZ: workspace.penUpZ ?? 5,
      penDownZ: workspace.penDownZ ?? 0,
      repeat,
      rotation,
      center,
    })
  }, [selected, currentGeometry, size, repeat, rotation, center, workspace])

  // Extract planned path points for preview canvas
  const plannedPoints = useMemo(() => gcodeToPoints(gcode), [gcode])

  const progress = senderState.total ? Math.round((senderState.acked / senderState.total) * 100) : 0
  const isRunning = senderState.running

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PageHeader title="Formes prédéfinies:" accentColor="#60a5fa" />

      {alarm ? (
        <div className="mx-8 md:mx-10 mt-3 flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          <span>⚠ {alarm} — La machine est verrouillée.</span>
          <button onClick={unlock} className="ml-4 px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700">
            Déverrouiller ($X)
          </button>
        </div>
      ) : null}

      <div className="flex-1 flex flex-col md:flex-row gap-6 px-8 md:px-10 py-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full md:w-80 flex flex-col gap-6 md:min-h-[520px]"
        >
          <div>
            <p className="text-sm text-gray-400 mb-3">Choisir une forme :</p>
            <div className="grid grid-cols-3 gap-2">
              {shapes.map((s, i) => (
                <motion.button
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelected(s.id)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                    selected === s.id
                      ? 'border-blue-400 bg-blue-50 text-blue-600'
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  {s.icon}
                  <span className="text-xs font-medium">{s.label}</span>
                </motion.button>
              ))}
            </div>
          </div>

          {selected && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">Taille (mm):</p>
                <div className="flex items-center gap-3">
                  <input type="range" min="10" max="200" value={size} onChange={(e) => setSize(+e.target.value)} className="flex-1" />
                  <span className="text-sm font-semibold text-gray-700 w-12 text-right">{size} mm</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Répétitions:</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setRepeat((r) => Math.max(1, r - 1))} className="w-8 h-8 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-bold">−</button>
                  <span className="text-sm font-semibold w-8 text-center">{repeat}</span>
                  <button onClick={() => setRepeat((r) => Math.min(10, r + 1))} className="w-8 h-8 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-bold">+</button>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-400 mb-2">Position du centre (mm) :</p>
                <div className="flex flex-col gap-3">
                  {[
                    { key: 'x', label: 'Position X' },
                    { key: 'y', label: 'Position Y' },
                  ].map(({ key, label }) => {
                    const isCenterFrame = workspace.referenceFrame === 'center'
                    const span = key === 'x' ? workspace.width : workspace.height
                    const min = isCenterFrame ? -Math.round(span / 2) : 0
                    const max = isCenterFrame ? Math.round(span / 2) : span
                    const val = Math.round(center[key])
                    return (
                      <div key={key} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{label}</span>
                          <span className="font-semibold text-gray-700">{val} mm</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="range" min={min} max={max}
                            value={val}
                            onChange={(e) => setPosition({ ...center, [key]: Number(e.target.value) })}
                            className="flex-1"
                          />
                          <input
                            type="number" min={min} max={max}
                            value={val}
                            onChange={(e) => setPosition({ ...center, [key]: Number(e.target.value) })}
                            className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600"
                          />
                        </div>
                      </div>
                    )
                  })}
                  <button
                    onClick={() => setPosition(null)}
                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors text-left"
                  >
                    Recentrer
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                  <span>Rotation :</span>
                  <span className="font-semibold text-gray-700">{rotation}°</span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range" min="0" max="360" value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="flex-1"
                  />
                  <input
                    type="number" min="0" max="360" value={rotation}
                    onChange={(e) => setRotation(Number(e.target.value))}
                    className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600"
                  />
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2">Paramètres géométriques :</p>
                <div className="flex flex-col gap-3">
                  {currentParams.map((param) => (
                    <div key={param.key} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{param.label}</span>
                        <span className="font-semibold text-gray-700">{currentGeometry[param.key]}{param.unit ? ` ${param.unit}` : ''}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <input
                          type="range" min={param.min} max={param.max}
                          value={currentGeometry[param.key]}
                          onChange={(e) => updateParam(param.key, Number(e.target.value))}
                          className="flex-1"
                        />
                        <input
                          type="number" min={param.min} max={param.max}
                          value={currentGeometry[param.key]}
                          onChange={(e) => updateParam(param.key, Number(e.target.value))}
                          className="w-20 rounded-lg border border-gray-200 px-2 py-1 text-xs text-gray-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => startStream(gcode, 'predefined-shape')}
                disabled={!connected || !gcode.length}
                className="flex items-center justify-center gap-2 bg-white/40 border border-white/70 text-gray-800 px-5 py-3 rounded-xl text-sm font-semibold backdrop-blur-md shadow-lg disabled:opacity-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
                </svg>
                {connected ? 'Commencer' : 'Non connecté'}
              </motion.button>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button onClick={senderState.paused ? resumeStream : pauseStream} disabled={!connected || !senderState.running} className="border border-gray-200 rounded-lg py-2 hover:bg-gray-50 disabled:opacity-50">
                  {senderState.paused ? 'Resume' : 'Pause'}
                </button>
                <button onClick={stopStream} disabled={!connected} className="border border-gray-200 rounded-lg py-2 hover:bg-gray-50 disabled:opacity-50">Stop</button>
                <button onClick={emergencyStop} disabled={!connected} className="col-span-2 border border-red-200 text-red-600 rounded-lg py-2 hover:bg-red-50 disabled:opacity-50">Arrêt urgence</button>
              </div>
              {lastError ? <div className="text-xs text-red-600">{lastError}</div> : null}
              <div className="text-xs text-gray-500">Progression: {senderState.acked}/{senderState.total} ({progress}%)</div>
            </motion.div>
          )}

          <div className="mt-auto pt-4">
            <CalibrationButton />
          </div>
        </motion.div>

        {/* Right panel — preview canvas (replaces the static icon preview) */}
        <div className="flex-1 flex flex-col gap-4 md:min-h-[520px]">
          <PreviewCanvas
            plannedPoints={plannedPoints}
            machinePos={machineCoords}
            ackedCount={senderState.acked}
            totalCount={senderState.total}
            isRunning={isRunning}
            workspace={workspace}
            className="flex-1"
          />
          <CoordBar returnTo="/" className="mt-auto pt-4" />
        </div>
      </div>
    </div>
  )
}
