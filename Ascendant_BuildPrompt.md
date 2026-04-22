# Ascendant — Full Build Prompt
> Paste this entire document as your prompt into Antigravity to build the complete game.

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
- **State management:** Zustand or Redux
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

Each campaign has **3 playable characters** based on fluency level. The character selection screen IS the placement — no separate onboarding quiz.

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

**Character selection UI:** Show all three characters side by side with their fluency label, a brief personality description, and their starting deck card count breakdown. Player taps to select. No language tests, no popups — the choice is the test.

---

## CORE COMBAT LOOP

### Turn Structure
1. Player draws **5 cards** from their deck
2. Player has **3 Energy** per turn
3. Player selects a card to play → a **question prompt appears**
4. Player answers the question (multiple choice, 4 options default)
5. **Correct answer** → card activates at full effect, costs Energy as listed
6. **Wrong answer** → card does NOT activate, costs 0 Energy, but the **enemy gains a buff** tied to the question type they failed
7. Player continues playing cards until Energy runs out or they end their turn
8. Enemy attacks/applies its queued action
9. Repeat until enemy HP = 0 (win) or player HP = 0 (lose)

### Energy System
- 3 Energy per turn, resets each turn
- Cards cost 1–3 Energy depending on rarity and effect
- Hint system costs 1 Energy (see Hints section)
- Some relics modify Energy (e.g., gain 1 extra Energy on a correct answer streak)

### Card Types

#### VOCABULARY CARDS (Attack)
- Question: Translate a word from target language → English, or English → target language
- Effect on correct answer: Deal damage to enemy
- Wrong answer enemy buff: *Confusion* — enemy gains +2 attack for 1 turn
- Visual: Sword or strike icon, red/orange color palette

#### GRAMMAR CARDS (Defense)
- Question: Fix or complete a sentence (fill-in-the-blank or select the correct form)
- Effect on correct answer: Gain Block (absorbs incoming damage)
- Wrong answer enemy buff: *Conjugation Armor* — enemy blocks grammar-type cards next turn
- Visual: Shield icon, blue color palette

#### READING CARDS (Utility)
- Question: Read a short passage (2–4 sentences) and answer a comprehension question
- Effect on correct answer: Heal HP, Stun enemy for 1 turn, or Draw 2 cards (varies by card)
- Wrong answer enemy buff: *Fortify* — enemy gains +5 max HP temporarily
- Visual: Book or scroll icon, green/teal color palette

### Chain Combo System
- Playing a **Vocabulary card** first *primes* a Grammar card played the same turn → Grammar card deals bonus damage equal to 50% of its block value
- Playing a **Grammar card** first *primes* a Reading card played the same turn → Reading card's utility effect is doubled (heal twice as much, stun lasts 2 turns, draw 3 cards instead of 2)
- The chain resets at the start of each turn
- Chain is shown visually as a glowing line connecting cards in the play area
- A small "CHAIN ACTIVE" indicator appears when a primer card is played

### Question Answering
- **Default:** Multiple choice, 4 options
- **Answer timer:** 20 seconds per question (visible countdown bar)
- Floor 1–2: Timer is generous, 4 clearly distinct options
- Floor 3–4: Timer pressure increases, wrong options are more plausible
- Mastery Levels (post-game) can reduce options to 3

### Hint System
- Every question has a **"Reveal Hint" button**
- Tapping it costs **1 Energy** and shows:
  - Vocabulary card → the word used in a short example sentence with translation
  - Grammar card → the incorrect part of the sentence is highlighted + one-line rule explanation
  - Reading card → the relevant sentence in the passage is highlighted
- Player still has to choose the correct answer themselves
- Hint usage is tracked in the post-run summary

---

## DECK BUILDING

### Drafting
- After every combat (including regular enemies), player is offered a **card draft**
- Draft pool size and quality scales with accuracy:
  - 80%+ correct answers → choose 1 of 4 cards (includes chance of rare)
  - 60–79% → choose 1 of 3 cards (commons and uncommons)
  - Below 60% → choose 1 of 2 commons only
