# SKILL.md — Ascendant Technical Knowledge Base
> Load this file before writing any code. It contains all patterns, rules, and conventions for building Ascendant correctly the first time.

---

## STACK OVERVIEW

| Layer | Technology | Why |
|---|---|---|
| Framework | React 18 + Vite | Fast HMR, component model fits card-based UI |
| Styling | Tailwind CSS (utility only) | Rapid layout, no CSS file sprawl |
| Animation | Framer Motion | Card physics, combat transitions, screen wipes |
| State | Zustand | Lightweight, no boilerplate, persists to localStorage easily |
| Audio | Howler.js | Cross-browser reliable, sprite support for SFX |
| Data | JSON files (static) | Questions, cards, enemies, events — no backend needed |
| Persistence | localStorage | Run state, graveyard, mastery levels, settings |
| Routing | React Router v6 | Campaign select → run → combat → summary |

---

## PROJECT STRUCTURE

```
Ascendant/
├── public/
│   ├── audio/
│   │   ├── japanese/          # bgm_floor1.mp3, bgm_boss.mp3, etc.
│   │   ├── korean/
│   │   ├── spanish/
│   │   └── sfx/               # correct.mp3, wrong.mp3, card_draw.mp3, etc.
│   └── images/
│       ├── cards/             # card illustrations per campaign
│       ├── enemies/           # enemy portraits
│       ├── characters/        # player character art
│       └── ui/                # icons, backgrounds, journal textures
├── src/
│   ├── components/
│   │   ├── combat/
│   │   │   ├── CombatScreen.jsx
│   │   │   ├── CardHand.jsx
│   │   │   ├── CardComponent.jsx
│   │   │   ├── QuestionPrompt.jsx
│   │   │   ├── EnemyDisplay.jsx
│   │   │   ├── PlayerStatus.jsx
│   │   │   ├── EnergyBar.jsx
│   │   │   └── ChainIndicator.jsx
│   │   ├── map/
│   │   │   ├── MapScreen.jsx
│   │   │   ├── MapNode.jsx
│   │   │   └── PathLine.jsx
│   │   ├── rooms/
│   │   │   ├── MerchantRoom.jsx
│   │   │   ├── RestRoom.jsx
│   │   │   └── EventRoom.jsx
│   │   ├── menus/
│   │   │   ├── MainMenu.jsx
│   │   │   ├── CampaignSelect.jsx
│   │   │   ├── CharacterSelect.jsx
│   │   │   └── PostRunSummary.jsx
│   │   ├── journal/
│   │   │   ├── JournalOverlay.jsx
│   │   │   ├── WordsTab.jsx
│   │   │   └── GrammarTab.jsx
│   │   └── shared/
│   │       ├── HoverTranslate.jsx
│   │       ├── TooltipWrapper.jsx
│   │       ├── AnimatedNumber.jsx
│   │       └── ScreenTransition.jsx
│   ├── stores/
│   │   ├── runStore.js        # Active run state (HP, deck, floor, gold)
│   │   ├── settingsStore.js   # Timer speed, romanization, SFX toggles
│   │   ├── graveyardStore.js  # Persistent mistake tracking
│   │   └── progressStore.js   # Campaign clears, mastery levels, unlocks
│   ├── data/
│   │   ├── japanese/
│   │   │   ├── questions.json
│   │   │   ├── cards.json
│   │   │   ├── enemies.json
│   │   │   ├── events.json
│   │   │   └── relics.json
│   │   ├── korean/
│   │   └── spanish/
│   ├── hooks/
│   │   ├── useCombat.js       # Combat logic hook
│   │   ├── useQuestion.js     # Question prompt lifecycle
│   │   ├── useAudio.js        # Howler wrapper
│   │   ├── useDraft.js        # Card draft logic
│   │   └── useGraveyard.js    # Graveyard read/write
│   ├── utils/
│   │   ├── combat.js          # Damage calc, buff application, chain logic
│   │   ├── deck.js            # Shuffle, draw, discard
│   │   ├── map.js             # Map generation, node placement
│   │   ├── questions.js       # Question sampling, floor filtering
│   │   └── localStorage.js    # Typed read/write helpers
│   ├── constants/
│   │   ├── campaigns.js       # Campaign metadata (theme, colors, fonts)
│   │   ├── cardTypes.js       # VOCABULARY | GRAMMAR | READING enums
│   │   ├── nodeTypes.js       # COMBAT | ELITE | REST | MERCHANT | EVENT | BOSS
│   │   └── masteryRules.js    # All mastery level rule definitions
│   ├── App.jsx
│   └── main.jsx
├── SKILL.md                   # This file
├── AGENT.md                   # Agent behaviour instructions
└── package.json
```

