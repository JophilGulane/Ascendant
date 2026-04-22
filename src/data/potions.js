// data/potions.js — Full Potion Registry
// 15 potions across 3 tiers. Campaign-themed bottle shapes in UI.

export const POTION_TIER = { COMMON: 'common', UNCOMMON: 'uncommon', RARE: 'rare' }

export const POTIONS = {
  // ── COMMON ──────────────────────────────────────────────────────────
  healing_draught: {
    id: 'healing_draught',
    name: 'Healing Draught',
    tier: POTION_TIER.COMMON,
    icon: '🧪',
    color: '#22c55e',
    glowColor: 'rgba(34,197,94,0.4)',
    effect: { type: 'heal', value: 20 },
    description: 'Restore 20 HP instantly.',
    flavor: 'Simple but reliable.',
  },
  focus_tonic: {
    id: 'focus_tonic',
    name: 'Focus Tonic',
    tier: POTION_TIER.COMMON,
    icon: '⚡',
    color: '#facc15',
    glowColor: 'rgba(250,204,21,0.4)',
    effect: { type: 'gain_energy', value: 2, capAtMax: true },
    description: 'Gain 2 Energy. Does not exceed max Energy.',
    flavor: 'Clarity in a bottle.',
  },
  guard_brew: {
    id: 'guard_brew',
    name: 'Guard Brew',
    tier: POTION_TIER.COMMON,
    icon: '🛡️',
    color: '#3b82f6',
    glowColor: 'rgba(59,130,246,0.4)',
    effect: { type: 'gain_block', value: 12 },
    description: 'Gain 12 Block immediately.',
    flavor: 'A shield you can drink.',
  },
  clarity_potion: {
    id: 'clarity_potion',
    name: 'Clarity Potion',
    tier: POTION_TIER.COMMON,
    icon: '🔮',
    color: '#a78bfa',
    glowColor: 'rgba(167,139,250,0.4)',
    effect: { type: 'clarity' },
    description: 'Next question shows only 2 options (1 wrong + correct).',
    flavor: 'The fog lifts, briefly.',
  },

  // ── UNCOMMON ────────────────────────────────────────────────────────
  chain_elixir: {
    id: 'chain_elixir',
    name: 'Chain Elixir',
    tier: POTION_TIER.UNCOMMON,
    icon: '🔗',
    color: '#f97316',
    glowColor: 'rgba(249,115,22,0.5)',
    effect: { type: 'activate_chain' },
    description: 'Activate a Chain immediately. Next card gets chain bonus regardless of type.',
    flavor: 'Structure before the words arrive.',
  },
  memory_flask: {
    id: 'memory_flask',
    name: 'Memory Flask',
    tier: POTION_TIER.UNCOMMON,
    icon: '⏳',
    color: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.5)',
    effect: { type: 'freeze_timer', seconds: 20 },
    description: 'Freeze the question timer for 20 seconds on next question.',
    flavor: 'Time borrowed from somewhere else.',
  },
  purge_vial: {
    id: 'purge_vial',
    name: 'Purge Vial',
    tier: POTION_TIER.UNCOMMON,
    icon: '🧹',
    color: '#10b981',
    glowColor: 'rgba(16,185,129,0.5)',
    effect: { type: 'clear_debuffs' },
    description: 'Remove all active debuffs instantly.',
    flavor: 'Bitter going down. Worth it.',
  },
  echo_tonic: {
    id: 'echo_tonic',
    name: 'Echo Tonic',
    tier: POTION_TIER.UNCOMMON,
    icon: '🔁',
    color: '#ec4899',
    glowColor: 'rgba(236,72,153,0.5)',
    effect: { type: 'echo_next_card' },
    description: 'Next card you play activates twice (one question, double effect).',
    flavor: 'Say it again. Mean it twice.',
  },
  scribes_ink: {
    id: 'scribes_ink',
    name: "Scribe's Ink",
    tier: POTION_TIER.UNCOMMON,
    icon: '🖊️',
    color: '#8b5cf6',
    glowColor: 'rgba(139,92,246,0.5)',
    effect: { type: 'pull_from_discard' },
    description: 'Add a random card from your discard pile to your hand.',
    flavor: 'The pen remembers what the hand forgot.',
  },

  // ── RARE ────────────────────────────────────────────────────────────
  ancestral_draught: {
    id: 'ancestral_draught',
    name: 'Ancestral Draught',
    tier: POTION_TIER.RARE,
    icon: '🏺',
    color: '#f59e0b',
    glowColor: 'rgba(245,158,11,0.6)',
    effect: { type: 'heal_and_block', heal: 35, block: 10 },
    description: 'Heal 35 HP and gain 10 Block simultaneously.',
    flavor: 'What generations learned, you receive in an instant.',
  },
  the_answer: {
    id: 'the_answer',
    name: 'The Answer',
    tier: POTION_TIER.RARE,
    icon: '✨',
    color: '#fbbf24',
    glowColor: 'rgba(251,191,36,0.7)',
    effect: { type: 'auto_correct' },
    description: 'Next question is automatically correct. Full effect activates.',
    flavor: 'Sometimes you just know.',
  },
  overclock: {
    id: 'overclock',
    name: 'Overclock',
    tier: POTION_TIER.RARE,
    icon: '🔥',
    color: '#ef4444',
    glowColor: 'rgba(239,68,68,0.6)',
    effect: { type: 'gain_energy_exceed', value: 3 },
    description: 'Gain 3 Energy immediately. Can exceed max Energy (up to 6 total).',
    flavor: 'The system runs hot. It runs.',
  },
  scholars_blood: {
    id: 'scholars_blood',
    name: "Scholar's Blood",
    tier: POTION_TIER.RARE,
    icon: '📖',
    color: '#dc2626',
    glowColor: 'rgba(220,38,38,0.6)',
    effect: { type: 'scholars_blood' },
    description: 'For the rest of this fight, every correct answer restores 3 HP.',
    flavor: 'Knowledge sustains.',
  },
  graveyard_dust: {
    id: 'graveyard_dust',
    name: 'Graveyard Dust',
    tier: POTION_TIER.RARE,
    icon: '💀',
    color: '#6b7280',
    glowColor: 'rgba(107,114,128,0.6)',
    effect: { type: 'graveyard_dust' },
    description: "Mark your 3 most-failed Graveyard words toward mastery. Also draws 1 card.",
    flavor: 'You remembered. That counts.',
  },
}

