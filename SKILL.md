# SKILL.md — Ascendant Technical Knowledge Base
> Load this file before writing any code. It contains all patterns, rules, and conventions for building Ascendant correctly the first time.
> Version 2: includes locked card mechanic, no-repeat question pool, and full enemy turn system.

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
│   │   ├── japanese/
│   │   ├── korean/
│   │   ├── spanish/
│   │   └── sfx/
│   └── images/
│       ├── cards/
│       ├── enemies/
│       ├── characters/
│       └── ui/
├── src/
│   ├── components/
│   │   ├── combat/
│   │   │   ├── CombatScreen.jsx
│   │   │   ├── CardHand.jsx
│   │   │   ├── CardComponent.jsx
│   │   │   ├── QuestionPrompt.jsx
│   │   │   ├── EnemyDisplay.jsx
│   │   │   ├── EnemyIntentPanel.jsx      ← NEW: shows full action chain
│   │   │   ├── PlayerStatus.jsx
│   │   │   ├── EnergyBar.jsx
│   │   │   ├── ChainIndicator.jsx
│   │   │   ├── DebuffBadges.jsx          ← NEW: shows active player debuffs
│   │   │   └── EnemyTurnResolver.jsx     ← NEW: animates enemy action chain
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
│   │   ├── runStore.js
│   │   ├── settingsStore.js
│   │   ├── graveyardStore.js
│   │   └── progressStore.js
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
│   │   ├── useCombat.js
│   │   ├── useQuestion.js
│   │   ├── useEnemyTurn.js               ← NEW: enemy turn resolution
│   │   ├── useAudio.js
│   │   ├── useDraft.js
│   │   └── useGraveyard.js
│   ├── utils/
│   │   ├── combat.js
│   │   ├── enemyTurn.js                  ← NEW: enemy action resolution logic
│   │   ├── deck.js
│   │   ├── map.js
│   │   ├── questions.js
│   │   └── localStorage.js
│   ├── constants/
│   │   ├── campaigns.js
│   │   ├── cardTypes.js
│   │   ├── nodeTypes.js
│   │   ├── enemyMoves.js                 ← NEW: all move type definitions
│   │   └── masteryRules.js
│   ├── App.jsx
│   └── main.jsx
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
    "bonus_correct_no_hint": 4,
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
  "id": "jp_oni_warrior",
  "campaign": "japanese",
  "floor": 3,
  "tier": "regular",
  "name_target": "鬼戦士",
  "name_native": "Oni Warrior",
  "hp": 110,
  "base_attack": 18,
  "actions_per_turn": 2,
  "concept_tags": ["te-form", "casual-conjugation"],
  "intent_pattern": [
    ["strike", "self_buff_power_up"],
    ["strike", "debuff_drain"],
    ["special_demon_roar", "strike"]
  ],
  "wrong_answer_buffs": {
    "vocabulary": { "type": "confusion", "attack_bonus": 2, "duration_turns": 1 },
    "grammar": { "type": "conjugation_armor", "blocks_type": "grammar", "duration_turns": 1 },
    "reading": { "type": "fortify", "hp_bonus": 5, "duration_turns": 2 }
  },
  "special_ability": {
    "id": "demon_roar",
    "description": "Forces a te-form question before player next turn. Wrong = enemy attacks twice.",
    "trigger": "intent_pattern"
  },
  "portrait": "enemies/japanese/oni_warrior.png"
}
```

### Enemy Move Type Definitions
```javascript
// constants/enemyMoves.js
export const MOVE_TYPES = {
  STRIKE:             'strike',
  DEBUFF_SILENCE:     'debuff_silence',
  DEBUFF_DRAIN:       'debuff_drain',
  DEBUFF_FOG:         'debuff_fog',
  DEBUFF_BIND:        'debuff_bind',
  DEBUFF_CONFUSION:   'debuff_confusion',
  SELF_BUFF_ARMOR:    'self_buff_armor_up',
  SELF_BUFF_RECOVER:  'self_buff_recover',
  SELF_BUFF_POWER:    'self_buff_power_up',
  SELF_BUFF_FOCUS:    'self_buff_focus',
  SPECIAL:            'special',
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
```

---

## STATE MANAGEMENT

### Run Store (Zustand)
```javascript
// stores/runStore.js
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useRunStore = create(persist((set, get) => ({
  runId: null,
  campaign: null,
  character: null,
  masteryLevel: 0,

  hp: 80, maxHp: 80, block: 0,
  gold: 0, energy: 3, maxEnergy: 3,

  floor: 1, currentNode: null, mapNodes: [],

  deck: [], hand: [], discardPile: [], exhaustPile: [],
  lockedCards: [],          // card IDs locked this turn by wrong answers

  relics: [],
  activePlayerDebuffs: [],  // debuffs on the player: silence, drain, fog, bind, confusion
  activeEnemyBuffs: [],     // buffs on the enemy from wrong answers: confusion, armor, fortify

  inCombat: false,
  currentEnemy: null,
  enemyHp: 0,
  enemyArmor: 0,
  enemyFuryStacks: 0,
  enemyFocusType: null,     // card type the enemy is focused against
  turnNumber: 0,
  intentIndex: 0,           // current index in enemy intent_pattern

  chainActive: false,
  chainType: null,

  // Per-fight question pool tracking — cleared on fight start
  fightQuestionPoolUsed: [],

  // Persistent mistake tracking for this session
  sessionMistakes: [],

  // ── Actions ──
  setHp: (hp) => set({ hp: Math.max(0, hp) }),
  addBlock: (amount) => set(s => ({ block: s.block + amount })),
  spendBlock: (amount) => set(s => ({ block: Math.max(0, s.block - amount) })),
  spendEnergy: (amount) => set(s => ({ energy: Math.max(0, s.energy - amount) })),
  resetEnergy: () => set(s => ({ energy: s.maxEnergy })),
  addGold: (amount) => set(s => ({ gold: s.gold + amount })),
  spendGold: (amount) => set(s => ({ gold: Math.max(0, s.gold - amount) })),

  lockCard: (cardId) => set(s => ({
    lockedCards: [...s.lockedCards, cardId]
  })),
  unlockAllCards: () => set({ lockedCards: [] }),

  addPlayerDebuff: (debuff) => set(s => ({
    activePlayerDebuffs: [...s.activePlayerDebuffs, debuff]
  })),
  tickPlayerDebuffs: () => set(s => ({
    activePlayerDebuffs: s.activePlayerDebuffs
      .map(d => ({ ...d, duration: d.duration - 1 }))
      .filter(d => d.duration > 0)
  })),
  clearPlayerDebuffs: () => set({ activePlayerDebuffs: [] }),

  addEnemyBuff: (buff) => set(s => ({
    activeEnemyBuffs: [...s.activeEnemyBuffs, buff]
  })),
  clearEnemyBuffs: () => set({ activeEnemyBuffs: [] }),

  activateChain: (type) => set({ chainActive: true, chainType: type }),
  breakChain: () => set({ chainActive: false, chainType: null }),

  markQuestionUsed: (questionId) => set(s => ({
    fightQuestionPoolUsed: [...s.fightQuestionPoolUsed, questionId]
  })),
  resetFightQuestionPool: () => set({ fightQuestionPoolUsed: [] }),

  logMistake: (questionId) => set(s => ({
    sessionMistakes: [...s.sessionMistakes, { questionId, timestamp: Date.now() }]
  })),

  advanceIntent: () => set(s => ({
    intentIndex: (s.intentIndex + 1) % (s.currentEnemy?.intent_pattern?.length || 1)
  })),

  startFight: (enemy) => set(s => ({
    inCombat: true,
    currentEnemy: enemy,
    enemyHp: enemy.hp,
    enemyArmor: 0,
    enemyFuryStacks: 0,
    enemyFocusType: null,
    intentIndex: 0,
    lockedCards: [],
    activeEnemyBuffs: [],
    chainActive: false, chainType: null,
    fightQuestionPoolUsed: [],
  })),

  endFight: () => set({
    inCombat: false,
    currentEnemy: null,
    lockedCards: [],
    activeEnemyBuffs: [],
    activePlayerDebuffs: [],
    chainActive: false, chainType: null,
    fightQuestionPoolUsed: [],
  }),

  startRun: (campaign, character, masteryLevel) => set({
    runId: crypto.randomUUID(),
    campaign, character, masteryLevel,
    hp: 80, maxHp: 80, block: 0,
    gold: 0, floor: 1,
    deck: [], hand: [], discardPile: [],
    relics: [], sessionMistakes: [],
    lockedCards: [], activePlayerDebuffs: [], activeEnemyBuffs: [],
  }),
}), { name: 'Ascendant-run' }))
```

---

## COMBAT LOGIC PATTERNS

### Card Activation Flow
```
Player selects card
  → Check: card is NOT in lockedCards — if it is, show shake animation + tooltip, abort
  → QuestionPrompt mounts
  → markQuestionUsed(question.id) — prevents repeat in this fight
  → Timer starts
  → Player answers OR timer expires
    → CORRECT:
        1. Resolve chain bonus (resolveChain)
        2. Apply card effect
        3. Check if this card primes chain (vocabulary → grammar, grammar → reading)
        4. spendEnergy(card.energy_cost)
        5. Move card to discard pile
        6. Play correct SFX
    → WRONG / TIMEOUT:
        1. lockCard(card.id) — card greyed out, lock icon overlaid
        2. Apply enemy wrong-answer buff (addEnemyBuff)
        3. breakChain() — chain cannot continue through a locked card
        4. logMistake(question.id) — graveyard + session tracking
        5. graveyardStore.recordWrong(question.id, label, reading)
        6. Play wrong + lock SFX
        7. Show brief explanation overlay (1.5 seconds)
        8. Card stays in hand (no energy cost)
```

### Locked Card Rules
```javascript
// In CardHand.jsx — prevent interaction with locked cards
const isLocked = lockedCards.includes(card.id)

// On card click:
if (isLocked) {
  triggerShakeAnimation(card.id)
  showTooltip('Locked until next turn')
  return
}

// Visual state: apply locked CSS class (grey + lock icon + red border)
// At turn start: store.unlockAllCards() — all locked cards return to normal with flash animation
```

### Chain Logic
```javascript
// utils/combat.js
export function resolveChain(playedCardType, store) {
  const { chainActive, chainType } = store

  if (!chainActive) {
    if (playedCardType === 'vocabulary') store.activateChain('vocabulary')
    if (playedCardType === 'grammar') store.activateChain('grammar')
    return { bonusMultiplier: 1 }
  }

  if (chainType === 'vocabulary' && playedCardType === 'grammar') {
    store.breakChain()
    return { bonusMultiplier: 1.5 }
  }
  if (chainType === 'grammar' && playedCardType === 'reading') {
    store.breakChain()
    return { bonusMultiplier: 2 }
  }

  store.breakChain()
  return { bonusMultiplier: 1 }
}
// IMPORTANT: resolveChain is only called on CORRECT answers.
// Wrong answers call store.breakChain() directly, then lockCard().
```

### Question Pool — No Repeats Per Fight
```javascript
// utils/questions.js
export function sampleQuestion(card, allQuestions, store, settings) {
  const usedIds = store.fightQuestionPoolUsed
  const eligible = allQuestions.filter(q =>
    q.campaign === card.campaign &&
    q.type === card.type &&
    card.question_tags.some(tag => q.tags.includes(tag)) &&
    !usedIds.includes(q.id)  // ← exclude already-used questions this fight
  )

  // If pool exhausted, reset silently (rare edge case)
  const pool = eligible.length > 0
    ? eligible
    : allQuestions.filter(q =>
        q.campaign === card.campaign &&
        q.type === card.type &&
        card.question_tags.some(tag => q.tags.includes(tag))
      )

  if (pool.length === 0) {
    console.warn(`[Ascendant] Empty question pool for card ${card.id}`)
    return getFallbackQuestion(card.campaign, card.type)
  }

  // Spaced repetition weighting (if enabled)
  if (settings.spacedRepetition) {
    const graveyardIds = Object.keys(graveyardStore.entries)
      .filter(id => !graveyardStore.entries[id].mastered)
    const weakPool = pool.filter(q => graveyardIds.includes(q.id))
    if (weakPool.length > 0 && Math.random() < 0.4) {
      const chosen = weakPool[Math.floor(Math.random() * weakPool.length)]
      store.markQuestionUsed(chosen.id)
      return chosen
    }
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)]
  store.markQuestionUsed(chosen.id)
  return chosen
}
```

---

## ENEMY TURN SYSTEM

### Enemy Turn Hook
```javascript
// hooks/useEnemyTurn.js
export function useEnemyTurn() {
  const store = useRunStore()
  const { playSFX } = useAudio()

  async function executeEnemyTurn() {
    const { currentEnemy, intentIndex, activeEnemyBuffs, masteryLevel } = store
    const actions = currentEnemy.intent_pattern[intentIndex % currentEnemy.intent_pattern.length]

    playSFX('enemy_turn_start')

    for (const action of actions) {
      await resolveEnemyAction(action, currentEnemy, store, playSFX, masteryLevel)
      await delay(600) // brief pause between multi-actions for readability
    }

    store.advanceIntent()
    store.clearEnemyBuffs() // wrong-answer buffs consumed after turn
    store.tickPlayerDebuffs() // decrement durations
    store.unlockAllCards() // unlock all locked cards for next player turn
  }

  return { executeEnemyTurn }
}
```

### Enemy Action Resolution
```javascript
// utils/enemyTurn.js
export async function resolveEnemyAction(action, enemy, store, playSFX, masteryLevel) {
  const { activeEnemyBuffs } = store

  switch (action) {
    case 'strike': {
      let damage = enemy.base_attack
      // Apply enemy accumulated buffs from wrong answers
      const confusionBuff = activeEnemyBuffs.find(b => b.type === 'confusion')
      if (confusionBuff) damage += confusionBuff.attack_bonus
      const furyBonus = store.enemyFuryStacks >= 3 ? damage : 0 // double at 3 fury
      damage += furyBonus
      if (furyBonus > 0) store.set({ enemyFuryStacks: 0 })
      // Apply focus resistance
      // (focus resistance handled during card play, not here)
      // Apply player block
      const blocked = Math.min(store.block, damage)
      const remaining = damage - blocked
      store.spendBlock(blocked)
      if (remaining > 0) store.setHp(store.hp - remaining)
      playSFX('enemy_strike')
      break
    }
    case 'debuff_silence': {
      const silenceTarget = enemy.silence_type || 'vocabulary' // defined per enemy
      store.addPlayerDebuff({ type: 'silence', target: silenceTarget, duration: 1 })
      playSFX('debuff_apply')
      break
    }
    case 'debuff_drain': {
      store.addPlayerDebuff({ type: 'drain', energy_penalty: 1, duration: 1 })
      playSFX('debuff_apply')
      break
    }
    case 'debuff_fog': {
      store.addPlayerDebuff({ type: 'fog', duration_questions: 1 })
      playSFX('debuff_apply')
      break
    }
    case 'debuff_bind': {
      store.addPlayerDebuff({ type: 'bind', draw_penalty: 1, duration: 1 })
      playSFX('debuff_apply')
      break
    }
    case 'debuff_confusion': {
      store.addPlayerDebuff({ type: 'confusion', duration_questions: 1 })
      playSFX('debuff_apply')
      break
    }
    case 'self_buff_armor_up': {
      store.set({ enemyArmor: store.enemyArmor + 8 })
      playSFX('enemy_buff')
      break
    }
    case 'self_buff_recover': {
      if (store.enemyHp < store.currentEnemy.hp * 0.5) {
        store.set({ enemyHp: Math.min(store.currentEnemy.hp, store.enemyHp + 15) })
        playSFX('enemy_heal')
      }
      break
    }
    case 'self_buff_power_up': {
      store.set({ enemyFuryStacks: store.enemyFuryStacks + 1 })
      playSFX('enemy_buff')
      break
    }
    case 'self_buff_focus': {
      const mostUsed = getMostUsedCardType(store)
      store.set({ enemyFocusType: mostUsed })
      playSFX('enemy_buff')
      break
    }
    case 'special_demon_roar':
    case 'special_system_override':
    case 'special_contract_clause':
    case 'special_time_split':
    case 'special_shapeshift':
    case 'special_fox_fire': {
      await resolveSpecialMove(action, enemy, store, playSFX)
      break
    }
  }
}

