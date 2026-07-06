/**
 * ModeImport
 *
 * File parsing mirrors gcode_sender.py clean_gcode_line():
 *   • Strip everything after ';'
 *   • Remove all (...) parenthesis comments
 *   • Skip blank lines and '%' markers
 *   • Skip unsupported commands: M6, M06, M7, M8, M9 (configurable)
 *   • Parse XY coordinates for the preview canvas
 *
 * Coordinates shown in CoordBar update live from the GRBL ? poll
 * (every 250 ms via GrblContext) — no extra work needed here.
 */
import { useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '../components/PageHeader'
import CoordBar from '../components/CoordBar'
import CalibrationButton from '../components/CalibrationButton'
import PreviewCanvas from '../components/PreviewCanvas'
import { useGrbl } from '../context/GrblContext'

/* Commands to silently skip — mirrors gcode_sender.py --skip-unsupported */
const SKIP_COMMANDS = new Set(['M6', 'M06', 'M7', 'M07', 'M8', 'M08', 'M9', 'M09'])

/**
 * cleanGcodeLine — mirrors gcode_sender.py clean_gcode_line()
 * Returns '' for blank / comment-only / skipped lines.
 */
function cleanGcodeLine(raw) {
  if (!raw) return ''
  let line = String(raw).trim()
  if (!line) return ''

  /* Strip ; comments */
  const semiIdx = line.indexOf(';')
  if (semiIdx !== -1) line = line.substring(0, semiIdx)

  /* Strip (...) parenthesis comments — all occurrences */
  line = line.replace(/\([^)]*\)/g, '')

  /* Strip trailing ( without closing ) */
  const openIdx = line.indexOf('(')
  if (openIdx !== -1) line = line.substring(0, openIdx)

  line = line.trim()
  if (!line || line === '%') return ''

  /* Skip unsupported commands */
  const firstToken = line.split(/\s+/)[0].toUpperCase()
  if (SKIP_COMMANDS.has(firstToken)) return ''

  return line
}

/**
 * gcodeToPoints — extract XY waypoints for the preview canvas.
 * Tracks current position across G0/G1 moves (absolute mode assumed).
 */
function gcodeToPoints(lines) {
  const pts = []
  let cx = 0
  let cy = 0
  for (const line of lines) {
    const up = line.toUpperCase()
    /* Only care about G0/G1 moves */
    if (!/^G0[01]?(\s|$)/.test(up) && !/^G1(\s|$)/.test(up)) continue
    const xm = up.match(/X([-\d.]+)/)
    const ym = up.match(/Y([-\d.]+)/)
    if (xm) cx = parseFloat(xm[1])
    if (ym) cy = parseFloat(ym[1])
    if (xm || ym) pts.push({ x: cx, y: cy })
  }
  return pts
}