---

## DATA SCHEMAS

### Question Schema
```json
{
  "id": "jp_vocab_001",
  "campaign": "japanese",
  "floor_tier": 1,
  "type": "vocabulary",
  "question": "What does 食べる (taberu) mean?",
  "options": ["To eat", "To drink", "To sleep", "To walk"],
  "correct_index": 0,
  "hint": "Used in: 私は寿司を食べる — I eat sushi.",
  "graveyard_label": "食べる",
  "graveyard_reading": "taberu",
  "explanation": "食べる is a Group 2 verb meaning 'to eat'. The ます form is 食べます.",
  "tags": ["verb", "group2", "food", "basic"]
}
```

### Card Schema
```json
{
  "id": "jp_vocab_strike",
  "campaign": "japanese",
  "name_target": "斬撃",
  "name_native": "Strike",
  "type": "vocabulary",
  "rarity": "common",
  "energy_cost": 1,
  "effect": {
    "damage": 8,
    "bonus_correct_first_try": 4,
    "chain_bonus": null
  },
  "question_tags": ["verb", "basic"],
  "flavor_target": "切る。",
  "flavor_native": "Cut.",
  "upgradeable": true,
  "upgraded_id": "jp_vocab_strike_plus",
  "illustration": "cards/japanese/strike.png"
}
```

### Enemy Schema
```json
{
  "id": "jp_lost_spirit",
  "campaign": "japanese",
  "floor": 1,
  "tier": "regular",
  "name_target": "迷い霊",
  "name_native": "Lost Spirit",
  "hp": 40,
  "attack": 6,
  "concept_tags": ["hiragana", "basic_nouns"],
  "intent_pattern": ["vocabulary", "attack", "vocabulary", "vocabulary", "attack"],
  "wrong_answer_buff": {
    "type": "confusion",
    "effect": "enemy_attack_plus_2",
    "duration_turns": 1,
    "icon": "confusion"
  },
  "special_ability": null,
  "portrait": "enemies/japanese/lost_spirit.png",
  "defeat_sfx": "spirit_dispel"
}
```

### Relic Schema
```json
{
  "id": "worn_dictionary",
  "name": "Worn Dictionary",
  "description": "Once per fight, reveal the answer on a Vocabulary card. That card deals half damage.",
  "flavor": "The pages are worn from use.",
  "trigger": "on_vocabulary_activate",
  "effect": {
    "type": "reveal_answer",
    "cost": "half_damage",
    "uses_per_fight": 1
  },
  "source": "merchant",
  "campaign": "all",
  "icon": "relics/worn_dictionary.png"
}
```

### Event Schema
```json
{
  "id": "jp_event_shrine_maiden",
  "campaign": "japanese",
  "floor_tier": 1,
  "title": "The Shrine Maiden's Riddle",
  "setup_text": "A shrine maiden blocks your path. She speaks:",
  "npc_dialogue": "「あなたは何を求めているのですか？」",
  "npc_dialogue_translation": "What are you seeking?",
  "options": [
    {
      "text": "「知識を求めています。」",
      "translation": "I seek knowledge.",
      "outcome": "reward",
      "reward": { "type": "card_upgrade", "amount": 1 }
    },
    {
      "text": "「力を求めています。」",
      "translation": "I seek power.",
      "outcome": "neutral",
      "reward": { "type": "gold", "amount": 10 }
    }
  ]
}
```

---

## STATE MANAGEMENT PATTERNS

