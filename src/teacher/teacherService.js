// teacher/teacherService.js
// Pure service layer — all custom campaign CRUD against localStorage.
// Custom campaigns are stored under key: lq_custom_campaigns_v1
// Shape: { [campaignCode]: CustomCampaign }
//
// CustomCampaign:
//   { id, code, name, description, subject, themeId, teacherUsername,
//     visibility, publishedAt, updatedAt,
//     questions: Question[], enemies: CustomEnemy[] }
//
// Question matches the built-in schema exactly so existing combat/question
// utilities work without any modification.

import { ACCOUNT_KEYS } from '../account/accountService.js'

const CUSTOM_CAMPAIGNS_KEY = 'lq_custom_campaigns_v1'

export const THEME_PRESETS = [
  { id: 'ancient_academy', label: '🏛️ Ancient Academy',  bg: 'linear-gradient(180deg,#1a1000,#2a1800)', accent: '#d4a843', enemyStyle: 'scholar' },
  { id: 'space_station',   label: '🚀 Space Station',    bg: 'linear-gradient(180deg,#000814,#001a2e)', accent: '#00d4ff', enemyStyle: 'rogue' },
  { id: 'modern_city',     label: '🏙️ Modern City',     bg: 'linear-gradient(180deg,#0a0a0a,#1a1a2e)', accent: '#ff6b6b', enemyStyle: 'rival' },
  { id: 'enchanted_forest',label: '🌲 Enchanted Forest', bg: 'linear-gradient(180deg,#001a00,#0a2a0a)', accent: '#4ade80', enemyStyle: 'creature' },
  { id: 'steampunk_lab',   label: '⚙️ Steampunk Lab',   bg: 'linear-gradient(180deg,#1a0a00,#2a1a00)', accent: '#f59e0b', enemyStyle: 'automaton' },
  { id: 'custom',          label: '🎨 Custom',           bg: 'linear-gradient(180deg,#0d0d0d,#1a1a1a)', accent: '#a855f7', enemyStyle: 'generic' },
]

export const SUBJECT_TAGS = ['Programming', 'Science', 'History', 'Math', 'Language', 'Literature', 'Geography', 'Other']

export const QUESTION_TYPES = [
  { id: 'vocabulary', label: 'Vocabulary / Term' },
  { id: 'grammar',    label: 'Grammar / Rule' },
  { id: 'reading',    label: 'Reading / Concept' },
]

// ── Auto-generated intent patterns by floor/tier ─────────────────────────────
const INTENT_TEMPLATES = {
  1: { regular: [['strike'],['strike'],['debuff_silence'],['strike'],['self_buff_armor_up']] },
  2: { regular: [['strike','debuff_fog'],['debuff_confusion','strike'],['self_buff_power_up','strike'],['strike','debuff_bind']] },
  3: { regular: [['strike','strike'],['self_buff_armor_up','strike'],['debuff_silence','strike']] },
  4: { regular: [['strike','self_buff_power_up'],['strike','debuff_drain'],['self_buff_armor_up','strike','debuff_silence']] },
}
const WRONG_ANSWER_BUFFS_TEMPLATE = {
  vocabulary: { type: 'confusion',        attack_bonus: 2, duration_turns: 1 },
  grammar:    { type: 'conjugation_armor',attack_bonus: 0, duration_turns: 1 },
  reading:    { type: 'fortify',          hp_bonus: 4,     duration_turns: 2 },
}

// ── DB helpers ────────────────────────────────────────────────────────────────
function readDb() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_CAMPAIGNS_KEY) || '{}') } catch { return {} }
}
function writeDb(db) {
  try { localStorage.setItem(CUSTOM_CAMPAIGNS_KEY, JSON.stringify(db)) } catch {}
}

