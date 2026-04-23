// utils/combat.js
// All combat resolution logic — damage, block, chain, buffs, enemy turns

import { CARD_TYPES } from '../constants/cardTypes.js'

/**
 * Resolve chain state when a card is played.
 * Returns a bonus multiplier and updates chain state.
 * @param {string} playedCardType - CARD_TYPES value
 * @param {{ chainActive: boolean, chainType: string|null }} chainState
 * @param {Object} store - runStore instance (for activateChain / breakChain)
 * @param {boolean} hasChainBracelet - relic that adds reverse chain direction
 * @returns {{ bonusMultiplier: number }}
 */
export function resolveChain(playedCardType, chainState, store, hasChainBracelet = false) {
  const { chainActive, chainType } = chainState

  if (!chainActive) {
    // First card — check if it primes a chain
    if (playedCardType === CARD_TYPES.VOCABULARY) {
      store.activateChain(CARD_TYPES.VOCABULARY) // primes grammar
    }
    if (playedCardType === CARD_TYPES.GRAMMAR) {
      store.activateChain(CARD_TYPES.GRAMMAR) // primes reading (and vocab if relic)
    }
    return { bonusMultiplier: 1 }
  }

  // Chain is active — check if this card benefits from it
  if (chainType === CARD_TYPES.VOCABULARY && playedCardType === CARD_TYPES.GRAMMAR) {
    store.breakChain()
    return { bonusMultiplier: 1.5 } // Grammar card gets 50% bonus (deals bonus damage equal to 50% of block value)
  }

  if (chainType === CARD_TYPES.GRAMMAR && playedCardType === CARD_TYPES.READING) {
    store.breakChain()
    return { bonusMultiplier: 2 } // Reading card effect is doubled
  }

  // Chain Bracelet relic: grammar can also prime vocabulary (reverse chain)
  if (hasChainBracelet && chainType === CARD_TYPES.GRAMMAR && playedCardType === CARD_TYPES.VOCABULARY) {
    store.breakChain()
    return { bonusMultiplier: 1.5 }
  }

  // Wrong card type — chain breaks, no bonus
  store.breakChain()
  return { bonusMultiplier: 1 }
}

/**
 * Calculate final damage dealt to enemy
 */
export function calculateDamage({
  base,
  bonusCorrectFirstTry = 0,
  chainMultiplier = 1,
  isFirstTry = false,
  hits = 1,
}) {
  let dmg = base
  if (isFirstTry && bonusCorrectFirstTry) dmg += bonusCorrectFirstTry
  dmg = Math.floor(dmg * chainMultiplier)
  // NOTE: armor reduction is handled by damageEnemy in runStore — do NOT subtract here
  return dmg * hits
}

/**
 * Calculate final block gained by player
 */
export function calculateBlock({ base, chainMultiplier = 1 }) {
  return Math.floor(base * chainMultiplier)
}

/**
 * Apply incoming damage to player, absorbing block first
 * @returns {{ newHp: number, newBlock: number, damageDealt: number }}
 */
export function applyDamageToPlayer(damage, currentHp, currentBlock) {
  const blocked = Math.min(currentBlock, damage)
  const remaining = damage - blocked
  return {
    newHp: Math.max(0, currentHp - remaining),
    newBlock: Math.max(0, currentBlock - blocked),
    damageDealt: remaining,
  }
}

/**
 * Resolve an enemy's turn based on their intent pattern index
 * @param {Object} enemy - enemy data object
 * @param {number} intentIndex - current turn index
 * @param {Object[]} enemyBuffs - active enemy buff array
 * @returns {{ type: string, damage?: number, buff?: Object }}
 */
export function resolveEnemyTurn(enemy, intentIndex, enemyBuffs) {
  const intent = enemy.intent_pattern[intentIndex % enemy.intent_pattern.length]

  if (intent === 'attack') {
    let damage = enemy.attack

    // Apply enemy buff modifiers
    const confusionBuff = enemyBuffs.find(b => b.type === 'confusion')
    if (confusionBuff) damage += confusionBuff.effect_value || 0

    const wrathBuff = enemyBuffs.find(b => b.type === 'mountain_wrath')
    if (wrathBuff) damage += wrathBuff.effect_value || 0

    return { type: 'attack', damage }
  }

  // vocabulary / grammar / reading intents are informational only
  return { type: intent }
}

/**
 * Get the next intent in an enemy's pattern
 * @param {Object} enemy
 * @param {number} currentIntentIndex
 * @returns {string} next intent type
 */
export function getNextIntent(enemy, currentIntentIndex) {
  const nextIdx = (currentIntentIndex + 1) % enemy.intent_pattern.length
  return enemy.intent_pattern[nextIdx]
}

/**
 * Apply a wrong-answer enemy buff to the buff list
 */
export function applyEnemyBuff(existingBuffs, buffTemplate) {
  // Don't stack exact same buff type if already active
  const existing = existingBuffs.find(b => b.type === buffTemplate.type)
  if (existing) {
    // Refresh duration instead
    return existingBuffs.map(b =>
      b.type === buffTemplate.type
        ? { ...b, duration_turns: buffTemplate.duration_turns }
        : b
    )
  }
  return [...existingBuffs, { ...buffTemplate, id: `${buffTemplate.type}_${Date.now()}` }]
}

/**
 * Tick down buff durations at end of turn — remove expired buffs
 */
export function tickBuffs(buffs) {
  return buffs
    .map(b => ({ ...b, duration_turns: b.duration_turns - 1 }))
    .filter(b => b.duration_turns > 0 || b.duration_turns === -1) // -1 = permanent
}

/**
 * Full combat state reset — call at the start of every fight
 */
export function getResetCombatState() {
  return {
    inCombat: true,
    enemyBuffs: [],
    chainActive: false,
    chainType: null,
    turnNumber: 0,
    hintUsedThisFight: false,
    intentIndex: 0,
  }
}
