// hooks/useQuestion.js
// Question prompt lifecycle — completely decoupled from combat
// Receives a question, manages timer, answer selection, hint
// Fires callback: onResult({ result: 'correct'|'wrong'|'timeout', selectedIndex, timeUsed })

import { useState, useEffect, useRef, useCallback } from 'react'
import useSettingsStore from '../stores/settingsStore.js'
import useRunStore from '../stores/runStore.js'

const TIMER_SECONDS = {
  relaxed: 30,
  normal: 20,
  fast: 12,
  off: null, // no timer
}

export function useQuestion({ question, masteryLevel = 0, onResult, noTimer = false, autoHint = false, isPaused = false }) {
  const timerSpeed = useSettingsStore(s => s.timerSpeed)
  const activeModifier = useRunStore(s => s.activeModifier)
  const potionEffects = useRunStore(s => s.potionEffects)

  // Curse: timer_reduction overrides the settings timer
  const curseEffect = activeModifier?.curse?.effect
  const blessingEffect = activeModifier?.blessing?.effect
  const overrideSeconds = curseEffect?.type === 'timer_reduction' ? curseEffect.value : null
  const baseMaxSeconds = noTimer ? null : (overrideSeconds ?? TIMER_SECONDS[timerSpeed] ?? 20)

  // Potion: memory_flask freezes timer for +20 extra seconds on this question
  const memoryBonus = potionEffects?.memoryFlaskActive ? 20 : 0
  const maxSeconds = baseMaxSeconds !== null ? baseMaxSeconds + memoryBonus : null

  // Blessing: free_hints means hint never costs energy
  const hasFreeHints = blessingEffect?.type === 'free_hints'

  // Potion: clarity reduces options to 2 (exported as flag for QuestionPrompt to use)
  const hasClarityActive = potionEffects?.clarityActive ?? false

  // Potion: auto_correct — next question auto-resolves as correct
  const hasAutoCorrect = potionEffects?.autoCorrectActive ?? false

  // Mastery 4+: reduce timer by 5 seconds
  const effectiveMax = (masteryLevel >= 4 && maxSeconds !== null)
    ? Math.max(5, maxSeconds - 5)
    : maxSeconds

  const [timeLeft, setTimeLeft] = useState(effectiveMax)
  const [hintShown, setHintShown] = useState(autoHint)
  const [answered, setAnswered] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(null)
  const [isFirstTry, setIsFirstTry] = useState(true)
  const [halfDamage, setHalfDamage] = useState(false)
  const timerRef = useRef(null)
  const startRef = useRef(Date.now())

  // Start/reset timer when question changes
  useEffect(() => {
    if (!question) return
    setTimeLeft(effectiveMax)
    setHintShown(autoHint)
    setAnswered(false)
    setSelectedIndex(null)
    setIsFirstTry(true)
    setHalfDamage(false)
    startRef.current = Date.now()

    if (effectiveMax === null || isPaused) return // no timer mode or paused

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current)
          return 0
        }
        return t - 1
      })
    }, 1000)

    return () => clearInterval(timerRef.current)
  }, [question?.id, isPaused]) // reset on question change or pause toggle

  // Handle timeout
  useEffect(() => {
    if (effectiveMax === null) return
    if (timeLeft === 0 && !answered) {
      setAnswered(true)
      clearInterval(timerRef.current)
      const timeUsed = (Date.now() - startRef.current) / 1000
      // Small delay on timeout too so the red timer is visible briefly
      setTimeout(() => {
        onResult({ result: 'timeout', selectedIndex: null, timeUsed, isFirstTry, halfDamage })
      }, 400)
    }
  }, [timeLeft, answered, halfDamage])

  const selectAnswer = useCallback((index) => {
    if (answered) return
    setAnswered(true)
    clearInterval(timerRef.current)
    setSelectedIndex(index)
    const timeUsed = (Date.now() - startRef.current) / 1000

    // Potion: auto_correct — treat any answer as correct, consume the effect
    const s = useRunStore.getState()
    if (s.potionEffects?.autoCorrectActive) {
      s.setPotionEffect('autoCorrectActive', false)
      setTimeout(() => {
        onResult({ result: 'correct', selectedIndex: index, timeUsed, isFirstTry: true, halfDamage: false })
      }, 650)
      return
    }

    // Potion: clarity — consume flag when answer is submitted
    if (s.potionEffects?.clarityActive) {
      s.setPotionEffect('clarityActive', false)
    }
    // Potion: memory_flask — consume flag when answer is submitted
    if (s.potionEffects?.memoryFlaskActive) {
      s.setPotionEffect('memoryFlaskActive', false)
    }

    const correct = index === question.correct_index
    setTimeout(() => {
      onResult({
        result: correct ? 'correct' : 'wrong',
        selectedIndex: index,
        timeUsed,
        isFirstTry,
        halfDamage,
      })
    }, 650)
  }, [answered, question, isFirstTry, halfDamage, onResult])

  const revealHint = useCallback(() => {
    if (hintShown) return false // already shown
    setHintShown(true)
    setIsFirstTry(false) // hint costs first-try bonus
    return true // signal to caller to deduct energy
  }, [hintShown])

  const timerProgress = effectiveMax
    ? (timeLeft / effectiveMax) * 100
    : 100

  return {
    timeLeft,
    timerProgress,
    hintShown,
    answered,
    selectedIndex,
    isFirstTry,
    halfDamage,
    hasFreeHints,
    hasClarityActive,
    hasAutoCorrect,
    selectAnswer,
    revealHint,
    setHalfDamage,
  }
}
