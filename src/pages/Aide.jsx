import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useGrbl } from '../context/GrblContext'

const faqs = [
  {
    q: 'Comment démarrer le système ?',
    a: "Depuis la page d'accueil, sélectionnez le mode souhaité : Mode manuel, Mode import ou Formes prédéfinies. Effectuez d'abord une calibration avant tout dessin.",
  },
  {
    q: "Qu'est-ce que la calibration ?",
    a: "La calibration permet de positionner la tête d'impression à l'origine (0,0,0) avant chaque session. Appuyez sur le bouton Calibration dans chaque page de mode.",
  },
  {
    q: 'Quels formats de fichiers sont acceptés en Mode Import ?',
    a: 'Les formats G-code (.gcode, .nc, .jcc, .txt) sont acceptés. Glissez-déposez votre fichier ou cliquez sur Sélectionner.',
  },
  {
    q: 'Comment utiliser le Mode Manuel ?',
    a: "Choisissez entre 'Tapage de coordonnées' pour saisir des coordonnées X,Y,Z précises, ou 'Dessin sur écran' pour dessiner directement sur le plan. Ajustez la vitesse avec le curseur.",
  },
  {
    q: "Comment revenir à l'accueil ?",
    a: "Utilisez le bouton rouge « retourner » en bas de chaque page pour revenir à la page d'accueil.",
  },
  {
    q: 'Puis-je modifier la vitesse en cours de tracé ?',
    a: 'Oui, le curseur de vitesse peut être ajusté à tout moment. La modification est appliquée immédiatement au tracé en cours.',
  },
  {
    q: 'Comment régler la vitesse maximale ?',
    a: "Dans la section PARAMÈTRES ci-dessous, le champ « Vitesse maximale (mm/min) » fixe la valeur atteinte à 100 % sur les barres curseurs de vitesse. Réglez-le selon les capacités réelles de la machine.",
  },
  {
    q: 'À quoi servent les positions Z stylo levé / posé ?',
    a: "En Mode manuel, les deux champs « Position Z du stylo » définissent la hauteur du stylo levé (déplacements sans tracer) et posé (tracé). Ces hauteurs sont aussi utilisées par les formes prédéfinies.",
  },
]