- Player can **skip** the draft (no penalty, just no new card)

### Card Rarities
| Rarity | Color | Question Difficulty | Effect Strength | Draft Frequency |
|---|---|---|---|---|
| Common | Gray | Basic single-concept | Moderate | Very common |
| Uncommon | Blue | Two-concept combo | Strong | Occasional |
| Rare | Gold | Contextual / nuanced | Very strong | Rare |
| Story Rare | Red border | Campaign-world sentences | Unique effects | Boss rewards only |

### Starting Deck
Every character starts with 10 cards:
- 4 Vocabulary commons (attack)
- 3 Grammar commons (defense)
- 2 Reading commons (utility)
- 1 character-specific starter rare

### Deck Size
- No hard limit, but drafting more than 20 cards starts to dilute draws
- Merchants sell a "Condense" item that removes 2 duplicate commons from the deck for free

---

## CARD DESIGNS (Examples — build full sets of 60+ cards per campaign)

### Japanese Campaign — Sample Cards

**Strike (Vocabulary, Common, 1 Energy)**
> Question: What does 食べる (taberu) mean?
> Effect: Deal 8 damage. If correct on first try, deal 12.

**Ward (Grammar, Common, 1 Energy)**
> Question: Complete the sentence: 私は学校___行きます。
> Effect: Gain 8 Block.

**Spirit Scroll (Reading, Uncommon, 2 Energy)**
> Passage: Short 3-sentence story about a traveler at a shrine
> Question: Why did the traveler stop walking?
> Effect: Heal 10 HP and draw 1 card.

**Kanji Blade (Vocabulary, Rare, 2 Energy)**
> Question: What is the kanji for "mountain"?
> Effect: Deal 18 damage. If you have Block active, deal 26.

**Yokai's Curse (Grammar, Story Rare, 3 Energy)**
> Question: The yokai speaks: 「お前は___が好きか？」— complete its sentence.
> Effect: Gain 20 Block. The yokai is Stunned for 1 turn.

### Korean Campaign — Sample Cards

**Data Burst (Vocabulary, Common, 1 Energy)**
> Question: What does 안녕하세요 mean?
> Effect: Deal 8 damage.

**Firewall (Grammar, Common, 1 Energy)**
> Question: Correct this sentence: 나는 학교에 갔습니다 (select the correct verb form)
> Effect: Gain 8 Block.

**Signal Tap (Reading, Uncommon, 2 Energy)**
> Passage: Intercepted corporate memo in Korean (3 sentences)
> Question: What is the memo's subject?
> Effect: Stun enemy for 1 turn and draw 2 cards.

### Spanish Campaign — Sample Cards

**Machete Strike (Vocabulary, Common, 1 Energy)**
> Question: What does "selva" mean?
> Effect: Deal 8 damage. Chain bonus: +4 if Grammar card was played this turn.

**Jungle Guard (Grammar, Uncommon, 2 Energy)**
> Question: Fill in: Yo ___ (ir) al mercado mañana.
> Effect: Gain 14 Block.

**Ancient Reading (Reading, Rare, 2 Energy)**
> Passage: Inscription found on ruins (3 sentences in Spanish)
> Question: What does the inscription warn against?
> Effect: Heal 15 HP. Add a free Vocabulary card to your hand.

---

## ENEMIES

### Enemy Design Principles
- Every enemy is tied to a **specific language concept** — its attacks and buffs relate to what it teaches
- Enemies **telegraph their next action** with a visible icon showing what type of question will come next turn
- Enemy HP, damage, and buff strength scale across floors

### Enemy Intent Icons
Display clearly above enemy each turn:
- 📖 = Vocabulary question incoming (prepare attack cards)
- ✏️ = Grammar question incoming (prepare defense cards)
- 📜 = Reading question incoming (prepare utility cards)
- 💢 = Enemy attacking directly this turn (no question, just raw damage)
- 🌀 = Enemy applying a debuff this turn

