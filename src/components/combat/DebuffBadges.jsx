// components/combat/DebuffBadges.jsx — v2
// Displays all active player debuffs as icon badges with duration countdowns.
// Pulses red on last turn before expiring.

import { motion, AnimatePresence } from 'framer-motion'
import { DEBUFF_ICONS, DEBUFF_COLORS } from '../../constants/enemyMoves.js'

const DEBUFF_LABELS = {
  silence:   (d) => `${d.target || '?'} silenced`,
  drain:     ()  => '−1 energy',
  fog:       ()  => 'fog active',
  bind:      ()  => '−1 draw',
  confusion: ()  => 'options shuffle',
}

/**
 * @param {Object[]} debuffs - activePlayerDebuffs from runStore
 */
export function DebuffBadges({ debuffs = [] }) {
  if (debuffs.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1">
      <AnimatePresence>
        {debuffs.map((debuff) => {
          const icon = DEBUFF_ICONS[debuff.type] || '❓'
          const colorClass = DEBUFF_COLORS[debuff.type] || 'text-gray-400 border-gray-600'
          const label = DEBUFF_LABELS[debuff.type]?.(debuff) || debuff.type
          const isExpiring = debuff.duration === 1

          return (
            <motion.div
              key={debuff.id || `${debuff.type}-${debuff.duration}`}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{
                opacity: 1,
                scale: 1,
                // Pulse red when last turn
                boxShadow: isExpiring
                  ? ['0 0 0px #ef4444', '0 0 8px #ef4444', '0 0 0px #ef4444']
                  : '0 0 0px transparent',
              }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{
                duration: 0.2,
                boxShadow: isExpiring ? { duration: 1, repeat: Infinity } : {},
              }}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded border text-[9px] font-semibold ${colorClass} bg-black/40`}
              title={label}
            >
              <span>{icon}</span>
              <span>{debuff.duration}T</span>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
