// constants/cardTypes.js
// Card type enums and associated visual/mechanical metadata

export const CARD_TYPES = {
  VOCABULARY: 'vocabulary',
  GRAMMAR: 'grammar',
  READING: 'reading',
  CURSE: 'curse',
}

export const CARD_TYPE_META = {
  [CARD_TYPES.VOCABULARY]: {
    label: 'Vocabulary',
    icon: '⚔️',
    colorClass: 'text-red-400',
    bgClass: 'bg-red-950/40',
    borderClass: 'border-red-800',
    glowClass: 'shadow-red-900/60',
    wrongAnswerBuff: 'confusion',
    wrongAnswerDescription: 'Confusion: Enemy gains +2 ATK this turn',
    primes: 'grammar', // vocabulary primes grammar combos
  },
  [CARD_TYPES.GRAMMAR]: {
    label: 'Grammar',
    icon: '🛡️',
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-950/40',
    borderClass: 'border-blue-800',
    glowClass: 'shadow-blue-900/60',
    wrongAnswerBuff: 'conjugation_armor',
    wrongAnswerDescription: 'Conjugation Armor: Enemy blocks grammar cards next turn',
    primes: 'reading', // grammar primes reading combos
  },
  [CARD_TYPES.READING]: {
    label: 'Reading',
    icon: '📖',
    colorClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/40',
    borderClass: 'border-emerald-800',
    glowClass: 'shadow-emerald-900/60',
    wrongAnswerBuff: 'fortify',
    wrongAnswerDescription: 'Fortify: Enemy gains +5 max HP temporarily',
    primes: null, // reading doesn't prime anything
  },
  [CARD_TYPES.CURSE]: {
    label: 'Curse',
    icon: '💀',
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-950/40',
    borderClass: 'border-purple-800',
    glowClass: 'shadow-purple-900/60',
    wrongAnswerBuff: null,
    wrongAnswerDescription: null,
    primes: null,
  },
}

export const CARD_RARITIES = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  STORY_RARE: 'story_rare',
  CURSE: 'curse',
}

export const CARD_RARITY_META = {
  [CARD_RARITIES.COMMON]: {
    label: 'Common',
    colorClass: 'text-gray-300',
    borderClass: 'border-gray-500',
    gemClass: 'bg-gray-400',
  },
  [CARD_RARITIES.UNCOMMON]: {
    label: 'Uncommon',
    colorClass: 'text-blue-300',
    borderClass: 'border-blue-500',
    gemClass: 'bg-blue-400',
  },
  [CARD_RARITIES.RARE]: {
    label: 'Rare',
    colorClass: 'text-yellow-300',
    borderClass: 'border-yellow-500',
    gemClass: 'bg-yellow-400',
  },
  [CARD_RARITIES.STORY_RARE]: {
    label: 'Story Rare',
    colorClass: 'text-red-300',
    borderClass: 'border-red-500',
    gemClass: 'bg-red-400',
  },
  [CARD_RARITIES.CURSE]: {
    label: 'Curse',
    colorClass: 'text-purple-300',
    borderClass: 'border-purple-500',
    gemClass: 'bg-purple-400',
  },
}