export const POTION_IDS = Object.keys(POTIONS)

// Weighted random pool by tier — floors 1-2 favor common, 3-4 uncommon, 5+ rare possible
export function getRandomPotionDrop(floor = 1) {
  const weights = {
    common:   floor <= 2 ? 70 : floor <= 4 ? 50 : 35,
    uncommon: floor <= 2 ? 25 : floor <= 4 ? 35 : 40,
    rare:     floor <= 2 ? 5  : floor <= 4 ? 15 : 25,
  }
  const roll = Math.random() * 100
  const tier = roll < weights.common ? 'common'
             : roll < weights.common + weights.uncommon ? 'uncommon'
             : 'rare'

  const pool = POTION_IDS.filter(id => POTIONS[id].tier === tier)
  return pool[Math.floor(Math.random() * pool.length)]
}

// Drop rate by enemy tier
export function getPotionDropRate(enemyTier, isBossFirstClear = false) {
  if (isBossFirstClear) return 1.0  // guaranteed
  if (enemyTier === 'boss') return 0.6
  if (enemyTier === 'elite') return 0.35
  return 0.25
}

// Merchant always stocks 2 potions
export function getMerchantPotions(floor = 1) {
  const all = [...POTION_IDS]
  const shuffled = all.sort(() => Math.random() - 0.5)
  return shuffled.slice(0, 2)
}

// Price by tier
export const POTION_PRICES = {
  common: 30,
  uncommon: 55,
  rare: 90,
}
