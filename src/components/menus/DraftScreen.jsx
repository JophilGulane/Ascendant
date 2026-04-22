// components/menus/DraftScreen.jsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CARD_TYPE_META, CARD_RARITY_META } from '../../constants/cardTypes.js'
import { HoverTranslate } from '../shared/HoverTranslate.jsx'
import { useAudio } from '../../hooks/useAudio.js'
import useRunStore from '../../stores/runStore.js'

/**
 * @param {Object[]} cards - sampled draft card data objects
 * @param {Object} cardMap - full card map
 * @param {function} onPick(card|null)
 * @param {function} onSkip
 * @param {number} accuracy - fight accuracy 0-1
 */
export default function DraftScreen({ cards = [], cardMap = {}, onPick, onSkip, accuracy = 1 }) {
  const [selected, setSelected] = useState(null)
  const { playSFX } = useAudio()
  const activeModifier = useRunStore(s => s.activeModifier)
  // Curse: blind_drafts — card names/effects are hidden during draft
  const isBlindDraft = activeModifier?.curse?.effect?.type === 'blind_drafts'

  const accuracyLabel = accuracy >= 0.8 ? 'Excellent!' : accuracy >= 0.6 ? 'Good' : 'Keep practicing'
  const accuracyColor = accuracy >= 0.8 ? 'text-green-400' : accuracy >= 0.6 ? 'text-yellow-400' : 'text-red-400'

  const handlePick = () => {
    if (selected) {
      playSFX('correct')
      onPick(selected)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(180deg, #0a0516 0%, #0d0d0d 100%)' }}
    >
      <div className="absolute inset-0 opacity-10"
        style={{ backgroundImage: 'radial-gradient(ellipse at 50% 20%, #E8B86D 0%, transparent 60%)' }}
      />

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-2xl px-6"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="text-4xl mb-2"
          >
            🏆
          </motion.div>
          <h1 className="text-2xl font-bold text-amber-200">Victory!</h1>
          <p className="text-sm text-gray-400 mt-1">
            Fight accuracy: <span className={accuracyColor}>{Math.round(accuracy * 100)}% — {accuracyLabel}</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">Choose a card to add to your deck, or skip.</p>
        </div>

        {/* Cards */}
        <div className="flex gap-4 justify-center flex-wrap mb-6">
          <AnimatePresence>
            {cards.map((card, i) => {
              const typeMeta = CARD_TYPE_META[card.type] || {}
              const rarityMeta = CARD_RARITY_META[card.rarity] || {}
              const isSelected = selected?.id === card.id

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 40, rotateY: 90 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ delay: i * 0.15, type: 'spring', stiffness: 280, damping: 24 }}
                  whileHover={{ y: -8, scale: 1.03 }}
                  onClick={() => { playSFX('button_click'); setSelected(isSelected ? null : card); }}
                  className={`
                    w-40 p-4 rounded-2xl border-2 cursor-pointer transition-all
                    ${typeMeta.bgClass}
                    ${isSelected ? `${rarityMeta.borderClass} ring-2 ring-yellow-400/50 shadow-xl shadow-yellow-500/20` : `${rarityMeta.borderClass}/60`}
                  `}
                  style={{ background: 'linear-gradient(160deg, rgba(18,18,24,0.95) 0%, rgba(8,8,12,0.98) 100%)' }}
                >
                  {/* Type + Rarity */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-lg">{typeMeta.icon}</span>
                    <span className={`text-xs font-bold ${rarityMeta.gemClass?.replace('bg-', 'text-')}`}>
                      {card.rarity}
                    </span>
                  </div>

                  {/* Name */}
                  <div className={`font-bold text-base mb-1 ${typeMeta.colorClass}`}>
                    {isBlindDraft ? (
                      <span className="text-gray-600 italic">???</span>
                    ) : (
                      <HoverTranslate translation={card.name_native}>{card.name_target}</HoverTranslate>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    {isBlindDraft ? '???' : card.name_native}
                  </div>

                  {/* Cost */}
                  <div className="text-xs text-gray-400 mb-2">⚡ {card.energy_cost} Energy</div>

                  {/* Effect */}
                  <div className="text-xs text-gray-300 leading-tight">
                    {isBlindDraft ? <span className="text-gray-700 italic">Effect hidden</span> : getEffectDesc(card)}
                  </div>

                  {/* Flavor */}
                  <div className="mt-3 text-[10px] text-gray-600 italic border-t border-gray-700/50 pt-2">
                    {isBlindDraft ? '...' : <HoverTranslate translation={card.flavor_native}>{card.flavor_target}</HoverTranslate>}
                  </div>

                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 text-center text-xs font-bold text-yellow-400"
                    >
                      ✓ Selected
                    </motion.div>
                  )}
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 justify-center">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handlePick}
            disabled={!selected}
            className={`
              px-8 py-3 rounded-xl font-bold text-sm border transition-all
              ${selected
                ? 'bg-amber-700/60 border-amber-500 text-amber-100 hover:bg-amber-600/60 cursor-pointer'
                : 'bg-gray-800 border-gray-700 text-gray-600 cursor-default'}
            `}
          >
            Add to Deck
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { playSFX('button_click'); onSkip(); }}
            className="px-6 py-3 rounded-xl font-medium text-sm border border-gray-700 bg-gray-800/40 text-gray-400 hover:bg-gray-700/40 hover:text-gray-200 transition-all cursor-pointer"
          >
            Skip
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

function getEffectDesc(card) {
  const e = card.effect || {}
  const parts = []
  if (e.damage) parts.push(`Deal ${e.damage}${e.bonus_correct_first_try ? ` (+${e.bonus_correct_first_try})` : ''} damage`)
  if (e.block) parts.push(`Gain ${e.block} Block`)
  if (e.heal) parts.push(`Heal ${e.heal} HP`)
  if (e.draw) parts.push(`Draw ${e.draw} card${e.draw > 1 ? 's' : ''}`)
  if (e.chain_bonus) parts.push(`Chain: +${e.chain_bonus}`)
  return parts.join('. ') || 'Special effect.'
}
