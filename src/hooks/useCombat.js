// hooks/useCombat.js
// Core combat logic hook — orchestrates card play, question resolution, enemy turns, turn flow
// Reads from runStore, fires store actions, never mutates state directly

import { useState, useCallback, useEffect } from 'react'
import useRunStore from '../stores/runStore.js'
import useSettingsStore from '../stores/settingsStore.js'
import { useGraveyard } from './useGraveyard.js'
import { useAudio } from './useAudio.js'
import { drawCards, discardCard } from '../utils/deck.js'
import {
  resolveChain,
  calculateDamage,
  calculateBlock,
  applyDamageToPlayer,
  resolveEnemyTurn,
  applyEnemyBuff,
  tickBuffs,
} from '../utils/combat.js'
import { sampleQuestionsForCard, shuffleOptions } from '../utils/questions.js'
import { CARD_TYPES } from '../constants/cardTypes.js'

// Loaded lazily per campaign
const questionCache = {}

async function loadQuestions(campaign) {
  if (questionCache[campaign]) return questionCache[campaign]
  try {
    const mod = await import(`../data/${campaign}/questions.json`)
    questionCache[campaign] = mod.default
    return questionCache[campaign]
  } catch (e) {
    console.error(`[useCombat] Failed to load questions for ${campaign}:`, e)
    return []
  }
}

const cardCache = {}
async function loadCards(campaign) {
  if (cardCache[campaign]) return cardCache[campaign]
  try {
    const mod = await import(`../data/${campaign}/cards.json`)
    // Build a map for O(1) lookup
    const map = {}
    for (const card of mod.default) map[card.id] = card
    cardCache[campaign] = map
    return cardCache[campaign]
  } catch (e) {
    console.error(`[useCombat] Failed to load cards for ${campaign}:`, e)
    return {}
  }
}

