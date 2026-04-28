// teacher/components/StepQuestionBank.jsx
// Step 2: Question form editor + CSV bulk import + per-floor/type count warnings.
// Under 500 lines — question list and editor are in the same file for cohesion.

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { QUESTION_TYPES, makeBlankQuestion, parseCSV } from '../teacherService.js'

const FLOORS = [1, 2, 3, 4]
const MIN_PER_TIER = 10
const CORRECT_LETTERS = ['A', 'B', 'C', 'D']

// ── Small shared components ───────────────────────────────────────────────────
function FieldLabel({ children, required }) {
  return (
    <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: '5px' }}>
      {children}{required && <span style={{ color: '#fca5a5', marginLeft: '3px' }}>*</span>}
    </div>
  )
}
function TextBox({ value, onChange, placeholder, rows, mono }) {
  return (
    <textarea
      value={value} rows={rows || 2}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
        padding: '8px 12px', color: '#f3f4f6', fontSize: mono ? '0.78rem' : '0.85rem',
        outline: 'none', resize: 'vertical', boxSizing: 'border-box',
        fontFamily: mono ? 'monospace' : 'inherit',
      }}
      onFocus={e => e.target.style.borderColor = '#F5C842'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
    />
  )
}

// ── Floor × Type count warning grid ──────────────────────────────────────────
function CoverageGrid({ questions }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.72rem' }}>
        <thead>
          <tr>
            <th style={{ padding: '6px 10px', color: '#6b7280', textAlign: 'left', fontWeight: 400 }}>Type</th>
            {FLOORS.map(f => (
              <th key={f} style={{ padding: '6px 10px', color: '#6b7280', textAlign: 'center', fontWeight: 400 }}>Floor {f}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {QUESTION_TYPES.map(({ id, label }) => (
            <tr key={id}>
              <td style={{ padding: '6px 10px', color: '#9ca3af', borderTop: '1px solid rgba(255,255,255,0.05)' }}>{label}</td>
              {FLOORS.map(f => {
                const count = questions.filter(q => q.type === id && q.floor_tier === f).length
                const ok = count >= MIN_PER_TIER
                return (
                  <td key={f} style={{ padding: '6px 10px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontWeight: 700, color: ok ? '#6ee7b7' : count > 0 ? '#fde047' : '#fca5a5' }}>
                      {count}
                    </span>
                    <span style={{ color: '#4b5563', marginLeft: '2px' }}>/{MIN_PER_TIER}</span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Question editor form ──────────────────────────────────────────────────────
function QuestionEditor({ q, onSave, onCancel }) {
  const [draft, setDraft] = useState({ ...q })
  const upd = (key, val) => setDraft(d => ({ ...d, [key]: val }))
  const updOption = (i, val) => setDraft(d => { const opts = [...d.options]; opts[i] = val; return { ...d, options: opts } })

  const isReading = draft.type === 'reading'
  const canSave = draft.question.trim() && draft.options.every(o => o.trim())

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(245,200,66,0.25)',
        borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px',
      }}
    >
      {/* Floor + Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <FieldLabel>Floor Tier</FieldLabel>
          <div style={{ display: 'flex', gap: '6px' }}>
            {FLOORS.map(f => (
              <button key={f} onClick={() => upd('floor_tier', f)} style={{
                flex: 1, padding: '6px', borderRadius: '8px',
                border: draft.floor_tier === f ? '1px solid #F5C842' : '1px solid rgba(255,255,255,0.12)',
                background: draft.floor_tier === f ? 'rgba(245,200,66,0.12)' : 'transparent',
                color: draft.floor_tier === f ? '#F5C842' : '#9ca3af',
                fontWeight: draft.floor_tier === f ? 700 : 400,
                cursor: 'pointer', fontSize: '0.8rem',
              }}>{f}</button>
            ))}
          </div>
        </div>
        <div>
          <FieldLabel>Type</FieldLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {QUESTION_TYPES.map(t => (
              <button key={t.id} onClick={() => upd('type', t.id)} style={{
                padding: '5px 10px', borderRadius: '6px', textAlign: 'left',
                border: draft.type === t.id ? '1px solid #F5C842' : '1px solid rgba(255,255,255,0.1)',
                background: draft.type === t.id ? 'rgba(245,200,66,0.1)' : 'transparent',
                color: draft.type === t.id ? '#F5C842' : '#9ca3af',
                fontSize: '0.74rem', cursor: 'pointer',
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Passage (reading only) */}
      {isReading && (
        <div>
          <FieldLabel>Passage / Code Block</FieldLabel>
          <TextBox value={draft.passage || ''} onChange={v => upd('passage', v)} placeholder="Paste the reading passage or code snippet here..." rows={4} mono />
        </div>
      )}

      {/* Question text */}
      <div>
        <FieldLabel required>Question Text</FieldLabel>
        <TextBox value={draft.question} onChange={v => upd('question', v)} placeholder="Enter your question..." rows={2} />
      </div>

      {/* Options A–D */}
      <div>
        <FieldLabel required>Answer Options — click the correct one</FieldLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {draft.options.map((opt, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                onClick={() => upd('correct_index', i)}
                title={`Mark ${CORRECT_LETTERS[i]} as correct`}
                style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  border: draft.correct_index === i ? 'none' : '2px solid rgba(255,255,255,0.2)',
                  background: draft.correct_index === i ? '#22c55e' : 'transparent',
                  color: '#fff', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                }}
              >{CORRECT_LETTERS[i]}</button>
              <input
                type="text"
                value={opt}
                onChange={e => updOption(i, e.target.value)}
                placeholder={`Option ${CORRECT_LETTERS[i]}`}
                style={{
                  flex: 1, background: draft.correct_index === i ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                  border: draft.correct_index === i ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '8px', padding: '7px 12px', color: '#f3f4f6', fontSize: '0.85rem', outline: 'none',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Hint + Explanation */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <FieldLabel>Hint</FieldLabel>
          <TextBox value={draft.hint} onChange={v => upd('hint', v)} placeholder="Shown when student uses hint..." rows={2} />
        </div>
        <div>
          <FieldLabel>Explanation</FieldLabel>
          <TextBox value={draft.explanation} onChange={v => upd('explanation', v)} placeholder="Shown in post-run summary..." rows={2} />
        </div>
      </div>

      {/* Tags */}
      <div>
        <FieldLabel>Tags (comma-separated)</FieldLabel>
        <input
          type="text"
          value={(draft.tags || []).join(', ')}
          onChange={e => upd('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
          placeholder="e.g., printf, integers, basics"
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
            padding: '8px 12px', color: '#f3f4f6', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#9ca3af', cursor: 'pointer' }}>Cancel</button>
        <motion.button
          onClick={() => canSave && onSave(draft)}
          disabled={!canSave}
          whileHover={canSave ? { scale: 1.03 } : {}} whileTap={canSave ? { scale: 0.97 } : {}}
          style={{
            padding: '8px 22px', borderRadius: '8px', border: 'none',
            background: canSave ? 'linear-gradient(135deg, #b45309, #F5C842)' : 'rgba(245,200,66,0.2)',
            color: canSave ? '#1a0e00' : '#6b7280', fontWeight: 700, fontSize: '0.85rem', cursor: canSave ? 'pointer' : 'not-allowed',
          }}
        >Save Question</motion.button>
      </div>
    </motion.div>
  )
}

// ── CSV import panel ──────────────────────────────────────────────────────────
function CsvImport({ campaignCode, onImport }) {
  const [csv, setCsv] = useState('')
  const [result, setResult] = useState(null)

  const handleParse = () => {
    const { questions, errors } = parseCSV(csv, campaignCode)
    setResult({ questions, errors })
  }

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '18px' }}>
      <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.88rem', marginBottom: '8px' }}>📋 Bulk CSV Import</div>
      <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '10px' }}>
        Format: <code style={{ color: '#F5C842', fontSize: '0.68rem' }}>question, A, B, C, D, correct_letter, hint, explanation, tier, type</code>
      </div>
      <TextBox value={csv} onChange={setCsv} placeholder={"What does printf do?, Prints output, Reads input, Loops, Exits, A, Use %d for integers, printf sends formatted output to stdout, 1, vocabulary"} rows={5} mono />
      <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
        <button onClick={handleParse} style={{ padding: '7px 16px', borderRadius: '8px', border: '1px solid rgba(245,200,66,0.3)', background: 'rgba(245,200,66,0.1)', color: '#F5C842', cursor: 'pointer', fontSize: '0.8rem' }}>
          Preview Import
        </button>
        {result?.questions?.length > 0 && (
          <button onClick={() => { onImport(result.questions); setCsv(''); setResult(null) }} style={{ padding: '7px 16px', borderRadius: '8px', border: 'none', background: '#22c55e', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem' }}>
            ✓ Add {result.questions.length} Questions
          </button>
        )}
      </div>
      {result && (
        <div style={{ marginTop: '8px', fontSize: '0.72rem' }}>
          {result.questions.length > 0 && <div style={{ color: '#6ee7b7' }}>✓ {result.questions.length} questions parsed</div>}
          {result.errors.map((e, i) => <div key={i} style={{ color: '#fca5a5' }}>✗ {e}</div>)}
        </div>
      )}
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function StepQuestionBank({ campaign, onUpdate }) {
  const questions = campaign.questions || []
  const [editing, setEditing] = useState(null)   // null | 'new' | questionId
  const [filterFloor, setFilterFloor] = useState(null)
  const [filterType,  setFilterType]  = useState(null)
  const [showCsv, setShowCsv] = useState(false)

  const saveQuestion = (q) => {
    let updated
    if (editing === 'new') {
      updated = [...questions, q]
    } else {
      updated = questions.map(existing => existing.id === q.id ? q : existing)
    }
    onUpdate({ ...campaign, questions: updated })
    setEditing(null)
  }

  const deleteQ = (id) => onUpdate({ ...campaign, questions: questions.filter(q => q.id !== id) })

  const importMany = (qs) => onUpdate({ ...campaign, questions: [...questions, ...qs] })

  const visible = questions.filter(q =>
    (!filterFloor || q.floor_tier === filterFloor) &&
    (!filterType  || q.type === filterType)
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontFamily: "'Cinzel', serif", color: '#F5C842', fontSize: '1.2rem', margin: '0 0 4px' }}>Step 2 — Question Bank</h2>
        <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>Build the question pool for your campaign. Aim for 10+ per floor per type (green = good).</p>
      </div>

      {/* Coverage grid */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '14px' }}>
        <div style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>Question Coverage</div>
        <CoverageGrid questions={questions} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          onClick={() => { setEditing('new') }}
          style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg,#b45309,#F5C842)', color: '#1a0e00', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer' }}>
          + Add Question
        </motion.button>
        <button onClick={() => setShowCsv(s => !s)} style={{ padding: '8px 18px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#9ca3af', fontSize: '0.82rem', cursor: 'pointer' }}>
          {showCsv ? '▲ Hide' : '📋 Bulk Import'}
        </button>
        {/* Filters */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          <select value={filterFloor || ''} onChange={e => setFilterFloor(e.target.value ? Number(e.target.value) : null)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#9ca3af', padding: '6px 10px', fontSize: '0.75rem', cursor: 'pointer' }}>
            <option value="">All Floors</option>
            {FLOORS.map(f => <option key={f} value={f}>Floor {f}</option>)}
          </select>
          <select value={filterType || ''} onChange={e => setFilterType(e.target.value || null)}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px', color: '#9ca3af', padding: '6px 10px', fontSize: '0.75rem', cursor: 'pointer' }}>
            <option value="">All Types</option>
            {QUESTION_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {/* CSV import */}
      <AnimatePresence>
        {showCsv && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
          <CsvImport campaignCode={campaign.code} onImport={importMany} />
        </motion.div>}
      </AnimatePresence>

      {/* New question editor */}
      <AnimatePresence>
        {editing === 'new' && (
          <QuestionEditor
            q={makeBlankQuestion(campaign.code)}
            onSave={saveQuestion}
            onCancel={() => setEditing(null)}
          />
        )}
      </AnimatePresence>

      {/* Question list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#4b5563', fontSize: '0.85rem' }}>
            {questions.length === 0 ? 'No questions yet. Add your first one!' : 'No questions match this filter.'}
          </div>
        )}
        {visible.map(q => (
          <AnimatePresence key={q.id} mode="popLayout">
            {editing === q.id ? (
              <QuestionEditor q={q} onSave={saveQuestion} onCancel={() => setEditing(null)} />
            ) : (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                <span style={{ fontSize: '0.62rem', color: '#6b7280', fontFamily: 'monospace', flexShrink: 0 }}>F{q.floor_tier}</span>
                <span style={{
                  fontSize: '0.6rem', flexShrink: 0,
                  color: q.type === 'vocabulary' ? '#fca5a5' : q.type === 'grammar' ? '#93c5fd' : '#86efac',
                  background: q.type === 'vocabulary' ? 'rgba(239,68,68,0.1)' : q.type === 'grammar' ? 'rgba(59,130,246,0.1)' : 'rgba(34,197,94,0.1)',
                  border: `1px solid ${q.type === 'vocabulary' ? 'rgba(239,68,68,0.3)' : q.type === 'grammar' ? 'rgba(59,130,246,0.3)' : 'rgba(34,197,94,0.3)'}`,
                  borderRadius: '4px', padding: '1px 6px',
                }}>{q.type.slice(0, 4).toUpperCase()}</span>
                <span style={{ flex: 1, color: '#d1d5db', fontSize: '0.82rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.question || '(empty)'}</span>
                <button onClick={() => setEditing(q.id)} style={{ background: 'none', border: 'none', color: '#F5C842', cursor: 'pointer', fontSize: '0.75rem' }}>Edit</button>
                <button onClick={() => deleteQ(q.id)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.75rem' }}>✕</button>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
      <div style={{ fontSize: '0.68rem', color: '#4b5563', textAlign: 'center' }}>
        Total: {questions.length} question{questions.length !== 1 ? 's' : ''}
      </div>
    </div>
  )
}
