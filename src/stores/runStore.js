// stores/runStore.js
// Active run state — all combat, navigation, and deck data for the current run
// Per SKILL.md: never mutate state directly — always use store actions

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
      deck: [],       // draw pile (card IDs)
      hand: [],       // current hand (card IDs)
      discardPile: [],
      exhaustPile: [],

      // Relics and buffs
      relics: [],
      activeBuffs: [],    // player buffs
      activeDebuffs: [],  // player debuffs

      // Combat
      inCombat: false,
      currentEnemy: null,
      enemyBuffs: [],
      enemyHp: 0,
      enemyMaxHp: 0,
      enemyBlock: 0,
      intentIndex: 0,
      turnNumber: 0,
      chainActive: false,
      chainType: null,    // 'vocabulary' | 'grammar'
      hintUsedThisFight: false,

      // Run session graveyard (merged to persistent graveyard on run end)
      sessionMistakes: [],

      // Combat accuracy tracking
      sessionCorrect: 0,
      sessionTotal: 0,
      fightCorrect: 0,
      fightTotal: 0,

      // Journal — words and grammar seen this run
      journalWords: [],   // { questionId, word, reading, translation, example, seenAt }
      journalGrammar: [], // { questionId, concept, pattern, example }

      // ============================================================
      // ACTIONS — always use these, never mutate state directly
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
      gainBonusEnergy: (amount) => set(s => ({ energy: Math.min(s.maxEnergy + amount, s.energy + amount) })),

      // Gold
      addGold: (amount) => set(s => ({ gold: s.gold + amount })),
      spendGold: (amount) => set(s => ({ gold: Math.max(0, s.gold - amount) })),

      // Enemy
      setEnemy: (enemy) => set({
        currentEnemy: enemy,
        enemyHp: enemy.hp,
        enemyMaxHp: enemy.hp,
        enemyBlock: 0,
        enemyBuffs: [],
        intentIndex: 0,
      }),
      damageEnemy: (amount) => set(s => {
        const absorbed = Math.min(s.enemyBlock, amount)
        const remaining = amount - absorbed
        return {
          enemyHp: Math.max(0, s.enemyHp - remaining),
          enemyBlock: Math.max(0, s.enemyBlock - absorbed),
        }
      }),
      healEnemy: (amount) => set(s => ({ enemyHp: Math.min(s.enemyMaxHp, s.enemyHp + amount) })),
      addEnemyMaxHp: (amount) => set(s => ({
        enemyMaxHp: s.enemyMaxHp + amount,
        enemyHp: s.enemyHp + amount,
      })),

      // Enemy phase (boss multi-phase)
      setEnemyHp: (hp) => set({ enemyHp: Math.max(0, hp) }),

      // Enemy buffs
      addEnemyBuff: (buff) => set(s => ({ enemyBuffs: [...s.enemyBuffs, buff] })),
      clearEnemyBuffs: () => set({ enemyBuffs: [] }),
      setEnemyBuffs: (buffs) => set({ enemyBuffs: buffs }),

      // Chain
      activateChain: (type) => set({ chainActive: true, chainType: type }),
      breakChain: () => set({ chainActive: false, chainType: null }),

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
      logCorrect: (questionId) => set(s => ({
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
        deck: startingDeck,
        hand: [],
        discardPile: [],
        exhaustPile: [],
        relics: starterRelicId ? [starterRelicId] : [],
        activeBuffs: [],
        activeDebuffs: [],
        enemyBuffs: [],
        currentEnemy: null,
        chainActive: false,
        chainType: null,
        inCombat: false,
        sessionMistakes: [],
        sessionCorrect: 0,
        sessionTotal: 0,
        fightCorrect: 0,
        fightTotal: 0,
        journalWords: [],
        journalGrammar: [],
        mapNodes: [],
        mapPaths: [],
        currentNodeId: null,
        hintUsedThisFight: false,
        turnNumber: 0,
        intentIndex: 0,
      }),

      endRun: () => set({
        runId: null,
        inCombat: false,
        currentEnemy: null,
        hand: [],
      }),
    }),
    {
      name: STORAGE_KEYS.ACTIVE_RUN,
    }
  )
)

export default useRunStore
