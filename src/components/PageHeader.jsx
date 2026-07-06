import { useNavigate } from 'react-router-dom'
import ModeDropdown from './ModeDropdown'
import { useGrbl } from '../context/GrblContext'

export default function PageHeader({ title, accentColor = '#39FF14' }) {
  const navigate = useNavigate()
  const {
    serialSupported,
    connected,
    connecting,
    baudRate,
    setBaudRate,
    baudRates,
    machineState,
    connect,
    disconnect,
  } = useGrbl()

  return (
    <div>
      <div className="flex items-center justify-between px-8 md:px-10 pt-4 pb-3 border-b border-gray-100">
        <p className="text-xs text-gray-400 font-medium tracking-widest uppercase">PI. Groupe 7</p>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-500 min-w-20 text-right">{machineState}</span>
          <select
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
            disabled={!serialSupported || connected}
          >
            {baudRates.map((rate) => <option key={rate} value={rate}>{rate}</option>)}
          </select>
          <button
            onClick={connected ? disconnect : () => connect(baudRate)}
            disabled={!serialSupported || connecting}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
          >
            {connected ? 'Déconnecter' : connecting ? 'Connexion…' : 'Connecter'}
          </button>
          <ModeDropdown />
          <button
            onClick={() => navigate('/aide')}
            className="bg-gray-900 hover:bg-gray-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            Aide
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 px-8 md:px-10 pt-5 pb-4">
        <div className="w-9 h-9 rounded flex-shrink-0" style={{ backgroundColor: accentColor }} />
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">{title}</h1>
      </div>
    </div>
  )
}
