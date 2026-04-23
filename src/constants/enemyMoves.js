// constants/enemyMoves.js
// All move type definitions for the enemy turn system

export const MOVE_TYPES = {
  STRIKE:           'strike',
  STRIKE_HEAVY:     'strike_heavy',
  STRIKE_SWIFT:     'strike_swift',
  DEBUFF_SILENCE:   'debuff_silence',
  DEBUFF_DRAIN:     'debuff_drain',
  DEBUFF_FOG:       'debuff_fog',
  DEBUFF_BIND:      'debuff_bind',
  DEBUFF_CONFUSION: 'debuff_confusion',
  DEBUFF_CURSE:     'debuff_curse',
  DEBUFF_TAUNT:     'debuff_taunt',
  SELF_BUFF_ARMOR:  'self_buff_armor_up',
  SELF_BUFF_HARDEN: 'self_buff_harden',
  SELF_BUFF_RECOVER:'self_buff_recover',
  SELF_BUFF_POWER:  'self_buff_power_up',
  SELF_BUFF_ENRAGE: 'self_buff_enrage',
  SELF_BUFF_FOCUS:  'self_buff_focus',
  SPECIAL:          'special',
}

export const MOVE_ICONS = {
  strike:             '⚔️',
  strike_heavy:       '💥',
  strike_swift:       '⚡',
  debuff_silence:     '🔇',
  debuff_drain:       '⚡',
  debuff_fog:         '🌫️',
  debuff_bind:        '🔗',
  debuff_confusion:   '🔀',
  debuff_curse:       '💀',
  debuff_taunt:       '😡',
  self_buff_armor_up: '🛡️',
  self_buff_harden:   '💎',
  self_buff_recover:  '💉',
  self_buff_power_up: '🔥',
  self_buff_enrage:   '😤',
  self_buff_focus:    '👁️',
  special:            '💀',
}

export const MOVE_COLORS = {
  strike:             'text-red-400',
  strike_heavy:       'text-red-500',
  strike_swift:       'text-orange-400',
  debuff_silence:     'text-purple-400',
  debuff_drain:       'text-yellow-400',
  debuff_fog:         'text-blue-300',
  debuff_bind:        'text-orange-400',
  debuff_confusion:   'text-pink-400',
  debuff_curse:       'text-red-300',
  debuff_taunt:       'text-orange-300',
  self_buff_armor_up: 'text-blue-400',
  self_buff_harden:   'text-cyan-400',
  self_buff_recover:  'text-green-400',
  self_buff_power_up: 'text-orange-500',
  self_buff_enrage:   'text-red-400',
  self_buff_focus:    'text-cyan-400',
  special:            'text-red-500',
}

export const MOVE_CATEGORY = {
  strike:             'damage',
  strike_heavy:       'damage',
  strike_swift:       'damage',
  debuff_silence:     'debuff',
  debuff_drain:       'debuff',
  debuff_fog:         'debuff',
  debuff_bind:        'debuff',
  debuff_confusion:   'debuff',
  debuff_curse:       'debuff',
  debuff_taunt:       'debuff',
  self_buff_armor_up: 'selfbuff',
  self_buff_harden:   'selfbuff',
  self_buff_recover:  'selfbuff',
  self_buff_power_up: 'selfbuff',
  self_buff_enrage:   'selfbuff',
  self_buff_focus:    'selfbuff',
  special:            'special',
}

export const DEBUFF_ICONS = {
  silence:    '🔇',
  drain:      '⚡',
  fog:        '🌫️',
  bind:       '🔗',
  confusion:  '🔀',
}

export const DEBUFF_COLORS = {
  silence:    'text-purple-400 border-purple-600',
  drain:      'text-yellow-400 border-yellow-600',
  fog:        'text-blue-300  border-blue-500',
  bind:       'text-orange-400 border-orange-600',
  confusion:  'text-pink-400  border-pink-600',
}