function getMostUsedCardType(store) {
  // Returns the card type the player has played most this fight
  // Tracked in store.cardTypesPlayedThisFight (add this counter to store)
  const counts = store.cardTypesPlayedThisFight || {}
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
}
```

### Intent Panel Component
```jsx
// components/combat/EnemyIntentPanel.jsx
export function EnemyIntentPanel({ enemy, intentIndex }) {
  const pattern = enemy.intent_pattern
  const currentActions = pattern[intentIndex % pattern.length]

  return (
    <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-2">
      {currentActions.map((action, i) => (
        <React.Fragment key={action}>
          <IntentAction action={action} enemy={enemy} />
          {i < currentActions.length - 1 && (
            <span className="text-gray-500 text-sm">→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

function IntentAction({ action, enemy }) {
  const icon = MOVE_ICONS[action] || '❓'
  const label = getIntentLabel(action, enemy)

  return (
    <div className="flex items-center gap-1 text-sm">
      <span>{icon}</span>
      <span className="text-white">{label}</span>
    </div>
  )
}

function getIntentLabel(action, enemy) {
  switch (action) {
    case 'strike': return `Strike (${enemy.base_attack})`
    case 'debuff_silence': return `Silence ${enemy.silence_type}`
    case 'debuff_drain': return 'Drain (−1 Energy)'
    case 'debuff_fog': return 'Fog (next answer)'
    case 'debuff_bind': return 'Bind (−1 draw)'
    case 'debuff_confusion': return 'Confusion (shuffle options)'
    case 'self_buff_armor_up': return 'Armor Up (+8)'
    case 'self_buff_recover': return 'Recover (+15 HP)'
    case 'self_buff_power_up': return 'Power Up (Fury +1)'
    case 'self_buff_focus': return 'Focus (type resist)'
    default: return 'Special'
  }
}
```

---

## DEBUFF APPLICATION IN PLAYER TURN

Debuffs from the enemy must be checked during the player's turn:

```javascript
// In useCombat.js — check active debuffs before each action

function getEffectiveEnergy(store) {
  const drainDebuff = store.activePlayerDebuffs.find(d => d.type === 'drain')
  return drainDebuff
    ? store.maxEnergy - drainDebuff.energy_penalty
    : store.maxEnergy
}

function getEffectiveDrawCount(store) {
  const bindDebuff = store.activePlayerDebuffs.find(d => d.type === 'bind')
  return bindDebuff ? 5 - bindDebuff.draw_penalty : 5
}

function isCardTypeSilenced(cardType, store) {
  return store.activePlayerDebuffs.some(
    d => d.type === 'silence' && d.target === cardType
  )
}

// In QuestionPrompt — apply Fog debuff
function applyFogDebuff(store) {
  const fogDebuff = store.activePlayerDebuffs.find(d => d.type === 'fog')
  if (fogDebuff) {
    // Hide hover highlights on answer options
    // Consume the debuff
    store.set({
      activePlayerDebuffs: store.activePlayerDebuffs.filter(d => d !== fogDebuff)
    })
    return true
  }
  return false
}

// In QuestionPrompt — apply Confusion debuff (shuffles options at 3s mark)
function applyConfusionDebuff(options, store) {
  const confusion = store.activePlayerDebuffs.find(d => d.type === 'confusion')
  if (confusion) {
    setTimeout(() => shuffleOptions(options), 3000)
    store.set({
      activePlayerDebuffs: store.activePlayerDebuffs.filter(d => d !== confusion)
    })
  }
}
```

---

## DAMAGE CALCULATION

```javascript
// utils/combat.js
export function calculateDamage({ base, chainMultiplier, enemyArmor, enemyFocusType, cardType }) {
  let dmg = Math.floor(base * chainMultiplier)
  // Focus resistance: 50% damage reduction to focused type
  if (enemyFocusType && enemyFocusType === cardType) dmg = Math.floor(dmg * 0.5)
  // Armor: flat reduction, chain combos bypass it
  if (enemyArmor && chainMultiplier <= 1) dmg = Math.max(0, dmg - enemyArmor)
  return dmg
}

export function calculateBlock({ base, chainMultiplier }) {
  return Math.floor(base * chainMultiplier)
}
```

---

## QUESTION POOL MANAGEMENT

Minimum required question counts to prevent pool exhaustion in any fight:

| Floor Tier | Min Questions Per Card Type |
|---|---|
| 1 | 10 unique |
| 2 | 10 unique |
| 3 | 10 unique |
| 4 | 10 unique |

Validate this at data load time. Log a console.warn if any tier falls below minimum.

```javascript
// utils/questions.js
export function validateQuestionPoolSizes(questions, campaign) {
  const types = ['vocabulary', 'grammar', 'reading']
  const tiers = [1, 2, 3, 4]
  for (const type of types) {
    for (const tier of tiers) {
      const count = questions.filter(
        q => q.campaign === campaign && q.type === type && q.floor_tier === tier
      ).length
      if (count < 10) {
        console.warn(`[Ascendant] LOW POOL: ${campaign} ${type} tier ${tier} has only ${count} questions`)
      }
    }
  }
}
```

---

## AUDIO PATTERNS

```javascript
// hooks/useAudio.js
const sfx = {
  correct:          new Howl({ src: ['/audio/sfx/correct.mp3'] }),
  wrong:            new Howl({ src: ['/audio/sfx/wrong.mp3'] }),
  cardLock:         new Howl({ src: ['/audio/sfx/card_lock.mp3'] }),
  cardUnlock:       new Howl({ src: ['/audio/sfx/card_unlock.mp3'] }),
  cardDraw:         new Howl({ src: ['/audio/sfx/card_draw.mp3'] }),
  chainActivate:    new Howl({ src: ['/audio/sfx/chain_activate.mp3'] }),
  enemyTurnStart:   new Howl({ src: ['/audio/sfx/enemy_turn_start.mp3'] }),
  enemyStrike:      new Howl({ src: ['/audio/sfx/enemy_strike.mp3'] }),
  debuffApply:      new Howl({ src: ['/audio/sfx/debuff_apply.mp3'] }),
  enemyBuff:        new Howl({ src: ['/audio/sfx/enemy_buff.mp3'] }),
  enemyHeal:        new Howl({ src: ['/audio/sfx/enemy_heal.mp3'] }),
  bossAppear:       new Howl({ src: ['/audio/sfx/boss_appear.mp3'] }),
  victory:          new Howl({ src: ['/audio/sfx/victory.mp3'] }),
}
```

---

## HOVER-TO-TRANSLATE COMPONENT

Every piece of target language text must be wrapped:

```jsx
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

## ANIMATION CONVENTIONS

```jsx
// Card locked (wrong answer)
<motion.div animate={{ x: [0, -8, 8, -8, 8, 0] }} transition={{ duration: 0.3 }} />

// Card unlock at turn start
<motion.div
  initial={{ filter: 'grayscale(100%)' }}
  animate={{ filter: 'grayscale(0%)' }}
  transition={{ duration: 0.4 }}
/>

// Damage float
<motion.div
  initial={{ opacity: 1, y: 0 }}
  animate={{ opacity: 0, y: -60 }}
  transition={{ duration: 0.8 }}
  className="absolute text-red-400 font-bold text-2xl pointer-events-none"
/>

// Enemy buff icon floating up
<motion.div
  initial={{ opacity: 1, scale: 1, y: 0 }}
  animate={{ opacity: 0, scale: 1.5, y: -40 }}
  transition={{ duration: 0.6 }}
/>

// Intent panel update (after player ends turn)
<motion.div
  key={intentIndex}
  initial={{ opacity: 0, x: 20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.3 }}
/>
```

---

## CAMPAIGN THEME TOKENS

```javascript
export const CAMPAIGN_THEMES = {
  japanese: {
    primary: '#1A0A00', accent: '#C41E3A', accent2: '#E8B86D',
    cardVocab: '#8B1A1A', cardGrammar: '#1A3A8B', cardReading: '#1A6B3A',
    font: 'Noto Serif JP', bgPattern: 'url(/images/ui/japanese_paper.png)',
  },
  korean: {
    primary: '#000814', accent: '#00F5FF', accent2: '#FF006E',
    cardVocab: '#FF006E', cardGrammar: '#00F5FF', cardReading: '#ADFF2F',
    font: 'Noto Sans KR', bgPattern: 'url(/images/ui/korean_circuit.png)',
  },
  spanish: {
    primary: '#1A0A00', accent: '#FF6B35', accent2: '#4ECDC4',
    cardVocab: '#FF6B35', cardGrammar: '#4ECDC4', cardReading: '#FFE66D',
    font: 'Playfair Display', bgPattern: 'url(/images/ui/spanish_tile.png)',
  },
}
```

---

## LOCALSTORAGE KEY CONVENTIONS

```javascript
export const STORAGE_KEYS = {
  ACTIVE_RUN:  'lq_active_run',
  GRAVEYARD:   'lq_graveyard',
  PROGRESS:    'lq_progress',
  SETTINGS:    'lq_settings',
  JOURNAL:     'lq_journal',
}
```

---

## ERROR HANDLING RULES

1. All JSON data files validated on import. Missing references log a warning and skip — never crash.
2. Audio failures are silent. Wrap all Howler calls in try/catch. Game must be fully playable with no audio.
3. localStorage failures degrade gracefully to in-memory state. Show one-time notice.
4. Empty question pool: fall back to any question from same type and floor tier. Log warning.
5. Enemy intent overflow: always use `% intent_pattern.length`. Never fixed index access.
6. **Locked card state must be reset on fight start**, not only on turn start. Call `store.unlockAllCards()` in `startFight()`.

---

## TESTING CHECKLIST

Before any feature is considered complete:

**Core combat:**
- [ ] Correct answer applies full card effect and costs Energy
- [ ] Wrong answer locks the card visually (greyed + lock icon), costs 0 Energy
- [ ] Locked card shows shake animation and tooltip when tapped
- [ ] All Locked cards unlock with flash animation at start of next player turn
- [ ] Wrong answer applies the correct enemy buff (Confusion / Conjugation Armor / Fortify)
- [ ] Chain activates when vocabulary → grammar played correctly in same turn
- [ ] Chain breaks when wrong card type played OR wrong answer occurs
- [ ] Locked cards cannot trigger or receive chain bonuses

**Question pool:**
- [ ] Same question never appears twice in the same fight
- [ ] Pool exhaustion silently resets (rare edge case)
- [ ] Pool size validation warns on startup for any tier below 10 questions

**Enemy turn:**
- [ ] Enemy executes actions AFTER player ends their turn, not before
- [ ] Regular enemies perform exactly 1 action
- [ ] Elites perform 1–2 actions per their definition
- [ ] Bosses perform 2–3 actions per their phase
- [ ] Intent panel updates at end of player turn showing next enemy actions
- [ ] Intent panel shows exact damage, exact debuff description, exact buff effect
- [ ] Multi-action intent shows all moves left to right with arrows
- [ ] Strike move correctly applies damage minus player block
- [ ] Silence debuff prevents correct card type from being played next turn
- [ ] Drain debuff reduces starting Energy by 1 next turn
- [ ] Fog debuff hides answer option hover state for next question
- [ ] Bind debuff reduces draw count by 1 next turn
- [ ] Confusion debuff shuffles option positions at 3s mark
- [ ] Armor Up correctly reduces incoming damage
- [ ] Power Up stacks fury, doubles damage at 3 stacks, resets on 3 consecutive correct answers
- [ ] Recover only heals when enemy below 50% HP
- [ ] Focus correctly identifies most-played card type and applies resistance
- [ ] Special moves resolve correctly per enemy
- [ ] Enemy buffs from wrong answers are consumed after enemy turn
- [ ] Player debuffs tick down correctly each turn

**Other:**
- [ ] Draft pool scales with accuracy (80%+, 60–79%, below 60%)
- [ ] Graveyard records wrong answers and persists across sessions
- [ ] Hint costs 1 Energy and cannot be used on Locked card
- [ ] Rest site offers Heal OR Review (not both)
- [ ] Mastery rules apply correctly at their level
- [ ] Post-run summary shows locked card count

---

*End of SKILL.md*