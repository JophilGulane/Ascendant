// teacher/ai/questionGenerator.js
// AI Question Generator logic — prompt engineering + JSON parsing.
// Converts campaign metadata + generation params into validated question objects
// compatible with the Ascendant question schema.

import { openRouterChat } from './openRouterClient.js'

// ── Question type descriptors ──────────────────────────────────────────────────
const TYPE_DESCRIPTIONS = {
  vocabulary: 'multiple-choice vocabulary questions testing word meaning',
  grammar:    'multiple-choice grammar questions testing grammatical rules or sentence structure',
  reading:    'multiple-choice reading comprehension questions with a short passage or sentence',
}

// ── JSON extraction from model response ───────────────────────────────────────
function extractJSON(text) {
  // Try to find JSON array inside the response (model may wrap with prose)
  const fenced = text.match(/```(?:json)?\s*([\s\S]+?)```/)
  if (fenced) {
    try { return JSON.parse(fenced[1]) } catch {}
  }
  // Try bare JSON array
  const arrayMatch = text.match(/\[[\s\S]+\]/)
  if (arrayMatch) {
    try { return JSON.parse(arrayMatch[0]) } catch {}
  }
  // Last resort: parse the whole thing
  try { return JSON.parse(text) } catch {}
  throw new Error('Could not parse JSON from model response. Try again or switch models.')
}

// ── Schema validation for each question ───────────────────────────────────────
function validateQuestion(q, idx) {
  const errors = []
  if (!q.question || typeof q.question !== 'string') errors.push('missing question text')
  if (!Array.isArray(q.options) || q.options.length !== 4) errors.push('options must be an array of 4 strings')
  if (typeof q.correct_index !== 'number' || q.correct_index < 0 || q.correct_index > 3) errors.push('correct_index must be 0-3')
  if (!q.hint || typeof q.hint !== 'string') errors.push('missing hint')
  if (!q.graveyard_label || typeof q.graveyard_label !== 'string') errors.push('missing graveyard_label')
  return errors.map(e => `Question ${idx + 1}: ${e}`)
}

// ── ID generator ──────────────────────────────────────────────────────────────
function generateId(campaignId, type, index) {
  const prefix = campaignId.slice(0, 6).replace(/[^a-z0-9]/gi, '').toLowerCase()
  const typeCode = type.slice(0, 4)
  const num = String(Date.now()).slice(-4) + String(index).padStart(2, '0')
  return `${prefix}_${typeCode}_ai_${num}`
}

// ── Prompt builder ────────────────────────────────────────────────────────────
function buildPrompt({ subject, topic, questionType, floorTier, count, tags, campaignName, existingQuestions }) {
  const typeDesc = TYPE_DESCRIPTIONS[questionType] || TYPE_DESCRIPTIONS.vocabulary

  const existingContext = existingQuestions?.length > 0
    ? `\n\nAVOID duplicating these topics already in the bank:\n${existingQuestions.slice(0, 10).map(q => `- ${q.graveyard_label}: ${q.question}`).join('\n')}`
    : ''

  return `You are an expert educational content creator for the Ascendant language-learning RPG game.

Generate exactly ${count} ${typeDesc} for the subject: "${subject}"
Campaign: "${campaignName || subject}"
Topic focus: "${topic || subject}"
Difficulty floor tier: ${floorTier} (1=beginner, 2=elementary, 3=intermediate, 4=advanced)
Tags to use: ${tags || `${subject.toLowerCase()},floor${floorTier}`}
${existingContext}

OUTPUT RULES — CRITICAL:
1. Return ONLY a valid JSON array. No prose, no markdown, no explanation.
2. Each question must follow this EXACT schema:
{
  "question": "The full question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correct_index": 0,
  "hint": "A helpful example sentence or usage hint",
  "graveyard_label": "The word/concept being tested",
  "graveyard_reading": "Pronunciation or alternate form (use empty string if N/A)",
  "explanation": "Brief explanation of why the answer is correct",
  "tags": ["tag1", "tag2"]
}
3. options must have exactly 4 entries.
4. correct_index is 0-based (0 = options[0] is correct).
5. Make wrong options plausible but clearly incorrect to an educated student.
6. graveyard_label should be the key word/phrase/concept being tested.
7. All strings must be in English unless the question intentionally tests a foreign script.

Output the JSON array now:`
}

// ── Main generator function ────────────────────────────────────────────────────
/**
 * Generate AI questions and return validated question objects.
 * @param {Object} params
 * @param {string}   params.model           - OpenRouter model ID
 * @param {string}   params.campaignId      - Campaign ID for ID generation
 * @param {string}   params.campaignName    - Human-readable campaign name
 * @param {string}   params.subject         - e.g. 'Japanese', 'Python'
 * @param {string}   params.topic           - e.g. 'verb conjugation', 'for loops'
 * @param {string}   params.questionType    - 'vocabulary' | 'grammar' | 'reading'
 * @param {number}   params.floorTier       - 1 | 2 | 3 | 4
 * @param {number}   params.count           - How many to generate (max 10)
 * @param {string}   params.tags            - Pipe-separated tags string
 * @param {Object[]} params.existingQuestions - Questions already in the bank (for dedup context)
 * @param {Function} [params.onProgress]    - Called with status strings during generation
 * @returns {Promise<{ questions: Object[], errors: string[], rawResponse: string }>}
 */
export async function generateQuestions(params) {
  const { model, campaignId, campaignName, subject, topic, questionType, floorTier, count, tags, existingQuestions, onProgress } = params

  onProgress?.('Building prompt…')
  const prompt = buildPrompt({ subject, topic, questionType, floorTier, count: Math.min(count, 10), tags, campaignName, existingQuestions })

  onProgress?.(`Sending to ${model}…`)
  const rawResponse = await openRouterChat({
    model,
    temperature: 0.75,
    maxTokens:   3000,
    messages: [
      { role: 'system', content: 'You are an educational content creator. You output only valid JSON arrays. Never add prose, markdown, or comments outside the JSON.' },
      { role: 'user',   content: prompt },
    ],
  })

  onProgress?.('Parsing response…')
  let parsed
  try {
    parsed = extractJSON(rawResponse)
  } catch (e) {
    return { questions: [], errors: [e.message], rawResponse }
  }

  if (!Array.isArray(parsed)) {
    return { questions: [], errors: ['Model returned non-array JSON'], rawResponse }
  }

  // Validate and assemble final question objects
  const questions = []
  const errors    = []

  parsed.forEach((q, i) => {
    const qErrors = validateQuestion(q, i)
    if (qErrors.length) {
      errors.push(...qErrors)
      return // skip this question
    }
    questions.push({
      id:               generateId(campaignId, questionType, i),
      campaign:         campaignId,
      floor_tier:       floorTier,
      type:             questionType,
      question:         q.question.trim(),
      options:          q.options.map(o => String(o).trim()),
      correct_index:    q.correct_index,
      hint:             q.hint.trim(),
      graveyard_label:  q.graveyard_label.trim(),
      graveyard_reading: (q.graveyard_reading || '').trim(),
      explanation:      (q.explanation || '').trim(),
      tags:             Array.isArray(q.tags) ? q.tags : (q.tags || '').split('|').map(t => t.trim()).filter(Boolean),
      _aiGenerated:     true, // Flag for UI display
    })
  })

  onProgress?.(questions.length > 0 ? `✓ Generated ${questions.length} questions` : 'No valid questions parsed')
  return { questions, errors, rawResponse }
}
