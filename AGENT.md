# AGENT.md — Ascendant Build Agent Instructions
> This file tells you how to behave, what order to build things, and how to avoid the most common mistakes when building Ascendant. Read this before SKILL.md. Follow both.

---

## YOUR ROLE

You are the sole developer of Ascendant — a browser-based, single-player, turn-based card RPG that teaches language through combat. Your job is to build it completely, correctly, and in the right order.

You are not building a prototype. You are not building a demo. You are building a shippable game.

---

## FIRST THING — READ THESE FILES

Before writing a single line of code:

1. Read `AGENT.md` (this file) — understand how to behave
2. Read `SKILL.md` — understand all technical patterns, schemas, and conventions
3. Read `Ascendant_BuildPrompt.md` — understand what the game IS

If any of these files are missing, stop and ask. Do not invent your own conventions.

---

## ABSOLUTE RULES — NEVER BREAK THESE

**1. Never build out of order.**
The phase plan exists for a reason. Phase 1 must work perfectly before Phase 2 begins. A broken Phase 1 with Phase 3 features is worthless.

**2. Never hardcode content.**
Questions, cards, enemies, events — all must come from JSON data files. No content string should ever appear in a component or hook. If you find yourself writing a question inside a React component, stop and move it to the data layer.

**3. Never block the game on a missing asset.**
If an image is missing → show a styled placeholder. If audio fails → silence, no crash. If a question pool is empty → use a fallback. The game must always be playable.

**4. Never add a feature not in the spec without flagging it.**
If you think of an improvement, note it as a comment `// SUGGESTION:` and continue. Do not implement it silently. Unplanned features are the most common source of scope creep and bugs.

**5. Never use inline styles or raw hex colors.**
Always use Tailwind utility classes or campaign theme tokens from `constants/campaigns.js`. This ensures themes can be changed in one place.

**6. Never mutate Zustand state directly.**
Always use the store's defined action functions. Never do `store.hp = 50`. Always do `store.setHp(50)`.

**7. Never skip the testing checklist.**
After completing any feature, run through the relevant items in SKILL.md's testing checklist before moving on.

---

## BUILD ORDER — PHASE 1 (Build this first, fully)

Phase 1 scope: Japanese campaign only, Kenji (The Traveler) only, Floors 1–2 only.

### Step 1 — Project scaffold
- Initialize Vite + React project
- Install all dependencies: `framer-motion`, `zustand`, `howler`, `react-router-dom`, `tailwindcss`
- Set up folder structure exactly as defined in SKILL.md
- Set up Tailwind config with campaign theme tokens as custom colors
- Create all store files (runStore, settingsStore, graveyardStore, progressStore) with their full schemas — even if unused in Phase 1

### Step 2 — Data layer
- Create `src/data/japanese/questions.json` with minimum 30 vocabulary + 20 grammar + 10 reading questions (floor_tier 1 and 2 only)
- Create `src/data/japanese/cards.json` with 15 cards (8 vocabulary, 5 grammar, 2 reading)
- Create `src/data/japanese/enemies.json` with 4 enemies (2 floor 1, 2 floor 2)
- Validate all JSON manually — run a schema check script before proceeding

### Step 3 — Core combat loop
Build in this exact order. Do not skip ahead:

1. `CardComponent.jsx` — renders a single card with name, type, cost, effect text
2. `CardHand.jsx` — renders up to 5 cards in a fanned layout, handles selection
3. `QuestionPrompt.jsx` — mounts on card selection, shows question, timer, 4 options, hint button
4. `EnemyDisplay.jsx` — enemy portrait, HP bar, intent icon
5. `PlayerStatus.jsx` — player HP bar, block indicator, energy pips
6. `CombatScreen.jsx` — assembles all the above, handles turn flow
7. `useCombat.js` — all combat logic (draw, play, resolve, enemy turn, end turn)
8. `useQuestion.js` — question lifecycle (mount, timer, answer, outcome)

Test combat loop end-to-end before moving to Step 4.

### Step 4 — Map system
1. `map.js` utility — generates a 2-floor map with correct node weights
2. `MapNode.jsx` — single node with type icon, locked/unlocked state
3. `MapScreen.jsx` — renders full map, handles navigation

### Step 5 — Room types
Build each room as a self-contained component:
1. `RestRoom.jsx` — Heal vs Review choice
2. `MerchantRoom.jsx` — 3 cards, remove card option, gold display
3. `EventRoom.jsx` — NPC dialogue, two choice options, outcome

### Step 6 — Draft system
1. `useDraft.js` — accuracy-based pool calculation, card sampling
2. Draft screen component — shown after every combat

### Step 7 — Post-run summary
1. Collect session data (questions seen, wrong answers, accuracy)
2. `PostRunSummary.jsx` — three sections: learned, struggled, pattern

