// components/combat/CardComponent.jsx — STS style redesign
// Renders a single card with thick borders, energy orb, and structured text banners.

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

  const isBlocked = isLocked || isSilenced
  const canInteract = isPlayable && !isBlocked && !isSelected

  // Fan angle calculation (STS style curve)
  const centerIdx = (totalInHand - 1) / 2
  const angle = (indexInHand - centerIdx) * 6
  // Curve height
  const yOffset = Math.pow(indexInHand - centerIdx, 2) * 4

  // Card specific colors
  const cardColorHex = {
    [CARD_TYPES.VOCABULARY]: '#991b1b', // Red
    [CARD_TYPES.GRAMMAR]:    '#1e3a8a', // Blue
    [CARD_TYPES.READING]:    '#14532d', // Green
  }[card.type] || '#4b5563'

  return (
    <motion.div
      className="relative select-none"
      style={{ originY: 1.5 }}
      initial={{ opacity: 0, y: 100, scale: 0.8, rotate: angle }}
      animate={{
        opacity: canInteract ? 1 : 0.6,
        y: isSelected ? yOffset - 40 : yOffset,
        scale: isSelected ? 1.15 : 1,
        rotate: isShaking ? [0, -8, 8, -8, 8, -4, 4, 0] : (isSelected ? 0 : angle),
        zIndex: isSelected ? 50 : indexInHand,
        filter: isLocked ? 'grayscale(100%)' : 'grayscale(0%)',
      }}
      whileHover={canInteract ? {
        y: yOffset - 30,
        scale: 1.1,
        rotate: 0,
        zIndex: 40,
        transition: { type: 'spring', stiffness: 400, damping: 25 },
      } : {}}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => canInteract && onSelect?.(card.id)}
    >
      {/* Glow for primed cards */}
      {isPrimed && (
        <motion.div
          className="absolute inset-0 rounded-lg pointer-events-none z-10"
          animate={{ boxShadow: ['0 0 10px #F5C842', '0 0 25px #F5C842', '0 0 10px #F5C842'] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* ── Main Card Body ── */}
      <div
        className="relative w-[140px] h-[190px] cursor-pointer"
        style={{
          background: `linear-gradient(150deg, #2a2a2a, #111)`,
          border: '4px solid #333',
          borderRadius: '10px',
          boxShadow: isSelected ? '0 10px 30px rgba(0,0,0,0.8)' : '0 4px 10px rgba(0,0,0,0.6)',
          overflow: 'visible', // allow energy orb to break bounds
          fontFamily: "'Crimson Text', Georgia, serif"
        }}
      >
        {/* Inner colored background based on type */}
        <div className="absolute inset-0 m-0.5 rounded-sm" style={{ background: `linear-gradient(180deg, ${cardColorHex}dd, ${cardColorHex}66)` }} />

        {/* ── Card Name Banner ── */}
        <div className="absolute top-2 left-3 right-2 h-6 flex items-center justify-center bg-black/60 border border-gray-500/30 rounded-sm">
          <div className="text-center font-bold text-white text-[11px] leading-none px-1 truncate w-full" style={{ textShadow: '1px 1px 2px #000' }}>
            <HoverTranslate translation={card.name_native}>
              {card.name_target}
            </HoverTranslate>
          </div>
        </div>

        {/* ── Illustration Area ── */}
        <div className="absolute top-9 left-2 right-2 h-[70px] bg-black/40 border-2 border-gray-600/50 flex items-center justify-center overflow-hidden">
          {card.illustration ? (
            <img src={card.illustration} alt="" className="object-cover w-full h-full opacity-80 mix-blend-screen" />
          ) : (
            <span className="text-4xl opacity-50 drop-shadow-md">{typeMeta.icon}</span>
          )}
        </div>

        {/* ── Type Banner ── */}
        <div className="absolute top-[82px] left-1/2 -translate-x-1/2 bg-[#1a1a1a] border border-[#555] rounded-full px-2 py-[1px] text-[8px] text-gray-300 font-bold tracking-wider uppercase shadow-md whitespace-nowrap">
          {card.type}
        </div>

        {/* ── Text Box ── */}
        <div className="absolute top-[96px] left-2 right-2 bottom-2 bg-[#f4ebd8]/90 border border-[#b8a066] rounded-sm p-1.5 flex flex-col justify-between">
          <div className="text-[10px] text-center text-gray-900 leading-tight font-bold" style={{ textShadow: 'none' }}>
            {getEffectDescription(card)}
          </div>
          <div className="text-center text-[8px] text-gray-600 italic leading-tight truncate">
             <HoverTranslate translation={card.flavor_native}>{card.flavor_target}</HoverTranslate>
          </div>
        </div>

        {/* ── Energy Orb (Top Left overlap) ── */}
        <div
          className="absolute -top-3 -left-3 w-8 h-8 rounded-full border-2 border-[#8a4a1c] flex items-center justify-center font-black text-[15px] text-white shadow-lg"
          style={{
            background: 'radial-gradient(circle, #ffaa00, #993300)',
            textShadow: '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000',
            zIndex: 10
          }}
        >
          {card.energy_cost}
        </div>

        {/* ── Rarity Gem (Top Right) ── */}
        <div className={`absolute top-0.5 right-0.5 w-3 h-3 rounded-full border border-black shadow-sm ${rarityMeta.gemClass}`} title={rarityMeta.label} />

        {/* ── Lock/Silence Overlays ── */}
        {isLocked && (
          <div className="absolute inset-0 bg-gray-900/80 flex flex-col items-center justify-center rounded-lg border-2 border-red-700 z-20">
            <span className="text-3xl filter drop-shadow-[0_0_8px_#f00]">🔒</span>
            <span className="text-[10px] text-red-400 font-bold mt-1 bg-black/60 px-2 rounded">LOCKED</span>
          </div>
        )}

        {isSilenced && !isLocked && (
          <div className="absolute inset-0 bg-purple-900/70 flex items-center justify-center rounded-lg border-2 border-purple-500 z-20">
            <span className="text-3xl filter drop-shadow-[0_0_8px_#a855f7]">🔇</span>
          </div>
        )}

        {/* Unplayable Dimming */}
        {!canInteract && !isLocked && !isSilenced && (
          <div className="absolute inset-0 bg-black/50 rounded-lg pointer-events-none z-20" />
        )}
      </div>
    </motion.div>
  )
})

function getEffectDescription(card) {
  const e = card.effect || {}
  const parts = []
  if (e.damage) parts.push(`Deal ${e.damage} damage.${e.hits && e.hits > 1 ? ` (${e.hits} times)` : ''}${e.bonus_correct_first_try ? ` If 1st try, deal ${e.damage + e.bonus_correct_first_try} instead.` : ''}`)
  if (e.block) parts.push(`Gain ${e.block} Block.`)
  if (e.heal) parts.push(`Heal ${e.heal} HP.`)
  if (e.draw) parts.push(`Draw ${e.draw} card${e.draw > 1 ? 's' : ''}.`)
  if (e.stun) parts.push(`Stun enemy for ${e.stun} turn.`)
  if (e.chain_bonus) parts.push(`Adds +${e.chain_bonus} to Chain.`)
  if (e.bonus_if_block_active) parts.push(`If Block active, gain +${e.bonus_if_block_active}.`)
  return parts.join(' ') || 'Special effect'
}

export default CardComponent
