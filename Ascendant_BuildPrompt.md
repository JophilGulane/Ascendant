# Ascendant — Full Build Prompt
> Paste this entire document as your prompt into Antigravity to build the complete game.
> Version 2: includes locked card mechanic, no repeated questions per battle, and full enemy turn system.

---

## OVERVIEW & MISSION

Build **Ascendant** — a single-player, turn-based card RPG that runs in a web browser where combat IS the language lesson. The game is directly inspired by Slay the Spire but every card requires answering a real language question to activate. There is no separation between gameplay and learning.

**Platform:** Web browser (React preferred)
**Languages taught:** Japanese, Korean, Spanish (three separate campaigns)
**Session length:** 30–45 minutes per run
**Tone:** Stylish, immersive, moderately challenging — never feels like a quiz app

---

## TECH STACK

- **Frontend:** React + Tailwind CSS
- **Animations:** Framer Motion for card animations, combat effects, transitions
- **State management:** Zustand
- **Audio:** Howler.js for SFX and ambient music
- **Data:** JSON files for all question banks, card definitions, enemy data, event scripts
- **Storage:** LocalStorage for run state, progress, Mastery Level unlocks, journal
- **Build:** Vite

---

## GAME STRUCTURE

### Campaigns
Three fully separate campaigns, each with its own world, character roster, enemy types, and question bank:

| Campaign | World Theme | Setting | Enemy Types |
|---|---|---|---|
| 🗾 Japanese | Feudal Japan | Shrine mountain, bamboo forests, spirit paths | Yokai, samurai spirits, shrine guardians |
| 🌆 Korean | Cyberpunk Seoul | Corporate towers, neon markets, server districts | Rival factions, rogue AIs, corporate enforcers |
| 🌎 Spanish | Magical Latin America | Jungle roads, ancient ruins, colonial plazas | Spirits, mythical creatures, rival travelers |

Each campaign has **4 floors** with this structure:
- **Floors 1–2:** Gradual difficulty, new mechanics introduced quietly
- **Floor 3:** Complexity ramps, enemies start combining question types
- **Floor 4 + Boss:** Full difficulty, boss is a multi-phase floor exam

---

## PLAYER CHARACTERS

Each campaign has **3 playable characters** based on fluency level. The character selection screen IS the placement test — no separate onboarding quiz.

### Japanese Campaign
| Character | Fluency | Starting Deck | Script Display | Playstyle |
|---|---|---|---|---|
| **Hana** (The Newcomer) | Zero knowledge | Heavy vocabulary cards | Full romaji everywhere | Aggressive, simple combos |
| **Kenji** (The Traveler) | Some basics | Mixed vocab + grammar | Romaji fades by floor 3 | Balanced, flexible drafting |
| **Yuki** (The Returnee) | Studied before, rusty | Grammar-heavy deck | Full hiragana/kanji, no romaji | Defense and setup focused |

### Korean Campaign
| Character | Fluency | Starting Deck | Script Display | Playstyle |
|---|---|---|---|---|
| **Minjun** (The Newcomer) | Zero knowledge | Vocabulary-heavy | Full romanization | Fast aggression |
| **Sora** (The Traveler) | Some basics | Mixed | Partial hangul shown | Balanced |
| **Jiyeon** (The Returnee) | Previously studied | Grammar-heavy | Full hangul only | Control-focused |

### Spanish Campaign
| Character | Fluency | Starting Deck | Script Display | Playstyle |
|---|---|---|---|---|
| **Rosa** (The Newcomer) | Zero knowledge | Vocabulary-heavy | IPA pronunciation shown | Aggressive |
| **Marco** (The Traveler) | Some basics | Mixed | Standard text | Balanced |
| **Elena** (The Returnee) | Previously studied | Grammar-heavy | Full conjugation tables visible | Defense/setup |

**Character selection UI:** Show all three characters side by side with fluency label, personality description, and starting deck breakdown. Player taps to select. No tests, no popups.

---

## CORE COMBAT LOOP

### Turn Structure

