const fs = require('fs');
const path = require('path');

const relicsPath = path.join(__dirname, '../src/data/japanese/relics.json');
const enemiesPath = path.join(__dirname, '../src/data/japanese/enemies.json');

let relics = JSON.parse(fs.readFileSync(relicsPath, 'utf8'));
if (!relics.some(r => r.id === 'fox_mask')) {
  relics.push({
    id: "fox_mask",
    name: "Fox Mask",
    name_target: "狐のお面",
    description: "Start each fight with 10 Block.",
    flavor: "A lingering protection from the trickster spirit.",
    trigger: "on_fight_start",
    effect: { type: "gain_block", amount: 10 },
    source: "merchant",
    campaign: "japanese",
    icon: "🦊",
    uses_per_fight: -1
  });
}
if (!relics.some(r => r.id === 'lucky_coin')) {
  relics.push({
    id: "lucky_coin",
    name: "Lucky Coin",
    name_target: "幸運の硬貨",
    description: "Gain 15 extra Gold from every combat victory.",
    flavor: "It always lands on heads.",
    trigger: "on_combat_victory",
    effect: { type: "bonus_gold", amount: 15 },
    source: "merchant",
    campaign: "all",
    icon: "🪙",
    uses_per_fight: -1
  });
}
fs.writeFileSync(relicsPath, JSON.stringify(relics, null, 2));

let enemies = JSON.parse(fs.readFileSync(enemiesPath, 'utf8'));
const newEnemies = [
  {
    id: "jp_tengu_warrior",
    campaign: "japanese",
    floor: 3,
    tier: "regular",
    name_target: "天狗の武者",
    name_native: "Tengu Warrior",
    hp: 85,
    base_attack: 12,
    actions_per_turn: 2,
    silence_type: "vocabulary",
    concept_tags: ["verb", "movement"],
    intent_pattern: [ ["strike", "strike"], ["self_buff_armor_up", "strike"], ["debuff_silence", "strike"] ],
    wrong_answer_buffs: {
      vocabulary: { type: "confusion", attack_bonus: 2, duration_turns: 1 },
      grammar: { type: "confusion", attack_bonus: 2, duration_turns: 1 },
      reading: { type: "fortify", hp_bonus: 5, duration_turns: 2 }
    },
    special_ability: null,
    portrait: null,
    portrait_placeholder_color: "#4a1a1a",
    defeat_sfx: "tengu_defeat",
    defeat_dialogue: "見事だ…",
    defeat_dialogue_translation: "Magnificent..."
  },
  {
    id: "jp_tengu_lord",
    campaign: "japanese",
    floor: 3,
    tier: "boss",
    name_target: "天狗の王",
    name_native: "Tengu Lord",
    hp: 220,
    base_attack: 16,
    actions_per_turn: 3,
    silence_type: "grammar",
    concept_tags: ["verb", "grammar", "reading"],
    intent_pattern: [ ["strike", "strike", "debuff_drain"], ["self_buff_power_up", "strike", "strike"], ["debuff_fog", "strike", "debuff_silence"] ],
    wrong_answer_buffs: {
      vocabulary: { type: "confusion", attack_bonus: 3, duration_turns: 1 },
      grammar: { type: "conjugation_armor", attack_bonus: 2, duration_turns: 1 },
      reading: { type: "fortify", hp_bonus: 10, duration_turns: 2 }
    },
    phases: [
      { phase: 1, hp_threshold: 220, description: "Aggressive strikes" },
      { phase: 2, hp_threshold: 110, description: "Gains massive attack boost", on_enter: "add_fury_3" }
    ],
    special_ability: {
      id: "wind_stance",
      name: "Wind Stance",
      description: "In Phase 2, gains 3 Fury stacks instantly.",
      trigger: "on_phase_2_start",
      effect: "add_fury_3"
    },
    portrait: null,
    portrait_placeholder_color: "#5a0a0a",
    defeat_sfx: "boss_dissolve",
    pre_fight_dialogue: [ { line: "風に逆らうか。", translation: "Will you defy the wind?" } ],
    defeat_dialogue: [ { line: "風が…止む…", translation: "The wind...stops..." } ]
  },
  {
    id: "jp_dragon_spirit",
    campaign: "japanese",
    floor: 4,
    tier: "boss",
    name_target: "龍神",
    name_native: "Dragon Spirit",
    hp: 350,
    base_attack: 20,
    actions_per_turn: 3,
    silence_type: "reading",
    concept_tags: ["reading", "advanced", "grammar"],
    intent_pattern: [ ["strike", "strike", "self_buff_power_up"], ["debuff_fog", "debuff_silence", "debuff_drain"], ["strike", "strike", "strike"] ],
    wrong_answer_buffs: {
      vocabulary: { type: "confusion", attack_bonus: 5, duration_turns: 1 },
      grammar: { type: "conjugation_armor", attack_bonus: 5, duration_turns: 1 },
      reading: { type: "fortify", hp_bonus: 15, duration_turns: 2 }
    },
    phases: [
      { phase: 1, hp_threshold: 350, description: "Standard attacks" },
      { phase: 2, hp_threshold: 200, description: "Gains Chain Armor 20", on_enter: "add_chain_armor_20" },
      { phase: 3, hp_threshold: 100, description: "Gains 5 Fury stacks instantly", on_enter: "add_fury_5" }
    ],
    special_ability: {
      id: "divine_wrath",
      name: "Divine Wrath",
      description: "Multi-phase boss with Chain Armor and Fury mechanics.",
      trigger: "on_phase_change",
      effect: "custom"
    },
    portrait: null,
    portrait_placeholder_color: "#0a5a3a",
    defeat_sfx: "boss_dissolve",
    pre_fight_dialogue: [ { line: "我が試練を越えてみよ。", translation: "Overcome my trial." } ],
    defeat_dialogue: [ { line: "見事なり…", translation: "Magnificent..." } ]
  }
];

newEnemies.forEach(e => {
  if (!enemies.some(ex => ex.id === e.id)) {
    enemies.push(e);
  }
});
fs.writeFileSync(enemiesPath, JSON.stringify(enemies, null, 2));
console.log('Added 2 relics and 3 enemies for floors 3 & 4!');
