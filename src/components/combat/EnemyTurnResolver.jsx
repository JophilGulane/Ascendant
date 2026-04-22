// components/combat/EnemyTurnResolver.jsx — v2
// Visual banner shown during ENEMY_TURN phase.
// Displays current action being executed with icon, message, and animated frame.
// Shown as a centered overlay — pointer-events-none so it doesn't block anything.

import { motion, AnimatePresence } from 'framer-motion'
import { MOVE_CATEGORY } from '../../constants/enemyMoves.js'

const CATEGORY_STYLES = {
  damage:  { bg: 'bg-red-950/90 border-red-600',    text: 'text-red-200',    glow: '#ef4444' },
  debuff:  { bg: 'bg-purple-950/90 border-purple-500', text: 'text-purple-200', glow: '#a855f7' },
  selfbuff:{ bg: 'bg-blue-950/90 border-blue-500',  text: 'text-blue-200',   glow: '#3b82f6' },
  special: { bg: 'bg-gray-900/90  border-gray-500', text: 'text-gray-200',   glow: '#6b7280' },
}

/**
 * @param {boolean} isActive      - whether the enemy turn is executing
 * @param {Object|null} action    - { icon, message, type } from useEnemyTurn
 */
export function EnemyTurnResolver({ isActive, action }) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          key="enemy-turn-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none"
        >
          {/* Dark vignette behind the banner */}
          <div className="absolute inset-0 bg-black/30" />

          {/* Enemy turn label */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="absolute top-1/4 text-xs font-bold text-gray-400 tracking-widest uppercase"
          >
            ⚔ Enemy Turn
          </motion.div>

          {/* Action banner */}
          <AnimatePresence mode="wait">
            {action && (
              <ActionBanner key={action.message} action={action} />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function ActionBanner({ action }) {
  const category = MOVE_CATEGORY[action.type] || 'special'
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.special

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.85, opacity: 0, y: -15 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className={`
        flex flex-col items-center gap-2 px-8 py-5 rounded-2xl border-2
        ${style.bg} shadow-2xl backdrop-blur-sm
      `}
      style={{ boxShadow: `0 0 32px ${style.glow}40` }}
    >
      <span className="text-5xl">{action.icon}</span>
      <span className={`text-sm font-bold tracking-wide ${style.text}`}>
        {action.message}
      </span>

      {/* Damage value displayed large if it's a strike */}
      {action.type === 'damage' && action.value > 0 && (
        <motion.span
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="text-3xl font-black text-red-300"
        >
          -{action.value}
        </motion.span>
      )}
    </motion.div>
  )
}
