// utils/questions.js
// Question sampling and filtering utilities

/**
 * Filter questions by floor tier
 * Floor 1: tier 1 only
 * Floor 2: tier 1-2
 * Floor 3: tier 2-3
 * Floor 4: tier 3-4
 * @param {Object[]} questions
 * @param {number} floor
 * @returns {Object[]}
 */
export function filterQuestionsByFloor(questions, floor) {
  const tierMap = {
    1: [1],
    2: [1, 2],
    3: [2, 3],
    4: [3, 4],
  }
  const tiers = tierMap[floor] || [1]
  return questions.filter(q => tiers.includes(q.floor_tier))
}

/**
 * Sample a question for a given card — v2: no repeats within the same fight.
 * @param {Object} card          - card data
 * @param {Object[]} allQuestions - all questions for the campaign
 * @param {Object} graveyardEntries - graveyard store entries
 * @param {Object} settings      - settingsStore values
 * @param {number} floor         - current floor
 * @param {Object} store         - runStore instance (for fightQuestionPoolUsed + markQuestionUsed)
 * @returns {Object|null} question data or null if none found
 */
export function sampleQuestionsForCard(card, allQuestions, graveyardEntries, settings, floor, store) {
  const usedIds = store?.fightQuestionPoolUsed ?? []

  const floorFiltered = filterQuestionsByFloor(allQuestions, floor)

  // Primary pool: matching campaign, type, tags — excluding used questions this fight
  let pool = floorFiltered.filter(q =>
    q.campaign === card.campaign &&
    q.type === card.type &&
    card.question_tags.some(tag => q.tags.includes(tag)) &&
    !usedIds.includes(q.id)
  )

  // If pool exhausted by used IDs, silently reset for this card type (rare edge case)
  if (pool.length === 0) {
    const exhaustedPool = floorFiltered.filter(q =>
      q.campaign === card.campaign &&
      q.type === card.type &&
      card.question_tags.some(tag => q.tags.includes(tag))
    )
    if (exhaustedPool.length > 0) {
      console.warn(`[Ascendant] Question pool exhausted for ${card.id} — silently resetting this type's pool`)
      pool = exhaustedPool
    }
  }

  // Fallback: same type + floor, ignore tags
  if (pool.length === 0) {
    pool = floorFiltered.filter(q =>
      q.campaign === card.campaign &&
      q.type === card.type &&
      !usedIds.includes(q.id)
    )
    if (pool.length > 0) {
      console.warn(`[Ascendant] No tag match for ${card.id}, using tag-agnostic fallback pool`)
    }
  }

  // Last resort: any question of same type
  if (pool.length === 0) {
    pool = allQuestions.filter(q => q.type === card.type)
    console.warn(`[Ascendant] Empty floor pool for ${card.id}, using global fallback`)
  }

  if (pool.length === 0) {
    console.error(`[Ascendant] No questions found anywhere for ${card.id}`)
    return null
  }

  // Spaced repetition: weight toward graveyard mistakes
  if (settings?.spacedRepetition && graveyardEntries) {
    const graveyardIds = Object.keys(graveyardEntries).filter(id =>
      graveyardEntries[id] && !graveyardEntries[id].mastered
    )
    const weakPool = pool.filter(q => graveyardIds.includes(q.id))
    if (weakPool.length > 0 && Math.random() < 0.4) {
      const chosen = weakPool[Math.floor(Math.random() * weakPool.length)]
      store?.markQuestionUsed?.(chosen.id)
      return chosen
    }
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)]
  store?.markQuestionUsed?.(chosen.id) // RULE: mark before returning — no repeats this fight
  return chosen
}


/**
 * Shuffle answer options while tracking the correct answer's new index
 * Respects mastery level (3 options if mastery >= 2)
 * @param {string[]} options - all 4 answer options
 * @param {number} correctIndex - original correct answer index
 * @param {number} masteryLevel
 * @returns {{ shuffledOptions: string[], newCorrectIndex: number }}
 */
export function shuffleOptions(options, correctIndex, masteryLevel) {
  const correctAnswer = options[correctIndex]
  let opts = [...options]

  // Mastery 2+: reduce to 3 options
  if (masteryLevel >= 2 && opts.length === 4) {
    // Remove one wrong answer
    const wrongIndices = opts.map((_, i) => i).filter(i => i !== correctIndex)
    const removeIdx = wrongIndices[Math.floor(Math.random() * wrongIndices.length)]
    opts = opts.filter((_, i) => i !== removeIdx)
  }

  // Shuffle
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]]
  }

  const newCorrectIndex = opts.indexOf(correctAnswer)
  return { shuffledOptions: opts, newCorrectIndex }
}

/**
 * Calculate session accuracy (0-1)
 * @param {number} correct
 * @param {number} total
 * @returns {number}
 */
export function calculateAccuracy(correct, total) {
  if (total === 0) return 1
  return correct / total
}