### Floor 1 Enemies (Beginner)

**Japanese: Lost Spirit**
- HP: 40 | Attack: 6
- Concept: Basic hiragana vocabulary (nouns only)
- Intent: Always telegraphs one turn ahead
- Buff on player wrong answer: Gains Confusion (+2 ATK for 1 turn)

**Korean: Street Vendor**
- HP: 35 | Attack: 5
- Concept: Basic greetings and numbers
- Intent: Alternates between attack and vocabulary challenge turns

**Spanish: Market Rival**
- HP: 38 | Attack: 6
- Concept: Basic nouns and colors
- Intent: Attacks if player skips grammar cards

### Floor 2 Enemies (Elementary)

**Japanese: Kitsune Trickster**
- HP: 65 | Attack: 10
- Concept: Particles (は, が, を, に, で)
- Special: If player fails a particle question twice in a row, draws a Curse into player deck
- Intent: Mixes vocabulary + grammar questions in same fight

**Korean: Corporate Enforcer**
- HP: 70 | Attack: 12
- Concept: Present tense verb conjugation
- Special: Conjugation Armor — if player fails grammar, blocks all grammar cards next turn

**Spanish: Jungle Spirit**
- HP: 60 | Attack: 9
- Concept: Ser vs Estar
- Special: Shapeshifts between two forms if player confuses the two verbs

### Floor 3 Enemies (Intermediate)

**Japanese: Oni Warrior**
- HP: 110 | Attack: 18
- Concept: Te-form and casual conjugation
- Special: Each turn gains 1 stack of Fury; at 3 stacks, attacks twice. Stacks reset if player answers 3 questions correctly in a row.

**Korean: Rogue AI**
- HP: 120 | Attack: 16
- Concept: Honorifics and speech levels
- Special: Switches between formal and casual mode mid-fight; questions change type based on mode

**Spanish: Jungle Colossus**
- HP: 100 | Attack: 15
- Concept: Preterite vs Imperfect past tenses
- Special: Two heads — each represents one past tense. Defeating one buffs the other.

### Floor 4 Elites (Pre-Boss)

**Japanese: Shrine Guardian**
- HP: 150 | Attack: 20
- Concept: Mixed topics from floors 1–3
- Special: Every 3 turns, summons a ghost from the player's Mistake Graveyard

**Korean: Executive**
- HP: 160 | Attack: 22
- Concept: Complex sentence structure
- Special: Has a "Contract" mechanic — player must answer one question each turn or take 15 damage

**Spanish: Temple Guardian**
- HP: 145 | Attack: 19
- Concept: Subjunctive mood introduction
- Special: Reflects player attack cards back as damage if player fails a vocabulary question while attacking

### Bosses (Floor 4 Finals)

**Japanese Boss: The Mountain Spirit (三神)**
- HP: 300 | Phase 1 HP: 300 → Phase 2 triggers at 150 HP
- Phase 1: Vocabulary and particle focus — tests floors 1–2 content
- Phase 2: Transforms, gains an armor that only breaks if player uses a Chain Combo
- Phase 3 (at 50 HP): Speaks only in hiragana/kanji, no romanization regardless of character choice
- Pre-fight dialogue: In Japanese with hover-to-translate (3–4 lines)
- Defeat dialogue: In Japanese — player gets 2 response choices, correct choice gives bonus loot

**Korean Boss: Chairman KANG**
- HP: 320
- Phase 1: Attacks with debuffs — reduces player hand size by 1
- Phase 2: Forces player to use only Grammar cards (locks others)
- Phase 3: Dual-language mode — questions mix formal and casual Korean in same sentence
- Dialogue: Corporate speech patterns throughout

**Spanish Boss: La Guardiana del Tiempo**
- HP: 290
- Phase 1: Past tense gauntlet — alternates preterite/imperfect each turn
- Phase 2: Summons two mini-guardians (50 HP each) that ask simultaneous questions
- Phase 3: Time loop — resets to Phase 1 HP once if player hasn't chained 3 correct combos
- Dialogue: Magical realism flavor, written in Spanish throughout fight

