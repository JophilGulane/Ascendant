// stores/runStore.js — v2
// Active run state — all combat, navigation, and deck data for the current run
// Per SKILL.md v2: includes lockedCards, activePlayerDebuffs, fightQuestionPoolUsed

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '../utils/localStorage.js'

const useRunStore = create(
  persist(
    (set, get) => ({
      // Run identity
      runId: null,
      campaign: null,
      character: null,
      masteryLevel: 0,
      activeModifier: null,
      lastCardTypePlayed: null,  // for type_lock curse
      lastStandUsed: false,       // for last_stand blessing (once per run)

      // Potions (max 3 slots — array of potion IDs or null)
      potions: [],
      // Active combat potion effects (reset each fight)
      potionEffects: {
        clarityActive: false,      // next question shows 2 options
        memoryFlaskActive: false,  // next question timer frozen
        echoTonicActive: false,    // next card plays twice
        autoCorrectActive: false,  // next question auto-correct
        scholarsBloodActive: false, // rest of fight: correct = +3 HP
      },

      // Player state
      hp: 80,
      maxHp: 80,
      block: 0,
      gold: 0,
      energy: 3,
      maxEnergy: 3,

      // Navigation
      floor: 1,
      currentNodeId: null,
      mapNodes: [],
      mapPaths: [],

      // Deck
      deck: [],
      hand: [],
      discardPile: [],
      exhaustPile: [],

      // v2: Locked cards (wrong answer → locked for this turn)
      lockedCards: [],

      // v3: Retained cards (stay in hand next turn)
      retainedCards: [],
      // v3: Growth stacks per retained card ID (how many turns it has been retained)
      retainGrowthStacks: {},

      // Relics — max 5 equipped, unlimited vault storage
      relics: [],        // equipped (active, max 5)
      vaultRelics: [],   // stored but inactive
      pendingRelicSwap: null, // { relicId } — set when a new relic is found with full slots

      // v2: Player debuffs applied by enemy (silence/drain/fog/bind/confusion)
      activePlayerDebuffs: [],

      // v2: Enemy buffs from wrong answers (consumed after enemy turn)
      activeEnemyBuffs: [],

      // Combat
      inCombat: false,
      currentEnemy: null,
      enemyHp: 0,
      enemyMaxHp: 0,
      enemyArmor: 0,          // v2: flat damage reduction (armor_up move)
      enemyFuryStacks: 0,     // v2: fury accumulates via power_up, doubles dmg at 3
      enemyFocusType: null,   // v2: card type enemy is focused against (focus move)
      intentIndex: 0,
      turnNumber: 0,
      chainActive: false,
      chainType: null,
      hintUsedThisFight: false,

      // v2: Per-fight question pool — reset on fight start, prevents repeats
      fightQuestionPoolUsed: [],
      blindCardId: null,

      // Card type tracking for self_buff_focus
      cardTypesPlayedThisFight: {},

      // Run session graveyard (merged to persistent graveyard on run end)
      sessionMistakes: [],

      // Combat accuracy tracking
      sessionCorrect: 0,
      sessionTotal: 0,
      fightCorrect: 0,
      fightTotal: 0,
      fightCorrectStreak: 0,

      // Journal
      journalWords: [],
      journalGrammar: [],

      // ============================================================
      // ACTIONS
      // ============================================================

      // HP & Block
      setHp: (hp) => set({ hp: Math.max(0, hp) }),
      healHp: (amount) => set(s => ({ hp: Math.min(s.maxHp, s.hp + amount) })),
      addBlock: (amount) => set(s => ({ block: s.block + amount })),
      spendBlock: (amount) => set(s => ({ block: Math.max(0, s.block - amount) })),
      clearBlock: () => set({ block: 0 }),

      // Energy
      spendEnergy: (amount) => set(s => ({ energy: Math.max(0, s.energy - amount) })),
      resetEnergy: () => set(s => {
        const bonus = s.bonusEnergyNextTurn || 0
        return { 
          energy: s.maxEnergy + bonus,
          bonusEnergyNextTurn: 0
        }
      }),
      gainBonusEnergy: (amount) => set(s => ({ energy: s.energy + amount })),
      queueBonusEnergyNextTurn: (amount) => set(s => ({ bonusEnergyNextTurn: (s.bonusEnergyNextTurn || 0) + amount })),

      // Gold
      addGold: (amount) => set(s => ({ gold: s.gold + amount })),
      spendGold: (amount) => set(s => ({ gold: Math.max(0, s.gold - amount) })),

      // v2: Locked cards
      lockCard: (cardId) => set(s => ({
        lockedCards: s.lockedCards.includes(cardId) ? s.lockedCards : [...s.lockedCards, cardId]
      })),
      unlockAllCards: () => set({ lockedCards: [] }),

      // v3: Retained cards
      setRetainedCards: (cardIds) => set({ retainedCards: cardIds }),
      clearRetainedCards: () => set({ retainedCards: [], retainGrowthStacks: {} }),
      tickRetainGrowth: (cardId) => set(s => ({
        retainGrowthStacks: {
          ...s.retainGrowthStacks,
          [cardId]: (s.retainGrowthStacks[cardId] || 0) + 1,
        },
      })),
      clearRetainGrowth: (cardId) => set(s => {
        const newStacks = { ...s.retainGrowthStacks }
        delete newStacks[cardId]
        return { retainGrowthStacks: newStacks }
      }),

      // v2: Player debuffs
      addPlayerDebuff: (debuff) => set(s => ({
        activePlayerDebuffs: [...s.activePlayerDebuffs, { ...debuff, id: Date.now() + Math.random() }]
      })),
      tickPlayerDebuffs: () => set(s => ({
        activePlayerDebuffs: s.activePlayerDebuffs
          .map(d => ({ ...d, duration: d.duration - 1 }))
          .filter(d => d.duration > 0)
      })),
      clearPlayerDebuffs: () => set({ activePlayerDebuffs: [] }),
      consumeDebuff: (type) => set(s => ({
        activePlayerDebuffs: s.activePlayerDebuffs.filter(d => d.type !== type)
      })),

      // v2: Enemy buffs from wrong answers
      addEnemyBuff: (buff) => set(s => ({
        activeEnemyBuffs: [...s.activeEnemyBuffs, buff]
      })),
      clearEnemyBuffs: () => set({ activeEnemyBuffs: [] }),

      // v2: Question pool tracking
      markQuestionUsed: (questionId) => set(s => ({
        fightQuestionPoolUsed: [...s.fightQuestionPoolUsed, questionId]
      })),
      resetFightQuestionPool: () => set({ fightQuestionPoolUsed: [] }),

      // v2: Card type tracking for focus move
      trackCardTypePlayed: (cardType) => set(s => ({
        cardTypesPlayedThisFight: {
          ...s.cardTypesPlayedThisFight,
          [cardType]: (s.cardTypesPlayedThisFight[cardType] || 0) + 1,
        }
      })),

      // Chain
      activateChain: (type) => set({ chainActive: true, chainType: type }),
      breakChain: () => set({ chainActive: false, chainType: null }),

      // Enemy state
      setEnemy: (enemy) => set({
        currentEnemy: enemy,
        enemyHp: enemy.hp,
        enemyMaxHp: enemy.hp,
        enemyArmor: 0,
        enemyFuryStacks: 0,
        enemyFocusType: null,
        activeEnemyBuffs: [],
        intentIndex: 0,
      }),
      damageEnemy: (amount) => set(s => {
        const absorbed = Math.min(s.enemyArmor > 0 ? s.enemyArmor : 0, amount)
        const remaining = amount - absorbed
        return {
          enemyHp: Math.max(0, s.enemyHp - remaining),
          enemyArmor: Math.max(0, s.enemyArmor - absorbed),
        }
      }),
      healEnemy: (amount) => set(s => ({ enemyHp: Math.min(s.enemyMaxHp, s.enemyHp + amount) })),
      setEnemyHp: (hp) => set({ enemyHp: Math.max(0, hp) }),
      setEnemyArmor: (armor) => set({ enemyArmor: Math.max(0, armor) }),
      addEnemyArmor: (amount) => set(s => ({ enemyArmor: s.enemyArmor + amount })),
      addEnemyFury: () => set(s => ({ enemyFuryStacks: s.enemyFuryStacks + 1 })),
      clearEnemyFury: () => set({ enemyFuryStacks: 0 }),
      setEnemyFocusType: (type) => set({ enemyFocusType: type }),
      setEnemyBuffs: (buffs) => set({ activeEnemyBuffs: buffs }),

      // Intent
      advanceIntent: () => set(s => {
        if (!s.currentEnemy) return {}
        return { intentIndex: (s.intentIndex + 1) % s.currentEnemy.intent_pattern.length }
      }),

      // Hand & Deck
      setHand: (hand) => set({ hand }),
      setDeck: (deck) => set({ deck }),
      setDiscard: (discardPile) => set({ discardPile }),
      addToDiscard: (cardId) => set(s => ({ discardPile: [...s.discardPile, cardId] })),
      addToHand: (cardId) => set(s => ({ hand: [...s.hand, cardId] })),
      removeFromHand: (cardId) => set(s => {
        const idx = s.hand.indexOf(cardId)
        if (idx === -1) return {}
        return { hand: [...s.hand.slice(0, idx), ...s.hand.slice(idx + 1)] }
      }),

      // Relics
      addRelic: (relicId) => set(s => {
        if (s.relics.includes(relicId) || s.vaultRelics.includes(relicId)) return {} // already have it
        if (s.relics.length < 5) {
          // Slot available — equip directly
          return { relics: [...s.relics, relicId] }
        }
        // All 5 slots full — trigger swap screen
        return { pendingRelicSwap: relicId }
      }),
      clearPendingRelicSwap: () => set({ pendingRelicSwap: null }),

      // Swap equipped[slotIndex] out to vault, put newRelicId in its place
      swapRelic: (slotIndex, newRelicId) => set(s => {
        const outgoing = s.relics[slotIndex]
        if (!outgoing) return {}
        const newEquipped = [...s.relics]
        newEquipped[slotIndex] = newRelicId
        const newVault = s.vaultRelics.filter(id => id !== newRelicId)
        if (outgoing) newVault.push(outgoing)
        return { relics: newEquipped, vaultRelics: newVault, pendingRelicSwap: null }
      }),

      // Decline the new relic — put it in vault (or discard)
      skipRelicSwap: () => set(s => ({
        pendingRelicSwap: null,
        // Optionally discard: don't add to vault. Spec says "Skip = decline entirely".
      })),

      // Vault swapping at rest site — swap equipped[i] with vault[j]
      vaultSwap: (equippedIndex, vaultRelicId) => set(s => {
        const outgoing = s.relics[equippedIndex]
        if (!outgoing || !s.vaultRelics.includes(vaultRelicId)) return {}
        const newEquipped = [...s.relics]
        newEquipped[equippedIndex] = vaultRelicId
        const newVault = s.vaultRelics.filter(id => id !== vaultRelicId)
        if (outgoing) newVault.push(outgoing)
        return { relics: newEquipped, vaultRelics: newVault }
      }),

      // Add relic directly to vault (e.g. from events)
      addRelicToVault: (relicId) => set(s => ({
        vaultRelics: s.vaultRelics.includes(relicId) ? s.vaultRelics : [...s.vaultRelics, relicId]
      })),

      // Modifier tracking
      setLastCardTypePlayed: (type) => set({ lastCardTypePlayed: type }),
      useLastStand: () => set({ lastStandUsed: true }),

      // Potions
      addPotion: (potionId) => set(s => {
        if (s.potions.length >= 3) return {} // full, drop is lost (handled in UI)
        return { potions: [...s.potions, potionId] }
      }),
      removePotion: (potionId) => set(s => {
        const idx = s.potions.indexOf(potionId)
        if (idx === -1) return {}
        const next = [...s.potions]
        next.splice(idx, 1)
        return { potions: next }
      }),
      removePotionByIndex: (index) => set(s => {
        const next = [...s.potions]
        next.splice(index, 1)
        return { potions: next }
      }),
      setPotionEffect: (key, value) => set(s => ({
        potionEffects: { ...s.potionEffects, [key]: value }
      })),
      resetPotionEffects: () => set({
        potionEffects: {
          clarityActive: false,
          memoryFlaskActive: false,
          echoTonicActive: false,
          autoCorrectActive: false,
          scholarsBloodActive: false,
        }
      }),

      // Mistakes & journal
      logMistake: (questionId, label, reading) => set(s => ({
        sessionMistakes: [...s.sessionMistakes, {
          questionId, label, reading, timestamp: Date.now(), floor: s.floor
        }],
        sessionTotal: s.sessionTotal + 1,
        fightTotal: s.fightTotal + 1,
        fightCorrectStreak: 0,
      })),
      logCorrect: () => set(s => ({
        sessionCorrect: s.sessionCorrect + 1,
        fightCorrect: s.fightCorrect + 1,
        fightCorrectStreak: s.fightCorrectStreak + 1,
      })),
      resetFightAccuracy: () => set({ fightCorrect: 0, fightTotal: 0, fightCorrectStreak: 0 }),
      setHintUsed: () => set({ hintUsedThisFight: true }),
      setWornDictionaryUsed: () => set({ wornDictionaryUsedThisFight: true }),
      incrementTurn: () => set(s => ({ turnNumber: s.turnNumber + 1 })),

      // Map navigation
      setMap: (nodes, paths) => set({ mapNodes: nodes, mapPaths: paths }),
      setMapNodes: (nodes) => set({ mapNodes: nodes }),
      setCurrentNode: (nodeId) => set({ currentNodeId: nodeId }),
      setFloor: (floor) => set({ floor }),

      // Journal
      addJournalWord: (entry) => set(s => ({
        journalWords: s.journalWords.some(w => w.questionId === entry.questionId)
          ? s.journalWords
          : [...s.journalWords, entry]
      })),
      addJournalGrammar: (entry) => set(s => ({
        journalGrammar: s.journalGrammar.some(g => g.questionId === entry.questionId)
          ? s.journalGrammar
          : [...s.journalGrammar, entry]
      })),

      // Deck management
      addCardToDeck: (cardId) => set(s => ({ deck: [...s.deck, cardId] })),
      removeCardFromDeck: (cardId) => set(s => {
        const idx = s.deck.indexOf(cardId)
        if (idx === -1) return {}
        return { deck: [...s.deck.slice(0, idx), ...s.deck.slice(idx + 1)] }
      }),

      // Combat toggle
      setInCombat: (val) => set({ inCombat: val }),

      // v2: startFight — single action that resets all fight state atomically
      startFight: (enemy) => set(s => {
        let newBlindCardId = null
        if (s.masteryLevel >= 3 && s.deck.length > 0) {
          newBlindCardId = s.deck[Math.floor(Math.random() * s.deck.length)]
        }
        return {
          inCombat: true,
          currentEnemy: enemy,
          enemyHp: enemy.hp,
          enemyMaxHp: enemy.hp,
          enemyArmor: 0,
          enemyFuryStacks: 0,
          enemyFocusType: null,
          intentIndex: 0,
          lockedCards: [],           // RULE: unlock all cards at fight start
          retainedCards: [],         // v3: clear retained cards at fight start
          retainGrowthStacks: {},    // v3: clear growth stacks at fight start
          activeEnemyBuffs: [],
          chainActive: false,
          chainType: null,
          fightQuestionPoolUsed: [], // RULE: reset question pool at fight start
          cardTypesPlayedThisFight: {},
          hintUsedThisFight: false,
          wornDictionaryUsedThisFight: false,
          fightCorrect: 0,
          fightTotal: 0,
          fightCorrectStreak: 0,
          block: s.relics.includes('fox_mask') ? 10 : 0,
          energy: s.maxEnergy,
          bonusEnergyNextTurn: 0,
          blindCardId: newBlindCardId,
          lastCardTypePlayed: null,  // Reset type_lock tracker
        }
      }),

      // v2: endFight — moves remaining hand to discard to prevent deck shrinkage
      endFight: () => set(s => ({
        inCombat: false,
        currentEnemy: null,
        lockedCards: [],
        retainedCards: [],         // v3: clear on fight end
        retainGrowthStacks: {},    // v3: clear on fight end
        activeEnemyBuffs: [],
        activePlayerDebuffs: [],
        chainActive: false,
        chainType: null,
        fightQuestionPoolUsed: [],
        cardTypesPlayedThisFight: {},
        // CRITICAL: Merge all combat cards back into the master deck
        deck: [...s.deck, ...s.discardPile, ...s.hand],
        discardPile: [],
        hand: [],
        block: 0,
        blindCardId: null,
      })),


      // Run lifecycle
      startRun: (campaign, character, masteryLevel, startingDeck, starterRelicId) => {
        // Read chosen modifier from sessionStorage
        let activeModifier = null
        try {
          const raw = sessionStorage.getItem('chosen_modifier')
          if (raw) activeModifier = JSON.parse(raw)
        } catch {}
        sessionStorage.removeItem('chosen_modifier')

        // Apply curse effects that affect starting state
        let startHp = 80
        let startMaxEnergy = 3
        let startGold = 0
        if (activeModifier?.curse?.effect) {
          const e = activeModifier.curse.effect
          if (e.type === 'start_hp') startHp = e.value
        }
        if (activeModifier?.blessing?.effect) {
          const e = activeModifier.blessing.effect
          if (e.type === 'bonus_max_energy') startMaxEnergy = 3 + e.value
          if (e.type === 'bonus_gold') startGold = e.value
        }

        set({
          runId: crypto.randomUUID(),
          campaign,
          character,
          masteryLevel,
          activeModifier,
          hp: startHp,
          maxHp: startHp,
          block: 0,
          gold: startGold,
          floor: 1,
          energy: startMaxEnergy,
          maxEnergy: startMaxEnergy,
          deck: startingDeck || [],
          hand: [],
          discardPile: [],
          exhaustPile: [],
          relics: starterRelicId ? [starterRelicId] : [],
          activeBuffs: [],
          lockedCards: [],
          activePlayerDebuffs: [],
          activeEnemyBuffs: [],
          chainActive: false,
          chainType: null,
          inCombat: false,
          currentEnemy: null,
          sessionMistakes: [],
          sessionCorrect: 0,
          sessionTotal: 0,
          fightCorrect: 0,
          fightTotal: 0,
          fightQuestionPoolUsed: [],
          cardTypesPlayedThisFight: {},
          journalWords: [],
          journalGrammar: [],
          mapNodes: [],
          mapPaths: [],
          currentNodeId: null,
          hintUsedThisFight: false,
          wornDictionaryUsedThisFight: false,
          turnNumber: 0,
          intentIndex: 0,
          enemyArmor: 0,
          enemyFuryStacks: 0,
          enemyFocusType: null,
          blindCardId: null,
        })
      },

      endRun: () => set({
        runId: null,
        inCombat: false,
        currentEnemy: null,
        hand: [],
        lockedCards: [],
        activePlayerDebuffs: [],
        activeEnemyBuffs: [],
      }),
    }),
    {
      name: STORAGE_KEYS.ACTIVE_RUN,
    }
  )
)

export default useRunStore
