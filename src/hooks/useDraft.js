// hooks/useDraft.js
// Card draft logic after combat

import { useState, useCallback } from 'react'
import useRunStore from '../stores/runStore.js'
import { shuffle } from '../utils/deck.js'
import { isRuleActive } from '../constants/masteryRules.js'

const cardCache = {}
async function loadCards(campaign) {
  if (cardCache[campaign]) return cardCache[campaign]
  try {
    const mod = await import(`../data/${campaign}/cards.json`)
    cardCache[campaign] = mod.default
    return cardCache[campaign]
  } catch {
    return []
  }
}

/**
 * Calculate draft pool size and rarity based on fight accuracy
 * @param {number} accuracy - 0 to 1
 * @param {number} masteryLevel
 * @returns {{ count: number, allowRare: boolean }}
 */
export function calculateDraftPool(accuracy, masteryLevel) {
  let pool = { count: 3, allowRare: accuracy >= 0.8 }

  // Mastery 9: draft pools reduced by 1
  if (isRuleActive('smaller_draft', masteryLevel)) {
    pool.count = Math.max(1, pool.count - 1)
  }

  return pool
}

export function useDraft() {
  const store = useRunStore()
  const [draftCards, setDraftCards] = useState([])
  const [isDrafting, setIsDrafting] = useState(false)

  const openDraft = useCallback(async (fightAccuracy, guaranteedRarity = null) => {
    const pool = calculateDraftPool(fightAccuracy, store.masteryLevel)
    const allCards = await loadCards(store.campaign)

    // Boss rewards bypass normal pool logic
    if (guaranteedRarity) {
      const eligible = allCards.filter(c => c.campaign === store.campaign && c.rarity === guaranteedRarity)
      const sampled = shuffle(eligible).slice(0, 3) // Give 3 choices of that rarity
      setDraftCards(sampled)
      setIsDrafting(true)
      return
    }

    const eligible = allCards.filter(c =>
      c.campaign === store.campaign &&
      (pool.allowRare || (c.rarity !== 'rare' && c.rarity !== 'story_rare')) &&
      c.rarity !== 'story_rare' // story rares only from boss rewards
    )

    const sampled = shuffle(eligible).slice(0, pool.count)
    setDraftCards(sampled)
    setIsDrafting(true)
  }, [store.campaign, store.masteryLevel])

  const pickCard = useCallback((card) => {
    if (!card) {
      // Skip
      setIsDrafting(false)
      setDraftCards([])
      return
    }
    store.addCardToDeck(card.id)
    setIsDrafting(false)
    setDraftCards([])
  }, [store])

  const skipDraft = useCallback(() => {
    setIsDrafting(false)
    setDraftCards([])
  }, [])

  return { draftCards, isDrafting, openDraft, pickCard, skipDraft }
}
