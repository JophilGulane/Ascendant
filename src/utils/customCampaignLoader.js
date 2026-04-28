// utils/customCampaignLoader.js
// Intercepts getEnemies() and question sampling so custom campaigns work
// seamlessly with the existing combat engine without modifying its core files.
//
// Custom campaign data lives in localStorage under lq_custom_campaigns_v1.
// When a run uses a custom campaignId (starts with "custom:"), this module
// returns the correct enemies and questions instead of the built-in JSON files.

const CUSTOM_CAMPAIGNS_KEY = 'lq_custom_campaigns_v1'

function readCustomCampaigns() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_CAMPAIGNS_KEY) || '{}') } catch { return {} }
}

// ── Campaign code from campaignId ─────────────────────────────────────────────
// Custom campaign IDs are stored as "custom:<CODE>" in runStore.
// e.g., "custom:CP-7731"
export function isCustomCampaign(campaignId) {
  return typeof campaignId === 'string' && campaignId.startsWith('custom:')
}
export function codeFromId(campaignId) {
  return campaignId?.replace('custom:', '') || ''
}

// ── Get custom enemies ────────────────────────────────────────────────────────
export function getCustomEnemies(campaignId) {
  const code = codeFromId(campaignId)
  const db   = readCustomCampaigns()
  const campaign = db[code]
  if (!campaign) return []

  return (campaign.enemies || []).map(e => ({
    ...e,
    campaign: campaignId,     // ensure campaign key matches the runStore value
    // Ensure required combat fields are present (auto-generate from floor if missing)
    actions_per_turn: e.actions_per_turn || (e.floor <= 2 ? 1 : e.floor === 3 ? 2 : 3),
    wrong_answer_buffs: e.wrong_answer_buffs || {
      vocabulary: { type: 'confusion', attack_bonus: 2, duration_turns: 1 },
      grammar:    { type: 'conjugation_armor', attack_bonus: 0, duration_turns: 1 },
      reading:    { type: 'fortify', hp_bonus: 4, duration_turns: 2 },
    },
    intent_pattern: e.intent_pattern || [['strike'], ['strike'], ['debuff_silence']],
    // portrait: silhouette placeholder based on preset
    portrait: null,
    portrait_placeholder_color: e.portrait_placeholder_color || '#1a2a4a',
    // Ensure boss has phases
    phases: (e.tier === 'boss' && !e.phases) ? [
      { phase: 1, hp_threshold: e.hp, description: 'Standard attack patterns' },
      { phase: 2, hp_threshold: Math.floor(e.hp / 2), description: 'Empowered — only breaks with a successful Chain Combo', on_enter: 'add_chain_armor_15' },
    ] : e.phases || undefined,
  }))
}

// ── Get custom questions ──────────────────────────────────────────────────────
export function getCustomQuestions(campaignId) {
  const code = codeFromId(campaignId)
  const db   = readCustomCampaigns()
  const campaign = db[code]
  if (!campaign) return []

  return (campaign.questions || []).map(q => ({
    ...q,
    campaign: campaignId,        // match runStore campaignId
    // Ensure graveyard fields are set
    graveyard_label: q.graveyard_label || q.question.slice(0, 40),
    graveyard_reading: q.graveyard_reading || '',
    tags: q.tags || [],
  }))
}

// ── Campaign metadata for CharacterSelect / CampaignSelect ────────────────────
export function getCustomCampaignTheme(campaignId) {
  const code = codeFromId(campaignId)
  const db   = readCustomCampaigns()
  const c    = db[code]
  if (!c) return null

  const THEME_BG = {
    ancient_academy:  'linear-gradient(180deg,#1a1000,#2a1800)',
    space_station:    'linear-gradient(180deg,#000814,#001a2e)',
    modern_city:      'linear-gradient(180deg,#0a0a0a,#1a1a2e)',
    enchanted_forest: 'linear-gradient(180deg,#001a00,#0a2a0a)',
    steampunk_lab:    'linear-gradient(180deg,#1a0a00,#2a1a00)',
    custom:           'linear-gradient(180deg,#0d0d0d,#1a1a1a)',
  }
  const THEME_ACCENT = {
    ancient_academy:  '#d4a843',
    space_station:    '#00d4ff',
    modern_city:      '#ff6b6b',
    enchanted_forest: '#4ade80',
    steampunk_lab:    '#f59e0b',
    custom:           '#a855f7',
  }
  const THEME_EMOJI = {
    ancient_academy:  '🏛️',
    space_station:    '🚀',
    modern_city:      '🏙️',
    enchanted_forest: '🌲',
    steampunk_lab:    '⚙️',
    custom:           '📚',
  }


  return {
    id:           campaignId,
    code:         code,
    name:         c.name || 'Custom Campaign',
    name_target:  c.name || 'Custom Campaign',
    language:     c.subject || 'Custom',
    language_target: c.subject || 'Custom',
    tagline:      c.description || '',
    primary:      '#0d0d0d',
    accent:       THEME_ACCENT[c.themeId] || '#F5C842',
    accent2:      '#9ca3af',
    cardVocab:    '#8B1A1A',
    cardGrammar:  '#1A3A8B',
    cardReading:  '#1A6B3A',
    font:         'Inter',
    bgGradient:   THEME_BG[c.themeId] || THEME_BG.custom,
    particleColor: THEME_ACCENT[c.themeId] || '#F5C842',
    particleEmoji: THEME_EMOJI[c.themeId] || '📚',
    floors:       4,
    campaignWorld: c.description || '',
    locked:       false,
    isCustom:     true,
    subject:      c.subject,
    visibility:   c.visibility,
    teacherUsername: c.teacherUsername,
  }
}

// ── Get all campaigns a player has unlocked ───────────────────────────────────
// Returns an array of campaignTheme objects for use in campaign select.
export function getUnlockedCustomThemes(username) {
  if (!username) return []
  try {
    const codes = JSON.parse(localStorage.getItem(`lq_custom_unlocked_${username}`) || '[]')
    return codes
      .map(code => getCustomCampaignTheme(`custom:${code}`))
      .filter(Boolean)
  } catch { return [] }
}

// ── Patch data loader ─────────────────────────────────────────────────────────
// Call this from getEnemies() to transparently handle custom campaign IDs.
// Returns the custom enemy list if the campaignId is custom, else returns null
// (caller should fall through to built-in JSON).
export function tryGetCustomEnemies(campaignId) {
  if (!isCustomCampaign(campaignId)) return null
  return getCustomEnemies(campaignId)
}

export function tryGetCustomQuestions(campaignId) {
  if (!isCustomCampaign(campaignId)) return null
  return getCustomQuestions(campaignId)
}
