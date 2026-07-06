import { motion } from 'framer-motion';

export default function TopBar({ title, subtitle }) {
  return (
    <motion.div
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex items-center justify-between px-4 py-3 shrink-0"
      style={{ background: '#141728', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div>
        <h1 className="text-white font-bold text-base leading-tight">{title}</h1>
        {subtitle && <p className="text-gray-400 text-xs mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-gray-400 text-xs">Actif</span>
      </div>
    </motion.div>
  );
}
