// components/combat/CardHand.jsx
// Renders up to 5 cards in a fanned arc layout
// Handles card selection, fires onCardSelect callback
// Memoized — only re-renders if hand contents change

import React from 'react'
import { AnimatePresence } from 'framer-motion'
import CardComponent from './CardComponent.jsx'
import { CARD_TYPES } from '../../constants/cardTypes.js'

/**
 * @param {string[]} handIds - card IDs in current hand
 * @param {Object} cardMap - map of cardId → card data
 * @param {number} currentEnergy - player's current energy
 * @param {string|null} selectedCardId
 * @param {boolean} chainActive
 * @param {string|null} chainType - type of chain active
 * @param {boolean} hasConjugationArmor - enemy has grammar block active
 * @param {boolean} disabled - e.g. during enemy turn animation
 * @param {function} onCardSelect(cardId)
 */
const CardHand = React.memo(function CardHand({
  handIds = [],
  cardMap = {},
  currentEnergy = 3,
  selectedCardId = null,
  chainActive = false,
  chainType = null,
  hasConjugationArmor = false,
  disabled = false,
  onCardSelect,
}) {
  const cards = handIds.map(id => cardMap[id]).filter(Boolean)

  return (
    <div className="flex items-end justify-center gap-1 px-4 pb-2">
      <AnimatePresence mode="popLayout">
        {cards.map((card, i) => {
          const canAfford = currentEnergy >= card.energy_cost
          const isPrimed =
            chainActive && chainType &&
            ((chainType === CARD_TYPES.VOCABULARY && card.type === CARD_TYPES.GRAMMAR) ||
             (chainType === CARD_TYPES.GRAMMAR && card.type === CARD_TYPES.READING))

          const isGrammarBlocked = hasConjugationArmor && card.type === CARD_TYPES.GRAMMAR

          return (
            <CardComponent
              key={card.id + i}
              card={card}
              isPlayable={canAfford && !disabled}
              isPrimed={isPrimed}
              isSelected={selectedCardId === card.id}
              isGrammarBlocked={isGrammarBlocked}
              onSelect={disabled ? undefined : onCardSelect}
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
