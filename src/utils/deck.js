// utils/deck.js
// Deck manipulation utilities — shuffle, draw, discard

/**
 * Fisher-Yates shuffle — unbiased, in-place
 * @param {Array} array
 * @returns {Array} same array, shuffled
 */
export function shuffle(array) {
  const arr = [...array]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/**
 * Draw n cards from the deck. If deck runs out, shuffle discard into deck and continue.
 * @param {string[]} deck - card IDs in the draw pile
 * @param {string[]} discard - card IDs in the discard pile
 * @param {number} count - number to draw
 * @returns {{ drawn: string[], deck: string[], discard: string[] }}
 */
export function drawCards(deck, discard, count) {
  let remaining = [...deck]
  let discardPile = [...discard]
  const drawn = []

  for (let i = 0; i < count; i++) {
    if (remaining.length === 0) {
      if (discardPile.length === 0) {
        console.warn('[Ascendant] draw: deck and discard both empty')
        break
      }
      // Reshuffle discard into deck
      remaining = shuffle(discardPile)
      discardPile = []
    }
    drawn.push(remaining.pop())
  }

  return { drawn, deck: remaining, discard: discardPile }
}

/**
 * Add a card to the discard pile
 */
export function discardCard(card, discard) {
  return [...discard, card]
}

/**
 * Build a starting deck for a character
 * @param {string[]} vocabIds
 * @param {string[]} grammarIds
 * @param {string[]} readingIds
 * @param {string} rareId
 * @returns {string[]} shuffled deck
 */
export function buildStartingDeck(vocabIds, grammarIds, readingIds, rareId) {
  const full = [...vocabIds, ...grammarIds, ...readingIds, rareId].filter(Boolean)
  return shuffle(full)
}

/**
 * Check if a card can be played given current energy
 * @param {Object} card - card data object with energy_cost
 * @param {number} currentEnergy
 * @returns {boolean}
 */
export function canPlayCard(card, currentEnergy) {
  return card.energy_cost <= currentEnergy
}
