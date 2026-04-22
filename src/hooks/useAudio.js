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
  // Core UI
  button_click: '/audio/sfx/click.mp3',
  button_hover: '/audio/sfx/hover.mp3',

  // Game Logic
  correct: '/audio/sfx/correct.mp3',
  wrong: '/audio/sfx/wrong.mp3',
  hint: '/audio/sfx/hint.mp3',
  chain_activate: '/audio/sfx/chain_activate.mp3',
  cardLock: '/audio/sfx/cardLock.mp3',

  // Cards
  card_draw_vocab: '/audio/sfx/card_draw.mp3',
  card_draw_grammar: '/audio/sfx/card_draw.mp3',
  card_draw_reading: '/audio/sfx/card_draw.mp3',
  card_play: '/audio/sfx/card_play.mp3',
  card_exhaust: '/audio/sfx/card_play.mp3',
  card_discard: '/audio/sfx/card_play.mp3',

  // Combat Actions
  attack_player: '/audio/sfx/attack_player.mp3',
  attack_enemy: '/audio/sfx/attack_enemy.mp3',
  enemy_strike: '/audio/sfx/attack_player.mp3', // mapping enemy_strike to attack_player
  block_gain: '/audio/sfx/power_effect.mp3',
  heal: '/audio/sfx/heal.mp3',
  enemy_heal: '/audio/sfx/heal.mp3',
  debuff_apply: '/audio/sfx/debuff_apply.mp3',
  buff_apply: '/audio/sfx/power_effect.mp3',
  enemy_buff: '/audio/sfx/power_effect.mp3',
  enemy_turn_start: '/audio/sfx/enemy_turn.mp3',

  // Rewards & Loot
  gold_gain: '/audio/sfx/gold_gain.mp3',
  relic_obtain: '/audio/sfx/relic_obtain.mp3',
  potion_use: '/audio/sfx/potion_use.mp3',
  loot_appear: '/audio/sfx/loot_appear.mp3',
  draft_open: '/audio/sfx/draft_open.mp3',

  // Progress
  victory: '/audio/sfx/victory.mp3',
  boss_appear: '/audio/sfx/boss_appear.mp3',
  map_hover: '/audio/sfx/map_hover.mp3',
  map_click: '/audio/sfx/map_click.mp3',
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

  const playMusic = useCallback(async (campaign, trackId) => {
    const key = `${campaign}_${trackId}`
    let src = `/audio/${campaign}/bgm_floor${trackId}.mp3` // Default assumption: trackId is a floor number

    if (campaign === 'menu') {
      src = '/audio/bgm_menu.mp3'
    } else if (trackId === 'combat') {
      src = `/audio/${campaign}/bgm_combat.mp3`
    } else if (trackId === 'boss') {
      src = `/audio/${campaign}/bgm_boss.mp3`
    }

    await loadHowler()
    if (!Howl) return

    try {
      // Check if already playing the exact same track
      const currentTrack = musicRef.current[key]
      if (currentTrack && currentTrack.playing()) return

      // Stop all other playing music
      Object.entries(musicRef.current).forEach(([k, m]) => {
        if (m && m.playing() && k !== key) {
          m.fade(musicVolume, 0, 800)
          setTimeout(() => m && m.stop(), 800)
        }
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
        try { m.fade(musicRef.current ? 0.4 : 0, 0, 500); setTimeout(() => m.stop(), 500) } catch { }
      }
    })
  }, [])

  return { playSFX, playMusic, stopMusic }
}
