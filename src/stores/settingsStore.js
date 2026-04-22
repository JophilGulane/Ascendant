// stores/settingsStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '../utils/localStorage.js'
import { ROMANIZATION_MODES as ROM } from '../constants/campaigns.js'

const useSettingsStore = create(
  persist(
    (set) => ({
      // Timer
      timerSpeed: 'normal', // 'relaxed' (30s) | 'normal' (20s) | 'fast' (12s) | 'off'

      // Script display
      romanization: ROM.FADE_PROGRESSIVE,

      // Learning
      spacedRepetition: true, // Graveyard haunting / spaced rep weighting

      // Audio
      sfxVolume: 0.7,
      musicVolume: 0.4,

      // Visuals
      cardAnimSpeed: 'normal', // 'normal' | 'fast' | 'instant'
      fontSizeMultiplier: 1,   // 1 | 1.25 | 1.5

      // Accessibility
      highContrast: false,
      colorblindMode: false,

      // UI language
      uiLanguage: 'english', // 'english' | 'target' (advanced)

      // Subtitles
      subtitles: 'auto', // 'always' | 'auto' | 'off'

      // Actions
      setTimerSpeed: (speed) => set({ timerSpeed: speed }),
      setRomanization: (mode) => set({ romanization: mode }),
      setSpacedRepetition: (val) => set({ spacedRepetition: val }),
      setSfxVolume: (vol) => set({ sfxVolume: Math.max(0, Math.min(1, vol)) }),
      setMusicVolume: (vol) => set({ musicVolume: Math.max(0, Math.min(1, vol)) }),
      setCardAnimSpeed: (speed) => set({ cardAnimSpeed: speed }),
      setFontSizeMultiplier: (mult) => set({ fontSizeMultiplier: mult }),
      setHighContrast: (val) => set({ highContrast: val }),
      setColorblindMode: (val) => set({ colorblindMode: val }),

      // Get timer duration in seconds based on speed setting
      getTimerSeconds: () => {
        const speeds = { relaxed: 30, normal: 20, fast: 12, off: 0 }
        return (speed) => speeds[speed] || 20
      },
    }),
    { name: STORAGE_KEYS.SETTINGS }
  )
)

export default useSettingsStore
