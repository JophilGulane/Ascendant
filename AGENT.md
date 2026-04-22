# AGENT.md — Ascendant Build Agent Instructions
> Read this before SKILL.md. Follow both.
> Version 2: reflects locked card mechanic, no-repeat question pools, and full enemy turn system.

---

## YOUR ROLE

You are the sole developer of Ascendant — a browser-based, single-player, turn-based card RPG that teaches language through combat. Build it completely, correctly, and in the right order.

You are not building a prototype. You are not building a demo. You are building a shippable game.

---

## FIRST THING — READ THESE FILES IN ORDER

1. `AGENT.md` (this file) — how to behave
2. `SKILL.md` — all technical patterns, schemas, and conventions
3. `Ascendant_BuildPrompt.md` — what the game IS

If any file is missing, stop and ask. Do not invent conventions.

---

## WHAT CHANGED IN VERSION 2 — READ THIS CAREFULLY

Three core combat mechanics were updated from the original design. If you have any cached understanding of this game, these changes override it:

### Change 1 — Wrong answers now LOCK the card
**Old behavior:** Wrong answer → card does nothing, enemy gets buff.
**New behavior:** Wrong answer → card becomes Locked (greyed out, unplayable for the rest of the current turn), enemy gets buff, 0 Energy cost. The card automatically unlocks at the start of the player's next turn with a flash animation.

Implementation implications:
- `runStore` must have a `lockedCards` array (list of card IDs)
- `CardComponent` must check if its card ID is in `lockedCards` and render locked state
- Tapping a locked card shows shake animation + "Locked until next turn" tooltip, no other action
- `store.unlockAllCards()` must be called at the start of every player turn
- `store.unlockAllCards()` must also be called in `startFight()` to reset state between fights
- The chain system must call `breakChain()` on a wrong answer — a locked card cannot prime or extend a chain

### Change 2 — Enemy attacks AFTER the player turn (explicit ordering)
**This was previously implied but not explicitly ordered.**
**New behavior:** The enemy turn is a distinct, sequential phase that begins only after the player ends their turn or runs out of Energy. The enemy executes their full telegraphed action chain before the player draws new cards.

The correct turn order is:
1. Player draws cards (locked cards unlock here)
2. Player plays cards (answers questions)
3. Player ends turn
4. Enemy executes their full action chain (all queued actions resolve in sequence)
5. Player debuffs tick down
6. Repeat

Never resolve enemy actions mid-player-turn. Never resolve them before the player ends their turn.

### Change 3 — Questions never repeat within the same fight
**Old behavior:** Questions were sampled randomly each time a card was played.
**New behavior:** Every question used in a fight is tracked in `store.fightQuestionPoolUsed`. When sampling a question for a card, exclude any question IDs already in this array. Reset the array when a new fight starts (`store.startFight()`).

If the pool is exhausted (all questions for a card type have been shown this fight), silently reset the pool for that fight only. This is a rare edge case that occurs only in very long fights. Log a console.warn when it happens.

---

## ABSOLUTE RULES — NEVER BREAK THESE

**1. Never build out of order.**
Phase 1 must work perfectly before Phase 2 begins.

**2. Never hardcode content.**
Questions, cards, enemies, events — all from JSON data files. Never in components.

**3. Never block the game on a missing asset.**
Missing image → placeholder. Audio fails → silence. Empty question pool → fallback. Always playable.

**4. Never add unplanned features silently.**
Note improvements as `// SUGGESTION:` comments. Never implement silently.

**5. Never use inline styles or raw hex colors.**
Always use Tailwind utility classes or campaign theme tokens.

**6. Never mutate Zustand state directly.**
Always use the store's defined action functions.

**7. Never skip the testing checklist.**
Run through relevant SKILL.md checklist items after every feature.

**8. Never resolve enemy actions during the player turn.**
Enemy actions only execute after the player explicitly ends their turn or Energy reaches 0.

**9. Never allow a locked card to be played.**
Always check `lockedCards` before activating any card interaction.

**10. Never reuse a question in the same fight.**
Always check and update `fightQuestionPoolUsed` when sampling questions.

---

## BUILD ORDER — PHASE 1 (Build this fully before anything else)

