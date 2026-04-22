// constants/campaigns.js
// Campaign metadata — theme colors, fonts, display names
// NEVER use raw hex colors in components — always reference these tokens

export const CAMPAIGN_THEMES = {
  japanese: {
    id: 'japanese',
    name: 'The Mountain Pilgrimage',
    name_target: '山の巡礼',
    language: 'Japanese',
    language_target: '日本語',
    tagline: '山の頂へ — To the summit of the mountain',
    primary: '#1A0A00',
    accent: '#C41E3A',
    accent2: '#E8B86D',
    cardVocab: '#8B1A1A',
    cardGrammar: '#1A3A8B',
    cardReading: '#1A6B3A',
    font: 'Noto Serif JP',
    bgGradient: 'linear-gradient(180deg, #0a0516 0%, #1a0a00 50%, #0d0d0d 100%)',
    particleColor: '#E8B86D',
    particleEmoji: '🌸',
    floors: 2, // Phase 1: 2 floors
    campaignWorld: 'Feudal Japan — shrine mountain, bamboo forests, spirit paths',
    locked: false,
  },
  korean: {
    id: 'korean',
    name: 'The Corporate Ascent',
    name_target: '기업의 상승',
    language: 'Korean',
    language_target: '한국어',
    tagline: '정상까지 — To the top',
    primary: '#000814',
    accent: '#00F5FF',
    accent2: '#FF006E',
    cardVocab: '#FF006E',
    cardGrammar: '#00F5FF',
    cardReading: '#ADFF2F',
    font: 'Noto Sans KR',
    bgGradient: 'linear-gradient(180deg, #000814 0%, #001a2e 50%, #0d0d0d 100%)',
    particleColor: '#00F5FF',
    particleEmoji: '✨',
    floors: 4,
    campaignWorld: 'Cyberpunk Seoul — corporate towers, neon markets, server districts',
    locked: true,
  },
  spanish: {
    id: 'spanish',
    name: 'The Road to La Piedra Viva',
    name_target: 'El Camino a La Piedra Viva',
    language: 'Spanish',
    language_target: 'Español',
    tagline: 'El camino es el destino — The road is the destination',
    primary: '#1A0A00',
    accent: '#FF6B35',
    accent2: '#4ECDC4',
    cardVocab: '#FF6B35',
    cardGrammar: '#4ECDC4',
    cardReading: '#FFE66D',
    font: 'Playfair Display',
    bgGradient: 'linear-gradient(180deg, #1a0a00 0%, #2a1500 50%, #0d0d0d 100%)',
    particleColor: '#FF6B35',
    particleEmoji: '🌿',
    floors: 4,
    campaignWorld: 'Magical Latin America — jungle roads, ancient ruins, colonial plazas',
    locked: true,
  },
}

export const ROMANIZATION_MODES = {
  ALWAYS_SHOW: 'always_show',
  FADE_PROGRESSIVE: 'fade_progressive', // fades by floor based on character type
  ALWAYS_HIDE: 'always_hide',
}

export const CHARACTER_TYPES = {
  NEWCOMER: 'newcomer',   // Full romanization everywhere
  TRAVELER: 'traveler',   // Romanization fades by floor 3
  RETURNEE: 'returnee',   // Full target script, no romanization from floor 1
}

/**
 * Determine if romanization should be shown
 * @param {number} floor - Current floor (1-4)
 * @param {string} characterType - 'newcomer' | 'traveler' | 'returnee'
 * @param {string} settingsMode - ROMANIZATION_MODES value
 * @param {number} masteryLevel - 0-10
 * @returns {boolean}
 */
export function shouldShowRomanization(floor, characterType, settingsMode, masteryLevel) {
  // Mastery Level 1+ always removes romanization regardless
  if (masteryLevel >= 1) return false

  // Settings override
  if (settingsMode === ROMANIZATION_MODES.ALWAYS_HIDE) return false
  if (settingsMode === ROMANIZATION_MODES.ALWAYS_SHOW) return true

  // Character-based progressive fading
  const fadeAtFloor = {
    [CHARACTER_TYPES.NEWCOMER]: 5,  // never fades in base 4-floor game
    [CHARACTER_TYPES.TRAVELER]: 3,  // fades after floor 3
    [CHARACTER_TYPES.RETURNEE]: 0,  // always hidden from the start
  }
  return floor < fadeAtFloor[characterType]
}

export const CARDS = {
  japanese: {
    characters: [
      {
        id: 'hana',
        name: 'Hana',
        title: 'The Newcomer',
        type: CHARACTER_TYPES.NEWCOMER,
        fluency: 'Zero knowledge',
        description: 'Moves fast, hits hard — no hesitation. A fresh start is its own kind of power.',
        startingDeckBreakdown: { vocabulary: 4, grammar: 3, reading: 2, rare: 1 },
        starterRelic: 'newcomers_phrasebook',
        hp: 80,
        locked: true,
      },
      {
        id: 'kenji',
        name: 'Kenji',
        title: 'The Traveler',
        type: CHARACTER_TYPES.TRAVELER,
        fluency: 'Some basics',
        description: 'Has seen enough of the world to know what he doesn\'t know. Adapts to any situation.',
        startingDeckBreakdown: { vocabulary: 4, grammar: 3, reading: 2, rare: 1 },
        starterRelic: 'travelers_compass',
        hp: 80,
        locked: false,
      },
      {
        id: 'yuki',
        name: 'Yuki',
        title: 'The Returnee',
        type: CHARACTER_TYPES.RETURNEE,
        fluency: 'Studied before, rusty',
        description: 'The knowledge is still in there somewhere. The mountain will help her find it.',
        startingDeckBreakdown: { vocabulary: 4, grammar: 3, reading: 2, rare: 1 },
        starterRelic: 'returnees_old_notes',
        hp: 80,
        locked: true,
      },
    ],
    startingVocabCards: ['jp_vocab_strike', 'jp_vocab_strike', 'jp_vocab_wild_slash', 'jp_vocab_swift_strike'],
    startingGrammarCards: ['jp_gram_ward', 'jp_gram_ward', 'jp_gram_particle_shield'],
    startingReadingCards: ['jp_read_spirit_scroll', 'jp_read_spirit_scroll'],
    // Rare is character-specific (Kenji gets Traveler's Wisdom)
  },
}
