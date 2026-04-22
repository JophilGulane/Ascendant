// hooks/useAudio.js
// Howler.js wrapper — silent fallback if audio files are missing
// All audio calls go through this hook

import { useCallback, useRef } from 'react'
import useSettingsStore from '../stores/settingsStore.js'

// SFX registry — lazy loaded
const sfxCache = {}
let Howl = null

// Attempt to load Howler (silent if unavailable)
async function loadHowler() {
  if (Howl) return Howl
  try {
    const mod = await import('howler')
    Howl = mod.Howl
    return Howl
  } catch {
    console.warn('[Ascendant] Howler.js unavailable — audio disabled')
    return null
  }
}

function createHowl(src, options = {}) {
  if (!Howl) return null
  try {
    return new Howl({ src, ...options, onloaderror: () => null })
  } catch {
    return null
  }
}

const SFX_MAP = {
  correct: '/audio/sfx/correct.mp3',
  wrong: '/audio/sfx/wrong.mp3',
  card_draw_vocab: '/audio/sfx/card_draw.mp3',
  card_draw_grammar: '/audio/sfx/card_draw.mp3',
  card_draw_reading: '/audio/sfx/card_draw.mp3',
  chain_activate: '/audio/sfx/chain_activate.mp3',
  boss_appear: '/audio/sfx/boss_appear.mp3',
  victory: '/audio/sfx/victory.mp3',
  hint: '/audio/sfx/hint.mp3',
  button_click: '/audio/sfx/click.mp3',
}

export function useAudio() {
  const sfxVolume = useSettingsStore(s => s.sfxVolume)
  const musicVolume = useSettingsStore(s => s.musicVolume)
  const musicRef = useRef({})

  const playSFX = useCallback(async (name) => {
    if (sfxVolume === 0) return
    const src = SFX_MAP[name]
    if (!src) return

    await loadHowler()
    if (!Howl) return

    try {
      if (!sfxCache[name]) {
        sfxCache[name] = createHowl([src])
      }
      if (sfxCache[name]) {
        sfxCache[name].volume(sfxVolume)
        sfxCache[name].play()
      }
    } catch {
      // Silent failure — game must always be playable without audio
    }
  }, [sfxVolume])

  const playMusic = useCallback(async (campaign, floor) => {
    const key = `${campaign}_floor${floor}`
    const src = `/audio/${campaign}/bgm_floor${floor}.mp3`

    await loadHowler()
    if (!Howl) return

    try {
      // Stop all playing music
      Object.values(musicRef.current).forEach(m => {
        if (m && m.playing()) m.fade(musicVolume, 0, 800)
        setTimeout(() => m && m.stop(), 800)
      })

      if (!musicRef.current[key]) {
        musicRef.current[key] = createHowl([src], { loop: true, volume: 0 })
      }

      if (musicRef.current[key]) {
        musicRef.current[key].play()
        musicRef.current[key].fade(0, musicVolume, 1000)
      }
    } catch {
      // Silent failure
    }
  }, [musicVolume])

  const stopMusic = useCallback(() => {
    Object.values(musicRef.current).forEach(m => {
      if (m) {
        try { m.fade(musicRef.current ? 0.4 : 0, 0, 500); setTimeout(() => m.stop(), 500) } catch {}
      }
    })
  }, [])

  return { playSFX, playMusic, stopMusic }
}