### Step 8 — Navigation shell
1. `MainMenu.jsx` — campaign select (Japanese only active, others locked)
2. `CharacterSelect.jsx` — 3 characters, Kenji only (others grayed out)
3. React Router routes connecting all screens
4. `ScreenTransition.jsx` — fade between screens

**Phase 1 is complete when:** A player can select Kenji, navigate a 2-floor Japanese map, fight enemies, draft cards, visit rest sites, merchants, and events, and reach a Phase 1 boss that ends the run with a summary screen.

---

## BUILD ORDER — PHASE 2

Only begin Phase 2 when Phase 1 is fully working with no known bugs.

### Step 1 — Complete Japanese campaign
- Add Floors 3 and 4 enemies and questions (floor_tier 3 and 4)
- Add all 3 Japanese boss phases (Mountain Spirit)
- Add boss defeat dialogue with 2-choice mechanic
- Expand question bank to full 240 questions
- Expand card set to full 53 cards

### Step 2 — Add Hana and Yuki characters
- Character-specific starting decks
- Romanization fading logic per character type
- Character portraits on combat screen

### Step 3 — Relic system
- `relics.json` data file with all 8 Phase 2 relics
- Relic inventory display (horizontal strip in combat)
- Relic effect hooks (trigger on correct answer, on fight start, etc.)
- Relic acquisition: elite fights, merchant, boss clear

### Step 4 — Mistake Graveyard
- Full graveyard screen (accessible from main menu)
- Graveyard visual theme (stone lanterns for Japanese)
- Graveyard haunting toggle in Settings
- Ghost enemy encounters on map (when haunting is ON)

### Step 5 — Journal system
- Journal overlay (accessible during combat)
- Words tab (all vocab encountered this run)
- Grammar tab (all grammar concepts encountered this run)
- Mastery star counter (3 correct answers = ★)

### Step 6 — Mastery Level system
- Progress store tracking campaign clears per character
- Mastery Level unlock screen after first clear
- All 10 mastery rule modifiers implemented
- Mastery record screen (accessible from main menu)

### Step 7 — Audio
- Implement `useAudio.js` hook
- Add ambient music per floor (placeholder files if originals not ready)
- Add all SFX (correct, wrong, chain, card draw, boss appear, victory)

**Phase 2 is complete when:** All 3 Japanese characters can be played through all 4 floors and boss, graveyard tracks correctly, journal fills correctly, and Mastery Level 1 can be unlocked and played.

---

## BUILD ORDER — PHASE 3

Only begin Phase 3 when Phase 2 passes a full playthrough with no known bugs.

- Korean campaign (all data, enemies, boss, characters)
- Spanish campaign (all data, enemies, boss, characters)
- Cross-campaign main menu with all panels active
- Full audio implementation with campaign-specific music

---

## BUILD ORDER — PHASE 4 (Polish)

- All Framer Motion animations (card draw, damage numbers, chain glow, screen wipes)
- Cutscene system for boss defeat dialogues
- Accessibility features (colorblind mode, font size, high contrast)
- Mobile responsiveness (touch card selection, readable text at 375px width)
- Performance audit (lazy loading, image optimization, audio sprites)
- Final localStorage error handling and graceful degradation

---

## HOW TO HANDLE DECISIONS

### When the spec is clear → follow it exactly.
Do not improvise. Do not "improve" it without flagging. The game was designed carefully.

### When the spec is ambiguous → use this priority order:
1. Does SKILL.md answer it? Use that.
2. Does the core design principle answer it? ("Combat IS the lesson", "wrong answers are tactical, not punishing")
3. If still unclear → implement the simplest version that fits the principle and add a `// DECISION:` comment explaining your reasoning.

### When you discover a bug → fix it immediately.
Do not log it and move on. Do not build Phase 2 features while Phase 1 has broken combat. A working foundation is the only foundation worth building on.

### When you discover a performance problem → fix it before it compounds.
Late-stage performance fixes are 10x harder. Memoize components early. Lazy load data early. Don't defer these.

---

## COMPONENT WRITING RULES

**Every component must:**
- Have a single clear responsibility
- Accept typed props (use PropTypes or JSDoc comments at minimum)
- Handle its own loading and empty states
- Never fetch data — receive it via props or read from a store
- Never write to a store directly — call store actions

**Component size limit:** If a component exceeds 200 lines, it is doing too much. Split it.

**Example of correct component responsibility split:**

```
CombatScreen       — orchestrates combat, reads store, passes props down
  CardHand         — renders hand, handles card selection, fires callback
    CardComponent  — renders one card, knows nothing about combat state
  QuestionPrompt   — handles question lifecycle, fires answer callback
  EnemyDisplay     — renders enemy, knows nothing about player state
  PlayerStatus     — renders player HP/block/energy, knows nothing about enemy
```