Phase 1 scope: Japanese campaign only, Kenji (The Traveler) only, Floors 1–2 only.

### Step 1 — Project scaffold
- Initialize Vite + React, install all dependencies
- Set up folder structure exactly as defined in SKILL.md
- Create all store files with full schemas including: `lockedCards`, `activePlayerDebuffs`, `activeEnemyBuffs`, `fightQuestionPoolUsed`, `intentIndex`

### Step 2 — Data layer
- Create `src/data/japanese/questions.json` — 30 vocab + 20 grammar + 10 reading questions (floor_tier 1 and 2 only, minimum 10 per type per tier)
- Create `src/data/japanese/cards.json` — 15 cards
- Create `src/data/japanese/enemies.json` — 4 enemies (2 floor 1, 2 floor 2), each with `intent_pattern` and `wrong_answer_buffs` fields
- Create `src/data/japanese/moves.json` — all move type definitions
- Validate all JSON. Run pool size check.

### Step 3 — Core combat loop (build in this exact order)

1. `CardComponent.jsx` — renders card including locked state (greyed, lock icon, red border)
2. `CardHand.jsx` — fanned layout, locked card interaction handling (shake + tooltip)
3. `QuestionPrompt.jsx` — question lifecycle, timer, 4 options, hint button, fog/confusion debuff application
4. `EnemyDisplay.jsx` — enemy portrait, HP bar
5. `EnemyIntentPanel.jsx` — shows full action chain for next enemy turn (icons + labels + arrows)
6. `PlayerStatus.jsx` — HP, block, Energy, active debuff badges
7. `DebuffBadges.jsx` — visual display of all active player debuffs with remaining duration
8. `useCombat.js` — draw, play, chain logic, wrong answer → lock + enemy buff, turn management
9. `useQuestion.js` — question lifecycle with pool tracking (markQuestionUsed)
10. `useEnemyTurn.js` — enemy action execution in sequence after player turn ends
11. `EnemyTurnResolver.jsx` — animates enemy action chain with delays between actions
12. `CombatScreen.jsx` — assembles all above, owns the turn state machine

**The turn state machine must have these distinct states:**
- `PLAYER_DRAW` → draw cards, unlock locked cards, apply drain energy if debuffed
- `PLAYER_TURN` → player plays cards, questions answered, cards locked/unlocked
- `ENEMY_TURN` → enemy action chain executes fully
- `FIGHT_END` → victory or defeat processing

Test the complete loop end-to-end before Step 4.

### Step 4 — Map system
- `map.js` — generates 2-floor map with correct node weights
- `MapNode.jsx` + `MapScreen.jsx`

### Step 5 — Room types
- `RestRoom.jsx` — Heal vs Review
- `MerchantRoom.jsx` — 3 cards, remove card, gold display
- `EventRoom.jsx` — NPC dialogue, two choices, outcome

### Step 6 — Draft system
- Accuracy-based pool calculation, card sampling, draft screen after every combat

### Step 7 — Post-run summary
- Session data collection, three-section summary screen
- Include locked card count ("Cards locked by wrong answers: 7")

### Step 8 — Navigation shell
- MainMenu, CharacterSelect (Kenji only, others grayed), React Router, ScreenTransition

**Phase 1 complete when:** A player can select Kenji, navigate a 2-floor Japanese map, fight enemies using the full combat loop (locked cards, no repeated questions, enemy action chains), draft cards, visit rest sites and merchants, and reach a Phase 1 boss with a summary screen.

---

## BUILD ORDER — PHASE 2

Begin only when Phase 1 passes a full playthrough with zero known bugs.

- Add Floors 3 and 4 enemies with 2-action intent patterns
- Add all 3 Japanese boss phases with full multi-action chains
- Boss defeat dialogue with 2-choice mechanic
- Expand question bank to 240 questions, card set to 53 cards
- Add Hana and Yuki characters with correct script/romanization behavior
- Relic system (8 relics, passive hooks)
- Mistake Graveyard (screen + haunting toggle)
- Journal system (in-run overlay, Words + Grammar tabs)
- Mastery Level system (all 10 rules)
- Full audio (useAudio hook, per-floor music, all SFX)

---

