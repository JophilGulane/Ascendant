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

    // v2: unlock all locked cards first
    s.unlockAllCards()

    // v3: Passively retain cards that have the retain effect
    const currentHand = s.hand
    const retained = currentHand.filter(id => {
      const card = cardMap[id]
      return card?.effect?.retain
    })
    s.setRetainedCards(retained)

    // Tick growth for retained cards (they grow each turn they stay in hand)
    retained.forEach(cardId => s.tickRetainGrowth(cardId))

    const drawCount = getEffectiveDrawCount(s, 5)
    const effectiveEnergy = getEffectiveMaxEnergy(s)

    // Blessing: bonus_draw adds to draw count
    const modBlessing = s.activeModifier?.blessing?.effect
    const modCurse = s.activeModifier?.curse?.effect
    const bonusDraw = modBlessing?.type === 'bonus_draw' ? (modBlessing.value ?? 1) : 0
    const effectiveDrawCount = drawCount + bonusDraw

    // v3: Retained cards stay in the hand — only draw enough to fill up to drawCount
    const slotsToFill = Math.max(0, effectiveDrawCount - retained.length)
    // Cards currently in hand that are NOT retained go to discard
    const nonRetainedInHand = currentHand.filter(id => !retained.includes(id))
    const currentDeck = [...s.deck]

    // Curse: chaos_hand — every other turn, shuffle non-retained hand cards back to deck
    let currentDiscard = [...s.discardPile, ...nonRetainedInHand]
    if (modCurse?.type === 'chaos_hand' && s.turnNumber % 2 === 0 && s.turnNumber > 0) {
      currentDiscard = [...s.discardPile, ...nonRetainedInHand, ...retained]
      // retained cards also get reshuffled this turn (chaos!)
    }

    const { drawn, deck: newDeck, discard: newDiscard } = drawCards(currentDeck, currentDiscard, slotsToFill)

    // New hand = retained cards (still in hand) + newly drawn cards
    s.setHand([...retained, ...drawn])
    s.setDeck(newDeck)
    s.setDiscard(newDiscard)

    // Reset energy respecting Drain debuff
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

    // Curse: type_lock — cannot play the same card type consecutively
    const typeLockCurse = s.activeModifier?.curse?.effect?.type === 'type_lock'
    if (typeLockCurse && s.lastCardTypePlayed && s.lastCardTypePlayed === card.type) {
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
  const resolveAnswer = useCallback(({ result, isFirstTry, halfDamage }) => {
    if (!activeQuestion) return
    const { question, card } = activeQuestion
    const isCorrect = result === 'correct'
    const s = useRunStore.getState()

    if (isCorrect) {
      graveyard.logCorrect(question)
      s.logCorrect()

      const freshS = useRunStore.getState()
      if (freshS.relics.includes('travelers_compass') && freshS.fightCorrectStreak > 0 && freshS.fightCorrectStreak % 3 === 0) {
        freshS.queueBonusEnergyNextTurn(1)
      }

      // Potion: scholar's_blood — +3 HP per correct answer this fight
      if (freshS.potionEffects?.scholarsBloodActive) {
        freshS.healHp(3)
      }

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
      const chainResult = resolveChain(card.type, { chainActive: s.chainActive, chainType: s.chainType }, s, s.relics.includes('chain_bracelet'))
      if (chainResult.bonusMultiplier > 1) {
        playSFX('chain_activate')
      }

      // Blessing: chain_starter — first correct answer each turn auto-activates chain
      const chainStarterBlessing = s.activeModifier?.blessing?.effect?.type === 'chain_starter'
      if (chainStarterBlessing && s.fightCorrectStreak === 0 && !s.chainActive) {
        s.activateChain(card.type)
      }

      // Card effect (apply once normally)
      let mult = chainResult.bonusMultiplier
      if (halfDamage) mult *= 0.5
      applyCardEffect(card, mult, isFirstTry, s)

      // Potion: echo_tonic — apply card effect a second time
      const afterS = useRunStore.getState()
      if (afterS.potionEffects?.echoTonicActive) {
        afterS.setPotionEffect('echoTonicActive', false)
        applyCardEffect(card, mult, false, useRunStore.getState()) // second hit, no first-try bonus
      }

      // Spend energy + move to discard
      s.spendEnergy(card.energy_cost)
      s.removeFromHand(card.id)
      s.addToDiscard(card.id)
      s.clearRetainGrowth(card.id)
      // Track for type_lock curse
      s.setLastCardTypePlayed(card.type)

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

      // Enemy buff from wrong answer
      const enemy = s.currentEnemy
      const buffTemplate = enemy?.wrong_answer_buffs?.[card.type]
      
      const freshS = useRunStore.getState()
      const firstMistake = (freshS.fightTotal - freshS.fightCorrect === 1)

      if (buffTemplate) {
        if (s.relics.includes('newcomers_phrasebook') && firstMistake) {
          // Negated by relic
        } else {
          // Apply buff normally
          s.addEnemyBuff({ ...buffTemplate })
          
          // Apply extra times for relic / mastery rule
          const extraBuffs = (s.relics.includes('cracked_hourglass') ? 1 : 0) + (s.masteryLevel >= 5 ? 1 : 0)
          for (let i = 0; i < extraBuffs; i++) {
            s.addEnemyBuff({ ...buffTemplate })
          }
        }
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
      let baseDmg = calculateDamage({
        base: effect.damage,
        bonusCorrectFirstTry: effect.bonus_correct_first_try || effect.bonus_correct_no_hint || 0,
        chainMultiplier,
        enemyArmor: s.enemyArmor,
        enemyFocusType: s.enemyFocusType,
        cardType: card.type,
        isFirstTry,
        hits: effect.hits || 1,
      })

      // Apply bonus_damage from active modifier blessing (e.g. Critical Knowledge)
      const modBlessing = s.activeModifier?.blessing?.effect
      if (modBlessing?.type === 'bonus_damage') {
        baseDmg += modBlessing.value
      }

      // Chain armor: only breaks if chain combo (chainMultiplier > 1)
      const bypassesChainArmor = chainMultiplier > 1

      const finalDmg = bypassesChainArmor
        ? baseDmg  // chain combos bypass armor
        : (effect.bonus_if_block_active && s.block > 0 ? baseDmg + effect.bonus_if_block_active : baseDmg)

      s.damageEnemy(finalDmg)
      showDamageNumber(finalDmg, 'damage')
    }

    if (effect.block) {
      // Curse: no_block — block cards deal 0 block
      const noBlockCurse = s.activeModifier?.curse?.effect?.type === 'no_block'
      if (!noBlockCurse) {
        // v3: retain growth — each retained turn adds +4 bonus block
        const stacks = s.retainGrowthStacks?.[card.id] || 0
        const growthBonus = stacks * 4
        const blockGained = calculateBlock({ base: effect.block + growthBonus, chainMultiplier })
        s.addBlock(blockGained)
      }
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

    // Blessing: mono_mastery — if 3+ cards of same type played this turn, queue +1 energy
    const monoMasteryBlessing = s.activeModifier?.blessing?.effect?.type === 'mono_mastery'
    if (monoMasteryBlessing) {
      const typeCounts = s.cardTypesPlayedThisFight || {}
      const thisTypeCount = (typeCounts[card.type] || 0) + 1 // +1 because trackCardTypePlayed runs after
      if (thisTypeCount === 3) {
        s.queueBonusEnergyNextTurn(1)
      }
    }

    // v3: Discard/Draw — discard N cards from hand, draw N+1
    if (effect.discard_draw) {
      const count = effect.discard_draw
      const freshS = useRunStore.getState()
      // Discard random non-retained cards from hand (excluding the card just played, already removed)
      const eligibleToDiscard = freshS.hand.filter(id => !freshS.retainedCards.includes(id))
      const toDiscard = eligibleToDiscard.slice(0, count)
      const newHand = freshS.hand.filter(id => !toDiscard.includes(id))
      const newDiscard = [...freshS.discardPile, ...toDiscard]
      const { drawn, deck: newDeck, discard: finalDiscard } = drawCards(freshS.deck, newDiscard, count + 1)
      s.setHand([...newHand, ...drawn])
      s.setDeck(newDeck)
      s.setDiscard(finalDiscard)
    }

    // v3: Exhaust for energy — card is played, then immediately exhausted (removed from discard)
    if (effect.exhaust_self_gain_energy) {
      const freshS = useRunStore.getState()
      // Remove from discard (it was just added there by resolveAnswer), put in exhaustPile
      const newDiscard = freshS.discardPile.filter(id => id !== card.id)
      s.setDiscard(newDiscard)
      useRunStore.setState(st => ({ exhaustPile: [...st.exhaustPile, card.id] }))
      s.gainBonusEnergy(effect.exhaust_self_gain_energy)
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
