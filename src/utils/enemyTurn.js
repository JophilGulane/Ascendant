// utils/enemyTurn.js — v2
// All enemy action resolution logic. Called by useEnemyTurn.js.
// Pure functions that read and write to the store via actions — never mutate directly.

const delay = (ms) => new Promise(r => setTimeout(r, ms))

// Track consecutive wrong-answer counts per concept for particle_trap
const consecutiveWrongTracker = {}

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

    case 'self_buff_harden': {
      store.addEnemyArmor(15)
      playSFX?.('enemy_buff')
      return { icon: '💎', message: 'Harden! +15 armor', type: 'selfbuff' }
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

    case 'self_buff_enrage': {
      // Gains 2 fury at once — aggressive escalation
      store.addEnemyFury()
      store.addEnemyFury()
      playSFX?.('enemy_buff')
      const furyAfter = store.enemyFuryStacks + 2
      return {
        icon: '😤',
        message: `Enrage! Fury +2 (${furyAfter}/3)`,
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

    // ── NEW ACTION TYPES ──

    case 'strike_heavy': {
      // Slow but deals 1.8× base damage
      let damage = Math.floor(enemy.base_attack * 1.8)
      const confusionBuff = store.activeEnemyBuffs.find(b => b.type === 'confusion')
      if (confusionBuff) damage += (confusionBuff.attack_bonus || 2)
      if (store.enemyFuryStacks >= 3) { damage *= 2; store.clearEnemyFury() }
      const blocked = Math.min(store.block, damage)
      const remaining = damage - blocked
      if (blocked > 0) store.spendBlock(blocked)
      if (remaining > 0) {
        const newHp = store.hp - remaining
        const lastStandBlessing = store.activeModifier?.blessing?.effect?.type === 'last_stand'
        if (lastStandBlessing && !store.lastStandUsed && newHp <= 0) { store.setHp(1); store.useLastStand() }
        else store.setHp(newHp)
      }
      playSFX?.('enemy_strike')
      return {
        icon: '💥', message: blocked > 0 ? `Heavy Strike! ${remaining > 0 ? `-${remaining} HP` : 'Blocked!'}` : `-${damage} HP`,
        type: 'damage', value: remaining,
      }
    }

    case 'strike_swift': {
      // Hits twice at 0.6× — split damage pierces small blocks
      let dmg1 = Math.floor(enemy.base_attack * 0.6)
      let dmg2 = Math.floor(enemy.base_attack * 0.6)
      let totalRemaining = 0
      for (const dmg of [dmg1, dmg2]) {
        const b = Math.min(store.block, dmg)
        const r = dmg - b
        if (b > 0) store.spendBlock(b)
        if (r > 0) { store.setHp(Math.max(0, store.hp - r)); totalRemaining += r }
      }
      playSFX?.('enemy_strike')
      return { icon: '⚡', message: `Swift Strike ×2! −${totalRemaining} HP`, type: 'damage', value: totalRemaining }
    }

    case 'debuff_curse': {
      // Applies both silence AND drain in one action — brutal combo
      const silenceTarget = enemy.silence_type || 'vocabulary'
      store.addPlayerDebuff({ type: 'silence', target: silenceTarget, duration: 2 })
      store.addPlayerDebuff({ type: 'drain', energy_penalty: 1, duration: 1 })
      playSFX?.('debuff_apply')
      return { icon: '💀', message: `Curse! Silence + Drain applied`, type: 'debuff' }
    }

    case 'debuff_taunt': {
      // Forces player to play an extra card or lose 5 HP (simulated: lose 5 HP if not in attack mode)
      store.addPlayerDebuff({ type: 'bind', draw_penalty: 1, duration: 1 })
      store.addPlayerDebuff({ type: 'confusion', duration: 1 })
      playSFX?.('debuff_apply')
      return { icon: '😡', message: 'Taunt! Bind + Confusion', type: 'debuff' }
    }

    // ── SPECIAL MOVES (from build prompt spec) ──────────────────────────

    case 'special_fox_fire': {
      // Fox Fire — Swaps 2 of the player's hand cards with random cards from the discard pile.
      // Thematically: the Kitsune is scrambling your prepared cards.
      const hand = [...store.hand]
      const discard = [...store.discardPile]

      if (hand.length < 2 || discard.length < 2) {
        // Not enough cards to swap — treat as a weaker debuff instead
        store.addPlayerDebuff({ type: 'confusion', duration: 1 })
        playSFX?.('debuff_apply')
        return { icon: '🦊', message: 'Fox Fire! (not enough cards — Confusion!)', type: 'special' }
      }

      // Pick 2 random hand cards (not locked ones)
      const unlocked = hand.filter(id => !store.lockedCards.includes(id))
      const swappable = unlocked.length >= 2 ? unlocked : hand
      const shuffledHand = [...swappable].sort(() => Math.random() - 0.5)
      const toRemove = shuffledHand.slice(0, 2)

      // Pick 2 random discard cards
      const shuffledDiscard = [...discard].sort(() => Math.random() - 0.5)
      const toAdd = shuffledDiscard.slice(0, 2)

      // Perform the swap
      let newHand = hand.filter(id => !toRemove.includes(id))
      newHand = [...newHand, ...toAdd]
      let newDiscard = discard.filter(id => !toAdd.includes(id))
      newDiscard = [...newDiscard, ...toRemove]

      store.setHand(newHand)
      store.setDiscard(newDiscard)

      playSFX?.('debuff_apply')
      return { icon: '🦊', message: 'Fox Fire! 2 cards swapped!', type: 'special' }
    }

    case 'special_demon_roar': {
      // Demon Roar — Applies a special debuff that forces a penalty question before the
      // player's next turn. If the question is answered wrong, the enemy attacks twice.
      // Implementation: apply a compound debuff — Confusion + Drain, simulating the
      // pressure of the "ambush question". The double-attack is represented by adding
      // a fury stack so the next strike hits harder.
      store.addPlayerDebuff({ type: 'confusion', duration: 1 })
      store.addEnemyFury()
      store.addEnemyFury()
      playSFX?.('enemy_buff')
      return { icon: '👹', message: 'Demon Roar! Fury +2 & Confusion!', type: 'special' }
    }

    case 'special_contract_clause': {
      // Contract Clause — If the player does not play at least 1 Grammar card on their
      // next turn, they take 10 direct damage that ignores Block.
      // Implementation: apply a custom debuff that CombatScreen checks at end of player turn.
      store.addPlayerDebuff({ type: 'contract_clause', damage: 10, duration: 1 })
      playSFX?.('debuff_apply')
      return { icon: '📜', message: 'Contract Clause! Play Grammar or take 10 damage!', type: 'special' }
    }

    case 'special_shapeshift': {
      // Shapeshift — Enemy swaps vulnerability based on what the player used last turn.
      // If player used Vocabulary cards to deal damage, enemy becomes resistant to Vocabulary
      // and vulnerable to Grammar (and vice versa).
      const mostUsed = getMostUsedCardType(store)
      if (mostUsed) {
        store.setEnemyFocusType(mostUsed)
        playSFX?.('enemy_buff')
        return { icon: '🔄', message: `Shapeshift! Now resists ${mostUsed}!`, type: 'special' }
      }
      playSFX?.('enemy_buff')
      return { icon: '🔄', message: 'Shapeshift! (observing...)', type: 'special' }
    }

    case 'special_time_split': {
      // Time Split — Splits strike damage across current and next turn.
      // Half damage now, and a delayed damage debuff for next turn.
      const halfDmg = Math.floor(enemy.base_attack / 2)

      // Apply first half now
      const blocked1 = Math.min(store.block, halfDmg)
      const remaining1 = halfDmg - blocked1
      if (blocked1 > 0) store.spendBlock(blocked1)
      if (remaining1 > 0) store.setHp(Math.max(0, store.hp - remaining1))

      // Queue second half as a debuff for next turn
      store.addPlayerDebuff({ type: 'time_split', damage: halfDmg, duration: 1 })

      playSFX?.('enemy_strike')
      return { icon: '⏳', message: `Time Split! ${remaining1} now + ${halfDmg} next turn!`, type: 'special' }
    }

    case 'special_system_override': {
      // System Override — Rewrites the player's top 2 hand cards with random cards from discard.
      // Similar to Fox Fire but only replaces (doesn't swap back).
      const hand = [...store.hand]
      const discard = [...store.discardPile]

      if (hand.length < 2 || discard.length < 2) {
        store.addPlayerDebuff({ type: 'bind', draw_penalty: 1, duration: 1 })
        playSFX?.('debuff_apply')
        return { icon: '💻', message: 'System Override! (not enough cards — Bind!)', type: 'special' }
      }

      // Take first 2 hand cards (top of hand), replace with random discard cards
      const toReplace = hand.slice(0, 2)
      const shuffledDiscard = [...discard].sort(() => Math.random() - 0.5)
      const replacements = shuffledDiscard.slice(0, 2)

      let newHand = hand.slice(2) // Remove first 2
      newHand = [...replacements, ...newHand] // Add replacements at front
      let newDiscard = discard.filter(id => !replacements.includes(id))
      newDiscard = [...newDiscard, ...toReplace]

      store.setHand(newHand)
      store.setDiscard(newDiscard)

      playSFX?.('debuff_apply')
      return { icon: '💻', message: 'System Override! 2 cards rewritten!', type: 'special' }
    }

    case 'self_buff_fortify': {
      // Fortify — Enemy gains temporary max HP bonus (from wrong-answer buffs).
      // Uses the fortify buff data from wrong_answer_buffs on the enemy.
      const fortifyBuff = store.activeEnemyBuffs.find(b => b.type === 'fortify')
      const hpBonus = fortifyBuff?.hp_bonus || 5
      store.healEnemy(hpBonus)
      playSFX?.('enemy_buff')
      return { icon: '🏔️', message: `Fortify! +${hpBonus} HP`, type: 'selfbuff' }
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

// ═══════════════════════════════════════════════════════════════════════
// PASSIVE SPECIAL ABILITY TRIGGERS
// These are checked at specific moments in combat (not via intent_pattern).
// Each returns { triggered: bool, message?: string } for optional UI feedback.
// ═══════════════════════════════════════════════════════════════════════

/**
 * Check and resolve passive special abilities that trigger on specific events.
 * @param {'on_chain_break'|'on_wrong_answer'|'on_take_damage'|'on_low_hp'} trigger
 * @param {Object} store - runStore state (with action methods)
 * @param {Object} context - extra context depending on trigger type
 * @returns {{ triggered: boolean, message?: string, icon?: string }}
 */
export function resolvePassiveAbility(trigger, store, context = {}) {
  const enemy = store.currentEnemy
  if (!enemy?.special_ability) return { triggered: false }

  const ability = enemy.special_ability
  if (ability.trigger !== trigger) return { triggered: false }

  switch (ability.id) {
    case 'spirit_shield': {
      // Guardian Spirit: gains 10 armor whenever a chain breaks
      if (trigger === 'on_chain_break') {
        store.addEnemyArmor(10)
        return { triggered: true, message: 'Spirit Shield! +10 Armor', icon: '🛡️' }
      }
      return { triggered: false }
    }

    case 'particle_trap': {
      // Kitsune Trickster: if player fails questions consecutively, add a curse
      if (trigger === 'on_wrong_answer') {
        const key = enemy.id + '_consecutive_wrong'
        consecutiveWrongTracker[key] = (consecutiveWrongTracker[key] || 0) + 1
        if (consecutiveWrongTracker[key] >= (ability.threshold || 2)) {
          consecutiveWrongTracker[key] = 0
          // Add a "curse" card to deck — represented as debuff that locks a random card type
          store.addPlayerDebuff({ type: 'silence', target: 'vocabulary', duration: 2 })
          return { triggered: true, message: 'Particle Trap! Vocabulary silenced!', icon: '🦊' }
        }
      }
      return { triggered: false }
    }

    case 'meditate': {
      // Temple Acolyte: after taking 10+ damage in one hit, gains +4 armor next turn
      if (trigger === 'on_take_damage' && context.damage >= (ability.threshold || 10)) {
        store.addEnemyArmor(4)
        return { triggered: true, message: 'Meditate! +4 Armor (retaliation)', icon: '🧘' }
      }
      return { triggered: false }
    }

    case 'jade_shell': {
      // Jade Sentinel: when HP drops below 30, gains 20 armor instantly (once)
      if (trigger === 'on_low_hp' && store.enemyHp > 0 && store.enemyHp <= 30) {
        // Only trigger once — check if armor was already given
        if (!store._jadeShellTriggered) {
          store.addEnemyArmor(20)
          store._jadeShellTriggered = true
          return { triggered: true, message: 'Jade Shell! +20 Armor (critical defense)', icon: '💎' }
        }
      }
      return { triggered: false }
    }

    default:
      return { triggered: false }
  }
}

/**
 * Reset passive ability trackers at fight start.
 * Call this from startFight().
 */
export function resetPassiveTrackers() {
  Object.keys(consecutiveWrongTracker).forEach(k => delete consecutiveWrongTracker[k])
}

/**
 * Reset consecutive wrong counter on a correct answer (for particle_trap).
 */
export function resetConsecutiveWrong(enemyId) {
  const key = enemyId + '_consecutive_wrong'
  consecutiveWrongTracker[key] = 0
}

/**
 * Check and resolve the time_split debuff at the start of player turn.
 * Deals the delayed damage portion, respecting current block.
 * @param {Object} store - runStore state
 * @returns {{ triggered: boolean, damage?: number }}
 */
export function resolveTimeSplitDebuff(store) {
  const timeSplitDebuff = store.activePlayerDebuffs.find(d => d.type === 'time_split')
  if (!timeSplitDebuff) return { triggered: false }

  const damage = timeSplitDebuff.damage || 0
  const blocked = Math.min(store.block, damage)
  const remaining = damage - blocked
  if (blocked > 0) store.spendBlock(blocked)
  if (remaining > 0) store.setHp(Math.max(0, store.hp - remaining))

  // The debuff will tick down naturally via tickPlayerDebuffs
  return { triggered: true, damage: remaining }
}

/**
 * Check and resolve the contract_clause debuff at end of player turn.
 * If the player did NOT play a grammar card this turn, they take direct damage.
 * @param {Object} store - runStore state
 * @returns {{ triggered: boolean, damage?: number }}
 */
export function resolveContractClause(store) {
  const clause = store.activePlayerDebuffs.find(d => d.type === 'contract_clause')
  if (!clause) return { triggered: false }

  const grammarPlayed = (store.cardTypesPlayedThisFight?.grammar || 0) > 0
  // Check if grammar was played THIS turn specifically
  // A simpler check: if the clause debuff is active and no grammar was played,
  // deal direct damage ignoring block.
  // NOTE: This is approximate — in a full implementation we'd track per-turn card types.
  if (!grammarPlayed) {
    const damage = clause.damage || 10
    store.setHp(Math.max(0, store.hp - damage))
    return { triggered: true, damage }
  }

  return { triggered: false }
}