### Run Store (Zustand)
```javascript
// stores/runStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useRunStore = create(persist((set, get) => ({
  // Run identity
  runId: null,
  campaign: null,
  character: null,
  masteryLevel: 0,

  // Player state
  hp: 80,
  maxHp: 80,
  block: 0,
  gold: 0,
  energy: 3,
  maxEnergy: 3,

  // Navigation
  floor: 1,
  currentNode: null,
  mapNodes: [],

  // Deck
  deck: [],
  hand: [],
  discardPile: [],
  exhaustPile: [],

  // Relics and buffs
  relics: [],
  activeBuffs: [],     // player buffs
  activeDebuffs: [],   // player debuffs

  // Combat
  inCombat: false,
  currentEnemy: null,
  enemyBuffs: [],
  turnNumber: 0,
  chainActive: false,
  chainType: null,     // 'vocabulary' | 'grammar'
  hintUsedThisFight: false,

  // Session graveyard (gets merged to persistent graveyard on run end)
  sessionMistakes: [],

  // Actions — always use these, never mutate state directly
  setHp: (hp) => set({ hp: Math.max(0, hp) }),
  addBlock: (amount) => set(s => ({ block: s.block + amount })),
  spendEnergy: (amount) => set(s => ({ energy: Math.max(0, s.energy - amount) }),
  resetEnergy: () => set(s => ({ energy: s.maxEnergy })),
  addGold: (amount) => set(s => ({ gold: s.gold + amount })),
  spendGold: (amount) => set(s => ({ gold: Math.max(0, s.gold - amount) })),

  addEnemyBuff: (buff) => set(s => ({ enemyBuffs: [...s.enemyBuffs, buff] })),
  clearEnemyBuffs: () => set({ enemyBuffs: [] }),

  activateChain: (type) => set({ chainActive: true, chainType: type }),
  breakChain: () => set({ chainActive: false, chainType: null }),

  logMistake: (questionId) => set(s => ({
    sessionMistakes: [...s.sessionMistakes, { questionId, timestamp: Date.now() }]
  })),

  startRun: (campaign, character, masteryLevel) => set({
    runId: crypto.randomUUID(),
    campaign, character, masteryLevel,
    hp: 80, maxHp: 80, block: 0,
    gold: 0, floor: 1,
    deck: [], hand: [], discardPile: [],
    relics: [], activeBuffs: [], activeDebuffs: [],
    sessionMistakes: [],
  }),

  endRun: () => set({ runId: null, inCombat: false }),
}), { name: 'Ascendant-run' }))
```

### Graveyard Store (persistent)
```javascript
// stores/graveyardStore.js
const useGraveyardStore = create(persist((set, get) => ({
  entries: {},
  // entries shape: { [questionId]: { label, reading, wrongCount, correctStreak, mastered } }

  recordWrong: (questionId, label, reading) => set(s => ({
    entries: {
      ...s.entries,
      [questionId]: {
        label,
        reading,
        wrongCount: (s.entries[questionId]?.wrongCount || 0) + 1,
        correctStreak: 0,
        mastered: false,
      }
    }
  })),

  recordCorrect: (questionId) => set(s => {
    const entry = s.entries[questionId]
    if (!entry) return s
    const newStreak = (entry.correctStreak || 0) + 1
    return {
      entries: {
        ...s.entries,
        [questionId]: { ...entry, correctStreak: newStreak, mastered: newStreak >= 3 }
      }
    }
  }),
}), { name: 'Ascendant-graveyard' }))
```

---

## COMBAT LOGIC PATTERNS

### Card Activation Flow
```
Player selects card
  → QuestionPrompt mounts with question data
  → Timer starts (20s default, settings-aware)
  → Player selects answer OR timer expires
    → CORRECT:
        1. Apply chain bonus if active
        2. Apply card effect (damage / block / utility)
        3. Check if this card primes a chain (vocabulary → activate grammar chain)
        4. Deduct Energy cost
        5. Move card to discard
        6. Play correct SFX
    → WRONG / TIMEOUT:
        1. Apply enemy buff from card's wrong_answer_buff definition
        2. Log question to sessionMistakes and graveyardStore
        3. Card returns to hand (no energy cost)
        4. Play wrong SFX
        5. Show brief explanation overlay (1.5 seconds)
```

### Chain Logic
```javascript
// utils/combat.js
export function resolveChain(playedCardType, store) {
  const { chainActive, chainType } = store
  
  if (!chainActive) {
    // First card — check if it primes a chain
    if (playedCardType === 'vocabulary') {
      store.activateChain('vocabulary') // primes grammar
    }
    if (playedCardType === 'grammar') {
      store.activateChain('grammar')    // primes reading
    }
    return { bonusMultiplier: 1 }
  }

  // Chain is active — check if this card benefits
  if (chainType === 'vocabulary' && playedCardType === 'grammar') {
    store.breakChain()
    return { bonusMultiplier: 1.5 } // 50% bonus damage on grammar card
  }
  if (chainType === 'grammar' && playedCardType === 'reading') {
    store.breakChain()
    return { bonusMultiplier: 2 }   // doubled utility effect
  }

  // Wrong card type — chain breaks, no bonus
  store.breakChain()
  return { bonusMultiplier: 1 }
}
```

