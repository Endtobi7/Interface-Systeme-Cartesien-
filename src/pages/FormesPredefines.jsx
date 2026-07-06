import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CartesianGrid from '../components/CartesianGrid';
import TopBar from '../components/TopBar';

const SHAPES_DEF = [
  {
    id: 'circle',
    label: 'Cercle',
    icon: '○',
    color: '#6366f1',
    params: [
      { id: 'cx', label: 'Centre x', min: -5, max: 5, step: 0.5, default: 0 },
      { id: 'cy', label: 'Centre y', min: -5, max: 5, step: 0.5, default: 0 },
      { id: 'r',  label: 'Rayon',    min: 0.5, max: 5, step: 0.5, default: 2 },
    ],
    toShape: (p) => [{ type: 'circle', x: p.cx, y: p.cy, r: p.r, color: '#6366f1' }],
  },
  {
    id: 'rect',
    label: 'Rectangle',
    icon: '▭',
    color: '#8b5cf6',
    params: [
      { id: 'rx', label: 'Coin x',   min: -5, max: 5, step: 0.5, default: -1 },
      { id: 'ry', label: 'Coin y',   min: -5, max: 5, step: 0.5, default: -1 },
      { id: 'rw', label: 'Largeur',  min: 0.5, max: 6, step: 0.5, default: 3 },
      { id: 'rh', label: 'Hauteur',  min: 0.5, max: 6, step: 0.5, default: 2 },
    ],
    toShape: (p) => [{ type: 'rect', x: p.rx, y: p.ry, w: p.rw, h: p.rh, color: '#8b5cf6' }],
  },
  {
    id: 'triangle',
    label: 'Triangle',
    icon: '△',
    color: '#ec4899',
    params: [
      { id: 'tx', label: 'Centre x', min: -5, max: 5, step: 0.5, default: 0 },
      { id: 'ty', label: 'Centre y', min: -5, max: 5, step: 0.5, default: 0 },
      { id: 'ts', label: 'Taille',   min: 0.5, max: 4, step: 0.5, default: 2 },
    ],
    toShape: (p) => [{ type: 'triangle', x: p.tx, y: p.ty, size: p.ts, color: '#ec4899' }],
  },
  {
    id: 'line',
    label: 'Segment',
    icon: '╱',
    color: '#10b981',
    params: [
      { id: 'lx1', label: 'x₁', min: -6, max: 6, step: 0.5, default: -3 },
      { id: 'ly1', label: 'y₁', min: -6, max: 6, step: 0.5, default: -2 },
      { id: 'lx2', label: 'x₂', min: -6, max: 6, step: 0.5, default:  3 },
      { id: 'ly2', label: 'y₂', min: -6, max: 6, step: 0.5, default:  2 },
    ],
    toShape: (p) => [{ type: 'line', x1: p.lx1, y1: p.ly1, x2: p.lx2, y2: p.ly2, color: '#10b981' }],
  },
  {
    id: 'star',
    label: 'Étoile',
    icon: '★',
    color: '#f59e0b',
    params: [
      { id: 'sx', label: 'Centre x', min: -4, max: 4, step: 0.5, default: 0 },
      { id: 'sy', label: 'Centre y', min: -4, max: 4, step: 0.5, default: 0 },
      { id: 'sr', label: 'Rayon',    min: 0.5, max: 3, step: 0.25, default: 1.5 },
    ],
    toShape: (p) => {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        pts.push({ type: 'point', x: p.sx + p.sr * Math.cos(angle), y: p.sy + p.sr * Math.sin(angle), color: '#f59e0b' });
      }
      return pts;
    },
  },
  {
    id: 'ellipse',
    label: 'Ellipse',
    icon: '⬭',
    color: '#14b8a6',
    params: [
      { id: 'ex', label: 'Centre x',  min: -4, max: 4, step: 0.5, default: 0 },
      { id: 'ey', label: 'Centre y',  min: -4, max: 4, step: 0.5, default: 0 },
      { id: 'ea', label: 'Demi-axe a', min: 0.5, max: 5, step: 0.5, default: 3 },
      { id: 'eb', label: 'Demi-axe b', min: 0.5, max: 5, step: 0.5, default: 1.5 },
    ],
    toShape: (p) => [{ type: 'ellipse', x: p.ex, y: p.ey, a: p.ea, b: p.eb, color: '#14b8a6' }],
  },
  {
    id: 'hexagon',
    label: 'Hexagone',
    icon: '⬡',
    color: '#f97316',
    params: [
      { id: 'hx', label: 'Centre x', min: -4, max: 4, step: 0.5, default: 0 },
      { id: 'hy', label: 'Centre y', min: -4, max: 4, step: 0.5, default: 0 },
      { id: 'hs', label: 'Rayon',    min: 0.5, max: 3, step: 0.25, default: 1.5 },
    ],
    toShape: (p) => [{ type: 'hexagon', x: p.hx, y: p.hy, size: p.hs, color: '#f97316' }],
  },
  {
    id: 'parabola',
    label: 'Parabole',
    icon: '⌢',
    color: '#6366f1',
    params: [
      { id: 'px', label: 'Sommet x', min: -3, max: 3, step: 0.5, default: 0 },
      { id: 'py', label: 'Sommet y', min: -3, max: 3, step: 0.5, default: 0 },
      { id: 'pa', label: 'Coeff a',  min: 0.1, max: 3, step: 0.1, default: 0.5 },
    ],
    toShape: (p) => {
      const pts = [];
      for (let xi = -4; xi <= 4; xi += 0.5) {
        pts.push({ type: 'point', x: p.px + xi, y: p.py + p.pa * xi * xi, color: '#6366f140' });
      }
      return pts;
    },
  },
];

