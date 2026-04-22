// components/combat/CardComponent.jsx
// Renders a single card. Has NO knowledge of combat state.
// Receives everything via props, fires callbacks.

import React from 'react'
import { motion } from 'framer-motion'
import { CARD_TYPE_META, CARD_RARITY_META, CARD_TYPES } from '../../constants/cardTypes.js'
import { HoverTranslate } from '../shared/HoverTranslate.jsx'

/**
 * @param {Object} card - card data object from cards.json
 * @param {boolean} isPlayable - player has enough energy
 * @param {boolean} isLocked   - wrong answer locked this card until next turn
 * @param {boolean} isSilenced - silence debuff — cannot play this type
 * @param {boolean} isPrimed   - chain is active and this card would trigger a combo
 * @param {boolean} isSelected - this card is currently selected
 * @param {boolean} isShaking  - shake animation trigger (locked card clicked)
 * @param {function} onSelect  - called when card is clicked
 * @param {number} indexInHand - position in hand (0-4) for fan angle
 * @param {number} totalInHand - total cards in hand
 */
const CardComponent = React.memo(function CardComponent({
  card,
  isPlayable = true,
  isLocked = false,
  isSilenced = false,
  isPrimed = false,
  isSelected = false,
  isShaking = false,
  onSelect,
  indexInHand = 0,
  totalInHand = 5,
}) {
  if (!card) return null

  const typeMeta = CARD_TYPE_META[card.type] || CARD_TYPE_META[CARD_TYPES.VOCABULARY]
  const rarityMeta = CARD_RARITY_META[card.rarity] || CARD_RARITY_META['common']

  // v2: locked = wrong answer this turn, silenced = silence debuff on this card type
  const isBlocked = isLocked || isSilenced
  const canInteract = isPlayable && !isBlocked && !isSelected

  // Fan angle based on position in hand
  const centerIdx = (totalInHand - 1) / 2
  const angle = (indexInHand - centerIdx) * 5
  const yOffset = Math.abs(indexInHand - centerIdx) * 6

  return (
    <motion.div
      className="relative select-none"
      style={{ originY: 1.5 }}
      initial={{ opacity: 0, y: 60, scale: 0.8, rotate: angle }}
      animate={{
        opacity: canInteract ? 1 : 0.45,
        y: isSelected ? yOffset - 50 : yOffset,
        scale: isSelected ? 1.08 : 1,
        rotate: isShaking ? [0, -8, 8, -8, 8, -4, 4, 0] : (isSelected ? 0 : angle),
        zIndex: isSelected ? 50 : indexInHand,
        filter: isLocked ? 'grayscale(100%)' : 'grayscale(0%)',
      }}
      whileHover={canInteract ? {
        y: yOffset - 28,
        scale: 1.05,
        rotate: 0,
        zIndex: 40,
        transition: { type: 'spring', stiffness: 500, damping: 30 },
      } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => canInteract && onSelect?.(card.id)}
    >
      {/* Pulsing outline when primed for chain */}
      {isPrimed && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none z-10"
          animate={{ boxShadow: ['0 0 8px #EAB308', '0 0 20px #EAB308', '0 0 8px #EAB308'] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      )}

      {/* Card body */}
      <div
        className={`
          relative w-28 h-40 rounded-xl overflow-hidden cursor-pointer
          border-2 ${rarityMeta.borderClass}
          ${typeMeta.bgClass}
          transition-shadow duration-200
          ${isPlayable && !isBlocked ? typeMeta.glowClass + ' shadow-lg hover:shadow-xl' : ''}
          ${isBlocked ? 'grayscale' : ''}
        `}
        style={{ background: 'linear-gradient(160deg, rgba(18,18,24,0.95) 0%, rgba(8,8,12,0.98) 100%)' }}
      >
        {/* Top row: Energy cost + Rarity gem */}
        <div className="absolute top-1.5 left-1.5 right-1.5 flex justify-between items-start z-10">
          <span className="text-white font-bold text-sm bg-black/60 rounded-full w-5 h-5 flex items-center justify-center">
            {card.energy_cost}
          </span>
          <span className={`w-3 h-3 rounded-full ${rarityMeta.gemClass}`} title={rarityMeta.label} />
        </div>

        {/* Card Illustration Placeholder */}
        <div className={`absolute top-6 left-0 right-0 h-14 flex items-center justify-center ${typeMeta.bgClass}/60`}>
          {card.illustration ? (
            <img src={card.illustration} alt="" className="object-cover w-full h-full" />
          ) : (
            <span className="text-3xl">{typeMeta.icon}</span>
          )}
        </div>

        {/* Card Name */}
        <div className="absolute top-20 left-0 right-0 px-1.5">
          <div className={`text-center text-[10px] font-bold ${typeMeta.colorClass} truncate`}>
            <HoverTranslate translation={card.name_native}>
              {card.name_target}
            </HoverTranslate>
          </div>
          <div className="text-center text-[8px] text-gray-500 truncate">{card.name_native}</div>
        </div>

        {/* Divider */}
        <div className={`absolute top-28 left-2 right-2 h-px ${typeMeta.borderClass}/50`} />

        {/* Effect description */}
        <div className="absolute top-29 left-1 right-1 bottom-6 overflow-hidden">
          <p className="text-[7px] text-gray-300 text-center leading-tight px-0.5 mt-1">
            {getEffectDescription(card)}
          </p>
        </div>

        {/* Flavor text */}
        <div className="absolute bottom-1 left-0 right-0 px-1">
          <div className="text-center text-[7px] text-gray-600 italic truncate">
            <HoverTranslate translation={card.flavor_native}>
              {card.flavor_target}
            </HoverTranslate>
          </div>
        </div>

        {/* v2: Locked overlay — wrong answer this turn */}
        {isLocked && (
          <div className="absolute inset-0 bg-gray-900/70 flex flex-col items-center justify-center rounded-xl border-2 border-red-700">
            <span className="text-xl">🔒</span>
            <span className="text-[8px] text-red-400 font-bold mt-0.5">Locked</span>
          </div>
        )}

        {/* Silenced overlay */}
        {isSilenced && !isLocked && (
          <div className="absolute inset-0 bg-purple-950/60 flex items-center justify-center rounded-xl border border-purple-700">
            <span className="text-lg">🔇</span>
          </div>
        )}

        {/* Not enough energy overlay */}
        {!canInteract && !isLocked && !isSilenced && (
          <div className="absolute inset-0 bg-black/40 rounded-xl pointer-events-none" />
        )}
      </div>
    </motion.div>
  )
})

function getEffectDescription(card) {
  const e = card.effect || {}
  const parts = []
  if (e.damage) parts.push(`${e.hits && e.hits > 1 ? `${e.hits}×` : ''}${e.damage} dmg${e.bonus_correct_first_try ? ` (+${e.bonus_correct_first_try} 1st try)` : ''}`)
  if (e.block) parts.push(`${e.block} block`)
  if (e.heal) parts.push(`heal ${e.heal} HP`)
  if (e.draw) parts.push(`draw ${e.draw}`)
  if (e.stun) parts.push(`stun ${e.stun} turn`)
  if (e.chain_bonus) parts.push(`+${e.chain_bonus} chain`)
  if (e.bonus_if_block_active) parts.push(`+${e.bonus_if_block_active} if block`)
  return parts.join(' · ') || 'Special effect'
}

export default CardComponent
