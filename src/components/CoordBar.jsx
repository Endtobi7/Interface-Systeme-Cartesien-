import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useGrbl } from '../context/GrblContext'

export default function CoordBar({ coords = null, returnTo = '/', className = '' }) {
  const navigate = useNavigate()
  const { coords: liveCoords, machineState, limitsState, senderState } = useGrbl()
  const shownCoords = coords ?? liveCoords

  return (
    <div className={`flex items-center justify-between gap-4 flex-wrap ${className}`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium text-gray-700">Coordonnées actuelles:</span>
        <div className="flex items-center gap-2">
          {['x', 'y', 'z'].map((axis) => (
            <div key={axis} className="flex items-center gap-1">
              <span className="text-sm text-gray-500">{axis}</span>
              <div className="border border-gray-200 rounded-md px-3 py-1 min-w-[4.4rem] text-center text-sm font-medium bg-white">
                {Number(shownCoords[axis] ?? 0).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        <span className="text-xs text-gray-500">État: {machineState}</span>
        {limitsState ? <span className="text-xs text-gray-500">Fins de course: {limitsState}</span> : null}
        {senderState.currentLine ? (
          <span className="text-xs text-gray-500 max-w-[320px] truncate">Cmd: {senderState.currentLine}</span>
        ) : null}
      </div>
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => navigate(returnTo)}
        className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-full font-medium text-sm transition-colors shadow-md"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M5 12l7-7M5 12l7 7" />
        </svg>
        retourner
      </motion.button>
    </div>
  )
}
