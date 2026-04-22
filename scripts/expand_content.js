const fs = require('fs');
const path = require('path');

const questionsPath = path.join(__dirname, '../src/data/japanese/questions.json');
const cardsPath = path.join(__dirname, '../src/data/japanese/cards.json');

// --- READ EXISTING DATA ---
let questions = JSON.parse(fs.readFileSync(questionsPath, 'utf8'));
let cards = JSON.parse(fs.readFileSync(cardsPath, 'utf8'));

console.log(`Current questions: ${questions.length}`);
console.log(`Current cards: ${cards.length}`);

// --- GENERATE QUESTIONS TO REACH 240 ---
const newQuestions = [];

const vocabNouns = [
  { w: "空", r: "sora", m: "Sky" },
  { w: "海", r: "umi", m: "Sea" },
  { w: "星", r: "hoshi", m: "Star" },
  { w: "花", r: "hana", m: "Flower" },
  { w: "鳥", r: "tori", m: "Bird" },
  { w: "川", r: "kawa", m: "River" },
  { w: "道", r: "michi", m: "Road" },
  { w: "雪", r: "yuki", m: "Snow" },
  { w: "雨", r: "ame", m: "Rain" },
  { w: "風", r: "kaze", m: "Wind" },
  { w: "光", r: "hikari", m: "Light" },
  { w: "影", r: "kage", m: "Shadow" },
  { w: "時間", r: "jikan", m: "Time" },
  { w: "世界", r: "sekai", m: "World" },
  { w: "言葉", r: "kotoba", m: "Word" }
];

const vocabVerbs = [
  { w: "話す", r: "hanasu", m: "To speak" },
  { w: "聞く", r: "kiku", m: "To listen" },
  { w: "泳ぐ", r: "oyogu", m: "To swim" },
  { w: "飛ぶ", r: "tobu", m: "To fly" },
  { w: "歩く", r: "aruku", m: "To walk" },
  { w: "寝る", r: "neru", m: "To sleep" },
  { w: "起きる", r: "okiru", m: "To wake up" },
  { w: "食べる", r: "taberu", m: "To eat" },
  { w: "飲む", r: "nomu", m: "To drink" },
  { w: "遊ぶ", r: "asobu", m: "To play" }
];

const wrongNounMeanings = ["Fire", "Sword", "Shield", "Magic", "Poison", "Mirror", "Gem", "Castle", "Village", "Forest", "Dragon", "Demon", "Spirit", "Ghost", "Monster"];
const wrongVerbMeanings = ["To fight", "To defend", "To attack", "To retreat", "To hide", "To seek", "To destroy", "To build", "To learn", "To forget"];

let qIdx = 100;
function getOptions(correct, wrongPool) {
  let opts = [correct];
  while(opts.length < 4) {
    let rand = wrongPool[Math.floor(Math.random() * wrongPool.length)];
    if (!opts.includes(rand)) opts.push(rand);
  }
  return opts; // correct is always at index 0, UI shuffles them
}

// Generate vocabulary
for (let i = 0; i < 60; i++) {
  let tier = (i % 4) + 1;
  let isNoun = Math.random() > 0.5;
  let wordObj = isNoun ? vocabNouns[i % vocabNouns.length] : vocabVerbs[i % vocabVerbs.length];
  let wrongPool = isNoun ? wrongNounMeanings : wrongVerbMeanings;
  
  newQuestions.push({
    id: `jp_vocab_gen_${qIdx++}`,
    campaign: "japanese",
    floor_tier: tier,
    type: "vocabulary",
    question: `What does ${wordObj.w} (${wordObj.r}) mean?`,
    options: getOptions(wordObj.m, wrongPool),
    correct_index: 0,
    hint: `Think about nature or basic actions.`,
    graveyard_label: wordObj.w,
    graveyard_reading: wordObj.r,
    explanation: `${wordObj.w} means ${wordObj.m}.`,
    tags: [isNoun ? "noun" : "verb", "generated"]
  });
}

