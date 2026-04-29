// stores/modeStore.js
// Tracks whether the player is in 'languages' or 'programming' mode.
// Persisted to localStorage under 'lq_mode'.
// Single source of truth consumed by ModeSelect, CampaignSelect, Leaderboard.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useModeStore = create(
  persist(
    (set) => ({
      activeMode: null, // 'languages' | 'programming' | null

      setMode: (mode) => set({ activeMode: mode }),
      clearMode: () => set({ activeMode: null }),
    }),
    { name: 'lq_mode' }
  )
)

export default useModeStore