---

## MAP SYSTEM

### Map Layout
- Each floor has a **node map** (like Slay the Spire)
- Player sees 2–3 branching paths from their current position
- Node types are shown with icons before committing to a path
- Cannot revisit nodes

### Node Types

**⚔️ Combat — Regular Enemy**
- Standard fight, draft after
- Most common node on floors 1–2

**💀 Elite Enemy**
- Harder fight with mixed question types
- Guaranteed Uncommon or higher card in draft
- Grants a Relic on first clear per campaign

**🔥 Rest Site**
- Player chooses ONE of two options:
  - **Heal** — restore 25% of max HP
  - **Review** — open Mistake Graveyard, pick one failed word to study; that word's card gets upgraded (deals +3 damage or +3 block permanently for this run)

**🛒 Merchant**
- Sells 3 random cards (1 Common, 1 Uncommon, 1 Rare)
- Sells 2 random relics
- Sells 1 consumable item
- Has 1 "Remove Card" service (costs gold, removes a card from deck permanently)
- Merchant speaks in target language with hover-to-translate on all dialogue
- Currency: Gold earned from combat (10–30 per fight based on accuracy)

**❓ Random Event**
- Scripted mini-stories with a language-based choice
- Player chooses between 2 options written in the target language
- Correct/good choice → reward (card, gold, or HP restore)
- Wrong/bad choice → minor penalty (lose small HP or add a Doubt card to deck)

**💀 Boss Node**
- Always at end of each floor
- Always preceded by a rest site node (guaranteed)

### Random Event Examples

**Japanese — The Shrine Maiden's Riddle**
> A shrine maiden blocks your path. She speaks: 「あなたは何を求めているのですか？」
> Option A: 「知識を求めています。」
> Option B: 「力を求めています。」
> (Both are grammatically valid. The "correct" answer for reward is A — thematically fits the learning journey)
> Reward: Gain a random Reading card upgrade

**Korean — The Vending Machine**
> A glitching vending machine shows: 당신이 원하는 것을 선택하세요
> Option A: 커피 (coffee)
> Option B: 물 (water)
> The machine dispenses based on which word you recognize and pick
> Reward: Consumable item

**Spanish — Market Haggling**
> A vendor calls out: ¿Cuánto quieres pagar?
> Option A: Quiero pagar menos. (I want to pay less)
> Option B: Está bien, lo compro. (That's fine, I'll buy it)
> Choosing A correctly triggers a follow-up grammar check
> Reward: 30 gold vs 15 gold

---

## RELICS

Relics are passive items that modify the run. Player starts with 1 (character-specific). Gain more from Elite fights, Merchants, and boss clears.

### Starter Relics (one per character archetype)

**The Newcomer's Phrasebook** — Once per fight, the first wrong answer of the fight deals no enemy buff. "You're just getting started."

**The Traveler's Compass** — After 3 correct answers in a row, gain 1 bonus Energy next turn.

**The Returnee's Old Notes** — Grammar cards show a faint memory hint (previous example sentence) for 2 seconds before the question starts. Cannot be turned off.

### General Relics (found during runs)

**Worn Dictionary**
> Effect: Once per fight, tap to reveal the answer on a Vocabulary card — but that card deals half damage.
> Flavor: The pages are worn from use.

**Cracked Hourglass**
> Effect: No time limit on questions. Wrong answers give the enemy TWO buffs instead of one.
> Flavor: Time is infinite. So are consequences.

**Scholar's Lens**
> Effect: Grammar cards always highlight the incorrect part of the sentence before the question timer starts (+3 seconds).
> Flavor: Belonging to someone who passed these halls before.

**Chain Bracelet**
> Effect: Chain combos can now extend — Grammar can also prime Vocabulary cards (reverse chain direction).
> Flavor: Links that bind and connect.