## BUILD ORDER — PHASE 3

Begin only when Phase 2 passes a full run with zero known bugs.

- Korean campaign (all data, enemies, boss phases, characters)
- Spanish campaign (all data, enemies, boss phases, characters)
- Cross-campaign main menu with all panels active
- Full campaign-specific audio

---

## BUILD ORDER — PHASE 4 (Polish)

- All Framer Motion animations (card draw, damage floats, chain glow, unlock flash, enemy turn actions, screen wipes)
- Cutscene system for boss defeat dialogues
- Accessibility features
- Mobile responsiveness
- Performance audit (lazy loading, image optimization, audio sprites)
- Final localStorage error handling

---

## HOW TO HANDLE DECISIONS

**Spec is clear → follow it exactly.** Do not improve it without flagging.

**Spec is ambiguous → use this priority:**
1. Does SKILL.md answer it?
2. Does the core design principle answer it? ("Combat IS the lesson", "wrong answers are tactical not punishing", "enemy turn is earned consequence")
3. Implement simplest version that fits the principle, add `// DECISION:` comment.

**Found a bug → fix it immediately.** Do not build Phase 2 features while Phase 1 has broken combat.

**Found a performance problem → fix it before it compounds.**

---

## COMPONENT WRITING RULES

Every component must:
- Have a single clear responsibility
- Accept typed props
- Handle its own loading and empty states
- Never fetch data — receive via props or read from store
- Never write to a store directly — call store actions

Component size limit: 200 lines. Larger → split.

**Correct combat component responsibility split:**
```
CombatScreen         — turn state machine, owns phase transitions
  CardHand           — renders hand, locked state handling, selection
    CardComponent    — renders one card, knows nothing about combat
  QuestionPrompt     — question lifecycle, fog/confusion handling, fires callback
  EnemyDisplay       — portrait, HP bar (no player state knowledge)
  EnemyIntentPanel   — shows current intent chain (no player state knowledge)
  EnemyTurnResolver  — animates enemy actions sequentially
  PlayerStatus       — HP, block, energy, debuff badges (no enemy state knowledge)
  DebuffBadges       — debuff icons with duration countdowns
```

---

## DATA WRITING RULES

