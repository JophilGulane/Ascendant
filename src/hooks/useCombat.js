// hooks/useCombat.js — v2
// Core combat logic: card play, question resolution, locked cards, chain, debuff checks
// Enemy turn is now handled by useEnemyTurn.js — this hook is PLAYER_TURN only.

import { useState, useCallback, useEffect } from 'react'
import useRunStore from '../stores/runStore.js'
import useSettingsStore from '../stores/settingsStore.js'
import { useGraveyard } from './useGraveyard.js'
import { useAudio } from './useAudio.js'
import { drawCards } from '../utils/deck.js'
import {
  resolveChain,
  calculateDamage,
  calculateBlock,
} from '../utils/combat.js'
import { sampleQuestionsForCard, shuffleOptions } from '../utils/questions.js'
import {
  getEffectiveDrawCount,
  getEffectiveMaxEnergy,
  isCardTypeSilenced,
} from '../utils/enemyTurn.js'
import { CARD_TYPES } from '../constants/cardTypes.js'

// Lazy question + card cache per campaign
const questionCache = {}
const cardCache = {}

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

async function loadCards(campaign) {
  if (cardCache[campaign]) return cardCache[campaign]
  try {
    const mod = await import(`../data/${campaign}/cards.json`)
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

  // Question prompt state
  const [activeQuestion, setActiveQuestion] = useState(null)
  const [activeCardId, setActiveCardId] = useState(null)

  // Animation state
  const [animState, setAnimState] = useState(null) // 'correct' | 'wrong' | null
  const [damageNumbers, setDamageNumbers] = useState([])

  // v2: shake animation for locked card clicks
  const [shakingCardId, setShakingCardId] = useState(null)

  // Load campaign data on mount
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
  // DRAW HAND
  // Respects Bind debuff (fewer draws) + Drain debuff (less energy)
  // Called at start of PLAYER_DRAW phase
  // ============================================================
  const drawHand = useCallback(() => {
    const s = useRunStore.getState()

    // v2: unlock all locked cards first (greyscale → color flash handled by CardComponent)
    s.unlockAllCards()

    const drawCount = getEffectiveDrawCount(s, 5)
    const effectiveEnergy = getEffectiveMaxEnergy(s)

    const currentDeck = [...s.deck]
    const currentDiscard = [...s.discardPile, ...s.hand]
    const { drawn, deck: newDeck, discard: newDiscard } = drawCards(currentDeck, currentDiscard, drawCount)

    s.setHand(drawn)
    s.setDeck(newDeck)
    s.setDiscard(newDiscard)

    // Reset energy respecting Drain debuff (Drain reduces max energy by 1)
    // We manually set energy to effectiveEnergy rather than just calling resetEnergy()
    useRunStore.setState({ energy: effectiveEnergy })

    s.incrementTurn()

    drawn.forEach((_, i) => setTimeout(() => playSFX('card_draw_vocab'), i * 80))
  }, [playSFX])

  // ============================================================
  // SELECT CARD
  // v2: check locked, check silenced, check energy, then open question
  // ============================================================
  const selectCard = useCallback((cardId) => {
    if (activeQuestion) return

    const s = useRunStore.getState()
    const card = cardMap[cardId]
    if (!card) return

    // RULE: locked cards cannot be played — shake and return
    if (s.lockedCards.includes(cardId)) {
      setShakingCardId(cardId)
      setTimeout(() => setShakingCardId(null), 500)
      return
    }

    // v2: Silence debuff — silenced card type cannot be played
    if (isCardTypeSilenced(card.type, s)) {
      setShakingCardId(cardId)
      setTimeout(() => setShakingCardId(null), 500)
      return
    }

    // Energy check
    if (s.energy < card.energy_cost) return

    // Sample question — v2: passes store so used IDs are tracked
    const question = sampleQuestionsForCard(
      card,
      allQuestions,
      graveyard.entries,
      settings,
      s.floor,
      s  // v2: pass store for no-repeat tracking
    )

    if (!question) {
      console.warn(`[useCombat] No question found for card ${cardId}`)
      return
    }

    const { shuffledOptions, newCorrectIndex } = shuffleOptions(
      question.options,
      question.correct_index,
      s.masteryLevel
    )

    setActiveQuestion({ question, shuffledOptions, newCorrectIndex, card })
    setActiveCardId(cardId)
  }, [activeQuestion, cardMap, allQuestions, graveyard.entries, settings])

  // ============================================================
  // RESOLVE ANSWER — called by QuestionPrompt after delay
  // v2: wrong = lockCard + addEnemyBuff + breakChain
  // ============================================================
  const resolveAnswer = useCallback(({ result, isFirstTry }) => {
    if (!activeQuestion) return
    const { question, card } = activeQuestion
    const isCorrect = result === 'correct'
    const s = useRunStore.getState()

    if (isCorrect) {
      graveyard.logCorrect(question.id)
      s.logCorrect()

      // Track card type for enemy focus move
      s.trackCardTypePlayed(card.type)

      // Journal
      if (card.type === CARD_TYPES.VOCABULARY) {
        s.addJournalWord({
          questionId: question.id,
          word: question.graveyard_label,
          reading: question.graveyard_reading,
          translation: question.options[question.correct_index],
          example: question.hint,
        })
      } else if (card.type === CARD_TYPES.GRAMMAR) {
        s.addJournalGrammar({
          questionId: question.id,
          concept: question.graveyard_label,
          pattern: question.graveyard_reading,
          example: question.hint,
        })
      }

      // Chain resolution
      const chainResult = resolveChain(card.type, { chainActive: s.chainActive, chainType: s.chainType }, s)

      // Card effect
      applyCardEffect(card, chainResult.bonusMultiplier, isFirstTry, s)

      // Spend energy + move to discard
      s.spendEnergy(card.energy_cost)
      s.removeFromHand(card.id)
      s.addToDiscard(card.id)

      setAnimState('correct')
      setTimeout(() => setAnimState(null), 600)
      playSFX('correct')

    } else {
      // WRONG / TIMEOUT — v2: lock the card
      graveyard.logWrong(question)
      s.logMistake(question.id, question.graveyard_label, question.graveyard_reading)

      // RULE: lock the card for the rest of this turn
      s.lockCard(card.id)

      // RULE: break chain on any wrong answer
      s.breakChain()

      // Enemy buff from wrong answer — read from enemy data, not hardcoded
      const enemy = s.currentEnemy
      const buffTemplate = enemy?.wrong_answer_buffs?.[card.type]
      if (buffTemplate) {
        s.addEnemyBuff({ ...buffTemplate })
      }

      setAnimState('wrong')
      setTimeout(() => setAnimState(null), 600)
      playSFX('wrong')
      playSFX('cardLock')
    }

    setActiveQuestion(null)
    setActiveCardId(null)
  }, [activeQuestion, graveyard, playSFX])

  // ============================================================
  // CARD EFFECT APPLICATION
  // ============================================================
  const applyCardEffect = useCallback((card, chainMultiplier, isFirstTry, s) => {
    const { effect } = card
    if (!effect) return

    if (effect.damage) {
      const dmg = calculateDamage({
        base: effect.damage,
        bonusCorrectFirstTry: effect.bonus_correct_first_try || effect.bonus_correct_no_hint || 0,
        chainMultiplier,
        enemyArmor: s.enemyArmor,
        enemyFocusType: s.enemyFocusType,
        cardType: card.type,
        isFirstTry,
        hits: effect.hits || 1,
      })

      // Chain armor: only breaks if chain combo (chainMultiplier > 1)
      const bypassesChainArmor = chainMultiplier > 1

      const finalDmg = bypassesChainArmor
        ? dmg  // chain combos bypass armor
        : (effect.bonus_if_block_active && s.block > 0 ? dmg + effect.bonus_if_block_active : dmg)

      s.damageEnemy(finalDmg)
      showDamageNumber(finalDmg, 'damage')
    }

    if (effect.block) {
      const blockGained = calculateBlock({ base: effect.block, chainMultiplier })
      s.addBlock(blockGained)
    }

    if (effect.heal) {
      const healAmt = chainMultiplier > 1 ? Math.floor(effect.heal * chainMultiplier) : effect.heal
      s.healHp(healAmt)
    }

    if (effect.draw) {
      const drawCount = chainMultiplier > 1 ? effect.draw + 1 : effect.draw
      const { drawn, deck: newDeck, discard: newDiscard } = drawCards(s.deck, s.discardPile, drawCount)
      s.setHand([...s.hand, ...drawn])
      s.setDeck(newDeck)
      s.setDiscard(newDiscard)
    }

    if (effect.chain_bonus && chainMultiplier > 1) {
      s.damageEnemy(effect.chain_bonus)
    }
  }, [])

  // ============================================================
  // HINT
  // ============================================================
  const revealHint = useCallback(() => {
    const s = useRunStore.getState()
    if (s.energy < 1) return false
    s.spendEnergy(1)
    s.setHintUsed()
    playSFX('hint')
    return true
  }, [playSFX])

  // ============================================================
  // DAMAGE NUMBERS
  // ============================================================
  const showDamageNumber = useCallback((value, type) => {
    const id = Date.now() + Math.random()
    setDamageNumbers(prev => [...prev, { id, value, type }])
    setTimeout(() => setDamageNumbers(prev => prev.filter(d => d.id !== id)), 900)
  }, [])

  // ============================================================
  // WIN / LOSE
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
    shakingCardId,

    // Computed
    isEnemyDefeated,
    isPlayerDefeated,

    // Actions
    drawHand,
    selectCard,
    resolveAnswer,
    revealHint,
    getCard,
  }
}