**Ghost Ink**
> Effect: Once per run, a Mistake Graveyard word appears as a bonus question between two nodes. Answer it correctly to gain a free card upgrade.
> Flavor: They never truly leave.

**Merchant's Scale**
> Effect: Cards bought from the Merchant cost 20% less gold.
> Flavor: Know your worth.

**Iron Will**
> Effect: When HP drops below 20%, the next 3 correct answers deal double damage.
> Flavor: Desperation sharpens the mind.

**The Red Thread**
> Effect: The first Vocabulary card played each turn automatically chains into the next Grammar card regardless of order.
> Flavor: An unbreakable connection between meaning and structure.

---

## MISTAKE GRAVEYARD

### What It Is
A persistent tracker of every question the player has answered wrong, stored across all runs. Available from the main menu and as an in-run journal tab.

### How It Works
- Every wrong answer logs: the word/grammar concept, the question asked, the correct answer, and which run/floor it happened on
- Entries are sorted by most recently wrong, most frequently wrong
- Each entry has a small ★ counter that fills as the player answers it correctly in future runs (needs 3 correct answers to be "mastered")
- Mastered words get a green checkmark — they stay in the graveyard forever as a record of growth

### Graveyard Haunting (Optional Toggle)
- When enabled, words from the Mistake Graveyard occasionally **reappear as ghost enemies** on the map
- Ghost enemies are wispy, semi-transparent versions of past enemies
- They only ask the one question the player got wrong
- Defeating a ghost enemy permanently marks that word as "haunting cleared" (counts as one correct answer toward mastery)
- Ghost enemies drop no gold, no cards — only mastery progress

### Visual Design
- The Graveyard screen looks like a stylized cemetery/memorial wall themed to each campaign world
- Japanese: Stone lanterns with kanji carved on them
- Korean: Holographic grave markers in a server room
- Spanish: Colorful ofrenda (Day of the Dead altar) style

---

## JOURNAL SYSTEM

### In-Run Journal
Accessible anytime via a small book icon in the corner. Two tabs:

**Words Tab**
- Every vocabulary card the player has activated this run
- Sorted by most recently encountered
- Shows: target language word → English translation → example sentence
- Words answered correctly 3 times in a row this run show a ★

**Grammar Tab**
- Every grammar concept encountered this run
- Written as a simple pattern, not a textbook rule
- Example: instead of "The て-form is used for..." show "食べて + います = currently eating"
- One example sentence per entry

### Journal Visual Style
The journal looks like a hand-drawn traveler's notebook matching each campaign:
- Japanese: Ink-brush style, washi paper texture
- Korean: Digital notepad, neon highlights on dark background
- Spanish: Worn leather journal, watercolor illustrations

---

## POST-RUN SUMMARY SCREEN

Shown after every run (win or lose). Three sections:

### 1. What You Learned
- All new words and grammar rules encountered this run
- Each shown with their example sentence one final time
- Presented as cards flipping over, not a list dump

### 2. Where You Struggled
- Top 3 most missed questions from this run
- Shows: the question → the correct answer → a one-line explanation of WHY
- No judgment in tone. "Here's what tripped you up." framing.

### 3. Your Pattern
- A generated label based on performance data:
  - "Strong at vocabulary, struggles with verb endings"
  - "Great accuracy early, lost focus in floor 3"
  - "Grammar specialist — expand your vocabulary next run"
- This label subtly suggests which character to try next or which card types to prioritize

### Win Screen Additions
- If it's a first-time campaign clear: unlock Mastery Level 1 and show a short campaign epilogue cutscene
- Boss defeat replayed with the story dialogue
- Total accuracy percentage, hint usage count, gold earned, rarest card drafted

---

## MASTERY LEVEL SYSTEM (Post-Game Replayability)

Unlocked after first clear of any campaign. Inspired by Slay the Spire's Ascension system.

Each Mastery Level adds one permanent modifier to the campaign. Layers stack — Mastery 3 includes rules from 1, 2, and 3.

