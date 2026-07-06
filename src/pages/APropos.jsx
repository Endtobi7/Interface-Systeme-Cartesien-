import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const team = [
  { name: 'SABRI El Houssaine', role: 'Membre' },
  { name: 'EL ASRAOUI ElMehdi', role: 'Membre' },
  { name: 'LYAKTINI MohamedHabib', role: 'Membre' },
  { name: 'ABOURAZOUK Alaa', role: 'Membre' },
]

export default function APropos() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-8 md:px-10 py-5 border-b border-gray-100">
        <p className="text-xs text-gray-400 font-medium tracking-wide">PI. Groupe 7</p>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7"/>
          </svg>
          Retour
        </button>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-8 md:px-10 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-black tracking-tight mb-2">À propos</h1>
          <p className="text-gray-500 text-sm mb-10">Projet d&apos;ingénierie PI — Groupe 7</p>

          {/* Description */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h2 className="text-base font-bold mb-3">Le projet</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Le Système cartésien PI. Groupe 7 est un traceur à 3 axes conçu et réalisé dans le cadre d'un projet d'ingénierie PI.
              Il est capable de dessiner des formes géométriques, d'importer des fichiers G-code/SVG et d'être contrôlé manuellement
              via une interface web intuitive.
            </p>
          </div>

          {/* Specs */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { label: 'Axes', value: '3 (X, Y, Z)' },
              { label: 'Surface', value: '200 × 200 mm' },
              { label: 'Vitesse max', value: '150 mm/s' },
              { label: 'Précision', value: '±0.1 mm' },
              { label: 'Formats', value: 'G-code, SVG' },
              { label: 'Interface', value: 'Web (React)' },
            ].map(spec => (
              <div key={spec.label} className="bg-gray-50 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-400 mb-0.5">{spec.label}</p>
                <p className="text-sm font-semibold text-gray-800">{spec.value}</p>
              </div>
            ))}
          </div>

          {/* Team */}
          <h2 className="text-base font-bold mb-4">L'équipe</h2>
          <div className="grid grid-cols-2 gap-3">
            {team.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3"
              >
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                  {m.name[0]}{i+1}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{m.name}</p>
                  <p className="text-xs text-gray-400">{m.role}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              PI. Groupe 7 · Projet d&apos;ingénierie PI · {new Date().getFullYear()}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
