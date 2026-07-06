import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const modes = [
  { label: 'Mode manuel', path: '/manuel' },
  { label: 'Mode import', path: '/import' },
  { label: 'Formes prédéfinies', path: '/formes' },
]

export default function ModeDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium bg-white hover:bg-gray-50 transition-colors"
      >
        Changer le mode
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {modes.map(m => {
              const active = location.pathname === m.path
              return (
                <button
                  key={m.path}
                  onClick={() => { navigate(m.path); setOpen(false) }}
                  className={`w-full text-left px-4 py-3 text-sm flex items-center gap-2 transition-colors ${
                    active
                      ? 'bg-gray-900 text-white font-medium'
                      : 'hover:bg-gray-50 text-gray-800'
                  }`}
                >
                  {active && <span className="text-xs">✓</span>}
                  {!active && <span className="w-4"/>}
                  {m.label}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
