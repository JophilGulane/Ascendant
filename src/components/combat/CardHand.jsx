// components/combat/CardHand.jsx — v2
// Renders up to 5 cards in a fanned arc layout.
// v2: passes isLocked and isSilenced to each card.
// Locked card clicks trigger shake animation instead of selection.

import React, { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import CardComponent from './CardComponent.jsx'
import { CARD_TYPES } from '../../constants/cardTypes.js'

/**
 * @param {string[]} handIds        - card IDs in current hand
 * @param {Object} cardMap          - map of cardId → card data
 * @param {number} currentEnergy    - player's current energy
 * @param {string[]} lockedCards    - v2: card IDs locked this turn
 * @param {string[]} silencedTypes  - v2: card types currently silenced (from debuffs)
 * @param {string[]} retainedCards  - v3: card IDs retained across turns
 * @param {Object} retainGrowthStacks - v3: map of cardId → number of growth stacks
 * @param {string|null} selectedCardId
 * @param {boolean} chainActive
 * @param {string|null} chainType   - type of chain active
 * @param {boolean} disabled        - during enemy turn animation
 * @param {function} onCardSelect(cardId)
 */
const CardHand = React.memo(function CardHand({
  handIds = [],
  cardMap = {},
  currentEnergy = 3,
  lockedCards = [],
  silencedTypes = [],
  retainedCards = [],
  retainGrowthStacks = {},
  selectedCardId = null,
  chainActive = false,
  chainType = null,
  disabled = false,
  onCardSelect,
}) {
  // Track which card is currently shaking (locked or silenced click)
  const [shakingCardId, setShakingCardId] = useState(null)

  const handleCardClick = useCallback((cardId) => {
    if (disabled) return
    const card = cardMap[cardId]
    if (!card) return

    // v2: locked card → shake animation, no selection
    if (lockedCards.includes(cardId)) {
      setShakingCardId(cardId)
      setTimeout(() => setShakingCardId(null), 500)
      return
    }

    // v2: silenced type → shake and show (selection blocked in useCombat too)
    if (silencedTypes.includes(card.type)) {
      setShakingCardId(cardId)
      setTimeout(() => setShakingCardId(null), 500)
      return
    }

    onCardSelect?.(cardId)
  }, [disabled, lockedCards, silencedTypes, cardMap, onCardSelect])

  const cards = handIds.map(id => cardMap[id]).filter(Boolean)

  return (
    <div className="flex items-end justify-center gap-1 px-4 pb-2">
      <AnimatePresence mode="popLayout">
        {cards.map((card, i) => {
          const canAfford = currentEnergy >= card.energy_cost
          const isLocked = lockedCards.includes(card.id)
          const isSilenced = silencedTypes.includes(card.type)
          const isRetained = retainedCards.includes(card.id)
          const growthStacks = retainGrowthStacks[card.id] || 0

          const isPrimed =
            !isLocked &&
            chainActive && chainType &&
            ((chainType === CARD_TYPES.VOCABULARY && card.type === CARD_TYPES.GRAMMAR) ||
             (chainType === CARD_TYPES.GRAMMAR   && card.type === CARD_TYPES.READING))

          return (
            <CardComponent
              key={card.id + i}
              card={card}
              isPlayable={canAfford && !disabled}
              isLocked={isLocked}
              isSilenced={isSilenced}
              isPrimed={isPrimed}
              isRetained={isRetained}
              growthStacks={growthStacks}
              isSelected={selectedCardId === card.id}
              isShaking={shakingCardId === card.id}
              onSelect={handleCardClick}
              indexInHand={i}
              totalInHand={cards.length}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
})

export default CardHand