// ── Code generation ───────────────────────────────────────────────────────────
function generateCampaignCode() {
  const prefix = 'CP'
  const num = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${num}`
}

// ── CRUD ──────────────────────────────────────────────────────────────────────
export function createDraftCampaign(teacherUsername) {
  const db = readDb()
  let code
  do { code = generateCampaignCode() } while (db[code])

  const draft = {
    id: crypto.randomUUID(),
    code,
    name: '',
    description: '',
    subject: 'Other',
    themeId: 'ancient_academy',
    teacherUsername,
    visibility: 'class',
    publishedAt: null,
    updatedAt: Date.now(),
    questions: [],
    enemies: [],
    isDraft: true,
  }
  db[code] = draft
  writeDb(db)
  return draft
}

export function saveCampaignDraft(code, updates) {
  const db = readDb()
  if (!db[code]) return { ok: false, error: 'Campaign not found.' }
  db[code] = { ...db[code], ...updates, updatedAt: Date.now() }
  writeDb(db)
  return { ok: true, campaign: db[code] }
}

export function publishCampaign(code) {
  const db = readDb()
  const c = db[code]
  if (!c) return { ok: false, error: 'Campaign not found.' }

  // Validation
  const warnings = validateCampaign(c)
  if (warnings.errors.length > 0) return { ok: false, errors: warnings.errors }

  db[code] = { ...c, isDraft: false, publishedAt: Date.now(), updatedAt: Date.now() }
  writeDb(db)
  return { ok: true, campaign: db[code], warnings: warnings.warnings }
}

export function deleteCampaign(code) {
  const db = readDb()
  delete db[code]
  writeDb(db)
  return { ok: true }
}

export function getTeacherCampaigns(teacherUsername) {
  const db = readDb()
  return Object.values(db).filter(c => c.teacherUsername === teacherUsername)
}

export function getCampaignByCode(code) {
  const db = readDb()
  return db[code?.toUpperCase()] || null
}

export function getAllPublicCampaigns() {
  const db = readDb()
  return Object.values(db).filter(c => !c.isDraft && c.visibility === 'public')
}

// ── Validation ────────────────────────────────────────────────────────────────
export function validateCampaign(campaign) {
  const errors = []
  const warnings = []
  if (!campaign.name?.trim()) errors.push('Campaign name is required.')
  if (!campaign.description?.trim()) errors.push('Campaign description is required.')

  // Check question counts per floor per type
  const FLOORS = [1, 2, 3, 4]
  const TYPES = ['vocabulary', 'grammar', 'reading']
  const MIN_PER_TIER = 10
  for (const floor of FLOORS) {
    for (const type of TYPES) {
      const count = campaign.questions.filter(q => q.floor_tier === floor && q.type === type).length
      if (count < MIN_PER_TIER) {
        warnings.push(`Floor ${floor} ${type}: ${count}/${MIN_PER_TIER} questions (recommended minimum)`)
      }
    }
  }
  return { errors, warnings }
}

// ── Question helpers ──────────────────────────────────────────────────────────
export function makeBlankQuestion(campaignCode) {
  return {
    id: `custom_${campaignCode}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    campaign: campaignCode,
    floor_tier: 1,
    type: 'vocabulary',
    question: '',
    passage: '',           // for reading type
    options: ['', '', '', ''],
    correct_index: 0,
    hint: '',
    explanation: '',
    graveyard_label: '',
    graveyard_reading: '',
    tags: [],
  }
}

export function addQuestion(campaignCode, question) {
  const db = readDb()
  const c = db[campaignCode]
  if (!c) return { ok: false }
  c.questions = [...c.questions, { ...question, id: `custom_${campaignCode}_${Date.now()}_${Math.random().toString(36).slice(2,7)}` }]
  c.updatedAt = Date.now()
  writeDb(db)
  return { ok: true }
}

export function updateQuestion(campaignCode, questionId, updates) {
  const db = readDb()
  const c = db[campaignCode]
  if (!c) return { ok: false }
  c.questions = c.questions.map(q => q.id === questionId ? { ...q, ...updates } : q)
  c.updatedAt = Date.now()
  writeDb(db)
  return { ok: true }
}

export function deleteQuestion(campaignCode, questionId) {
  const db = readDb()
  const c = db[campaignCode]
  if (!c) return { ok: false }
  c.questions = c.questions.filter(q => q.id !== questionId)
  c.updatedAt = Date.now()
  writeDb(db)
  return { ok: true }
}

