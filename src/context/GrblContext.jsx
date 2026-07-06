/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import {
  DEFAULT_BAUD_RATES,
  GRBL_PARAMETERS,
  parseFirmwareParameter,
  parseStatusReport,
  sanitizeGcodeLine,
  toHBotBelts,
} from '../lib/grbl'

const GrblContext = createContext(null)

export function GrblProvider({ children }) {
  const [serialSupported] = useState(() => typeof navigator !== 'undefined' && 'serial' in navigator)
  const [connected, setConnected] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [baudRate, setBaudRate] = useState(115200)
  const [machineState, setMachineState] = useState('Disconnected')
  const [coords, setCoords] = useState({ x: 0, y: 0, z: 0 })
  const [hbot, setHbot] = useState({ a: 0, b: 0 })
  const [alarm, setAlarm] = useState('')
  const [lastError, setLastError] = useState('')

  const homingStateRef = useRef('idle')
  const [homingState, setHomingState] = useState('idle')
  const setHomingStateSynced = useCallback((val) => {
    homingStateRef.current = val
    setHomingState(val)
  }, [])

  const [limitsState, setLimitsState] = useState('')
  const [senderState, setSenderState] = useState({
    running: false, paused: false, source: '', total: 0, sent: 0, acked: 0, currentLine: '',
  })
  const [parameters, setParameters] = useState(() =>
    Object.fromEntries(GRBL_PARAMETERS.map((p) => [p.id, p.defaultValue])))
  const [workspace, setWorkspace] = useState({
    width: 300,
    height: 300,
    maxZ: 45,
    penUpZ: 5,
    penDownZ: 0,
    maxFeed: 2000,
    referenceFrame: 'bottom-left',
  })

  const portRef = useRef(null)
  const readerRef = useRef(null)
  const writerRef = useRef(null)
  const readBufferRef = useRef('')
  const txQueueRef = useRef([])
  const awaitingAckRef = useRef(false)
  const connectedRef = useRef(false)
  const wcoRef = useRef({ x: 0, y: 0, z: 0 })

  const writeRaw = useCallback(async (data) => {
    if (!writerRef.current) return false
    try { await writerRef.current.write(data); return true } catch { return false }
  }, [])

  const sendRealtime = useCallback(async (byteOrStr) => {
    if (!writerRef.current) return false
    const data = typeof byteOrStr === 'string' ? new TextEncoder().encode(byteOrStr) : byteOrStr
    return writeRaw(data)
  }, [writeRaw])

  const parseLine = useCallback((line) => {
    if (!line) return
    const status = parseStatusReport(line)
    if (status) {
      const state = status.machineState
      if (state) setMachineState(state)

      /* Cache the work-coordinate offset; GRBL 1.1 sends it periodically. */
      if (status.wco) wcoRef.current = status.wco

      /* Prefer an explicit work position; otherwise derive it from the
         machine position minus the cached offset (default GRBL 1.1 behaviour).
         Falls back to the raw machine position if nothing else is available. */
      let mc = status.wpos
      if (!mc && status.mpos) {
        mc = {
          x: status.mpos.x - wcoRef.current.x,
          y: status.mpos.y - wcoRef.current.y,
          z: status.mpos.z - wcoRef.current.z,
        }
      }
      if (!mc) mc = status.mpos || { x: 0, y: 0, z: 0 }

      setCoords(mc)
      setHbot(toHBotBelts(mc.x, mc.y))
      setLimitsState(status.limits || '')
      if (state && state.startsWith('Alarm')) setAlarm(state)
      if (state === 'Home' || state === 'Homing') setHomingStateSynced('running')
      if (state === 'Idle' && homingStateRef.current === 'running') setHomingStateSynced('done')
      return
    }
    if (line.toLowerCase() === 'ok') {
      awaitingAckRef.current = false
      setSenderState((prev) => ({ ...prev, acked: Math.min(prev.total, prev.acked + 1) }))
      return
    }
    if (line.toLowerCase().startsWith('error')) {
      awaitingAckRef.current = false
      setLastError(line)
      txQueueRef.current = []
      if (homingStateRef.current === 'running') setHomingStateSynced('idle')
      setSenderState((prev) => ({ ...prev, running: false, paused: false, currentLine: '' }))
      return
    }
    if (line.toLowerCase().startsWith('alarm')) {
      awaitingAckRef.current = false
      setAlarm(line)
      setMachineState('Alarm')
      txQueueRef.current = []
      if (homingStateRef.current === 'running') setHomingStateSynced('idle')
      setSenderState((prev) => ({ ...prev, running: false, paused: false, currentLine: '' }))
      return
    }
    const param = parseFirmwareParameter(line)
    if (param) setParameters((prev) => ({ ...prev, [param.id]: param.value }))
  }, [setHomingStateSynced])

  const sendNext = useCallback(async () => {
    if (awaitingAckRef.current || !writerRef.current || !connectedRef.current) return
    const line = txQueueRef.current.shift()
    if (!line) return
    try {
      await writerRef.current.write(new TextEncoder().encode(line + '\n'))
      awaitingAckRef.current = true
      setSenderState((prev) => ({ ...prev, sent: Math.min(prev.total, prev.sent + 1), currentLine: line }))
    } catch { awaitingAckRef.current = false }
  }, [])

  useEffect(() => {
    if (!connected) return undefined
    const id = setInterval(() => {
      if (!awaitingAckRef.current) {
        if (txQueueRef.current.length > 0) {
          sendNext()
        } else {
          setSenderState((prev) => {
            if (prev.running && prev.total > 0 && prev.acked >= prev.total) {
              return { ...prev, running: false, paused: false, currentLine: '' }
            }
            return prev
          })
        }
      }
    }, 30)
    return () => clearInterval(id)
  }, [connected, sendNext])

  useEffect(() => {
    if (!connected) return undefined
    /* '?' is a GRBL real-time command: it is answered immediately, even while
       a line is awaiting its 'ok' or while the machine is homing/running.
       Polling it unconditionally is what makes the live position (and the
       Home-page animation) update in real time. */
    const id = setInterval(() => {
      sendRealtime('?')
    }, 200)
    return () => clearInterval(id)
  }, [connected, sendRealtime])

  const disconnect = useCallback(async () => {
    connectedRef.current = false
    txQueueRef.current = []
    awaitingAckRef.current = false
    try { await readerRef.current?.cancel() } catch { /* ignore */ }
    try { readerRef.current?.releaseLock() } catch { /* ignore */ }
    try { writerRef.current?.releaseLock() } catch { /* ignore */ }
    try { await portRef.current?.close() } catch { /* ignore */ }
    readerRef.current = null
    writerRef.current = null
    portRef.current = null
    setConnected(false)
    setMachineState('Disconnected')
    setHomingStateSynced('idle')
    setSenderState({ running: false, paused: false, source: '', total: 0, sent: 0, acked: 0, currentLine: '' })
  }, [setHomingStateSynced])

  const readLoop = useCallback(async () => {
    while (readerRef.current && connectedRef.current) {
      try {
        const { value, done } = await readerRef.current.read()
        if (done) break
        if (!value) continue
        const text = new TextDecoder().decode(value)
        readBufferRef.current += text
        const parts = readBufferRef.current.split(/\r?\n/)
        readBufferRef.current = parts.pop() || ''
        parts.forEach((l) => parseLine(l.trim()))
      } catch (err) {
        setLastError(err?.message || 'Connexion perdue')
        break
      }
    }
    if (connectedRef.current) await disconnect()
  }, [parseLine, disconnect])

  const connect = useCallback(async (targetBaud = baudRate) => {
    if (!serialSupported || connecting || connected) return
    setConnecting(true)
    setLastError('')
    setAlarm('')
    try {
      const port = await navigator.serial.requestPort()
      await port.open({ baudRate: Number(targetBaud) || 115200, dataBits: 8, stopBits: 1, parity: 'none', flowControl: 'none' })
      portRef.current = port
      writerRef.current = port.writable.getWriter()
      readerRef.current = port.readable.getReader()
      // Wait 2 seconds for GRBL to boot (mirrors Python time.sleep(2))
      await new Promise((r) => setTimeout(r, 2000))
      connectedRef.current = true
      setConnected(true)
      setBaudRate(Number(targetBaud) || 115200)
      setMachineState('Connecté')
      setHomingStateSynced('idle')
      await sendRealtime('?')
      readLoop()
    } catch (err) {
      setLastError(err?.message || 'Connexion échouée')
      await disconnect()
    } finally {
      setConnecting(false)
    }
  }, [baudRate, connected, connecting, disconnect, readLoop, sendRealtime, serialSupported, setHomingStateSynced])

  const sendCommand = useCallback((line) => {
    const clean = sanitizeGcodeLine(line)
    if (!clean || !connectedRef.current) return
    txQueueRef.current.push(clean)
  }, [])

  const startStream = useCallback((lines, source = 'stream') => {
    const clean = lines.map(sanitizeGcodeLine).filter(Boolean)
    if (!clean.length) return
    txQueueRef.current = [...txQueueRef.current, ...clean]
    setSenderState({ running: true, paused: false, source, total: clean.length, sent: 0, acked: 0, currentLine: '' })
    setLastError('')
  }, [])

  const pauseStream = useCallback(async () => {
    setSenderState((prev) => ({ ...prev, paused: true }))
    await sendRealtime('!')
  }, [sendRealtime])

  const resumeStream = useCallback(async () => {
    setSenderState((prev) => ({ ...prev, paused: false }))
    await sendRealtime('~')
  }, [sendRealtime])

  const stopStream = useCallback(async () => {
    txQueueRef.current = []
    awaitingAckRef.current = false
    setSenderState((prev) => ({ ...prev, running: false, paused: false, currentLine: '' }))
    await sendRealtime('!')
  }, [sendRealtime])

  const emergencyStop = useCallback(async () => {
    txQueueRef.current = []
    awaitingAckRef.current = false
    setSenderState({ running: false, paused: false, source: '', total: 0, sent: 0, acked: 0, currentLine: '' })
    await sendRealtime('\x18')
    setMachineState('Reset')
    setAlarm('')
    setTimeout(() => { if (connectedRef.current) txQueueRef.current.push('$X') }, 500)
  }, [sendRealtime])

  const home = useCallback(() => {
    if (!connectedRef.current) return
    setHomingStateSynced('running')
    txQueueRef.current.push('$H')
  }, [setHomingStateSynced])

  const unlock = useCallback(() => {
    if (!connectedRef.current) return
    txQueueRef.current.push('$X')
    setAlarm('')
  }, [])

  const refreshParameters = useCallback(() => { txQueueRef.current.push('$$') }, [])

  const saveParameter = useCallback((id, value) => {
    const v = String(value).trim()
    if (!/^[-+]?\d*\.?\d+$/.test(v)) { setLastError(`Valeur invalide pour $${id}`); return false }
    txQueueRef.current.push(`$${id}=${v}`)
    setParameters((prev) => ({ ...prev, [id]: v }))
    return true
  }, [])

  const value = useMemo(() => ({
    serialSupported, connected, connecting, baudRate, setBaudRate, baudRates: DEFAULT_BAUD_RATES,
    machineState, coords, hbot, alarm, lastError, homingState, limitsState, senderState,
    parameters, parameterDefinitions: GRBL_PARAMETERS, workspace, setWorkspace,
    connect, disconnect, sendCommand, startStream, pauseStream, resumeStream,
    stopStream, emergencyStop, home, unlock, refreshParameters, saveParameter,
  }), [
    serialSupported, connected, connecting, baudRate, machineState, coords, hbot,
    alarm, lastError, homingState, limitsState, senderState, parameters, workspace,
    connect, disconnect, sendCommand, startStream, pauseStream, resumeStream,
    stopStream, emergencyStop, home, unlock, refreshParameters, saveParameter,
  ])

  return <GrblContext.Provider value={value}>{children}</GrblContext.Provider>
}

export function useGrbl() {
  const ctx = useContext(GrblContext)
  if (!ctx) throw new Error('useGrbl must be used within GrblProvider')
  return ctx
}
