// hooks/useGraveyard.js
// Graveyard read/write + session mistake merging

import { useCallback } from 'react'
import useGraveyardStore from '../stores/graveyardStore.js'
import useRunStore from '../stores/runStore.js'

export function useGraveyard() {
  const { recordWrong, recordCorrect, getSortedEntries, getUnclearedCount, entries } = useGraveyardStore()
  const sessionMistakes = useRunStore(s => s.sessionMistakes)

  const logWrong = useCallback((question) => {
    if (!question) return
    recordWrong(question.id, question.graveyard_label, question.graveyard_reading)
  }, [recordWrong])

  const logCorrect = useCallback((questionId) => {
    if (!questionId) return
    recordCorrect(questionId)
  }, [recordCorrect])

  // Merge session mistakes into persistent graveyard on run end
  const mergeSessionToGraveyard = useCallback((sessionMistakesParam) => {
    const mistakes = sessionMistakesParam || sessionMistakes
    for (const m of mistakes) {
      // Only record wrong if not already overridden by a correct this session
      recordWrong(m.questionId, m.label, m.reading)
    }
  }, [sessionMistakes, recordWrong])

  const isInGraveyard = useCallback((questionId) => {
    return Boolean(entries[questionId])
  }, [entries])

  const getMasteryStars = useCallback((questionId) => {
    const entry = entries[questionId]
    if (!entry) return 0
    return Math.min(entry.correctStreak || 0, 3)
  }, [entries])

  return {
    logWrong,
    logCorrect,
    mergeSessionToGraveyard,
    getSortedEntries,
    getUnclearedCount,
    isInGraveyard,
    getMasteryStars,
    entries,
  }
}