export function useCombat() {
  const store = useRunStore()
  const settings = useSettingsStore()
  const graveyard = useGraveyard()
  const { playSFX } = useAudio()

  const [cardMap, setCardMap] = useState({})
  const [allQuestions, setAllQuestions] = useState([])
  const [activeQuestion, setActiveQuestion] = useState(null) // { question, shuffledOptions, newCorrectIndex, card }
  const [activeCardId, setActiveCardId] = useState(null)
  const [animState, setAnimState] = useState(null) // 'correct' | 'wrong' | 'enemy_attack' | null
  const [damageNumbers, setDamageNumbers] = useState([]) // [{ id, value, type, x, y }]
  const [consecutiveWrong, setConsecutiveWrong] = useState(0)

  // Load campaign data on mount / campaign change
  useEffect(() => {
    if (!store.campaign) return
    Promise.all([
      loadCards(store.campaign),
      loadQuestions(store.campaign),
    ]).then(([cards, questions]) => {
      setCardMap(cards)
      setAllQuestions(questions)
    })
  }, [store.campaign])

  const getCard = useCallback((cardId) => cardMap[cardId] || null, [cardMap])

  // ============================================================
  // DRAW HAND — defined first so startFight can call it
  // ============================================================
  const drawHand = useCallback(() => {
    // Always read fresh state so we never operate on a stale snapshot
    const s = useRunStore.getState()
    const currentDeck = [...s.deck]
    const currentDiscard = [...s.discardPile, ...s.hand]

    const { drawn, deck: newDeck, discard: newDiscard } = drawCards(currentDeck, currentDiscard, 5)

    s.setHand(drawn)
    s.setDeck(newDeck)
    s.setDiscard(newDiscard)
    s.resetEnergy()
    s.incrementTurn()

    drawn.forEach((_, i) => {
      setTimeout(() => playSFX('card_draw_vocab'), i * 80)
    })
  }, [playSFX])

  // ============================================================
  // FIGHT INITIALIZATION
  // ============================================================
  const startFight = useCallback((enemy) => {
    store.setEnemy(enemy)
    store.setInCombat(true)
    store.clearBlock()
    store.clearEnemyBuffs()
    store.breakChain()
    store.resetFightAccuracy()
    setConsecutiveWrong(0)
    setActiveQuestion(null)
    setActiveCardId(null)
    setAnimState(null)

    // Draw opening hand — drawHand is defined above so this is safe
    drawHand()
  }, [store, drawHand])

  // (drawHand is defined above startFight — see earlier in file)

  // ============================================================
  // SELECT CARD — triggers question prompt
  // ============================================================
  const selectCard = useCallback((cardId) => {
    if (activeQuestion) return // question already active
    const card = getCard(cardId)
    if (!card) return
    if (store.energy < card.energy_cost) return // can't afford

    // Sample a question for this card
    const question = sampleQuestionsForCard(
      card,
      allQuestions,
      graveyard.entries,
      settings,
      store.floor
    )

    if (!question) {
      console.warn(`[useCombat] No question found for card ${cardId}`)
      return
    }

    // Shuffle options (respects mastery level)
    const { shuffledOptions, newCorrectIndex } = shuffleOptions(
      question.options,
      question.correct_index,
      store.masteryLevel
    )

    setActiveQuestion({ question, shuffledOptions, newCorrectIndex, card })
    setActiveCardId(cardId)
  }, [activeQuestion, getCard, allQuestions, graveyard.entries, settings, store])

  // ============================================================
  // ANSWER RESOLUTION
  // ============================================================
  const resolveAnswer = useCallback(({ result, selectedIndex, isFirstTry }) => {
    const { question, card } = activeQuestion
    const isCorrect = result === 'correct'

    if (isCorrect) {
      // Log correct to graveyard (reduces mastery debt)
      graveyard.logCorrect(question.id)
      store.logCorrect(question.id)
      setConsecutiveWrong(0)

      // Add to journal
      if (card.type === CARD_TYPES.VOCABULARY) {
        store.addJournalWord({
          questionId: question.id,
          word: question.graveyard_label,
          reading: question.graveyard_reading,
          translation: question.options[question.correct_index],
          example: question.hint,
        })
      } else if (card.type === CARD_TYPES.GRAMMAR) {
        store.addJournalGrammar({
          questionId: question.id,
          concept: question.graveyard_label,
          pattern: question.graveyard_reading,
          example: question.hint,
        })
      }

      // Resolve chain
      const chainResult = resolveChain(
        card.type,
        { chainActive: store.chainActive, chainType: store.chainType },
        store,
        store.relics.includes('chain_bracelet')
      )

      // Apply card effect
      applyCardEffect(card, chainResult.bonusMultiplier, isFirstTry)

      // Deduct energy
      store.spendEnergy(card.energy_cost)

      // Move card to discard
      store.removeFromHand(card.id)
      store.addToDiscard(card.id)

      // Animation
      setAnimState('correct')
      setTimeout(() => setAnimState(null), 600)
      playSFX('correct')

      // Consecutive correct → check Traveler's Compass relic
      if (store.relics.includes('travelers_compass')) {
        const newStreak = (store.sessionCorrect % 3) + 1 // rough streak tracking
        if (newStreak === 0) {
          store.gainBonusEnergy(1)
        }
      }

    } else {
      // Wrong or timeout
      graveyard.logWrong(question)
      store.logMistake(question.id, question.graveyard_label, question.graveyard_reading)
      const newWrongCount = consecutiveWrong + 1
      setConsecutiveWrong(newWrongCount)

      // Apply enemy buff from wrong answer
      // Skip if first wrong and player has Newcomer's Phrasebook relic
      const hasPhrasebook = store.relics.includes('newcomers_phrasebook')
      const isFirstWrongFight = store.fightTotal === 0
      const shouldSkipBuff = hasPhrasebook && isFirstWrongFight && !store.hintUsedThisFight

      if (!shouldSkipBuff) {
        // Apply wrong-answer buff based on card type
        const buffTemplate = card.type === CARD_TYPES.VOCABULARY
          ? { type: 'confusion', effect: 'enemy_attack_plus_2', effect_value: 2, duration_turns: 1 }
          : card.type === CARD_TYPES.GRAMMAR
            ? { type: 'conjugation_armor', effect: 'block_grammar_cards_1_turn', effect_value: 1, duration_turns: 1 }
            : { type: 'fortify', effect: 'enemy_max_hp_plus_5', effect_value: 5, duration_turns: 2 }

        const newBuffs = applyEnemyBuff(store.enemyBuffs, buffTemplate)
        store.setEnemyBuffs(newBuffs)
      }

      // Kitsune Trickster special: fail particle question twice → curse card
      if (store.currentEnemy?.special_ability?.id === 'particle_trap' && newWrongCount >= 2) {
        // SUGGESTION: Add curse card to deck — handled in Phase 2
        setConsecutiveWrong(0)
      }

      // Card returns to hand at no energy cost (do nothing — card stays in hand)
      setAnimState('wrong')
      setTimeout(() => setAnimState(null), 600)
      playSFX('wrong')

      // Show brief explanation overlay
      // Handled by CombatScreen reading animState
    }

    setActiveQuestion(null)
    setActiveCardId(null)
  }, [activeQuestion, store, graveyard, consecutiveWrong, playSFX])

  // ============================================================
  // CARD EFFECT APPLICATION
  // ============================================================
  const applyCardEffect = useCallback((card, chainMultiplier, isFirstTry) => {
    const { effect } = card

    if (effect.damage) {
      const dmg = calculateDamage({
        base: effect.damage,
        bonusCorrectFirstTry: effect.bonus_correct_first_try || 0,
        chainMultiplier,
        enemyArmor: 0, // TODO: check enemy armor buffs
        isFirstTry,
        hits: effect.hits || 1,
      })

      // Kanji Blade bonus: extra damage if player has block
      const finalDmg = card.id === 'jp_vocab_kanji_blade' && store.block > 0
        ? dmg + (effect.bonus_if_block_active || 0)
        : dmg

      store.damageEnemy(finalDmg)
      showDamageNumber(finalDmg, 'damage')
    }

    if (effect.block) {
      const blockGained = calculateBlock({ base: effect.block, chainMultiplier })
      store.addBlock(blockGained)
    }

    if (effect.heal) {
      const healAmt = chainMultiplier > 1
        ? Math.floor(effect.heal * chainMultiplier)
        : effect.heal
      store.healHp(healAmt)
    }

    if (effect.draw) {
      const drawCount = chainMultiplier > 1
        ? effect.draw + 1 // chain doubles draw (2 → 3)
        : effect.draw
      const { drawn, deck: newDeck, discard: newDiscard } = drawCards(
        store.deck,
        store.discardPile,
        drawCount
      )
      store.setHand([...store.hand, ...drawn])
      store.setDeck(newDeck)
      store.setDiscard(newDiscard)
    }

    if (effect.chain_bonus && chainMultiplier > 1) {
      store.damageEnemy(effect.chain_bonus)
    }
  }, [store])

  // ============================================================
  // HINT
  // ============================================================
  const revealHint = useCallback(() => {
    if (store.energy < 1) return false
    store.spendEnergy(1)
    store.setHintUsed()
    playSFX('hint')
    return true
  }, [store, playSFX])

  // ============================================================
  // END TURN
  // ============================================================
  const endTurn = useCallback(async () => {
    if (activeQuestion) return // can't end turn with active question

    // Always read fresh state — never use stale closure values
    const s = useRunStore.getState()
    if (!s.currentEnemy) return

    const enemyAction = resolveEnemyTurn(s.currentEnemy, s.intentIndex, s.enemyBuffs)

    if (enemyAction.type === 'attack') {
      setAnimState('enemy_attack')
      await new Promise(r => setTimeout(r, 400))

      // Read state again after the await — it may have changed
      const s2 = useRunStore.getState()
      const { newHp, newBlock } = applyDamageToPlayer(enemyAction.damage, s2.hp, s2.block)
      s2.setHp(newHp)
      const damageBlocked = s2.block - newBlock
      if (damageBlocked > 0) s2.spendBlock(damageBlocked)
      const damageDealt = enemyAction.damage - damageBlocked
      if (damageDealt > 0) showDamageNumber(damageDealt, 'player_damage')
      setAnimState(null)
    }

    // Tick buff durations (read fresh state)
    const s3 = useRunStore.getState()
    const tickedBuffs = tickBuffs(s3.enemyBuffs)
    s3.setEnemyBuffs(tickedBuffs)
    s3.advanceIntent()

    // Short pause then draw new hand
    await new Promise(r => setTimeout(r, 200))
    drawHand()
  }, [activeQuestion, drawHand])

  // ============================================================
  // DAMAGE NUMBER DISPLAY
  // ============================================================
  const showDamageNumber = useCallback((value, type) => {
    const id = Date.now()
    setDamageNumbers(prev => [...prev, { id, value, type }])
    setTimeout(() => {
      setDamageNumbers(prev => prev.filter(d => d.id !== id))
    }, 900)
  }, [])

  // ============================================================
  // CHECK WIN/LOSE
  // ============================================================
  const isEnemyDefeated = store.enemyHp <= 0 && store.inCombat
  const isPlayerDefeated = store.hp <= 0

  return {
    // Data
    cardMap,
    allQuestions,
    activeQuestion,
    activeCardId,
    animState,
    damageNumbers,

    // Computed
    isEnemyDefeated,
    isPlayerDefeated,

    // Actions
    startFight,
    drawHand,
    selectCard,
    resolveAnswer,
    revealHint,
    endTurn,
    getCard,
  }
}