### Damage Calculation
```javascript
export function calculateDamage({ base, bonusCorrectFirstTry, chainMultiplier, enemyArmor, playerBuffs }) {
  let dmg = base
  if (bonusCorrectFirstTry) dmg += bonusCorrectFirstTry
  dmg = Math.floor(dmg * chainMultiplier)
  // Apply enemy armor buffs
  if (enemyArmor) dmg = Math.max(0, dmg - enemyArmor)
  return dmg
}

export function calculateBlock({ base, chainMultiplier }) {
  return Math.floor(base * chainMultiplier)
}
```

### Enemy Turn Resolution
```javascript
export function resolveEnemyTurn(enemy, intentIndex, playerStore) {
  const intent = enemy.intent_pattern[intentIndex % enemy.intent_pattern.length]

  if (intent === 'attack') {
    let damage = enemy.attack
    // Apply enemy buffs
    const confusionBuff = playerStore.enemyBuffs.find(b => b.type === 'confusion')
    if (confusionBuff) damage += confusionBuff.effect_value

    // Apply player block
    const blocked = Math.min(playerStore.block, damage)
    const remaining = damage - blocked
    playerStore.spendBlock(blocked)
    playerStore.setHp(playerStore.hp - remaining)
  }
  // 'vocabulary' | 'grammar' | 'reading' intents just set the upcoming question type indicator
  // They don't apply effects — the intent icon is informational only
}
```

---

## QUESTION SAMPLING PATTERNS

```javascript
// utils/questions.js
export function sampleQuestionsForCard(card, allQuestions, graveyard, settings) {
  const pool = allQuestions.filter(q =>
    q.campaign === card.campaign &&
    q.type === card.type &&
    card.question_tags.some(tag => q.tags.includes(tag))
  )

  // If spaced repetition enabled and graveyard has matching entries, weight toward mistakes
  if (settings.spacedRepetition) {
    const graveyardIds = Object.keys(graveyard.entries).filter(id =>
      !graveyard.entries[id].mastered
    )
    const weakPool = pool.filter(q => graveyardIds.includes(q.id))
    if (weakPool.length > 0 && Math.random() < 0.4) {
      return weakPool[Math.floor(Math.random() * weakPool.length)]
    }
  }

  return pool[Math.floor(Math.random() * pool.length)]
}

export function filterQuestionsByFloor(questions, floor) {
  // Floor 1: tier 1 only
  // Floor 2: tier 1-2
  // Floor 3: tier 2-3
  // Floor 4: tier 3-4
  const tierMap = { 1: [1], 2: [1, 2], 3: [2, 3], 4: [3, 4] }
  return questions.filter(q => tierMap[floor].includes(q.floor_tier))
}
```

---

## MAP GENERATION

```javascript
// utils/map.js
export function generateFloorMap(floor, masteryLevel) {
  // Always: Start node → [2-3 branching paths] → Boss node
  // Each path has 4-6 nodes
  // Guaranteed: At least 1 rest site and 1 merchant per floor
  // Boss always preceded by a rest site

  const nodeWeights = {
    combat: 40,
    elite: 15,
    rest: 20,
    merchant: 15,
    event: 10,
  }

  // Higher floors shift weights toward harder nodes
  if (floor >= 3) {
    nodeWeights.combat = 30
    nodeWeights.elite = 25
  }

  // Mastery level 6+: rest sites only offer Review, no Heal (handled in RestRoom component)

  return buildPaths(nodeWeights, floor)
}
```

---

## DRAFT SYSTEM

```javascript
// hooks/useDraft.js
export function calculateDraftPool(sessionAccuracy, floor) {
  if (sessionAccuracy >= 0.8) {
    return { count: 4, allowRare: true }
  } else if (sessionAccuracy >= 0.6) {
    return { count: 3, allowRare: false }
  } else {
    return { count: 2, allowRare: false }
  }
}

export function sampleDraftCards(allCards, campaign, floor, pool) {
  const eligible = allCards.filter(c =>
    c.campaign === campaign &&
    (pool.allowRare || c.rarity !== 'rare') &&
    c.rarity !== 'story_rare' // story rares only from boss rewards
  )
  // Shuffle and slice to pool.count
  return shuffle(eligible).slice(0, pool.count)
}
```

---

## AUDIO PATTERNS

