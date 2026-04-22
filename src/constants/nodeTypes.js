// constants/nodeTypes.js
// Map node type definitions

export const NODE_TYPES = {
  START: 'start',
  COMBAT: 'combat',
  ELITE: 'elite',
  REST: 'rest',
  MERCHANT: 'merchant',
  EVENT: 'event',
  BOSS: 'boss',
}

export const NODE_TYPE_META = {
  [NODE_TYPES.START]: {
    icon: '🏯',
    label: 'Start',
    color: 'text-gray-400',
    bgColor: 'bg-gray-800',
    passable: false,
  },
  [NODE_TYPES.COMBAT]: {
    icon: '⚔️',
    label: 'Enemy',
    color: 'text-red-400',
    bgColor: 'bg-red-950',
    passable: true,
    hasDraftAfter: true,
    weight: 40,
  },
  [NODE_TYPES.ELITE]: {
    icon: '💀',
    label: 'Elite',
    color: 'text-orange-400',
    bgColor: 'bg-orange-950',
    passable: true,
    hasDraftAfter: true,
    guaranteedRarity: 'uncommon',
    grantsRelic: true,
    weight: 15,
  },
  [NODE_TYPES.REST]: {
    icon: '🔥',
    label: 'Rest Site',
    color: 'text-amber-400',
    bgColor: 'bg-amber-950',
    passable: true,
    weight: 20,
  },
  [NODE_TYPES.MERCHANT]: {
    icon: '🛒',
    label: 'Merchant',
    color: 'text-green-400',
    bgColor: 'bg-green-950',
    passable: true,
    weight: 15,
  },
  [NODE_TYPES.EVENT]: {
    icon: '❓',
    label: 'Event',
    color: 'text-purple-400',
    bgColor: 'bg-purple-950',
    passable: true,
    weight: 10,
  },
  [NODE_TYPES.BOSS]: {
    icon: '👹',
    label: 'Boss',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-950',
    passable: true,
    mustBePrecededBy: NODE_TYPES.REST,
  },
}