1. Player draws **5 cards** from their deck
2. Player has **3 Energy** per turn
3. Player selects a card to play → a **question prompt appears**
4. Player answers the question (multiple choice, 4 options default)
5. **Correct answer** → card activates at full effect, costs Energy as listed
6. **Wrong answer** → card does NOT activate, costs 0 Energy, the card becomes **Locked** (greyed out, unplayable for the rest of this turn), and the enemy gains a buff tied to the question type failed
7. Player continues playing remaining unlocked cards until Energy runs out or they end their turn
8. All **Locked cards automatically unlock** at the start of the player's next turn and return to normal
9. **Enemy executes their full turn** — all queued actions resolve in sequence (see Enemy Turn System section)
10. Repeat until enemy HP = 0 (win) or player HP = 0 (lose)

**Critical question rule:** Questions used in a battle are tracked in a per-fight pool and **never repeated within the same fight**. Each question is removed from the pool once shown. If all questions for a card type are exhausted mid-fight, the pool silently resets for that fight only. Enforce minimum pool size: at least 10 unique questions per card type per floor tier.

---

### Energy System

- 3 Energy per turn, resets each turn
- Cards cost 1–3 Energy depending on rarity and effect
- **Wrong answers cost 0 Energy** but lock the card for the rest of this turn
- Hint system costs **1 Energy**
- Some relics modify Energy (e.g., gain 1 extra Energy on a correct answer streak)

---

### Card Types

#### VOCABULARY CARDS (Attack)
- Question: Translate a word from target language → English, or English → target language
- **Correct answer:** Deal damage to enemy
- **Wrong answer:** Card Locked this turn + enemy gains *Confusion* (+2 attack for 1 turn)
- Visual: Sword or strike icon, red/orange color palette

#### GRAMMAR CARDS (Defense)
- Question: Fix or complete a sentence (fill-in-the-blank or select the correct form)
- **Correct answer:** Gain Block (absorbs incoming damage)
- **Wrong answer:** Card Locked this turn + enemy gains *Conjugation Armor* (blocks grammar-type cards next turn)
- Visual: Shield icon, blue color palette

#### READING CARDS (Utility)
- Question: Read a short passage (2–4 sentences) and answer a comprehension question
- **Correct answer:** Heal HP, Stun enemy for 1 turn, or Draw 2 cards (varies by card)
- **Wrong answer:** Card Locked this turn + enemy gains *Fortify* (+5 max HP temporarily)
- Visual: Book or scroll icon, green/teal color palette

---

### Chain Combo System

- Playing a **Vocabulary card correctly** first primes a Grammar card played the same turn → Grammar card deals bonus damage equal to 50% of its block value
- Playing a **Grammar card correctly** first primes a Reading card played the same turn → Reading card utility effect is doubled
- **A wrong answer on a primed card breaks the chain entirely** — locked card cannot trigger or receive chain bonuses
- Chain resets at the start of each new turn
- Chain shown visually as a glowing line connecting played cards
- **"CHAIN ACTIVE"** indicator appears when a primer card is successfully played

---

### Question Answering

- Default: Multiple choice, 4 options
- Answer timer: 20 seconds per question (visible countdown bar)
- **Questions never repeat within the same battle**
- Floor 1–2: Timer is generous, options clearly distinct
- Floor 3–4: Timer pressure increases, wrong options more plausible
- Mastery Levels (post-game) can reduce options to 3

---

### Hint System

- Every question has a **"Reveal Hint"** button
- Costs **1 Energy**, shows:
  - Vocabulary → word in a short example sentence with translation
  - Grammar → incorrect part highlighted + one-line rule explanation
  - Reading → relevant passage sentence highlighted
- Player still must choose the correct answer themselves
- **Hints cannot be used on a Locked card**
- Hint usage tracked in post-run summary

---

## ENEMY TURN SYSTEM

The enemy turn is one of the most important systems in the game. It must feel threatening, readable, and fair. Players always know exactly what is coming — the challenge is surviving it with correct answers.

### Actions Per Turn by Enemy Tier

| Tier | Actions Per Turn | Notes |
|---|---|---|
| Regular enemy | 1 action | Simple, predictable — teaches the system |
| Elite enemy | 1–2 actions | Can attack AND debuff in the same turn |
| Boss Phase 1 | 2 actions | Pressure begins |
| Boss Phase 2 | 2–3 actions | Escalates mid-fight |
| Boss Phase 3+ | 3 actions | Full threat — forces efficient play |

When a boss phases up, action count increases immediately on the next enemy turn.

---

### Move Categories

