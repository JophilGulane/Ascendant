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
  const { playSFX } = useAudio()
  const activeModifier = useRunStore(s => s.activeModifier)
  // Curse: blind_drafts — card names/effects are hidden during draft
  const isBlindDraft = activeModifier?.curse?.effect?.type === 'blind_drafts'

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
        className="relative z-10 w-full max-w-4xl px-6 pt-16 flex flex-col items-center justify-center h-full"
      >
        {/* Choose a Card Scroll Header */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-[450px] z-20 pointer-events-none">
          <svg viewBox="0 0 450 80" className="w-full drop-shadow-lg" preserveAspectRatio="none">
            <path d="M 30,40 Q 20,20 10,35 Q 0,50 15,60 Q 20,65 30,60 L 420,60 Q 430,65 435,60 Q 450,50 440,35 Q 430,20 420,40 Z" fill="#D9CDB6" stroke="#A29478" strokeWidth="2" />
            <path d="M 40,30 L 410,30 L 410,70 L 40,70 Z" fill="#E8DCC4" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pt-2">
            <h2 className="text-3xl font-bold text-[#333] tracking-widest" style={{ fontFamily: "'Cinzel', serif" }}>
              Choose a Card
            </h2>
          </div>
        </div>

        {/* Cards */}
        <div className="flex gap-4 justify-center flex-wrap mb-6">
          <AnimatePresence>
            {cards.map((card, i) => {
              const typeMeta = CARD_TYPE_META[card.type] || {}
              const rarityMeta = CARD_RARITY_META[card.rarity] || {}

              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 40, rotateY: 90 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ delay: i * 0.15, type: 'spring', stiffness: 280, damping: 24 }}
                  whileHover={{ y: -15, scale: 1.05 }}
                  onClick={() => { playSFX('correct'); onPick(card); }}
                  className={`
                    w-56 p-5 rounded-2xl border-2 cursor-pointer transition-all hover:ring-2 hover:ring-yellow-400/50 hover:shadow-xl hover:shadow-yellow-500/20
                    ${typeMeta.bgClass}
                    ${rarityMeta.borderClass}/60
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
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>

        {/* Skip button */}
        <div className="flex justify-center mt-12 w-full">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { playSFX('button_click'); onSkip(); }}
            className="px-16 py-3 rounded-full font-bold text-2xl border-4 border-[#F5C842] bg-[#4FA0A0] text-[#111] hover:bg-[#5FB0B0] hover:text-white transition-all cursor-pointer shadow-[0_4px_10px_rgba(0,0,0,0.6)]"
            style={{ fontFamily: "'Cinzel', serif" }}
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
