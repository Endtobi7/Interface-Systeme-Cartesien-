import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGrbl } from '../context/GrblContext'
import MachineAnimation from '../components/MachineAnimation'

const buttons = [
  { label: 'Mode manuel', path: '/manuel', bg: '#4ade80', textColor: '#1a3a1a' },
  { label: 'Mode import', path: '/import', bg: '#a3e635', textColor: '#1a3a1a' },
  { label: 'Formes prédéfinies', path: '/formes', bg: '#60a5fa', textColor: '#0c1e3a' },
]

export default function Home() {
  const navigate = useNavigate()
  const {
    serialSupported,
    connected,
    connecting,
    baudRate,
    setBaudRate,
    baudRates,
    machineState,
    coords,
    workspace,
    connect,
    disconnect,
  } = useGrbl()

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-8 md:px-10 py-5 border-b border-gray-100">
        <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">PI. Groupe 7</p>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-500">{machineState}</span>
          {!connected && (
            <select
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
              disabled={!serialSupported}
            >
              {baudRates.map((rate) => <option key={rate} value={rate}>{rate}</option>)}
            </select>
          )}
          <button
            onClick={connected ? disconnect : () => connect(baudRate)}
            disabled={!serialSupported || connecting}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
              connected
                ? 'border-red-200 text-red-600 hover:bg-red-50'
                : 'border-gray-200 hover:bg-gray-50'
            }`}
          >
            {connected ? 'Déconnecter' : connecting ? 'Connexion…' : 'Connecter'}
          </button>
          <button
            onClick={() => navigate('/apropos')}
            className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            A propos
          </button>
          <button
            onClick={() => navigate('/aide')}
            className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            Aide
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex items-center px-8 md:px-14 py-8 gap-8">
        {/* Left side */}
        <div className="flex-1 max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-tight mb-3">
              Système cartésien:
            </h1>
            <p className="text-gray-400 text-lg mb-14 font-light">Interface de contrôle</p>
          </motion.div>

          <div className="flex flex-col gap-5">
            {buttons.map((btn, i) => (
              <motion.button
                key={btn.path}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 + i * 0.12, duration: 0.38 }}
                whileHover={{ scale: 1.05, x: 6 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(btn.path)}
                className="relative flex items-center justify-between px-8 py-5 rounded-full text-xl font-bold shadow-lg w-80 transition-all"
                style={{ backgroundColor: btn.bg, color: btn.textColor }}
              >
                <span>{btn.label}</span>
                <svg
                  className="w-5 h-5 opacity-50 flex-shrink-0"
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                >
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Right side - real-time machine animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.93 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.55 }}
          className="hidden md:flex flex-1 items-center justify-center"
        >
          <MachineAnimation
            coords={coords}
            travels={{ x: workspace.width, y: workspace.height, z: workspace.maxZ }}
            className="max-w-full"
          />
        </motion.div>
      </div>

      {/* Quitter */}
      <div className="flex justify-end px-8 pb-8">
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => window.close()}
          className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-semibold text-sm transition-colors shadow-lg"
        >
          Quitter
        </motion.button>
      </div>
    </div>
  )
}
