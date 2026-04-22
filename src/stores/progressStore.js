// stores/progressStore.js
// Campaign clears, mastery levels, unlocks — persisted across sessions
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '../utils/localStorage.js'

const useProgressStore = create(
  persist(
    (set, get) => ({
      // { [campaign]: { [characterId]: { cleared: bool, masteryLevel: number, bestAccuracy: number } } }
      campaigns: {
        japanese: {
          hana: { cleared: false, masteryLevel: 0, bestAccuracy: 0, totalRuns: 0 },
          kenji: { cleared: false, masteryLevel: 0, bestAccuracy: 0, totalRuns: 0 },
          yuki: { cleared: false, masteryLevel: 0, bestAccuracy: 0, totalRuns: 0 },
        },
        korean: {
          minjun: { cleared: false, masteryLevel: 0, bestAccuracy: 0, totalRuns: 0 },
          sora: { cleared: false, masteryLevel: 0, bestAccuracy: 0, totalRuns: 0 },
          jiyeon: { cleared: false, masteryLevel: 0, bestAccuracy: 0, totalRuns: 0 },
        },
        spanish: {
          rosa: { cleared: false, masteryLevel: 0, bestAccuracy: 0, totalRuns: 0 },
          marco: { cleared: false, masteryLevel: 0, bestAccuracy: 0, totalRuns: 0 },
          elena: { cleared: false, masteryLevel: 0, bestAccuracy: 0, totalRuns: 0 },
        },
      },

      recordRunEnd: (campaign, characterId, cleared, accuracy) => set(s => {
        const prev = s.campaigns[campaign]?.[characterId] || {}
        const wasCleared = prev.cleared || cleared
        const newMastery = wasCleared && !prev.cleared ? 1 : prev.masteryLevel // unlock mastery 1 on first clear
        return {
          campaigns: {
            ...s.campaigns,
            [campaign]: {
              ...s.campaigns[campaign],
              [characterId]: {
                cleared: wasCleared,
                masteryLevel: (cleared && prev.masteryLevel === 0) ? 1 : prev.masteryLevel,
                bestAccuracy: Math.max(prev.bestAccuracy || 0, accuracy || 0),
                totalRuns: (prev.totalRuns || 0) + 1,
              }
            }
          }
        }
      }),

      unlockMasteryLevel: (campaign, characterId, level) => set(s => ({
        campaigns: {
          ...s.campaigns,
          [campaign]: {
            ...s.campaigns[campaign],
            [characterId]: {
              ...(s.campaigns[campaign]?.[characterId] || {}),
              masteryLevel: level,
            }
          }
        }
      })),

      getMasteryLevel: (campaign, characterId) => {
        return get().campaigns[campaign]?.[characterId]?.masteryLevel || 0
      },

      hasCleared: (campaign, characterId) => {
        return get().campaigns[campaign]?.[characterId]?.cleared || false
      },

      // Check if campaign is newly unlocked (any character cleared it)
      isCampaignUnlocked: (campaign) => {
        const chars = get().campaigns[campaign]
        if (!chars) return false
        return Object.values(chars).some(c => c.cleared)
      },
    }),
    { name: STORAGE_KEYS.PROGRESS }
  )
)

export default useProgressStore
