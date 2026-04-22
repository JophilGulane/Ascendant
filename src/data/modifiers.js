// data/modifiers.js
// Blessing & Curse run modifier pairs.
// Each pair is offered together — player takes BOTH or skips.
// Effects are applied via runStore and read by combat/question hooks.

export const MODIFIER_PAIRS = [
  {
    id: 'pair_speed_demon',
    blessing: {
      id: 'blessing_chain_starter',
      name: 'Chain Starter',
      icon: '⚡',
      description: 'Your first correct answer each turn automatically chains for free.',
      effect: { type: 'chain_starter' },
      color: '#F5C842',
    },
    curse: {
      id: 'curse_quick_timer',
      name: 'Racing Clock',
      icon: '⏱️',
      description: 'Answer timer is reduced to 12 seconds for the entire run.',
      effect: { type: 'timer_reduction', value: 12 },
      color: '#ef4444',
    },
  },
  {
    id: 'pair_glass_cannon',
    blessing: {
      id: 'blessing_crit_knowledge',
      name: 'Critical Knowledge',
      icon: '💥',
      description: 'Correct answers deal +5 bonus damage.',
      effect: { type: 'bonus_damage', value: 5 },
      color: '#F5C842',
    },
    curse: {
      id: 'curse_fragile',
      name: 'Fragile',
      icon: '🩹',
      description: 'You start the run with 60 HP instead of 80.',
      effect: { type: 'start_hp', value: 60 },
      color: '#ef4444',
    },
  },
  {
    id: 'pair_hoarder',
    blessing: {
      id: 'blessing_deep_pockets',
      name: 'Deep Pockets',
      icon: '🪙',
      description: 'Start with +40 bonus gold.',
      effect: { type: 'bonus_gold', value: 40 },
      color: '#F5C842',
    },
    curse: {
      id: 'curse_merchant_tax',
      name: 'Merchant\'s Tax',
      icon: '💸',
      description: 'All shop items cost 20% more gold.',
      effect: { type: 'merchant_tax', value: 1.2 },
      color: '#ef4444',
    },
  },
  {
    id: 'pair_scholar',
    blessing: {
      id: 'blessing_free_hints',
      name: 'Scholar\'s Grace',
      icon: '📚',
      description: 'Hint costs 0 energy (but still counts as first-try failure).',
      effect: { type: 'free_hints' },
      color: '#F5C842',
    },
    curse: {
      id: 'curse_blind_drafts',
      name: 'Blind Archive',
      icon: '🙈',
      description: 'Card names are hidden during draft — you choose by type and rarity only.',
      effect: { type: 'blind_drafts' },
      color: '#ef4444',
    },
  },
  {
    id: 'pair_juggernaut',
    blessing: {
      id: 'blessing_extra_energy',
      name: 'Inner Fire',
      icon: '🔥',
      description: 'Start each turn with 4 energy instead of 3.',
      effect: { type: 'bonus_max_energy', value: 1 },
      color: '#F5C842',
    },
    curse: {
      id: 'curse_no_block',
      name: 'Exposed',
      icon: '🛡️',
      description: 'Block cards deal 0 block. Defense is forbidden.',
      effect: { type: 'no_block' },
      color: '#ef4444',
    },
  },
  {
    id: 'pair_gambler',
    blessing: {
      id: 'blessing_extra_draw',
      name: 'Generous Fortune',
      icon: '🎲',
      description: 'Draw 6 cards per turn instead of 5.',
      effect: { type: 'bonus_draw', value: 1 },
      color: '#F5C842',
    },
    curse: {
      id: 'curse_random_hand',
      name: 'Chaos Hand',
      icon: '🌀',
      description: 'Your hand is reshuffled randomly at the start of every other turn.',
      effect: { type: 'chaos_hand' },
      color: '#ef4444',
    },
  },
  {
    id: 'pair_survivor',
    blessing: {
      id: 'blessing_last_stand',
      name: 'Last Stand',
      icon: '🌟',
      description: 'Once per run, survive a killing blow with 1 HP.',
      effect: { type: 'last_stand' },
      color: '#F5C842',
    },
    curse: {
      id: 'curse_no_heal',
      name: 'Iron Resolve',
      icon: '🩺',
      description: 'Rest sites cannot be used to heal.',
      effect: { type: 'no_rest_heal' },
      color: '#ef4444',
    },
  },
  {
    id: 'pair_purist',
    blessing: {
      id: 'blessing_mono_mastery',
      name: 'Mono Mastery',
      icon: '🎯',
      description: 'Playing 3+ cards of the same type in one turn grants +1 energy next turn.',
      effect: { type: 'mono_mastery' },
      color: '#F5C842',
    },
    curse: {
      id: 'curse_type_lock',
      name: 'Type Lock',
      icon: '🔒',
      description: 'You cannot play two cards of the same type consecutively.',
      effect: { type: 'type_lock' },
      color: '#ef4444',
    },
  },
]

// Get a random selection of N pairs (no repeats)
export function sampleModifierPairs(count = 3) {
  const shuffled = [...MODIFIER_PAIRS].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
