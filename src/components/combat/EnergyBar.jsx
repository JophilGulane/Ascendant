// components/combat/EnergyBar.jsx
import { motion } from 'framer-motion'

export function EnergyBar({ energy, maxEnergy }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: maxEnergy }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            scale: i < energy ? [1, 1.1, 1] : 1,
            opacity: i < energy ? 1 : 0.25,
          }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
            ${i < energy
              ? 'bg-yellow-400/80 border-yellow-300 shadow-[0_0_8px_#EAB30888]'
              : 'bg-gray-700 border-gray-600'
            }`}
        >
          {i < energy && <div className="w-2 h-2 rounded-full bg-yellow-200" />}
        </motion.div>
      ))}
      <span className="text-xs text-gray-400 ml-1">{energy}/{maxEnergy}</span>
    </div>
  )
}