```javascript
// hooks/useAudio.js
import { Howl, Howler } from 'howler'

const sfx = {
  correct:      new Howl({ src: ['/audio/sfx/correct.mp3'] }),
  wrong:        new Howl({ src: ['/audio/sfx/wrong.mp3'] }),
  cardDraw:     new Howl({ src: ['/audio/sfx/card_draw.mp3'] }),
  chainActivate: new Howl({ src: ['/audio/sfx/chain_activate.mp3'] }),
  bossAppear:   new Howl({ src: ['/audio/sfx/boss_appear.mp3'] }),
  victory:      new Howl({ src: ['/audio/sfx/victory.mp3'] }),
}

const music = {} // loaded per campaign/floor on demand

export function useAudio() {
  const { sfxVolume, musicVolume } = useSettingsStore()

  const playSFX = (name) => {
    if (sfx[name]) {
      sfx[name].volume(sfxVolume)
      sfx[name].play()
    }
  }

  const playMusic = (campaign, floor) => {
    const key = `${campaign}_floor${floor}`
    if (!music[key]) {
      music[key] = new Howl({
        src: [`/audio/${campaign}/bgm_floor${floor}.mp3`],
        loop: true,
        volume: musicVolume,
      })
    }
    // Stop all other music first
    Object.values(music).forEach(m => m.stop())
    music[key].play()
  }

  return { playSFX, playMusic }
}
```

---

## HOVER-TO-TRANSLATE COMPONENT

Every piece of target language text must be wrapped in this component:

```jsx
// components/shared/HoverTranslate.jsx
export function HoverTranslate({ children, translation, className }) {
  const [show, setShow] = useState(false)

  return (
    <span
      className={`relative cursor-help border-b border-dotted border-current ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onTouchStart={() => setShow(s => !s)}
    >
      {children}
      {show && (
        <motion.span
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1
                     bg-gray-900 text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none"
        >
          {translation}
        </motion.span>
      )}
    </span>
  )
}
```

---

## SCRIPT / ROMANIZATION SYSTEM

```javascript
// constants/campaigns.js
export const ROMANIZATION_MODES = {
  ALWAYS_SHOW: 'always_show',
  FADE_PROGRESSIVE: 'fade_progressive',  // fades by floor
  ALWAYS_HIDE: 'always_hide',
}

export function shouldShowRomanization(floor, character, settings, masteryLevel) {
  // Mastery Level 1 always removes romanization regardless
  if (masteryLevel >= 1) return false

  // Settings override
  if (settings.romanization === ROMANIZATION_MODES.ALWAYS_HIDE) return false
  if (settings.romanization === ROMANIZATION_MODES.ALWAYS_SHOW) return true

  // Character-based progressive fading
  const fadeFloors = {
    newcomer: 4,   // fades after floor 4 (never in base game)
    traveler: 3,   // fades after floor 3
    returnee: 1,   // fades immediately
  }
  return floor < fadeFloors[character.type]
}
```

---

## MASTERY LEVEL RULES APPLICATION

```javascript
// constants/masteryRules.js
export const MASTERY_RULES = {
  1: { id: 'no_romanization', description: 'Romanization removed for all cards' },
  2: { id: 'three_options', description: 'Multiple choice reduced to 3 options' },
  3: { id: 'one_random_nohint', description: 'One card per floor has no hints available' },
  4: { id: 'faster_timer', description: 'Answer timer reduced by 5 seconds' },
  5: { id: 'double_buffs', description: 'Enemy buffs on wrong answers are doubled' },
  6: { id: 'rest_review_only', description: 'Rest sites only offer Review, no Heal' },
  7: { id: 'merchant_target_only', description: 'Merchant speaks only in target language' },
  8: { id: 'haunting_forced', description: 'Graveyard haunting always ON' },
  9: { id: 'smaller_draft', description: 'Draft pools reduced by 1 card each tier' },
  10: { id: 'typed_final_boss', description: 'Final boss Phase 4 uses typed answers' },
}

export function getActiveRules(masteryLevel) {
  return Object.entries(MASTERY_RULES)
    .filter(([level]) => parseInt(level) <= masteryLevel)
    .map(([, rule]) => rule)
}
```

---

## ANIMATION CONVENTIONS

Use Framer Motion for ALL transitions. Never use CSS transitions for game state changes.

```jsx
// Card entering hand
<motion.div
  initial={{ opacity: 0, y: 60, scale: 0.8 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -40, scale: 0.9 }}
  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
/>

