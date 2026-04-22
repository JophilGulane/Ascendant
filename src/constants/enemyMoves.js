// constants/enemyMoves.js
// All move type definitions for the enemy turn system

export const MOVE_TYPES = {
  STRIKE:           'strike',
  DEBUFF_SILENCE:   'debuff_silence',
  DEBUFF_DRAIN:     'debuff_drain',
  DEBUFF_FOG:       'debuff_fog',
  DEBUFF_BIND:      'debuff_bind',
  DEBUFF_CONFUSION: 'debuff_confusion',
  SELF_BUFF_ARMOR:  'self_buff_armor_up',
  SELF_BUFF_RECOVER:'self_buff_recover',
  SELF_BUFF_POWER:  'self_buff_power_up',
  SELF_BUFF_FOCUS:  'self_buff_focus',
  SPECIAL:          'special',
}

export const MOVE_ICONS = {
  strike:             '⚔️',
  debuff_silence:     '🔇',
  debuff_drain:       '⚡',
  debuff_fog:         '🌫️',
  debuff_bind:        '🔗',
  debuff_confusion:   '🔀',
  self_buff_armor_up: '🛡️',
  self_buff_recover:  '💉',
  self_buff_power_up: '🔥',
  self_buff_focus:    '👁️',
  special:            '💀',
}

export const MOVE_COLORS = {
  strike:             'text-red-400',
  debuff_silence:     'text-purple-400',
  debuff_drain:       'text-yellow-400',
  debuff_fog:         'text-blue-300',
  debuff_bind:        'text-orange-400',
  debuff_confusion:   'text-pink-400',
  self_buff_armor_up: 'text-blue-400',
  self_buff_recover:  'text-green-400',
  self_buff_power_up: 'text-orange-500',
  self_buff_focus:    'text-cyan-400',
  special:            'text-red-500',
}

export const MOVE_CATEGORY = {
  strike:             'damage',
  debuff_silence:     'debuff',
  debuff_drain:       'debuff',
  debuff_fog:         'debuff',
  debuff_bind:        'debuff',
  debuff_confusion:   'debuff',
  self_buff_armor_up: 'selfbuff',
  self_buff_recover:  'selfbuff',
  self_buff_power_up: 'selfbuff',
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