---

## DATA WRITING RULES

**Every question must have:**
- A unique ID following the convention: `{campaign}_{type}_{3-digit-number}` (e.g., `jp_vocab_001`)
- A `floor_tier` between 1–4
- Exactly 4 options with a valid `correct_index` (0–3)
- A non-empty `hint` that teaches, not just reveals
- A non-empty `explanation` for the post-run summary
- At least 2 tags

**Every card must have:**
- A unique ID
- A `question_tags` array that matches real tags in the question bank
- An `energy_cost` between 1–3
- An `effect` object with at least one non-null field

**Validate data integrity before each phase transition.** Write a simple Node script that loads all JSON and checks:
- All card `question_tags` reference real tags in the question bank
- All enemy `wrong_answer_buff` types are valid enum values
- All relic `trigger` values match defined trigger hooks
- No duplicate IDs anywhere

---

## HOW TO NAME THINGS

| What | Convention | Example |
|---|---|---|
| Components | PascalCase | `CardComponent`, `QuestionPrompt` |
| Hooks | camelCase with `use` prefix | `useCombat`, `useAudio` |
| Store files | camelCase + Store | `runStore`, `graveyardStore` |
| Utility functions | camelCase | `calculateDamage`, `sampleQuestions` |
| Constants | UPPER_SNAKE_CASE | `CARD_TYPES`, `STORAGE_KEYS` |
| JSON data IDs | snake_case with campaign prefix | `jp_vocab_001`, `kr_gram_015` |
| CSS classes | Tailwind utilities only | Never write custom class names |
| LocalStorage keys | `lq_` prefix | `lq_active_run`, `lq_graveyard` |

---

## COMMON MISTAKES — AVOID THESE

### ❌ Building UI before data
Never design a component around hardcoded content. Always define the JSON schema first, write 3–5 sample entries, then build the component to consume them.

### ❌ Global state for everything
Not everything belongs in Zustand. Component-local state (`useState`) is correct for: question timer countdown, hover states, animation states, UI toggles. Only game-critical data belongs in the store.

### ❌ Tight coupling between combat and questions
The question system must be completely independent of combat. `QuestionPrompt` receives a question object and fires a callback with the result (`correct | wrong | timeout`). It knows nothing about cards, enemies, or damage. This separation is critical for reusability and testing.

### ❌ Assuming question pools are infinite
Always guard against empty pools. Every sampling function must have a fallback. Log a warning when a fallback is used so it can be fixed later.

### ❌ Skipping the chain logic on edge cases
Common chain bugs:
- Chain activates but doesn't break when wrong card type is played
- Chain persists across turns (it must reset at turn end)
- Chain double-applies on upgraded cards

Test chain logic explicitly after every combat system change.

### ❌ Not resetting combat state between fights
Between every fight: clear enemy buffs, reset chain, reset hand, reset energy, reset hint-used flag. Write a `resetCombatState()` function and call it explicitly on fight start.

### ❌ localStorage without error handling
Always wrap localStorage reads and writes in try/catch. Private browsing, quota exceeded, and browser restrictions can all cause silent failures that corrupt run state.

---

## WHEN YOU ARE STUCK

1. Re-read the relevant section of SKILL.md
2. Re-read the relevant section of `Ascendant_BuildPrompt.md`
3. Check if a simpler version of the feature satisfies the core design principle
4. Implement the simpler version with a `// TODO:` comment for the full version
5. Never stay stuck on one thing for more than 30 minutes — ship something that works and iterate

---

## DEFINITION OF DONE

A feature is done when:
- [ ] It works correctly in the happy path
- [ ] It handles its most common error case gracefully
- [ ] It is using data from JSON files, not hardcoded strings
- [ ] It is reading from and writing to the correct store actions
- [ ] It has been tested against the SKILL.md testing checklist items that apply to it
- [ ] No console errors appear during normal use of the feature

The game is done when:
- [ ] All three campaigns are playable from main menu to post-run summary
- [ ] Mistake Graveyard persists correctly across sessions
- [ ] Mastery Level 1 is unlockable and functional
- [ ] A new player with zero language knowledge can pick it up and understand what to do within 2 minutes
- [ ] A 30–45 minute run can be completed without a crash or game-breaking bug

---

## FINAL REMINDER

The heart of this game is one idea: **combat IS the lesson**. Every feature you build should serve that idea. If a feature makes the game feel more like a quiz and less like a card game, rethink it. If a feature makes the card strategy feel disconnected from the language learning, rethink it.

The player should never think "now I'm studying." They should think "I need to play this grammar card to block that attack — I hope I know what goes in that blank."

Build toward that feeling. Everything else is details.

---

*End of AGENT.md*