| Mastery Level | Rule Added | Learning Intent |
|---|---|---|
| 1 | Romanization completely removed for all cards | Forces real script reading |
| 2 | Multiple choice options reduced from 4 to 3 | Less guessing, more recall |
| 3 | One random card per floor is presented in full target script with no hints available | Deep reading challenge |
| 4 | Answer timer reduced by 5 seconds | Fluency pressure |
| 5 | Enemy buffs on wrong answers are doubled | Accuracy over speed |
| 6 | Rest sites no longer offer Heal — only Review | Prioritizes learning over survival |
| 7 | Merchant speaks only in target language — no hover translation | Full immersion |
| 8 | Mistake Graveyard haunting is always ON and cannot be disabled | Face your weaknesses |
| 9 | Draft pools are reduced by 1 card each tier | Tighter deck building |
| 10 | Final boss has an additional Phase 4 — all questions are typed answers (no multiple choice) | True mastery test |

Mastery Levels are tracked per campaign, per character. Clearing Mastery 10 with all 3 characters in a campaign unlocks a cosmetic "Master" badge for that language.

---

## IMMERSION SYSTEM — THREE-LAYER RULE

Apply this rule consistently across the entire game:

| Location | Target Language | Native Language |
|---|---|---|
| Combat — questions | All question text, word being asked, sentences | Answer choices labeled in native language |
| Combat — cards | Card name and flavor text in target language | Card effect description in native language |
| Enemy names | Target language name shown first | Native language name shown smaller underneath |
| Map & Event dialogue | All NPC/event speech | Player's choice options in native language |
| Merchant | All merchant dialogue | Item descriptions in native language |
| Boss cutscenes | All boss dialogue | Subtitle always available one line below |
| UI buttons | Native language | — |
| Journal | Both side by side | — |

**Hover-to-translate is available on EVERY piece of target language text in the game.** Players tap/hover any foreign text to see the translation. This is non-intrusive — the translation appears in a small tooltip, not replacing the original text.

---

## STORY & NARRATIVE

### Narrative Delivery
- No walls of text
- Story is delivered through: enemy dialogue, boss cutscenes, event scripts, and merchant conversations
- Each floor has 1 key story beat (not combat-related) — a short cutscene or NPC encounter that advances the world

### Campaign Story Outlines

**Japanese — The Mountain Pilgrimage**
> A spirit apprentice climbs the shrine mountain to prove themselves worthy of the Mountain Spirit's blessing. Each floor they encounter yokai who test their knowledge and character. The Mountain Spirit at the summit is not a villain — it is a gatekeeper. Only the worthy may pass. The final boss dialogue is a conversation, not a battle cry.

**Korean — The Corporate Ascent**
> A young hacker infiltrates a corporate megastructure to expose a conspiracy. Each floor is a different corporate division with its own faction and language-based security system. Chairman KANG is not purely evil — he believes language barriers protect power, and the player's fluency threatens that. His defeat dialogue explores this tension.

**Spanish — The Road to La Piedra Viva**
> A traveler follows a map through magical Latin America toward a living stone that is said to grant a single wish. The road is the journey — each floor is a different region with its own culture and dialect flavor. La Guardiana del Tiempo guards the stone because she has watched too many seekers use the wish selfishly. The final boss is about proving intent, not just skill.

### Boss Defeat Dialogue Mechanic
After defeating each boss, a short cutscene plays with 3–5 lines of boss dialogue in the target language. At the end, player is given **2 response options** — both written in the target language.

- The "correct" response (thematically fitting) gives bonus loot and the best ending variant
- The "wrong" response gives no bonus but is still acknowledged by the boss
- Players can hover any word in the dialogue or choices to translate

---

## AUDIO DESIGN

### Music
- Each campaign has its own ambient soundtrack
- Japanese: traditional instruments (shamisen, koto, shakuhachi) with subtle electronic undertones
- Korean: lo-fi synthwave with traditional percussion
- Spanish: acoustic guitar, marimba, with magical ambient pads