function FAQItem({ item }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between py-4 text-left hover:text-gray-600 transition-colors">
        <span className="font-medium text-sm text-gray-800">{item.q}</span>
        <motion.span animate={{ rotate: open ? 45 : 0 }} transition={{ duration: 0.2 }} className="text-xl text-gray-400 flex-shrink-0 ml-4">+</motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <p className="text-sm text-gray-500 pb-4 leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Aide() {
  const navigate = useNavigate()
  const {
    connected,
    parameterDefinitions,
    parameters,
    refreshParameters,
    saveParameter,
    workspace,
    setWorkspace,
    lastError,
  } = useGrbl()

  const [draft, setDraft] = useState({})

  // Auto-load parameters from EEPROM as soon as the machine is connected
  useEffect(() => {
    if (connected) {
      // Small delay to let GRBL finish its boot greeting before sending $$
      const t = setTimeout(() => refreshParameters(), 300)
      return () => clearTimeout(t)
    }
  }, [connected, refreshParameters])

  // When parameters arrive from GRBL, clear the draft so the table shows live values
  useEffect(() => {
    setDraft({})
  }, [parameters])

  const orderedParams = useMemo(() =>
    parameterDefinitions.slice().sort((a, b) => Number(a.id) - Number(b.id))
  , [parameterDefinitions])

  function updateWorkspace(key, value) {
    setWorkspace((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex items-center justify-between px-8 md:px-10 py-5 border-b border-gray-100">
        <p className="text-xs text-gray-400 font-medium tracking-wide">PI. Groupe 7</p>
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" />
          </svg>
          Retour
        </button>
      </div>

      <div className="flex-1 max-w-4xl mx-auto w-full px-8 md:px-10 py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h1 className="text-3xl font-black tracking-tight">Aide</h1>
          </div>
          <p className="text-gray-500 mb-8 text-sm">Guide d'utilisation du système cartésien PI. Groupe 7</p>

          <div className="grid grid-cols-3 gap-3 mb-10">
            {[
              { label: 'Mode manuel', path: '/manuel', color: '#4ade80' },
              { label: 'Mode import', path: '/import', color: '#a3e635' },
              { label: 'Formes prédéfinies', path: '/formes', color: '#60a5fa' },
            ].map((link) => (
              <motion.button
                key={link.path}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(link.path)}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-gray-100 hover:border-gray-200 transition-colors"
                style={{ background: `${link.color}22` }}
              >
                <div className="w-8 h-8 rounded-full" style={{ background: link.color }} />
                <span className="text-xs font-medium text-gray-700 text-center">{link.label}</span>
              </motion.button>
            ))}
          </div>

          <h2 className="text-lg font-bold mb-4">Questions fréquentes</h2>
          <div className="bg-gray-50 rounded-2xl px-5 divide-y divide-gray-100 mb-10">
            {faqs.map((f, i) => <FAQItem key={i} item={f} />)}
          </div>

          <h2 className="text-lg font-bold mb-4">PARAMÈTRES</h2>
          <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <button
                onClick={refreshParameters}
                disabled={!connected}
                className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-white disabled:opacity-50"
              >
                Rafraîchir ($$)
              </button>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {connected ? '● Connectée' : '○ Non connectée'}
              </span>
              {connected && !lastError && (
                <span className="text-gray-400 text-xs">Paramètres chargés automatiquement depuis l'EEPROM</span>
              )}
              {lastError ? <span className="text-red-600">{lastError}</span> : null}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <label className="flex flex-col gap-1 text-gray-600">
                Repère utilisé
                <select
                  value={workspace.referenceFrame}
                  onChange={(e) => updateWorkspace('referenceFrame', e.target.value)}
                  className="border border-gray-200 rounded-lg px-2 py-2 bg-white"
                >
                  <option value="bottom-left">Origine bas-gauche</option>
                  <option value="top-left">Origine haut-gauche</option>
                  <option value="center">Origine centrée</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-gray-600">
                Largeur zone (mm)
                <input
                  type="number" min="10" value={workspace.width}
                  onChange={(e) => updateWorkspace('width', Number(e.target.value) || 10)}
                  className="border border-gray-200 rounded-lg px-2 py-2 bg-white"
                />
              </label>
              <label className="flex flex-col gap-1 text-gray-600">
                Hauteur zone (mm)
                <input
                  type="number" min="10" value={workspace.height}
                  onChange={(e) => updateWorkspace('height', Number(e.target.value) || 10)}
                  className="border border-gray-200 rounded-lg px-2 py-2 bg-white"
                />
              </label>
              <label className="flex flex-col gap-1 text-gray-600">
                Vitesse maximale (mm/min)
                <input
                  type="number" min="60" step="10" value={workspace.maxFeed}
                  onChange={(e) => updateWorkspace('maxFeed', Number(e.target.value) || 60)}
                  className="border border-gray-200 rounded-lg px-2 py-2 bg-white"
                />
              </label>
              <label className="flex flex-col gap-1 text-gray-600">
                Course Z maximale (mm)
                <input
                  type="number" min="1" step="1" value={workspace.maxZ}
                  onChange={(e) => updateWorkspace('maxZ', Number(e.target.value) || 1)}
                  className="border border-gray-200 rounded-lg px-2 py-2 bg-white"
                />
              </label>
            </div>

            <p className="text-xs text-gray-400">
              La vitesse maximale définit la valeur atteinte à 100 % sur les barres
              curseurs de vitesse (Mode manuel et Formes prédéfinies).
            </p>

            <div className="max-h-96 overflow-auto border border-gray-100 rounded-xl bg-white">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-100 text-gray-600">
                  <tr>
                    <th className="text-left p-2">Param</th>
                    <th className="text-left p-2">Description</th>
                    <th className="text-left p-2">Défaut</th>
                    <th className="text-left p-2">Valeur EEPROM</th>
                    <th className="text-left p-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orderedParams.map((p) => {
                    const liveVal = parameters[p.id] ?? p.defaultValue
                    const editVal = draft[p.id] ?? liveVal
                    const isDirty = draft[p.id] !== undefined && draft[p.id] !== String(liveVal)
                    return (
                      <tr key={p.id} className="border-t border-gray-100 align-top">
                        <td className="p-2 font-mono">${p.id}</td>
                        <td className="p-2 text-gray-600">
                          {p.name}
                          <br />
                          <span className="text-gray-400">{p.description}</span>
                        </td>
                        <td className="p-2 font-mono text-gray-400">{p.defaultValue}</td>
                        <td className="p-2">
                          <input
                            value={editVal}
                            onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value }))}
                            className={`w-24 border rounded-md px-2 py-1 ${isDirty ? 'border-blue-400 bg-blue-50' : 'border-gray-200'}`}
                          />
                        </td>
                        <td className="p-2">
                          <button
                            onClick={() => {
                              const ok = saveParameter(p.id, editVal)
                              if (ok) setDraft((d) => { const n = { ...d }; delete n[p.id]; return n })
                            }}
                            disabled={!connected}
                            className="px-2 py-1 border border-gray-200 rounded-md hover:bg-gray-50 disabled:opacity-50"
                          >
                            Sauver
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