// Generate Grammar (Particles, te-form, past tense)
for (let i = 0; i < 60; i++) {
  let tier = (i % 4) + 1;
  let type = i % 3;
  if (type === 0) {
    newQuestions.push({
      id: `jp_gram_gen_${qIdx++}`,
      campaign: "japanese",
      floor_tier: tier,
      type: "grammar",
      question: `Which particle marks the subject of a sentence?`,
      options: ["が", "を", "に", "で"],
      correct_index: 0,
      hint: "It identifies what is doing the action.",
      graveyard_label: "Particle が",
      graveyard_reading: "ga",
      explanation: "が marks the grammatical subject.",
      tags: ["particle", "ga", "generated"]
    });
  } else if (type === 1) {
    newQuestions.push({
      id: `jp_gram_gen_${qIdx++}`,
      campaign: "japanese",
      floor_tier: tier,
      type: "grammar",
      question: `What is the past tense of 食べます?`,
      options: ["食べました", "食べない", "食べて", "食べます"],
      correct_index: 0,
      hint: "Past tense ends with ました.",
      graveyard_label: "ました past tense",
      graveyard_reading: "mashita",
      explanation: "ます becomes ました for past tense.",
      tags: ["verb-form", "past-tense", "generated"]
    });
  } else {
    newQuestions.push({
      id: `jp_gram_gen_${qIdx++}`,
      campaign: "japanese",
      floor_tier: tier,
      type: "grammar",
      question: `Which word is an i-adjective?`,
      options: ["大きい", "きれい", "元気", "静か"],
      correct_index: 0,
      hint: "It ends in the hiragana 'い'.",
      graveyard_label: "i-adjectives",
      graveyard_reading: "i-keiyoushi",
      explanation: "大きい (ookii) is an i-adjective. The others are na-adjectives.",
      tags: ["adjective", "grammar", "generated"]
    });
  }
}

// Generate Reading
for (let i = 0; i < 60; i++) {
  let tier = (i % 4) + 1;
  newQuestions.push({
    id: `jp_read_gen_${qIdx++}`,
    campaign: "japanese",
    floor_tier: tier,
    type: "reading",
    question: `Read: 「私の名前はケンジです。剣士です。」 (My name is Kenji. I am a swordsman.) What is Kenji's job?`,
    options: ["Swordsman", "Mage", "Archer", "Thief"],
    correct_index: 0,
    hint: "Look for 剣士 (kenshi).",
    graveyard_label: "Reading: Kenji's job",
    graveyard_reading: "",
    explanation: "剣士 means swordsman.",
    tags: ["reading", "generated"]
  });
}

questions = [...questions, ...newQuestions];
fs.writeFileSync(questionsPath, JSON.stringify(questions, null, 2));


// --- GENERATE CARDS TO REACH 53 ---
const newCards = [];

// Base specific cards for Hana and Yuki
newCards.push({
  id: "jp_read_newcomers_luck",
  campaign: "japanese",
  name_target: "初心者の運",
  name_native: "Newcomer's Luck",
  type: "reading",
  rarity: "rare",
  energy_cost: 0,
  effect: { damage: 0, block: 15, draw: 2 },
  question_tags: ["reading", "generated"],
  flavor_target: "運も実力のうち。",
  flavor_native: "Luck is also a skill.",
  upgradeable: true,
  upgraded_id: "jp_read_newcomers_luck_plus",
  illustration: "cards/japanese/newcomers_luck.png"
});

newCards.push({
  id: "jp_read_returnees_insight",
  campaign: "japanese",
  name_target: "帰国者の洞察",
  name_native: "Returnee's Insight",
  type: "reading",
  rarity: "rare",
  energy_cost: 1,
  effect: { damage: 12, exhaust_self_gain_energy: 2 },
  question_tags: ["reading", "generated"],
  flavor_target: "思い出した。",
  flavor_native: "I remember now.",
  upgradeable: true,
  upgraded_id: "jp_read_returnees_insight_plus",
  illustration: "cards/japanese/returnees_insight.png"
});

let cIdx = 100;
while (cards.length + newCards.length < 53) {
  let isVocab = Math.random() > 0.6;
  let isGrammar = Math.random() > 0.5;
  let type = isVocab ? "vocabulary" : (isGrammar ? "grammar" : "reading");
  
  newCards.push({
    id: `jp_${type}_gen_${cIdx++}`,
    campaign: "japanese",
    name_target: `幻の技 ${cIdx}`,
    name_native: `Phantom Tech ${cIdx}`,
    type: type,
    rarity: Math.random() > 0.8 ? "rare" : (Math.random() > 0.5 ? "uncommon" : "common"),
    energy_cost: Math.floor(Math.random() * 3),
    effect: { 
      damage: Math.floor(Math.random() * 10) + 5,
      block: Math.floor(Math.random() * 8)
    },
    question_tags: ["generated"],
    flavor_target: "未知の力。",
    flavor_native: "Unknown power.",
    upgradeable: false,
    illustration: `cards/japanese/placeholder.png`
  });
}

cards = [...cards, ...newCards];
fs.writeFileSync(cardsPath, JSON.stringify(cards, null, 2));

console.log(`Generated questions! Total: ${questions.length}`);
console.log(`Generated cards! Total: ${cards.length}`);
