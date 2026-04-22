// components/combat/ChainIndicator.jsx
import { motion, AnimatePresence } from 'framer-motion'
import { CARD_TYPES, CARD_TYPE_META } from '../../constants/cardTypes.js'

/**
 * Shows "CHAIN ACTIVE" banner when a primer card has been played
 * @param {boolean} chainActive
 * @param {string|null} chainType - what type was primed
 */
export function ChainIndicator({ chainActive, chainType }) {
  const nextType = chainType === CARD_TYPES.VOCABULARY
    ? CARD_TYPES.GRAMMAR
    : chainType === CARD_TYPES.GRAMMAR
      ? CARD_TYPES.READING
      : null

  const nextMeta = nextType ? CARD_TYPE_META[nextType] : null

  return (
    <AnimatePresence>
      {chainActive && chainType && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/40 rounded-lg"
        >
          <motion.div
            animate={{ boxShadow: ['0 0 6px #EAB308', '0 0 16px #EAB308', '0 0 6px #EAB308'] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-yellow-400"
          />
          <span className="text-xs font-bold text-yellow-300 tracking-widest">CHAIN ACTIVE</span>
          {nextMeta && (
            <span className={`text-xs ${nextMeta.colorClass}`}>
              → next {nextMeta.label} {nextMeta.icon}
            </span>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
