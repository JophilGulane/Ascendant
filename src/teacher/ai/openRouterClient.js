// teacher/ai/openRouterClient.js
// OpenRouter API client — thin wrapper around the OpenRouter REST API.
// API key is stored ONLY in sessionStorage under 'openrouter_key' (never persisted to disk).
// All models are routed through https://openrouter.ai/api/v1/chat/completions

const OPENROUTER_BASE  = 'https://openrouter.ai/api/v1'
const SITE_URL         = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'
const SITE_NAME        = 'Ascendant Lesson Builder'

// Supported models (shown in generator UI)
export const AI_MODELS = [
  { id: 'google/gemini-2.0-flash-001',    label: 'Gemini 2.0 Flash',   costPer1k: 0.00010 },
  { id: 'openai/gpt-4o-mini',             label: 'GPT-4o Mini',         costPer1k: 0.00015 },
  { id: 'anthropic/claude-3-haiku',       label: 'Claude 3 Haiku',      costPer1k: 0.00025 },
  { id: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (Free)', costPer1k: 0 },
]

// ── Key management (session-only) ─────────────────────────────────────────────

export function saveApiKey(key) {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('openrouter_key', key.trim())
  }
}

export function getApiKey() {
  if (typeof sessionStorage === 'undefined') return null
  return sessionStorage.getItem('openrouter_key') || null
}

export function clearApiKey() {
  sessionStorage.removeItem('openrouter_key')
}

export function hasApiKey() {
  return Boolean(getApiKey())
}

// ── Core request ──────────────────────────────────────────────────────────────

/**
 * Send a chat completion request to OpenRouter.
 * @param {Object} opts
 * @param {string}   opts.model     - Model ID from AI_MODELS
 * @param {Object[]} opts.messages  - Array of {role, content} chat messages
 * @param {number}   [opts.temperature=0.7]
 * @param {number}   [opts.maxTokens=2048]
 * @returns {Promise<string>} The assistant's reply text
 */
export async function openRouterChat({ model, messages, temperature = 0.7, maxTokens = 2048 }) {
  const key = getApiKey()
  if (!key) throw new Error('No OpenRouter API key set. Add your key in the AI Generator panel.')

  const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization':    `Bearer ${key}`,
      'HTTP-Referer':     SITE_URL,
      'X-Title':          SITE_NAME,
      'Content-Type':     'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    let errBody = ''
    try { errBody = (await response.json()).error?.message || '' } catch {}
    throw new Error(`OpenRouter error ${response.status}: ${errBody || response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content
  if (!content) throw new Error('OpenRouter returned an empty response.')
  return content
}

// ── Credit check ──────────────────────────────────────────────────────────────

/**
 * Fetch the current API key's remaining credits from OpenRouter.
 * @returns {Promise<{credits: number, used: number} | null>}
 */
export async function fetchCredits() {
  const key = getApiKey()
  if (!key) return null
  try {
    const res = await fetch(`${OPENROUTER_BASE}/auth/key`, {
      headers: { Authorization: `Bearer ${key}` },
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      credits: data.data?.limit_remaining ?? null,
      used:    data.data?.usage          ?? null,
    }
  } catch {
    return null
  }
}