- Music shifts dynamically during combat: tension builds when enemy HP is high, softens when player is winning
- Boss fights have dedicated battle themes with phase transitions

### Sound Effects
- Card draw: distinct sound per card type (Vocabulary = whoosh, Grammar = click, Reading = page turn)
- Correct answer: satisfying chime, slightly different per language campaign
- Wrong answer: low thud, not harsh — never punishing-sounding
- Chain combo activation: layered chime building with each chain link
- Level up / boss clear: triumphant, culturally themed fanfare
- Merchant shop: ambient market sounds per campaign world

---

## UI / UX DESIGN

### Combat Screen Layout
```
[Enemy portrait + name + HP bar + intent icon]      [Relic strip — horizontal row]

                    [Combat area — animations play here]

[Player HP + Block]                                  [Deck count | Discard count]

           [Hand of 5 cards — fanned display at bottom]

[End Turn button]   [Hint (costs 1 Energy)]   [Journal icon]   [Energy: 3/3]
```

### Card Visual Design
Each card shows:
- Card name (in target language, smaller English underneath)
- Card type icon (sword / shield / book)
- Energy cost (top left)
- Rarity gem (top right)
- Flavor text (2–3 words in target language at bottom)
- Effect description (in native language, clear and brief)
- A small illustration matching campaign world aesthetic

### Card States
- **Default:** Normal display
- **Playable:** Glows softly based on card type color
- **Not enough Energy:** Grayed out, slightly transparent
- **Primed (chain ready):** Golden outline pulsing
- **Selected:** Lifted slightly from hand, question prompt appears above

### Question Prompt UI
When a card is selected:
- Card rises to center of screen
- Question text appears clearly above the card in a styled panel
- 4 answer options appear as buttons below (styled per campaign)
- Timer bar runs across the top of the prompt (20 seconds)
- "Reveal Hint (1 Energy)" button sits in corner, small but accessible
- Correct answer: Green flash, card activates with animation
- Wrong answer: Red pulse, card returns to hand, enemy buff icon floats up

### Main Menu
- Campaign select as three large illustrated panels (Japanese / Korean / Spanish)
- Each panel shows campaign world art with ambient animation (falling cherry blossoms, neon rain, fireflies)
- On hover: panel expands slightly, shows campaign tagline in target language
- Options: New Run, Continue, Mistake Graveyard, Settings, Mastery Records

---

## DATA STRUCTURE

### Question Bank Format (JSON)
```json
{
  "id": "jp_vocab_001",
  "campaign": "japanese",
  "floor": 1,
  "type": "vocabulary",
  "question": "What does 食べる (taberu) mean?",
  "options": ["To eat", "To drink", "To sleep", "To walk"],
  "correct": 0,
  "hint": "Used in: 私は寿司を食べる — I eat sushi.",
  "graveyard_label": "食べる (taberu)",
  "tags": ["verb", "basic", "food"]
}
```

### Card Definition Format (JSON)
```json
{
  "id": "jp_vocab_strike",
  "name_target": "斬撃",
  "name_native": "Strike",
  "type": "vocabulary",
  "rarity": "common",
  "energy_cost": 1,
  "effect": { "damage": 8, "bonus_first_try": 4 },
  "question_pool": ["jp_vocab_001", "jp_vocab_002", "jp_vocab_003"],
  "flavor": "切る。",
  "campaign": "japanese",
  "upgradeable": true,
  "upgraded_effect": { "damage": 11, "bonus_first_try": 5 }
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
  "gold": 45,
  "deck": ["jp_vocab_strike", "jp_gram_ward", "..."],
  "relics": ["travelers_compass", "worn_dictionary"],
  "mastery_level": 0,
  "graveyard_session": [{ "question_id": "jp_vocab_001", "wrong_at": "floor_1_node_2" }]
}
```

---

## QUESTION BANKS — MINIMUM VIABLE CONTENT