| Icon | Category | What It Does |
|---|---|---|
| ⚔️ **Strike** | Direct damage | Flat damage reduced by player Block |
| 🌀 **Debuff** | Weaken player | Reduces card effectiveness, locks types, drains Energy |
| 🛡️ **Self-Buff** | Strengthen self | Gains armor, heals HP, powers up next attack |
| 💀 **Special** | Unique per enemy | Signature move tied to each enemy's language concept |

---

### Intent System — Full Transparency

Above every enemy, a clear **intent panel** shows exactly what is coming on their next turn. Updates at the end of each player turn.

The intent panel shows:
- Move **icon and name**
- **Exact damage number** for Strike moves
- **Exact effect description** for Debuffs and Buffs
- For multi-action enemies: **all queued moves shown left to right** with arrows between them

Example: ⚔️ Strike (18) → 🌀 Silence (Grammar) → 🛡️ Armor Up (+12)

---

### Debuff Move Definitions

**🔇 Silence** — Locks all cards of one specific type for 1 full turn. Shown as a status badge on the player's panel. Example: "Vocabulary cards Silenced — cannot play attack cards next turn."

**⚡ Drain** — Reduces player's starting Energy by 1 next turn (3 → 2). Duration: 1 turn.

**🌫️ Fog** — Hides the visual selection state on answer options. Timer still runs but options don't highlight on hover. Tests genuine knowledge vs. visual reliance. Duration: next 1 question.

**🔗 Bind** — Player draws 1 fewer card on their next draw phase (4 instead of 5). Duration: 1 turn.

**🔀 Confusion** — Shuffles the position of all 4 answer options once, 3 seconds after the timer starts. Tests whether the player knows the answer or is relying on muscle memory from option positioning. Duration: next 1 question.

---

### Self-Buff Move Definitions

**🛡️ Armor Up** — Enemy gains a flat damage reduction shield (e.g., absorbs next 8 damage). Shown as an armor bar beneath enemy HP. Only Vocabulary chain combos bypass it at full damage.

**💉 Recover** — Enemy heals a small portion of HP. Only available when enemy is below 50% HP. Forces players to push hard in the final phase.

**🔥 Power Up** — Enemy gains 1 Fury stack shown as flame icons. At 3 stacks, next Strike deals double damage. Stacks reset if player answers 3 consecutive questions correctly — fluency is the counter.

**👁️ Focus** — Enemy gains resistance to the player's most-used card type this fight. Punishes single-type spam, rewards varied decks.

---

### Special Moves (Per Enemy — Campaign Examples)

Every enemy has exactly one Special move tied to their language concept.

**Japanese — Oni Warrior (Floor 3)**
> 💀 *Demon Roar* — Forces the player to immediately answer a te-form question before their next turn begins. Not attached to any card — a pure language ambush. Wrong answer: Oni attacks twice next turn instead of once.

**Japanese — Kitsune Trickster (Floor 2)**
> 💀 *Fox Fire* — Swaps two of the player's hand cards with random cards from the discard pile.

**Korean — Rogue AI (Floor 3)**
> 💀 *System Override* — Rewrites the player's top 2 hand cards with random cards from the discard pile. Thematically: the AI is rewriting your program.

**Korean — Corporate Enforcer (Floor 2)**
> 💀 *Contract Clause* — If the player does not play at least 1 Grammar card on their next turn, they take 10 direct damage that ignores Block.

**Spanish — Jungle Colossus (Floor 3)**
> 💀 *Time Split* — Splits the next Strike across two turns: half damage this turn, half next turn regardless of Block applied. Block mitigates each half separately.

**Spanish — Jungle Spirit (Floor 2)**
> 💀 *Shapeshift* — Enemy transforms and swaps its vulnerability. If the player used Vocabulary cards to deal damage last turn, it becomes resistant to Vocabulary and vulnerable to Grammar.

---

### Boss Multi-Action Chains

Bosses telegraph their full action chain at the start of the player's turn. A player must plan their entire turn around the known incoming chain.

