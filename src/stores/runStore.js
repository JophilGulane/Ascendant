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

      // Relics
      relics: [],

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

      // Card type tracking for self_buff_focus
      cardTypesPlayedThisFight: {},

      // Run session graveyard (merged to persistent graveyard on run end)
      sessionMistakes: [],

      // Combat accuracy tracking
      sessionCorrect: 0,
      sessionTotal: 0,
      fightCorrect: 0,
      fightTotal: 0,

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
      resetEnergy: () => set(s => ({ energy: s.maxEnergy })),
      gainBonusEnergy: (amount) => set(s => ({ energy: s.energy + amount })),

      // Gold
      addGold: (amount) => set(s => ({ gold: s.gold + amount })),
      spendGold: (amount) => set(s => ({ gold: Math.max(0, s.gold - amount) })),

      // v2: Locked cards
      lockCard: (cardId) => set(s => ({
        lockedCards: s.lockedCards.includes(cardId) ? s.lockedCards : [...s.lockedCards, cardId]
      })),
      unlockAllCards: () => set({ lockedCards: [] }),

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
      addRelic: (relicId) => set(s => ({
        relics: s.relics.includes(relicId) ? s.relics : [...s.relics, relicId]
      })),

      // Mistakes & journal
      logMistake: (questionId, label, reading) => set(s => ({
        sessionMistakes: [...s.sessionMistakes, {
          questionId, label, reading, timestamp: Date.now(), floor: s.floor
        }],
        sessionTotal: s.sessionTotal + 1,
        fightTotal: s.fightTotal + 1,
      })),
      logCorrect: () => set(s => ({
        sessionCorrect: s.sessionCorrect + 1,
        fightCorrect: s.fightCorrect + 1,
      })),
      resetFightAccuracy: () => set({ fightCorrect: 0, fightTotal: 0 }),
      setHintUsed: () => set({ hintUsedThisFight: true }),
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
      startFight: (enemy) => set({
        inCombat: true,
        currentEnemy: enemy,
        enemyHp: enemy.hp,
        enemyMaxHp: enemy.hp,
        enemyArmor: 0,
        enemyFuryStacks: 0,
        enemyFocusType: null,
        intentIndex: 0,
        lockedCards: [],           // RULE: unlock all cards at fight start
        activeEnemyBuffs: [],
        chainActive: false,
        chainType: null,
        fightQuestionPoolUsed: [], // RULE: reset question pool at fight start
        cardTypesPlayedThisFight: {},
        hintUsedThisFight: false,
        fightCorrect: 0,
        fightTotal: 0,
      }),

      // v2: endFight — moves remaining hand to discard to prevent deck shrinkage
      endFight: () => set(s => ({
        inCombat: false,
        currentEnemy: null,
        lockedCards: [],
        activeEnemyBuffs: [],
        activePlayerDebuffs: [],
        chainActive: false,
        chainType: null,
        fightQuestionPoolUsed: [],
        cardTypesPlayedThisFight: {},
        // CRITICAL: move remaining hand cards to discard — never lose cards
        discardPile: [...s.discardPile, ...s.hand],
        hand: [],
      })),


      // Run lifecycle
      startRun: (campaign, character, masteryLevel, startingDeck, starterRelicId) => set({
        runId: crypto.randomUUID(),
        campaign,
        character,
        masteryLevel,
        hp: 80,
        maxHp: 80,
        block: 0,
        gold: 0,
        floor: 1,
        energy: 3,
        maxEnergy: 3,
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
        turnNumber: 0,
        intentIndex: 0,
        enemyArmor: 0,
        enemyFuryStacks: 0,
        enemyFocusType: null,
      }),

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
