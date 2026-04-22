// data/relics.js — Full Relic Registry
// equippedRelics = active 5-slot relics  |  vaultRelics = stored but inactive

export const RELIC_TIER = { STARTER: 'starter', COMMON: 'common', UNCOMMON: 'uncommon', RARE: 'rare', PANTHEON: 'pantheon' }

export const RELICS = {
  // ── STARTER ─────────────────────────────────────────────────────────
  cracked_hourglass: {
    id: 'cracked_hourglass',
    name: 'Cracked Hourglass',
    tier: RELIC_TIER.STARTER,
    icon: '⏳',
    color: '#a78bfa',
    description: 'On wrong answer, add 1 extra lock token. Gain 1 Energy on turn start.',
    flavor: 'Time stopped working. You kept going.',
  },
  fox_mask: {
    id: 'fox_mask',
    name: 'Fox Mask',
    tier: RELIC_TIER.STARTER,
    icon: '🦊',
    color: '#f97316',
    description: 'Start each fight with 10 Block.',
    flavor: 'A traveler\'s first shield.',
  },
  lucky_coin: {
    id: 'lucky_coin',
    name: 'Lucky Coin',
    tier: RELIC_TIER.STARTER,
    icon: '🪙',
    color: '#facc15',
    description: 'Gain +15 Gold after every fight.',
    flavor: 'Someone lost it. You found it.',
  },
  travelers_compass: {
    id: 'travelers_compass',
    name: "Traveler's Compass",
    tier: RELIC_TIER.STARTER,
    icon: '🧭',
    color: '#34d399',
    description: 'Every 3rd correct answer in a fight grants +1 Energy next turn.',
    flavor: 'Points toward understanding.',
  },

  // ── COMMON ──────────────────────────────────────────────────────────
  chain_bracelet: {
    id: 'chain_bracelet',
    name: 'Chain Bracelet',
    tier: RELIC_TIER.COMMON,
    icon: '📿',
    color: '#60a5fa',
    description: 'Chain combos can continue even when switching card types.',
    flavor: 'Every word links to the next.',
  },
  merchants_scale: {
    id: 'merchants_scale',
    name: "Merchant's Scale",
    tier: RELIC_TIER.COMMON,
    icon: '⚖️',
    color: '#fbbf24',
    description: 'Merchant shows 1 extra card offer per visit.',
    flavor: 'Better selection for the discerning buyer.',
  },
  newcomers_phrasebook: {
    id: 'newcomers_phrasebook',
    name: "Newcomer's Phrasebook",
    tier: RELIC_TIER.COMMON,
    icon: '📖',
    color: '#6ee7b7',
    description: 'First wrong answer each fight triggers a free hint instead of locking the card.',
    flavor: 'Everyone starts somewhere.',
  },
  returnees_old_notes: {
    id: 'returnees_old_notes',
    name: "Returnee's Old Notes",
    tier: RELIC_TIER.COMMON,
    icon: '📝',
    color: '#a3e635',
    description: 'Grammar cards auto-show their hint when played.',
    flavor: 'You wrote this down years ago.',
  },
  worn_dictionary: {
    id: 'worn_dictionary',
    name: 'Worn Dictionary',
    tier: RELIC_TIER.COMMON,
    icon: '📚',
    color: '#94a3b8',
    description: 'Once per fight, reveal the correct answer for a vocabulary question.',
    flavor: 'Dog-eared but dependable.',
  },

  // ── UNCOMMON ────────────────────────────────────────────────────────
  ink_stone: {
    id: 'ink_stone',
    name: 'Ink Stone',
    tier: RELIC_TIER.UNCOMMON,
    icon: '🪨',
    color: '#818cf8',
    description: 'After playing 3 cards of the same type in one turn, draw 1 card.',
    flavor: 'Repetition builds the groove.',
  },
  bamboo_fan: {
    id: 'bamboo_fan',
    name: 'Bamboo Fan',
    tier: RELIC_TIER.UNCOMMON,
    icon: '🪭',
    color: '#4ade80',
    description: 'Block does not expire at the start of your turn (persists until hit).',
    flavor: 'Patience. The strike will come.',
  },
  red_envelope: {
    id: 'red_envelope',
    name: 'Red Envelope',
    tier: RELIC_TIER.UNCOMMON,
    icon: '🧧',
    color: '#f87171',
    description: 'At the start of each fight, gain 5 Gold.',
    flavor: 'A small blessing before the battle.',
  },

  // ── RARE ────────────────────────────────────────────────────────────
  pantheon_sigil: {
    id: 'pantheon_sigil',
    name: 'Pantheon Sigil',
    tier: RELIC_TIER.RARE,
    icon: '🔱',
    color: '#fbbf24',
    description: 'Start the run with a free Blessing (no paired Curse required).',
    flavor: 'The gods owe you a favor.',
  },
  scribes_seal: {
    id: 'scribes_seal',
    name: "Scribe's Seal",
    tier: RELIC_TIER.RARE,
    icon: '🪬',
    color: '#c084fc',
    description: 'After winning a fight without taking damage, draw 2 extra cards next fight\'s first turn.',
    flavor: 'Perfection leaves its mark.',
  },

  // ── NEW SLOT-SYSTEM RELICS ───────────────────────────────────────────
  resonance_stone: {
    id: 'resonance_stone',
    name: 'Resonance Stone',
    tier: RELIC_TIER.RARE,
    icon: '💎',
    color: '#38bdf8',
    description: 'If your 5 equipped slots contain at least one relic of each card type (vocabulary, grammar, reading, culture), all relic effects amplified 20%.',
    flavor: 'Harmony between disciplines.',
  },
  the_empty_throne: {
    id: 'the_empty_throne',
    name: 'The Empty Throne',
    tier: RELIC_TIER.RARE,
    icon: '🪑',
    color: '#6b7280',
    description: 'If one relic slot is intentionally left empty for an entire floor, gain +5 Max HP at floor end.',
    flavor: 'Restraint is its own power.',
  },
  scholars_left_hand: {
    id: 'scholars_left_hand',
    name: "Scholar's Left Hand",
    tier: RELIC_TIER.UNCOMMON,
    icon: '🫲',
    color: '#818cf8',
    description: 'Grammar cards cost 1 less Energy. (Pair with Scholar\'s Right Hand for full effect.)',
    flavor: 'The left hand writes.',
    pair: 'scholars_right_hand',
  },
  scholars_right_hand: {
    id: 'scholars_right_hand',
    name: "Scholar's Right Hand",
    tier: RELIC_TIER.UNCOMMON,
    icon: '🫱',
    color: '#818cf8',
    description: 'Grammar cards deal bonus damage equal to their block value. (Pair with Scholar\'s Left Hand for full effect.)',
    flavor: 'The right hand strikes.',
    pair: 'scholars_left_hand',
  },

  // ── PANTHEON ────────────────────────────────────────────────────────
  ancient_lexicon: {
    id: 'ancient_lexicon',
    name: 'Ancient Lexicon',
    tier: RELIC_TIER.PANTHEON,
    icon: '📜',
    color: '#fde68a',
    description: 'All vocabulary cards deal +3 bonus damage.',
    flavor: 'The words of the old masters cut deeper.',
  },
  memory_palace: {
    id: 'memory_palace',
    name: 'Memory Palace',
    tier: RELIC_TIER.PANTHEON,
    icon: '🏛️',
    color: '#fde68a',
    description: 'Correct answers on first try heal 1 HP.',
    flavor: 'Your mind becomes your sanctuary.',
  },
}

export const RELIC_IDS = Object.keys(RELICS)

export const MAX_EQUIPPED_RELICS = 5

// Tier display colors
export const RELIC_TIER_COLORS = {
  starter:  '#94a3b8',
  common:   '#e5e7eb',
  uncommon: '#818cf8',
  rare:     '#fbbf24',
  pantheon: '#fde68a',
}

export const RELIC_TIER_GLOW = {
  starter:  'none',
  common:   'none',
  uncommon: '0 0 10px rgba(129,140,248,0.5)',
  rare:     '0 0 14px rgba(251,191,36,0.6)',
  pantheon: '0 0 18px rgba(253,230,138,0.8)',
}
