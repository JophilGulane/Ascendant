// stores/graveyardStore.js
// Persistent mistake tracking — persists across ALL runs and sessions
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '../utils/localStorage.js'

const useGraveyardStore = create(
  persist(
    (set, get) => ({
      // entries shape: { [questionId]: { label, reading, wrongCount, correctStreak, mastered, lastSeen } }
      entries: {},

      recordWrong: (questionId, label, reading) => set(s => ({
        entries: {
          ...s.entries,
          [questionId]: {
            label: label || questionId,
            reading: reading || '',
            wrongCount: (s.entries[questionId]?.wrongCount || 0) + 1,
            correctStreak: 0,
            mastered: false,
            lastSeen: Date.now(),
          }
        }
      })),

      recordCorrect: (questionId) => set(s => {
        const entry = s.entries[questionId]
        if (!entry) return {} // not in graveyard = never wrong, skip
        const newStreak = (entry.correctStreak || 0) + 1
        return {
          entries: {
            ...s.entries,
            [questionId]: {
              ...entry,
              correctStreak: newStreak,
              mastered: newStreak >= 3,
              lastSeen: Date.now(),
            }
          }
        }
      }),

      // Get sorted entries for display (most recently wrong first)
      getSortedEntries: () => {
        const entries = get().entries
        return Object.entries(entries)
          .map(([id, data]) => ({ id, ...data }))
          .sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0))
      },

      // Get unmastered entries count
      getUnclearedCount: () => {
        return Object.values(get().entries).filter(e => !e.mastered).length
      },

      clearAll: () => set({ entries: {} }),
    }),
    { name: STORAGE_KEYS.GRAVEYARD }
  )
)

export default useGraveyardStore