// ── CSV Import ────────────────────────────────────────────────────────────────
// Format: question, A, B, C, D, correct_letter (A/B/C/D), hint, explanation, tier, type
export function parseCSV(raw, campaignCode) {
  const lines = raw.trim().split('\n').filter(l => l.trim())
  const results = []
  const errors = []

  for (let i = 0; i < lines.length; i++) {
    // Handle quoted fields with commas inside
    const cols = parseCSVLine(lines[i])
    if (cols.length < 6) { errors.push(`Row ${i + 1}: Too few columns`); continue }

    const [question, a, b, c, d, correct, hint = '', explanation = '', tier = '1', type = 'vocabulary'] = cols
    const letterMap = { A: 0, B: 1, C: 2, D: 3 }
    const correct_index = letterMap[correct.trim().toUpperCase()]
    if (correct_index === undefined) { errors.push(`Row ${i + 1}: Correct column must be A, B, C, or D`); continue }

    const tierNum = parseInt(tier.trim()) || 1
    results.push({
      id: `custom_${campaignCode}_csv_${i}_${Date.now()}`,
      campaign: campaignCode,
      floor_tier: Math.min(4, Math.max(1, tierNum)),
      type: ['vocabulary', 'grammar', 'reading'].includes(type.trim().toLowerCase()) ? type.trim().toLowerCase() : 'vocabulary',
      question: question.trim(),
      passage: '',
      options: [a.trim(), b.trim(), c.trim(), d.trim()],
      correct_index,
      hint: hint.trim(),
      explanation: explanation.trim(),
      graveyard_label: question.trim().slice(0, 40),
      graveyard_reading: '',
      tags: [],
    })
  }
  return { questions: results, errors }
}

function parseCSVLine(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuotes = !inQuotes; continue }
    if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue }
    current += ch
  }
  result.push(current)
  return result
}

// ── Enemy helpers ─────────────────────────────────────────────────────────────
export function makeBlankEnemy(campaignCode, floor = 1) {
  return {
    id: `custom_enemy_${campaignCode}_${Date.now()}`,
    campaign: campaignCode,
    floor,
    tier: 'regular',
    name_native: '',
    name_target: '',
    hp: floor <= 1 ? 40 : floor === 2 ? 65 : floor === 3 ? 85 : 150,
    base_attack: floor <= 1 ? 7 : floor === 2 ? 10 : floor === 3 ? 13 : 17,
    concept_description: '',
    portrait_preset: 'silhouette_1',
    portrait_placeholder_color: '#1a2a4a',
    // Auto-assigned by floor:
    actions_per_turn: floor <= 2 ? 1 : floor === 3 ? 2 : 3,
    intent_pattern: INTENT_TEMPLATES[floor]?.regular || INTENT_TEMPLATES[1].regular,
    wrong_answer_buffs: WRONG_ANSWER_BUFFS_TEMPLATE,
    silence_type: 'vocabulary',
    concept_tags: [],
    special_ability: null,
    variants: [],
  }
}

export function saveEnemies(campaignCode, enemies) {
  const db = readDb()
  const c = db[campaignCode]
  if (!c) return { ok: false }
  c.enemies = enemies
  c.updatedAt = Date.now()
  writeDb(db)
  return { ok: true }
}

// ── Student: unlock campaign by code ─────────────────────────────────────────
export function getUnlockedCustomCodes(username) {
  try {
    const raw = localStorage.getItem(`lq_custom_unlocked_${username}`) || '[]'
    return JSON.parse(raw)
  } catch { return [] }
}
export function unlockCustomCampaign(username, code) {
  const campaign = getCampaignByCode(code)
  if (!campaign || campaign.isDraft) return { ok: false, error: 'Campaign code not found or not yet published.' }
  const existing = getUnlockedCustomCodes(username)
  if (!existing.includes(code)) {
    localStorage.setItem(`lq_custom_unlocked_${username}`, JSON.stringify([...existing, code]))
  }
  return { ok: true, campaign }
}
