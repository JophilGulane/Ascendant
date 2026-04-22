// components/menus/VaultScreen.jsx
// Rest site vault — freely swap equipped relics with vault relics.
// No cost, no limit. Leave with exactly 5 equipped (or fewer if fewer acquired).

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RELICS, RELIC_TIER_COLORS, RELIC_TIER_GLOW } from '../../data/relics.js'
import useRunStore from '../../stores/runStore.js'
import { useAudio } from '../../hooks/useAudio.js'

function SmallRelicCard({ relicId, isSelected, isEquipped, onClick }) {
  const relic = RELICS[relicId]
  if (!relic) return null
  const tierColor = RELIC_TIER_COLORS[relic.tier] || '#6b7280'

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="relative p-2.5 rounded-xl border cursor-pointer text-left w-full"
      style={{
        background: isSelected
          ? `linear-gradient(135deg, ${relic.color}22, #0d0d0d)`
          : 'linear-gradient(135deg, #111, #0a0a0a)',
        borderColor: isSelected ? tierColor : isEquipped ? '#374151' : '#1f2937',
        boxShadow: isSelected ? RELIC_TIER_GLOW[relic.tier] || 'none' : 'none',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{relic.icon}</span>
        <div className="min-w-0">
          <div className="text-xs font-bold truncate" style={{ color: relic.color }}>{relic.name}</div>
          <div className="text-[9px] text-gray-600 uppercase">{relic.tier}</div>
        </div>
        {isSelected && (
          <span className="ml-auto text-amber-400 text-xs">✓</span>
        )}
      </div>
    </motion.button>
  )
}

export function VaultScreen({ onClose }) {
  const store = useRunStore()
  const { playSFX } = useAudio()

  // selectedEquipped = slot index being swapped out
  // selectedVault = relicId being swapped in
  const [selectedEquipped, setSelectedEquipped] = useState(null)
  const [selectedVault, setSelectedVault] = useState(null)

  const handleEquippedClick = (index) => {
    playSFX('button_click')
    setSelectedEquipped(selectedEquipped === index ? null : index)
    setSelectedVault(null)
  }

  const handleVaultClick = (relicId) => {
    playSFX('button_click')
    setSelectedVault(selectedVault === relicId ? null : relicId)
  }

  const handleSwap = () => {
    if (selectedEquipped === null || !selectedVault) return
    playSFX('correct')
    store.vaultSwap(selectedEquipped, selectedVault)
    setSelectedEquipped(null)
    setSelectedVault(null)
  }

  const canSwap = selectedEquipped !== null && selectedVault !== null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-lg bg-gray-950 border border-amber-800/40 rounded-2xl overflow-hidden shadow-2xl"
        style={{ boxShadow: '0 0 40px rgba(245,158,11,0.12)' }}
      >
        {/* Header */}
        <div className="bg-amber-950/40 border-b border-amber-800/30 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-amber-200 text-lg" style={{ fontFamily: "'Cinzel', serif" }}>
              🗄 The Vault
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Swap relics freely. Leave with your best loadout.</p>
          </div>
          <button
            onClick={() => { playSFX('button_click'); onClose() }}
            className="text-gray-600 hover:text-gray-300 text-xl transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-4">
            <span className={selectedEquipped !== null ? 'text-amber-400' : ''}>
              1. Pick equipped relic to remove
            </span>
            <span>→</span>
            <span className={selectedVault !== null ? 'text-amber-400' : ''}>
              2. Pick vault relic to equip
            </span>
          </div>

          {/* Equipped relics */}
          <div className="mb-5">
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Equipped (Active)</div>
            <div className="grid grid-cols-1 gap-1.5">
              {store.relics.map((relicId, i) => (
                <SmallRelicCard
                  key={relicId}
                  relicId={relicId}
                  isSelected={selectedEquipped === i}
                  isEquipped={true}
                  onClick={() => handleEquippedClick(i)}
                />
              ))}
              {store.relics.length === 0 && (
                <p className="text-xs text-gray-700 italic">No relics equipped.</p>
              )}
            </div>
          </div>

          {/* Vault relics */}
          <div className="mb-5">
            <div className="text-xs uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
              Vault
              <span className="text-gray-700">({store.vaultRelics.length} stored)</span>
            </div>
            {store.vaultRelics.length === 0 ? (
              <div className="text-xs text-gray-700 italic py-3 text-center border border-gray-800 rounded-lg">
                The Vault is empty. Relics swapped out land here.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {store.vaultRelics.map((relicId) => (
                  <SmallRelicCard
                    key={relicId}
                    relicId={relicId}
                    isSelected={selectedVault === relicId}
                    isEquipped={false}
                    onClick={() => handleVaultClick(relicId)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Confirm swap */}
          <motion.button
            whileHover={canSwap ? { scale: 1.02 } : {}}
            whileTap={canSwap ? { scale: 0.98 } : {}}
            onClick={handleSwap}
            disabled={!canSwap}
            className={`w-full py-3 rounded-xl font-bold text-sm border transition-all ${
              canSwap
                ? 'bg-amber-700 hover:bg-amber-600 border-amber-500 text-white cursor-pointer'
                : 'bg-gray-900 border-gray-800 text-gray-700 cursor-default'
            }`}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {canSwap
              ? `⚡ Swap ${RELICS[store.relics[selectedEquipped]]?.name ?? ''} → ${RELICS[selectedVault]?.name ?? ''}`
              : 'Select one from each column to swap'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
