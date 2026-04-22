// utils/enemyTurn.js — v2
// All enemy action resolution logic. Called by useEnemyTurn.js.
// Pure functions that read and write to the store via actions — never mutate directly.

const delay = (ms) => new Promise(r => setTimeout(r, ms))

/**
 * Execute one enemy action. The store is read via getState() inside for freshness.
 * @param {string} action - MOVE_TYPE string
 * @param {Object} enemy  - current enemy data
 * @param {Object} store  - runStore instance (has all action methods)
 * @param {function} playSFX
 * @returns {Promise<{ message: string, icon: string }>} - what to display during animation
 */
export async function resolveEnemyAction(action, enemy, store, playSFX) {
  switch (action) {
    case 'strike': {
      // Read live state
      const s = () => store // store is reactive — re-read via getState if needed
      let damage = enemy.base_attack

      // Apply accumulated wrong-answer buffs (confusion → bonus attack)
      const confusionBuff = store.activeEnemyBuffs.find(b => b.type === 'confusion')
      if (confusionBuff) damage += (confusionBuff.attack_bonus || 2)

      // Fury stacks: at 3 stacks, damage doubles, fury resets
      if (store.enemyFuryStacks >= 3) {
        damage *= 2
        store.clearEnemyFury()
      }

      // Apply player block
      const currentBlock = store.block
      const blocked = Math.min(currentBlock, damage)
      const remaining = damage - blocked
      if (blocked > 0) store.spendBlock(blocked)
      if (remaining > 0) {
        const newHp = store.hp - remaining
        // Blessing: last_stand — survive one killing blow at 1 HP (once per run)
        const lastStandBlessing = store.activeModifier?.blessing?.effect?.type === 'last_stand'
        if (lastStandBlessing && !store.lastStandUsed && newHp <= 0) {
          store.setHp(1)
          store.useLastStand()
        } else {
          store.setHp(newHp)
        }
      }

      playSFX?.('enemy_strike')
      return {
        icon: '⚔️',
        message: blocked > 0
          ? `Strike! ${remaining > 0 ? `-${remaining} HP` : `Blocked!`}`
          : `-${damage} HP`,
        type: 'damage',
        value: remaining,
      }
    }

    case 'debuff_silence': {
      const silenceTarget = enemy.silence_type || 'vocabulary'
      store.addPlayerDebuff({ type: 'silence', target: silenceTarget, duration: 2 })
      playSFX?.('debuff_apply')
      return { icon: '🔇', message: `Silence! ${silenceTarget} cards muted`, type: 'debuff' }
    }

    case 'debuff_drain': {
      store.addPlayerDebuff({ type: 'drain', energy_penalty: 1, duration: 2 })
      playSFX?.('debuff_apply')
      return { icon: '⚡', message: 'Drain! −1 Energy next turn', type: 'debuff' }
    }

    case 'debuff_fog': {
      store.addPlayerDebuff({ type: 'fog', duration: 1 })
      playSFX?.('debuff_apply')
      return { icon: '🌫️', message: 'Fog! Next answer obscured', type: 'debuff' }
    }

    case 'debuff_bind': {
      store.addPlayerDebuff({ type: 'bind', draw_penalty: 1, duration: 2 })
      playSFX?.('debuff_apply')
      return { icon: '🔗', message: 'Bind! Draw 1 fewer card', type: 'debuff' }
    }

    case 'debuff_confusion': {
      store.addPlayerDebuff({ type: 'confusion', duration: 1 })
      playSFX?.('debuff_apply')
      return { icon: '🔀', message: 'Confusion! Options shuffle at 3s', type: 'debuff' }
    }

    case 'self_buff_armor_up': {
      store.addEnemyArmor(8)
      playSFX?.('enemy_buff')
      return { icon: '🛡️', message: 'Armor Up! +8 armor', type: 'selfbuff' }
    }

    case 'self_buff_recover': {
      if (store.enemyHp < store.enemyMaxHp * 0.5) {
        store.healEnemy(15)
        playSFX?.('enemy_heal')
        return { icon: '💉', message: 'Recover! +15 HP', type: 'selfbuff' }
      }
      return { icon: '💉', message: 'Recover (HP too high)', type: 'selfbuff' }
    }

    case 'self_buff_power_up': {
      store.addEnemyFury()
      playSFX?.('enemy_buff')
      const newFury = store.enemyFuryStacks + 1
      return {
        icon: '🔥',
        message: `Power Up! Fury ${newFury}/3${newFury >= 3 ? ' — NEXT STRIKE DOUBLES' : ''}`,
        type: 'selfbuff',
      }
    }

    case 'self_buff_focus': {
      const mostUsed = getMostUsedCardType(store)
      if (mostUsed) {
        store.setEnemyFocusType(mostUsed)
        playSFX?.('enemy_buff')
        return { icon: '👁️', message: `Focus! Resists ${mostUsed} cards (−50% dmg)`, type: 'selfbuff' }
      }
      return { icon: '👁️', message: 'Focus (observing...)', type: 'selfbuff' }
    }

    default: {
      // DECISION: unknown or special moves log a warning and are skipped
      console.warn(`[Ascendant] Unknown enemy action: ${action}`)
      return { icon: '❓', message: `${action}`, type: 'special' }
    }
  }
}

/**
 * Returns the card type the player has played most this fight.
 * Used by self_buff_focus to choose which type to resist.
 */
function getMostUsedCardType(store) {
  const counts = store.cardTypesPlayedThisFight || {}
  const entries = Object.entries(counts)
  if (entries.length === 0) return null
  return entries.sort((a, b) => b[1] - a[1])[0][0]
}

/**
 * Compute effective draw count (respects Bind debuff)
 */
export function getEffectiveDrawCount(store, base = 5) {
  const bindDebuff = store.activePlayerDebuffs.find(d => d.type === 'bind')
  return bindDebuff ? base - (bindDebuff.draw_penalty || 1) : base
}

/**
 * Compute effective starting energy (respects Drain debuff)
 */
export function getEffectiveMaxEnergy(store) {
  const drainDebuff = store.activePlayerDebuffs.find(d => d.type === 'drain')
  return drainDebuff ? store.maxEnergy - (drainDebuff.energy_penalty || 1) : store.maxEnergy
}

/**
 * Check if a card type is silenced by an active Silence debuff
 */
export function isCardTypeSilenced(cardType, store) {
  return store.activePlayerDebuffs.some(
    d => d.type === 'silence' && d.target === cardType
  )
}