**Japanese Boss — The Mountain Spirit (三神)**
- HP: 300 | Phase triggers at 150 HP (Phase 2) and 50 HP (Phase 3)
- Phase 1 (2 actions): [Strike (14) + Self-Buff Armor Up] alternating with [Strike (14) + Debuff Confusion]
- Phase 2 (2–3 actions): [Strike (18) + Debuff Silence Grammar + Self-Buff Armor Up]
- Phase 3 (3 actions): Romanization removed regardless of character. [Strike (22) + Debuff Drain + Special Demon Roar]
- Pre-fight and defeat dialogue in Japanese with hover-to-translate. 2 response choices on defeat.

**Korean Boss — Chairman KANG**
- HP: 320 | Phase triggers at 200 HP and 80 HP
- Phase 1 (2 actions): [Strike (12) + Debuff Bind] → [Strike (12) + Self-Buff Focus]
- Phase 2 (2 actions): Locks one card type per turn as a passive. [Strike (16) + Debuff Silence rotating type]
- Phase 3 (3 actions): [Strike (20) + Debuff Drain + Special dual-language question ambush before player turn]

**Spanish Boss — La Guardiana del Tiempo**
- HP: 290 | Phase triggers at 180 HP and 60 HP
- Phase 1 (2 actions): [Strike (13) + Debuff Confusion] → [Strike (13) + Self-Buff Power Up]
- Phase 2 (2 actions + bonus): [Strike (17) + Debuff Bind] + bonus action spawns two mini-guardians (50 HP each)
- Phase 3 (3 actions): [Strike (20) + Debuff Drain + Special Time Loop — resets to Phase 1 HP once if player hasn't chained 3 combos]

---

### How Wrong Answers Feed Into the Enemy Turn

The enemy turn is the consequence delivery system for wrong answers. Timing:

1. Player answers wrong → card Locked immediately, enemy buff applied immediately (visible icon floats up)
2. Player finishes their turn
3. Enemy executes their telegraphed action chain **plus all accumulated wrong-answer buffs on top**

A player who answers two questions wrong in one turn faces a buffed enemy hitting them with a multi-action chain. Punishment compounds naturally. The player always saw it coming.

---

## DECK BUILDING

### Drafting
- After every combat, player is offered a **card draft**
- Pool size scales with fight accuracy:
  - 80%+ correct → choose 1 of 4 cards (includes chance of rare)
  - 60–79% → choose 1 of 3 (commons and uncommons)
  - Below 60% → choose 1 of 2 commons only
- Player can **skip** the draft

### Card Rarities
| Rarity | Color | Question Difficulty | Effect Strength | Draft Frequency |
|---|---|---|---|---|
| Common | Gray | Basic single-concept | Moderate | Very common |
| Uncommon | Blue | Two-concept combo | Strong | Occasional |
| Rare | Gold | Contextual / nuanced | Very strong | Rare |
| Story Rare | Red border | Campaign-world sentences | Unique effects | Boss rewards only |

### Starting Deck
Every character starts with 10 cards: 4 Vocabulary commons, 3 Grammar commons, 2 Reading commons, 1 character-specific starter rare.

### Deck Size
- No hard limit, but 20+ cards dilutes draws
- Merchants sell a "Condense" item — removes 2 duplicate commons for free

---

## CARD DESIGNS (Examples — build full sets of 60+ cards per campaign)

### Japanese Campaign — Sample Cards

**Strike (Vocabulary, Common, 1 Energy)**
> Q: What does 食べる (taberu) mean?
> Effect: Deal 8 damage. If correct with no hint used, deal 12.

**Ward (Grammar, Common, 1 Energy)**
> Q: Complete: 私は学校___行きます。
> Effect: Gain 8 Block.

**Spirit Scroll (Reading, Uncommon, 2 Energy)**
> Passage: 3-sentence story about a traveler at a shrine
> Q: Why did the traveler stop walking?
> Effect: Heal 10 HP and draw 1 card.

**Kanji Blade (Vocabulary, Rare, 2 Energy)**
> Q: What is the kanji for "mountain"?
> Effect: Deal 18 damage. If Block is active, deal 26.

**Yokai's Curse (Grammar, Story Rare, 3 Energy)**
> Q: Complete: 「お前は___が好きか？」
> Effect: Gain 20 Block. Stun enemy for 1 turn.

### Korean Campaign — Sample Cards

**Data Burst (Vocabulary, Common, 1 Energy)**
> Q: What does 안녕하세요 mean?
> Effect: Deal 8 damage.

**Firewall (Grammar, Common, 1 Energy)**
> Q: Select the correct verb form for: 나는 학교에 ___
> Effect: Gain 8 Block.

**Signal Tap (Reading, Uncommon, 2 Energy)**
> Passage: Intercepted corporate memo in Korean (3 sentences)
> Q: What is the memo's subject?
> Effect: Stun enemy for 1 turn and draw 2 cards.

### Spanish Campaign — Sample Cards

**Machete Strike (Vocabulary, Common, 1 Energy)**
> Q: What does "selva" mean?
> Effect: Deal 8 damage. Chain bonus: +4 if Grammar was played this turn.

**Jungle Guard (Grammar, Uncommon, 2 Energy)**
> Q: Fill in: Yo ___ (ir) al mercado mañana.
> Effect: Gain 14 Block.

**Ancient Reading (Reading, Rare, 2 Energy)**
> Passage: Inscription on ruins (3 sentences in Spanish)
> Q: What does the inscription warn against?
> Effect: Heal 15 HP. Add a free Vocabulary card to hand.

---

## ENEMIES (Full Roster)

### Floor 1 — Regular (1 action/turn)

**Japanese: Lost Spirit** HP 40 | ATK 6 | Concept: basic nouns
Intent pattern: Strike → Strike → Debuff Confusion → Strike → Strike

**Korean: Street Vendor** HP 35 | ATK 5 | Concept: greetings, numbers
Intent pattern: Strike → Self-Buff Power Up → Strike → Debuff Bind

**Spanish: Market Rival** HP 38 | ATK 6 | Concept: basic nouns, colors
Intent pattern: Strike → Strike → Debuff Confusion → Self-Buff Armor Up

### Floor 2 — Regular (1 action/turn + Special unlocked)

**Japanese: Kitsune Trickster** HP 65 | ATK 10 | Concept: particles
Special: Fox Fire (swaps 2 hand cards with discard)
Intent pattern: Strike → Special → Debuff Fog → Strike → Strike

**Korean: Corporate Enforcer** HP 70 | ATK 12 | Concept: verb conjugation
Special: Contract Clause (must play Grammar or take 10 damage)
Intent pattern: Special → Strike → Strike → Debuff Silence Grammar

**Spanish: Jungle Spirit** HP 60 | ATK 9 | Concept: ser vs estar
Special: Shapeshift (swaps vulnerability)
Intent pattern: Strike → Special → Self-Buff Recover → Strike

### Floor 3 — Regular (2 actions/turn)

**Japanese: Oni Warrior** HP 110 | ATK 18 | Concept: te-form
Special: Demon Roar (standalone question ambush)
Intent: [Strike + Power Up] → [Strike + Drain] → [Demon Roar + Strike]

**Korean: Rogue AI** HP 120 | ATK 16 | Concept: honorifics
Special: System Override (rewrites top 2 hand cards)
Intent: [Strike + Silence] → [System Override + Strike] → [Drain + Focus]

**Spanish: Jungle Colossus** HP 100 | ATK 15 | Concept: preterite vs imperfect
Special: Time Split (damage split across 2 turns)
Intent: [Time Split] → [Strike + Armor Up] → [Strike + Bind]

### Floor 4 — Elites (2 actions/turn)

**Japanese: Shrine Guardian** HP 150 | ATK 20 | Concept: mixed floors 1–3
Intent: [Strike + Armor Up] → [Silence + Strike] → [Special: summons Graveyard ghost every 3 turns]

**Korean: Executive** HP 160 | ATK 22 | Concept: complex sentence structure
Intent: [Contract Clause + Strike] → [Drain + Strike] → [Focus + Strike]

**Spanish: Temple Guardian** HP 145 | ATK 19 | Concept: subjunctive
Intent: [Confusion + Strike] → [Power Up + Strike] → [Special: reflects Vocabulary damage if player failed a Vocabulary card this turn]

### Bosses — Floor 4 Finals (multi-phase, see Boss section above for full action chains)

**The Mountain Spirit (三神)** HP 300 | Japanese | 3 phases
**Chairman KANG** HP 320 | Korean | 3 phases
**La Guardiana del Tiempo** HP 290 | Spanish | 3 phases

---

## MAP SYSTEM

### Map Layout
- Each floor: node map with 2–3 branching paths
- Node types shown with icons before committing
- Cannot revisit nodes

### Node Types
- ⚔️ **Combat** — standard fight, draft after
- 💀 **Elite** — harder fight, guaranteed Uncommon+ in draft, Relic on first clear
- 🔥 **Rest Site** — Heal (25% HP) OR Review (upgrade one Graveyard word's card)
- 🛒 **Merchant** — 3 cards, 2 relics, 1 consumable, Remove Card service
- ❓ **Event** — scripted NPC choice in target language, reward or minor penalty
- 💀 **Boss** — always at floor end, always preceded by rest site

### Random Event Examples

**Japanese — The Shrine Maiden's Riddle**
> 「あなたは何を求めているのですか？」
> A: 「知識を求めています。」→ Reading card upgrade
> B: 「力を求めています。」→ 10 gold

**Korean — The Vending Machine**
> 당신이 원하는 것을 선택하세요
> A: 커피 → Consumable item
> B: 물 → Heal 5 HP

**Spanish — Market Haggling**
> ¿Cuánto quieres pagar?
> A: Quiero pagar menos. → Follow-up grammar check, 30 gold reward
> B: Está bien, lo compro. → 15 gold, no follow-up

---

## RELICS

Player starts with 1 character-specific relic. Gain more from Elite fights, Merchants, boss clears.

### Starter Relics
**The Newcomer's Phrasebook** — Once per fight, the first wrong answer deals no enemy buff and does not lock the card.
**The Traveler's Compass** — After 3 correct answers in a row, gain 1 bonus Energy next turn.
**The Returnee's Old Notes** — Grammar cards show a faint hint for 2 seconds before the timer starts.

### General Relics
**Worn Dictionary** — Once per fight, reveal the answer on a Vocabulary card. That card deals half damage.
**Cracked Hourglass** — No time limit. Wrong answers give TWO enemy buffs (card still Locked).
**Scholar's Lens** — Grammar cards highlight the incorrect sentence part before the timer (+3 seconds).
**Chain Bracelet** — Chain combos extend in reverse: Grammar can also prime Vocabulary.
**Ghost Ink** — Once per run, a Graveyard word appears as a bonus question. Correct = free card upgrade.
**Merchant's Scale** — Merchant cards cost 20% less gold.
**Iron Will** — Below 20% HP, next 3 correct answers deal double damage.
**The Red Thread** — First Vocabulary card each turn auto-chains into the next Grammar card.
**Quicklock Key** — When a card is Locked by a wrong answer, gain 1 Energy as compensation.
**Second Chance Scroll** — Once per fight, spend 2 Energy to immediately unlock a Locked card.

---

## MISTAKE GRAVEYARD

A persistent tracker of every wrong answer, stored across all runs. Available from main menu and in-run journal.

- Every wrong answer logs: word/concept, question, correct answer, which run/floor
- Sorted by most recently wrong, most frequently wrong
- Each entry has a ★ counter — 3 correct answers = mastered, shown with green checkmark
- Optional haunting mode: wrong-answer words appear as ghost enemies (1 HP) on the map
- Ghost enemies ask only the one failed question. Defeating = 1 mastery progress. No gold, no cards.
- Japanese visual: stone lanterns with kanji | Korean: holographic markers in server room | Spanish: ofrenda altar

---

## JOURNAL SYSTEM

In-run journal accessible anytime via book icon in the corner.

**Words Tab** — all vocabulary activated this run, sorted by recency. Target word → translation → example sentence. ★ after 3 correct in a row.

**Grammar Tab** — all grammar concepts encountered, written as patterns not rules. One example sentence each.

Visual style: Japanese (washi paper, ink-brush) / Korean (digital notepad, neon) / Spanish (worn leather, watercolor)

---

## POST-RUN SUMMARY SCREEN

**1. What You Learned** — all new words and grammar rules with example sentences. Cards flip over as a reveal, not a list dump.

**2. Where You Struggled** — top 3 most missed questions: question → correct answer → one-line explanation of WHY. No judgment.

**3. Your Pattern** — generated label: "Strong at vocabulary, struggles with verb endings" / "Grammar specialist — expand your vocabulary next run." Subtle suggestion for next run.

**Win Screen additions:** first-time clear unlocks Mastery Level 1 + epilogue cutscene. Shows: accuracy %, hint count, gold earned, rarest card drafted, locked card count ("Cards locked by wrong answers: 7").

---

## MASTERY LEVEL SYSTEM

| Level | Rule | Learning Intent |
|---|---|---|
| 1 | Romanization removed for all cards | Forces real script reading |
| 2 | Multiple choice reduced to 3 options | Less guessing |
| 3 | One card per floor has no hints | Deep reading challenge |
| 4 | Timer reduced by 5 seconds | Fluency pressure |
| 5 | Enemy buffs on wrong answers doubled (card still Locked) | Accuracy over speed |
| 6 | Rest sites only offer Review — no Heal | Prioritizes learning |
| 7 | Merchant speaks only in target language — no hover translation | Full immersion |
| 8 | Graveyard haunting always ON | Face your weaknesses |
| 9 | Draft pools reduced by 1 card each tier | Tighter deck building |
| 10 | Final boss Phase 4: typed answers only, no multiple choice | True mastery test |

---

## IMMERSION SYSTEM — THREE-LAYER RULE

| Location | Target Language | Native Language |
|---|---|---|
| Combat — questions | All question text, word, sentences | Answer choices |
| Combat — cards | Card name and flavor text | Card effect description |
| Enemy names | Target language first | Native name smaller underneath |
| Map & Events | All NPC/event speech | Player choice options |
| Merchant | All merchant dialogue | Item descriptions |
| Boss cutscenes | All boss dialogue | Subtitle always available below |
| UI buttons | Native language | — |
| Journal | Both side by side | — |

**Hover-to-translate available on EVERY piece of target language text in the game.**

---

## STORY & NARRATIVE

**Japanese — The Mountain Pilgrimage:** A spirit apprentice climbs to prove themselves worthy of the Mountain Spirit's blessing. The Spirit is a gatekeeper, not a villain. The final boss dialogue is a conversation.

**Korean — The Corporate Ascent:** A young hacker infiltrates a corporate megastructure. Chairman KANG believes language barriers protect power. The player's fluency threatens that.

**Spanish — The Road to La Piedra Viva:** A traveler seeks a living stone that grants one wish. La Guardiana guards it because past seekers misused it. The final boss is about proving intent, not just skill.

**Boss defeat dialogue:** Short cutscene in target language, 2 response choices in target language. Correct response = bonus loot. All words hover-translatable.

---

## AUDIO DESIGN

### Music
- Japanese: shamisen, koto, shakuhachi with subtle electronic undertones
- Korean: lo-fi synthwave with traditional percussion
- Spanish: acoustic guitar, marimba, magical ambient pads
- Dynamic shifting: tension builds as enemy HP rises, softens when player is winning
- Boss fights: dedicated themes with phase transition stings

### Sound Effects
- Card draw: per type (Vocabulary = whoosh, Grammar = click, Reading = page turn)
- Correct answer: satisfying chime, campaign-specific variation
- Wrong answer + lock: low thud + brief lock click — never harsh
- Chain combo: layered chime building with each link
- Enemy turn start: distinct whoosh indicating enemy is acting
- Enemy buff applied: rising tone SFX per buff type
- Locked card interaction attempt: short shake + tooltip sound

---

## UI / UX DESIGN

### Combat Screen Layout
```
[Enemy portrait + name + HP + INTENT PANEL (full action chain)]    [Relic strip]

                      [Combat animation area]

[Player HP + Block + Status badges (debuffs, locked count)]        [Deck | Discard]

             [Hand of 5 cards — fanned display at bottom]
             [Locked cards: greyed out with lock icon overlay]

[End Turn]   [Hint (1 Energy)]   [Journal icon]   [Energy: ●●● 3/3]
```

### Card States
- **Default:** Normal display
- **Playable:** Glows softly based on card type color
- **Not enough Energy:** Grayed out, slightly transparent
- **Primed (chain ready):** Golden outline pulsing
- **Selected:** Lifted from hand, question prompt appears
- **Locked:** Fully greyed, lock icon overlaid, red border, cannot be selected

### Locked Card Behavior
- Locked cards remain visible in hand with a lock icon overlay
- Tapping a Locked card: brief shake animation + "Locked until next turn" tooltip
- Start of next turn: all Locked cards animate a brief "unlock" flash, return to normal

### Question Prompt UI
- Card rises to center of screen
- Question text in styled panel above
- 4 answer buttons below (A/B/C/D, always same positions)
- Timer bar across top (20 seconds)
- "Reveal Hint (1 Energy)" button in corner
- Correct: green flash, card activates with animation
- Wrong: red pulse, card snaps back with lock icon appearing, enemy buff floats up

---

## DATA STRUCTURE

### Question Bank Format (JSON)
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

### Enemy Schema (JSON)
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

### Player Run State (LocalStorage)
```json
{
  "run_id": "uuid",
  "campaign": "japanese",
  "character": "kenji",
  "floor": 2,
  "node": 4,
  "hp": 65,
  "max_hp": 80,
  "block": 0,
  "gold": 45,
  "energy": 3,
  "deck": ["jp_vocab_strike", "jp_gram_ward"],
  "hand": [],
  "locked_cards": [],
  "relics": ["travelers_compass"],
  "active_player_debuffs": [],
  "mastery_level": 0,
  "fight_question_pool_used": [],
  "session_mistakes": [{ "question_id": "jp_vocab_001", "wrong_at": "floor_1_node_2" }]
}
```

---

## QUESTION BANKS — MINIMUM VIABLE CONTENT

| Campaign | Vocabulary | Grammar | Reading | Total |
|---|---|---|---|---|
| Japanese | 120 | 80 | 40 passages | 240 |
| Korean | 120 | 80 | 40 passages | 240 |
| Spanish | 120 | 80 | 40 passages | 240 |

Floor tier distribution: Floor 1 = 25%, Floor 2 = 30%, Floor 3 = 30%, Floor 4 = 15%.
**Minimum 10 unique questions per card type per floor tier** to prevent in-fight pool exhaustion.

---

## CARD SETS — MINIMUM VIABLE CONTENT

Per campaign: 20 Vocabulary cards, 15 Grammar cards, 10 Reading cards, 3 Story Rare cards, 5 Curse cards.
Total per campaign: ~53 cards.

---

## ACCESSIBILITY

- Colorblind mode: card types differentiated by shape, not only color
- Font size toggle: Small / Medium / Large
- Timer toggle: Relaxed (30s) / Normal (20s) / Off
- Screen reader support: all question text and answers aria-labeled
- High contrast mode
- Answer options always at fixed A/B/C/D positions with keyboard shortcuts

---

## SETTINGS MENU

Spaced Repetition (Graveyard Haunting): ON/OFF | Timer Speed: Relaxed/Normal/Fast | Romanization: Always Show / Fade / Always Hide | Subtitles: ON/OFF/Auto | SFX Volume | Music Volume | UI Language | Card Animation Speed

---

## PHASED DEVELOPMENT PLAN

### Phase 1 — Core Loop
- Japanese only, Kenji only, Floors 1–2 only
- 30 vocab + 20 grammar + 10 reading questions
- 15 cards total
- **Full combat loop: locked card mechanic, no repeated questions per fight, full enemy turn system with all 4 move categories for floor 1–2 enemies**
- Basic drafting, rest site, merchant
- No relics, no events, no graveyard

### Phase 2 — Full Japanese Campaign
- All 3 characters, all 4 floors + boss
- Full 240-question bank, full 53-card set
- All room types, 8 relics, Graveyard, Journal, post-run summary
- **Full enemy turn system including boss multi-phase action chains**

### Phase 3 — All Campaigns
- Korean and Spanish campaigns
- Mastery Level system, full audio

### Phase 4 — Polish
- All Framer Motion animations, cutscene system
- Accessibility, mobile responsiveness

---

## WHAT MAKES THIS DIFFERENT

1. **The question IS the gameplay decision.** Players choose which card to play BECAUSE of what question they want to answer right now.
2. **Wrong answers are tactical problems.** Locked card + enemy buff creates real hand management decisions — not punishment for its own sake.
3. **The enemy turn is earned consequence.** Everything the player did wrong compounds into the enemy's action chain. The player always saw it coming.
4. **The language is everywhere.** Enemy names, merchant dialogue, card flavor text, story cutscenes — the player swims in it at all times.
5. **Momentum matters.** A fast, strategic, satisfying run beats a more "complete" one. Prioritize combat feel first.

---

*Build Ascendant.*