export default function ModeImport() {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [previewName, setPreviewName] = useState('')
  const [lineCount, setLineCount] = useState(0)
  const [parseError, setParseError] = useState('')
  const [parsedLines, setParsedLines] = useState([])
  const inputRef = useRef()

  const {
    connected,
    alarm,
    unlock,
    coords: machineCoords,
    senderState,
    lastError,
    workspace,
    startStream,
    pauseStream,
    resumeStream,
    stopStream,
    emergencyStop,
  } = useGrbl()

  function readText(f) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result || ''))
      reader.onerror = () => reject(new Error('Lecture échouée'))
      reader.readAsText(f)
    })
  }

  async function handleFile(f) {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['gcode', 'nc', 'txt', 'jcc', 'ngc'].includes(ext)) {
      setParseError('Seuls les fichiers G-code (.gcode .nc .jcc .ngc .txt) sont acceptés.')
      return
    }
    setParseError('')
    setFile(f)
    setPreviewName(f.name)
    try {
      const text = await readText(f)
      /* Use same logic as gcode_sender.py stream_gcode() */
      const lines = text.split(/\r?\n/).map(cleanGcodeLine).filter(Boolean)
      setParsedLines(lines)
      setLineCount(lines.length)
      if (!lines.length) {
        setParseError('Aucune ligne G-code valide trouvée. Vérifiez le fichier.')
      }
    } catch {
      setParseError('Impossible de lire le fichier.')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragOver(false)
    handleFile(e.dataTransfer.files[0])
  }

  function startUpload() {
    if (!file || !connected || !parsedLines.length) return
    /* Mirror gcode_sender.py stream_gcode(): stream pre-parsed clean lines */
    startStream(parsedLines, previewName || 'gcode-import')
  }

  function cancel() {
    setFile(null)
    setPreviewName('')
    setLineCount(0)
    setParseError('')
    setParsedLines([])
    stopStream()
  }

  /* Preview path — built from cleaned lines, same as what will be sent */
  const plannedPoints = useMemo(() => gcodeToPoints(parsedLines), [parsedLines])

  const progress = useMemo(() =>
    senderState.total ? Math.round((senderState.acked / senderState.total) * 100) : 0
  , [senderState])

  const isRunning = senderState.running

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <PageHeader title="Mode Import :" accentColor="#facc15" />

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
            <p className="text-sm text-gray-400 mb-4">Importer le fichier G-code:</p>

            <div
              onClick={() => inputRef.current.click()}
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl py-10 cursor-pointer transition-all ${
                dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="1.5">
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
              </svg>
              <p className="text-sm font-semibold text-gray-700">
                {file ? file.name : 'Sélectionner votre fichier'}
              </p>
              <p className="text-xs text-gray-400 text-center">G-code (.gcode .nc .jcc .ngc .txt)</p>
              <input
                ref={inputRef}
                type="file"
                accept=".gcode,.jcc,.nc,.ngc,.txt"
                className="hidden"
                onChange={(e) => handleFile(e.target.files[0])}
              />
              {!file && (
                <button
                  onClick={(e) => { e.stopPropagation(); inputRef.current.click() }}
                  className="mt-1 bg-gray-900 hover:bg-gray-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sélectionner
                </button>
              )}
            </div>

            {parseError ? <p className="mt-2 text-xs text-red-600">{parseError}</p> : null}

            <div className="flex gap-3 mt-5">
              <button
                onClick={cancel}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={startUpload}
                disabled={!file || !connected || senderState.running || !!parseError || !parsedLines.length}
                className="flex-1 bg-gray-700 hover:bg-gray-900 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                {connected ? 'Téléverser' : 'Non connecté'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
              <button
                onClick={senderState.paused ? resumeStream : pauseStream}
                disabled={!connected || !senderState.running}
                className="border border-gray-200 rounded-lg py-2 hover:bg-gray-50 disabled:opacity-50"
              >
                {senderState.paused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={stopStream}
                disabled={!connected}
                className="border border-gray-200 rounded-lg py-2 hover:bg-gray-50 disabled:opacity-50"
              >
                Stop
              </button>
              <button
                onClick={emergencyStop}
                disabled={!connected}
                className="col-span-2 border border-red-200 text-red-600 rounded-lg py-2 hover:bg-red-50 disabled:opacity-50"
              >
                Arrêt urgence
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-center mt-auto pt-4">
            <CalibrationButton />
            <div className="flex items-center gap-2 border border-gray-200 rounded-full px-3 py-2 text-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span className="text-gray-500">Lignes:</span>
              <span className="font-semibold text-gray-800">{senderState.total || lineCount}</span>
            </div>
          </div>
        </motion.div>

        {/* Right panel */}
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

          <AnimatePresence>
            {(isRunning || progress > 0) && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 font-medium truncate max-w-[200px]">
                    {previewName || senderState.source}
                  </span>
                  <span className="text-blue-600 font-bold">{progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <motion.div
                    className="h-full bg-blue-500 rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <p className="text-xs text-gray-500 truncate">
                  {senderState.acked}/{senderState.total} · {senderState.currentLine || 'attente ack...'}
                </p>
                {progress === 100 && (
                  <p className="text-green-600 text-sm font-semibold text-center">
                    ✓ Fichier envoyé avec succès
                  </p>
                )}
                {lastError ? <p className="text-red-600 text-xs">{lastError}</p> : null}
              </motion.div>
            )}
          </AnimatePresence>

          <CoordBar returnTo="/" className="mt-auto pt-4" />
        </div>
      </div>
    </div>
  )
}