Build at minimum the following question counts before launch:

| Campaign | Vocabulary | Grammar | Reading | Total |
|---|---|---|---|---|
| Japanese | 120 questions | 80 questions | 40 passages | 240 |
| Korean | 120 questions | 80 questions | 40 passages | 240 |
| Spanish | 120 questions | 80 questions | 40 passages | 240 |

Questions should be organized by floor tier:
- Floor 1 (25% of bank): Absolute beginner — basic nouns, greetings, simple present
- Floor 2 (30% of bank): Elementary — common verbs, basic grammar patterns, simple sentences
- Floor 3 (30% of bank): Pre-intermediate — tense variation, particles/conjunctions, longer sentences
- Floor 4 (15% of bank): Intermediate — mixed concepts, contextual reading, nuanced grammar

---

## CARD SETS — MINIMUM VIABLE CONTENT

Per campaign, build:
- 20 Vocabulary cards (10 Common, 6 Uncommon, 4 Rare)
- 15 Grammar cards (8 Common, 5 Uncommon, 2 Rare)
- 10 Reading cards (5 Common, 3 Uncommon, 2 Rare)
- 3 Story Rare cards (boss rewards only)
- 5 Curse/Debuff cards (added to deck by enemies or events, all upgradeable to remove)

Total per campaign: ~53 cards

---

## ACCESSIBILITY

- **Colorblind mode:** Card type differentiated by icon shape, not just color
- **Font size toggle:** Small / Medium / Large for all question text
- **Timer toggle:** Can set timer to Relaxed (30s), Normal (20s), or Off in Settings
- **Screen reader support:** All question text and answer options labeled with aria attributes
- **High contrast mode:** For UI elements
- **Answer option layout:** Options always in same position (A/B/C/D) with keyboard shortcuts

---

## SETTINGS MENU

- **Spaced Repetition (Mistake Graveyard Haunting):** Toggle ON/OFF
- **Timer Speed:** Relaxed / Normal / Fast
- **Romanization:** Always Show / Fade Progressively / Always Hide (overrides character setting)
- **Subtitles:** Always ON / Always OFF / Auto (shows on hover)
- **SFX Volume**
- **Music Volume**
- **Language of UI:** English / [target language] (advanced toggle)
- **Card Animation Speed:** Normal / Fast / Instant

---

## PHASED DEVELOPMENT PLAN

### Phase 1 — Core Loop (Build First)
- Single campaign: Japanese
- Single character: The Traveler (Kenji)
- 2 floors only
- 30 vocabulary questions, 20 grammar questions, 10 reading passages
- 15 cards total
- Basic combat loop, drafting, one rest site and one merchant
- No relics, no events, no graveyard

### Phase 2 — Full Campaign
- All 3 characters for Japanese
- All 4 floors + boss
- Full question bank (240 questions)
- Full card set (53 cards)
- All room types (events, merchant, rest sites)
- 8 relics
- Mistake Graveyard
- Post-run summary screen

### Phase 3 — All Campaigns
- Korean and Spanish campaigns
- Mastery Level system
- Full journal system
- Full audio implementation

### Phase 4 — Polish
- All animations and transitions
- Full narrative/cutscene implementation
- Accessibility features
- Mobile responsiveness

---

## WHAT MAKES THIS DIFFERENT

Do not let any feature drift into making this feel like Duolingo with a combat skin. The design philosophy is:

1. **The question IS the gameplay decision** — not a gate in front of it. Players choose which card to play BECAUSE of what question they want to answer right now.
2. **Wrong answers are tactical problems**, not failures. The enemy buff they cause must be visible, understandable, and recoverable.
3. **The language is everywhere**, not just in question boxes. Enemy names, merchant dialogue, card flavor text, story cutscenes — the player is swimming in the language, not just tested on it.
4. **Momentum matters.** A run that feels fast, strategic, and satisfying beats one that is more "complete." Prioritize the combat feel first. Everything else serves the combat.

---

*Build Ascendant.*
