import { motion, AnimatePresence } from 'framer-motion'
import { useGrbl } from '../context/GrblContext'

export default function CalibrationButton() {
  const { connected, home, homingState, alarm } = useGrbl()
  const active = homingState === 'running'

  return (
    <div className="relative inline-block">
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={home}
        disabled={!connected || active}
        className={`flex items-center gap-2 px-5 py-3 rounded-full text-white font-medium text-sm transition-colors shadow-lg disabled:opacity-50 ${
          active ? 'bg-gray-700' : 'bg-gray-900 hover:bg-gray-800'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" />
        </svg>
        Calibration
      </motion.button>
      <AnimatePresence>
        {(active || homingState === 'done' || alarm) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 8 }}
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl"
          >
            {active ? 'Calibration en cours…' : alarm ? `Échec: ${alarm}` : 'Calibration terminée'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
