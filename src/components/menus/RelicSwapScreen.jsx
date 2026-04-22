// components/menus/RelicSwapScreen.jsx
// Shown when a new relic is found but all 5 slots are full.
// Player taps one equipped relic to swap out, or clicks Skip to decline.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RELICS, RELIC_TIER_COLORS, RELIC_TIER_GLOW } from '../../data/relics.js'
import useRunStore from '../../stores/runStore.js'
import { useAudio } from '../../hooks/useAudio.js'

function RelicCard({ relicId, isSelected, onClick, label }) {
  const relic = RELICS[relicId]
  if (!relic) return null
  const tierColor = RELIC_TIER_COLORS[relic.tier] || '#6b7280'

  return (
    <motion.button
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="relative p-3 rounded-xl border-2 text-left cursor-pointer transition-all w-full"
      style={{
        background: isSelected
          ? `linear-gradient(160deg, ${relic.color}22, #0d0d0d)`
          : 'linear-gradient(160deg, #1a1208, #0d0d0d)',
        borderColor: isSelected ? tierColor : '#374151',
        boxShadow: isSelected ? RELIC_TIER_GLOW[relic.tier] || 'none' : 'none',
      }}
    >
      {label && (
        <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-1">{label}</div>
      )}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">{relic.icon}</span>
        <span className="font-bold text-sm" style={{ color: relic.color, fontFamily: "'Cinzel', serif" }}>
          {relic.name}
        </span>
        <span className="text-[9px] uppercase ml-auto" style={{ color: tierColor, opacity: 0.7 }}>
          {relic.tier}
        </span>
      </div>
      <p className="text-xs text-gray-400 leading-relaxed">{relic.description}</p>
      {isSelected && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-2 right-2 text-xs font-bold text-red-400 bg-red-950/80 px-1.5 py-0.5 rounded"
        >
          ← Swap out
        </motion.div>
      )}
    </motion.button>
  )
}

export function RelicSwapScreen({ newRelicId, onDone }) {
  const store = useRunStore()
  const { playSFX } = useAudio()
  const [selectedSlot, setSelectedSlot] = useState(null)

  const newRelic = RELICS[newRelicId]
  if (!newRelic) return null

  const handleSwap = () => {
    if (selectedSlot === null) return
    playSFX('correct')
    store.swapRelic(selectedSlot, newRelicId)
    onDone?.()
  }

  const handleSkip = () => {
    playSFX('button_click')
    store.skipRelicSwap()
    onDone?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-6"
    >
      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 26 }}
        className="w-full max-w-xl"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-5xl mb-3"
          >
            ✨
          </motion.div>
          <h1 className="text-2xl font-bold text-amber-200" style={{ fontFamily: "'Cinzel', serif" }}>
            New Relic Found
          </h1>
          <p className="text-sm text-gray-500 mt-1">All 5 relic slots are full. Swap one out or skip.</p>
        </div>

        {/* New relic */}
        <div className="mb-6 p-4 rounded-2xl border" style={{
          background: `linear-gradient(160deg, ${newRelic.color}18, #0d0d0d)`,
          borderColor: RELIC_TIER_COLORS[newRelic.tier] || '#4b5563',
          boxShadow: RELIC_TIER_GLOW[newRelic.tier] || 'none',
        }}>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2">New Relic</div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{newRelic.icon}</span>
            <div>
              <div className="font-bold text-lg" style={{ color: newRelic.color, fontFamily: "'Cinzel', serif" }}>
                {newRelic.name}
              </div>
              <div className="text-[10px] uppercase" style={{ color: RELIC_TIER_COLORS[newRelic.tier], opacity: 0.7 }}>
                {newRelic.tier}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-300">{newRelic.description}</p>
          <p className="text-xs text-gray-600 italic mt-2">{newRelic.flavor}</p>
        </div>

        {/* Divider */}
        <p className="text-center text-xs text-gray-600 mb-4 uppercase tracking-widest">
          ↓ Tap a relic to replace it ↓
        </p>

        {/* Equipped relics */}
        <div className="grid grid-cols-1 gap-2 mb-6">
          {store.relics.map((relicId, i) => (
            <RelicCard
              key={relicId}
              relicId={relicId}
              isSelected={selectedSlot === i}
              onClick={() => { playSFX('button_click'); setSelectedSlot(i === selectedSlot ? null : i) }}
              label={`Slot ${i + 1}`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSwap}
            disabled={selectedSlot === null}
            className={`flex-1 py-3 rounded-xl font-bold text-sm border-2 transition-all ${
              selectedSlot !== null
                ? 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-white cursor-pointer'
                : 'bg-gray-900 border-gray-700 text-gray-600 cursor-default'
            }`}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            ⚡ Confirm Swap
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleSkip}
            className="px-6 py-3 rounded-xl border border-gray-700 text-gray-400 text-sm hover:border-gray-500 hover:text-gray-300 transition-all cursor-pointer"
          >
            Skip
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