// Card selected (rises from hand)
<motion.div
  animate={{ y: selectedCard === card.id ? -40 : 0, scale: selectedCard === card.id ? 1.05 : 1 }}
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
/>

// Damage number floating up
<motion.div
  initial={{ opacity: 1, y: 0 }}
  animate={{ opacity: 0, y: -60 }}
  transition={{ duration: 0.8, ease: 'easeOut' }}
  className="absolute text-red-400 font-bold text-2xl pointer-events-none"
/>

// Screen transition between rooms
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.4 }}
/>
```

---

## CAMPAIGN THEME TOKENS

Apply these consistently. Never hardcode colors — always reference campaign theme.

```javascript
export const CAMPAIGN_THEMES = {
  japanese: {
    primary: '#1A0A00',
    accent: '#C41E3A',
    accent2: '#E8B86D',
    cardVocab: '#8B1A1A',
    cardGrammar: '#1A3A8B',
    cardReading: '#1A6B3A',
    font: 'Noto Serif JP',
    bgPattern: 'url(/images/ui/japanese_paper.png)',
  },
  korean: {
    primary: '#000814',
    accent: '#00F5FF',
    accent2: '#FF006E',
    cardVocab: '#FF006E',
    cardGrammar: '#00F5FF',
    cardReading: '#ADFF2F',
    font: 'Noto Sans KR',
    bgPattern: 'url(/images/ui/korean_circuit.png)',
  },
  spanish: {
    primary: '#1A0A00',
    accent: '#FF6B35',
    accent2: '#4ECDC4',
    cardVocab: '#FF6B35',
    cardGrammar: '#4ECDC4',
    cardReading: '#FFE66D',
    font: 'Playfair Display',
    bgPattern: 'url(/images/ui/spanish_tile.png)',
  },
}
```

---

## LOCALSTORAGE KEY CONVENTIONS

Never use raw strings. Always use these constants:

```javascript
export const STORAGE_KEYS = {
  ACTIVE_RUN: 'lq_active_run',
  GRAVEYARD: 'lq_graveyard',
  PROGRESS: 'lq_progress',       // campaign clears, mastery levels
  SETTINGS: 'lq_settings',
  JOURNAL: 'lq_journal',         // words and grammar seen across all runs
}
```

---

## ERROR HANDLING RULES

1. **All JSON data files** must be validated on import. If a card references a question tag that doesn't exist in the question bank, log a warning and skip — never crash.

2. **Audio failures** must be silent. Wrap all Howler calls in try/catch. The game must be fully playable with audio broken.

3. **localStorage failures** (quota exceeded, private browsing) must degrade gracefully. Fall back to in-memory state. Show a one-time notice: "Progress won't be saved in this session."

4. **Question pool empty** (edge case on high mastery + small question bank): Fall back to a generic question from the same type and floor tier. Never block combat.

5. **Enemy intent overflow**: Intent pattern index must always use `% intent_pattern.length`. Never access a fixed index.

---

## PERFORMANCE RULES

- **Never import the entire question bank at startup.** Load per-campaign data lazily when a campaign is selected.
- **Shuffle deck with Fisher-Yates**, never `.sort(() => Math.random() - 0.5)` (biased).
- **Memoize card components** with `React.memo`. The hand re-renders on every store update — cards should not.
- **Audio sprites** for SFX: bundle all short SFX into one sprite file per campaign to reduce HTTP requests.
- **Images**: all card illustrations compressed to WebP, max 200KB each.

---

## TESTING CHECKLIST

Before considering any feature complete, verify:

- [ ] Correct answer applies full card effect
- [ ] Wrong answer applies enemy buff (not deck pollution)
- [ ] Chain activates when vocabulary → grammar played in same turn
- [ ] Chain breaks when wrong card type played
- [ ] Hint costs 1 energy and does not reveal answer directly
- [ ] Draft pool scales correctly with accuracy (80%+, 60–79%, below 60%)
- [ ] Graveyard records wrong answers and persists across sessions
- [ ] Rest site offers Heal OR Review, not both
- [ ] Mastery rules apply correctly at their level
- [ ] Romanization fades correctly based on character + floor + settings
- [ ] HoverTranslate works on all target language text
- [ ] Audio plays for correct, wrong, and chain events
- [ ] Map always has at least 1 rest and 1 merchant per floor
- [ ] Boss always preceded by a rest node
- [ ] Post-run summary shows top 3 missed questions with explanations

---

*End of SKILL.md*