function buildShapeInfo(def, params) {
  if (def.id === 'circle') return `C(${params.cx}, ${params.cy}), r=${params.r}`;
  if (def.id === 'rect') return `(${params.rx}, ${params.ry}), ${params.rw}×${params.rh}`;
  if (def.id === 'triangle') return `C(${params.tx}, ${params.ty}), s=${params.ts}`;
  if (def.id === 'line') return `(${params.lx1},${params.ly1}) → (${params.lx2},${params.ly2})`;
  return '';
}

export default function FormesPredefines() {
  const [selectedId, setSelectedId] = useState('circle');
  const selected = SHAPES_DEF.find(s => s.id === selectedId);

  // Initialize params
  const initParams = (def) => Object.fromEntries(def.params.map(p => [p.id, p.default]));
  const [paramMap, setParamMap] = useState(() => {
    const m = {};
    SHAPES_DEF.forEach(d => { m[d.id] = initParams(d); });
    return m;
  });

  const params = paramMap[selectedId];
  const setParam = (pid, val) => {
    setParamMap(prev => ({ ...prev, [selectedId]: { ...prev[selectedId], [pid]: val } }));
  };

  const shapes = selected.toShape(params);

  return (
    <div className="flex flex-col h-full bg-gray-50 overflow-y-auto">
      <TopBar title="Formes prédéfinies" subtitle="Sélection & paramètres" />

      <div className="flex flex-col gap-3 p-4">
        {/* Shape selector grid */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-3"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
        >
          <p className="text-xs text-gray-400 font-medium mb-2">Choisir une forme</p>
          <div className="grid grid-cols-4 gap-1.5">
            {SHAPES_DEF.map((s) => (
              <motion.button
                key={s.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedId(s.id)}
                className="flex flex-col items-center py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{
                  background: selectedId === s.id ? s.color : '#f5f5ff',
                  color: selectedId === s.id ? '#fff' : s.color,
                  boxShadow: selectedId === s.id ? `0 4px 12px ${s.color}55` : 'none',
                }}
              >
                <span className="text-base mb-0.5">{s.icon}</span>
                <span className="text-[10px]">{s.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Canvas preview */}
        <motion.div
          layout
          key={selectedId}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl overflow-hidden"
          style={{ boxShadow: '0 4px 24px rgba(99,102,241,0.12)' }}
        >
          <CartesianGrid width={310} height={200} scale={22} shapes={shapes} />
        </motion.div>

        {/* Info badge */}
        {buildShapeInfo(selected, params) && (
          <motion.div
            key={selectedId + 'info'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-semibold"
            style={{ background: selected.color + '18', color: selected.color }}
          >
            <span style={{ fontSize: 16 }}>{selected.icon}</span>
            <span>{selected.label} — {buildShapeInfo(selected, params)}</span>
          </motion.div>
        )}

        {/* Parameter controls */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-2xl p-4"
            style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
          >
            <h3 className="text-sm font-bold text-gray-700 mb-3">Paramètres</h3>
            <div className="flex flex-col gap-4">
              {selected.params.map((param) => (
                <div key={param.id}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-gray-600">{param.label}</label>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-lg"
                      style={{ background: selected.color + '18', color: selected.color }}
                    >
                      {params[param.id]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={params[param.id]}
                    onChange={(e) => setParam(param.id, parseFloat(e.target.value))}
                    className="w-full"
                    style={{ accentColor: selected.color }}
                  />
                  <div className="flex justify-between text-xs text-gray-300 mt-0.5">
                    <span>{param.min}</span><span>{param.max}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Reset button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setParamMap(prev => ({ ...prev, [selectedId]: initParams(selected) }))}
          className="py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200"
          style={{ borderColor: selected.color, color: selected.color }}
        >
          Réinitialiser les paramètres
        </motion.button>
      </div>
    </div>
  );
}