Every enemy must have:
- `intent_pattern` as an array of arrays (each sub-array is one turn's actions)
- `actions_per_turn` field matching the longest sub-array in `intent_pattern`
- `wrong_answer_buffs` object with keys for `vocabulary`, `grammar`, and `reading`
- `special_ability` object (can be null for floor 1 enemies)

Every question must have:
- Unique ID: `{campaign}_{type}_{3-digit}` (e.g., `jp_vocab_001`)
- `floor_tier` between 1–4
- Exactly 4 options with valid `correct_index` (0–3)
- Non-empty `hint` that teaches, not reveals
- Non-empty `explanation` for post-run summary
- At least 2 tags matching real tags in card definitions

**Validate data integrity before each phase transition:**
- All card `question_tags` reference real tags in the question bank
- All enemy `wrong_answer_buffs` types are valid (confusion / conjugation_armor / fortify)
- All enemy `intent_pattern` actions are valid MOVE_TYPES enum values
- All relic `trigger` values match defined trigger hooks in the codebase
- No duplicate IDs anywhere
- Minimum 10 questions per card type per floor tier

---

## NAMING CONVENTIONS

| What | Convention | Example |
|---|---|---|
| Components | PascalCase | `CardComponent`, `EnemyIntentPanel` |
| Hooks | camelCase with `use` | `useCombat`, `useEnemyTurn` |
| Store files | camelCase + Store | `runStore`, `graveyardStore` |
| Utility functions | camelCase | `resolveEnemyAction`, `sampleQuestion` |
| Constants | UPPER_SNAKE_CASE | `MOVE_TYPES`, `STORAGE_KEYS` |
| JSON IDs | snake_case with campaign prefix | `jp_vocab_001`, `jp_oni_warrior` |
| CSS | Tailwind utilities only | Never custom class names |
| LocalStorage keys | `lq_` prefix | `lq_active_run` |

---

## COMMON MISTAKES — AVOID THESE

### ❌ Resolving enemy actions mid-player-turn
The enemy turn must be a fully separate phase. Never apply enemy damage, debuffs, or buffs while the player still has cards to play. Wait for `ENEMY_TURN` state.

### ❌ Forgetting to reset locked cards between fights
`startFight()` must call `unlockAllCards()`. Locked cards from the previous fight must not carry over.

### ❌ Sampling the same question twice in one fight
Every call to `sampleQuestion()` must check and update `fightQuestionPoolUsed`. This is easy to forget when refactoring question selection logic.

### ❌ Allowing chain bonuses on locked cards
The chain check runs BEFORE the question prompt. But if the answer is wrong, `breakChain()` must be called AND the bonus must not be applied retroactively.

### ❌ Intent panel not updating after player turn
The intent panel must re-render when `intentIndex` changes. `advanceIntent()` is called after the full enemy turn executes, not before.

### ❌ Wrong-answer buffs persisting across turns
Enemy buffs from wrong answers should accumulate during the player turn and be consumed by the enemy turn (used to calculate their Strike damage, etc.), then cleared after the enemy turn ends via `clearEnemyBuffs()`.

### ❌ Global state for local UI
Timer countdown, hover states, question animation state, shake animation state — these are `useState` in components. Not in Zustand.

### ❌ Building UI before data
Always define the JSON schema first with 3–5 sample entries, then build the component to consume them.

---

## TURN STATE MACHINE REFERENCE

```
─────────────────────────────────────────────────────────────
FIGHT_START
  → startFight(enemy)
  → unlockAllCards()
  → resetFightQuestionPool()
  → Transition to: PLAYER_DRAW
─────────────────────────────────────────────────────────────
PLAYER_DRAW
  → unlockAllCards() (flash animation)
  → drawCards(getEffectiveDrawCount()) (respects Bind debuff)
  → resetEnergy(getEffectiveEnergy()) (respects Drain debuff)
  → Transition to: PLAYER_TURN
─────────────────────────────────────────────────────────────
PLAYER_TURN
  → Player selects cards, questions answered
  → Correct → card activates, energy spent, chain updated
  → Wrong → card locked, enemy buff added, chain broken
  → Energy reaches 0 OR player clicks End Turn
  → Transition to: ENEMY_TURN
─────────────────────────────────────────────────────────────
ENEMY_TURN
  → Execute all actions in intent_pattern[intentIndex]
  → Apply accumulated wrong-answer buffs to action calculations
  → Play action animations sequentially (600ms delay between)
  → advanceIntent()
  → clearEnemyBuffs()
  → tickPlayerDebuffs()
  → If enemyHp <= 0 → Transition to: FIGHT_END (victory)
  → If playerHp <= 0 → Transition to: FIGHT_END (defeat)
  → Else → Transition to: PLAYER_DRAW
─────────────────────────────────────────────────────────────
FIGHT_END
  → endFight()
  → If victory → show draft screen → map
  → If defeat → show summary screen → main menu
─────────────────────────────────────────────────────────────
```

---

## DEFINITION OF DONE

A feature is done when:
- [ ] It works in the happy path
- [ ] It handles its most common error case gracefully
- [ ] It uses data from JSON files, not hardcoded strings
- [ ] It reads from and writes to the correct store actions
- [ ] No console errors during normal use
- [ ] Relevant SKILL.md checklist items pass

The game is done when:
- [ ] All three campaigns are playable end-to-end
- [ ] Locked cards, no-repeat questions, and enemy action chains all work in every fight
- [ ] Enemy intent panels accurately show upcoming actions and update correctly
- [ ] Mistake Graveyard persists across sessions
- [ ] Mastery Level 1 is unlockable and functional
- [ ] A new player can pick up the game and understand what to do within 2 minutes
- [ ] A 30–45 minute run can be completed without a crash or game-breaking bug

---

## FINAL REMINDER

The heart of this game is one idea: **combat IS the lesson**.

The player should never think "now I'm studying." They should think:

*"The enemy is about to Silence my Grammar cards. I need to block with a Grammar card NOW — but do I know what goes in that blank?"*

That tension — between game strategy and language knowledge — is the entire product. Build toward it. Everything else is implementation details.

---

*End of AGENT.md*