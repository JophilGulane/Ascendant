// teacher/components/AIGeneratorPanel.jsx
// Generator configuration UI — API key entry, model picker, generation params.
// Drops into StepQuestionBank as a collapsible side panel.
// Props:
//   campaign       — active campaign object
//   onApprove(qs)  — called with approved question array to merge into bank
//   onClose()      — close the panel

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AI_MODELS, saveApiKey, getApiKey, clearApiKey, hasApiKey, fetchCredits } from '../ai/openRouterClient.js'
import { generateQuestions } from '../ai/questionGenerator.js'
import { AIQuestionPreview } from './AIQuestionPreview.jsx'

const FIELD = {
  label: { fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '5px' },
  input: { width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#f3f4f6', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' },
  select: { width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#f3f4f6', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' },
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={FIELD.label}>{label}</div>
      {children}
    </div>
  )
}

function KeySection({ onKeySet }) {
  const [key, setKey] = useState('')
  const [credits, setCredits] = useState(null)
  const [checking, setChecking] = useState(false)
  const [msg, setMsg] = useState(null)
  const already = hasApiKey()

  const handleSave = async () => {
    if (!key.trim()) return
    saveApiKey(key.trim())
    setChecking(true); setMsg(null)
    const c = await fetchCredits()
    setChecking(false)
    if (c) {
      setCredits(c)
      setMsg({ ok: true, text: c.credits != null ? `✓ Key valid · $${Number(c.credits).toFixed(4)} remaining` : '✓ Key accepted' })
      onKeySet?.()
    } else {
      setMsg({ ok: false, text: 'Key saved but could not verify credits. Proceed anyway.' })
      onKeySet?.()
    }
    setKey('')
  }

  const handleClear = () => { clearApiKey(); setCredits(null); setMsg(null) }

  return (
    <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)', marginBottom: '18px' }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#a78bfa', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>🔑 OpenRouter API Key</div>
      {already && !key ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.78rem', color: '#6ee7b7' }}>✓ Key stored (session only)</span>
          <button onClick={handleClear} style={{ background: 'none', border: 'none', color: '#fca5a5', fontSize: '0.72rem', cursor: 'pointer' }}>Clear</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="password" value={key} onChange={e => setKey(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="sk-or-v1-…"
            style={{ ...FIELD.input, flex: 1 }}
          />
          <button onClick={handleSave} disabled={!key.trim() || checking}
            style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {checking ? '…' : 'Save'}
          </button>
        </div>
      )}
      {msg && <div style={{ fontSize: '0.72rem', marginTop: '6px', color: msg.ok ? '#6ee7b7' : '#fcd34d' }}>{msg.text}</div>}
      <div style={{ fontSize: '0.65rem', color: '#4b5563', marginTop: '6px' }}>
        Key is stored in browser session only — never saved to disk.{' '}
        <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ color: '#7c3aed' }}>Get a key ↗</a>
      </div>
    </div>
  )
}

export function AIGeneratorPanel({ campaign, onApprove, onClose }) {
  const [keySet,    setKeySet]   = useState(hasApiKey())
  const [model,     setModel]    = useState(AI_MODELS[0].id)
  const [topic,     setTopic]    = useState('')
  const [qType,     setQType]    = useState('vocabulary')
  const [floorTier, setFloor]    = useState(1)
  const [count,     setCount]    = useState(5)
  const [tags,      setTags]     = useState('')
  const [status,    setStatus]   = useState('')
  const [loading,   setLoading]  = useState(false)
  const [generated, setGenerated] = useState([]) // Questions awaiting preview
  const [errors,    setErrors]   = useState([])
  const [rawResp,   setRawResp]  = useState('')
  const [showRaw,   setShowRaw]  = useState(false)

  const subject = campaign?.subject || campaign?.name || 'Language'

  const handleGenerate = useCallback(async () => {
    if (!hasApiKey()) { setStatus('❌ Add your API key first.'); return }
    if (!topic.trim()) { setStatus('❌ Enter a topic.'); return }

    setLoading(true); setErrors([]); setGenerated([]); setRawResp('')

    try {
      const { questions, errors: errs, rawResponse } = await generateQuestions({
        model,
        campaignId:   campaign.id || campaign.code,
        campaignName: campaign.name,
        subject,
        topic:        topic.trim(),
        questionType: qType,
        floorTier:    Number(floorTier),
        count:        Number(count),
        tags:         tags.trim() || `${subject.toLowerCase()},floor${floorTier}`,
        existingQuestions: campaign.questions || [],
        onProgress: s => setStatus(s),
      })
      setGenerated(questions)
      setErrors(errs)
      setRawResp(rawResponse)
      if (questions.length === 0) setStatus(`⚠ No valid questions parsed. ${errs.length} error(s).`)
      else setStatus(`✓ ${questions.length} question${questions.length > 1 ? 's' : ''} ready for review`)
    } catch (e) {
      setStatus(`❌ ${e.message}`)
    } finally {
      setLoading(false)
    }
  }, [model, topic, qType, floorTier, count, tags, campaign, subject])

  const handleApproveAll = () => {
    onApprove(generated)
    setGenerated([])
    setStatus(`✓ ${generated.length} questions added to the bank`)
  }

  const handleApproveOne = (q) => {
    onApprove([q])
    setGenerated(prev => prev.filter(x => x.id !== q.id))
  }

  const handleRejectOne = (q) => {
    setGenerated(prev => prev.filter(x => x.id !== q.id))
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
      style={{
        width: '380px', flexShrink: 0, background: '#0a0a12',
        borderLeft: '1px solid rgba(124,58,237,0.3)',
        display: 'flex', flexDirection: 'column',
        height: '100%', overflowY: 'auto',
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontFamily: "'Cinzel', serif", fontWeight: 700, color: '#a78bfa', fontSize: '0.9rem' }}>🤖 AI Question Generator</div>
          <div style={{ fontSize: '0.65rem', color: '#4b5563', marginTop: '2px' }}>Powered by OpenRouter</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
      </div>

      <div style={{ padding: '16px 18px', flex: 1, overflowY: 'auto' }}>
        <KeySection onKeySet={() => setKeySet(true)} />

        {/* Generation form */}
        <Field label="Model">
          <select value={model} onChange={e => setModel(e.target.value)} style={FIELD.select}>
            {AI_MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.label}{m.costPer1k === 0 ? ' (free)' : ''}</option>
            ))}
          </select>
        </Field>

        <Field label="Topic / Focus *">
          <input value={topic} onChange={e => setTopic(e.target.value)}
            placeholder={`e.g. "Japanese verbs Group 2" or "Python for loops"`}
            style={FIELD.input}
          />
        </Field>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <Field label="Question Type">
              <select value={qType} onChange={e => setQType(e.target.value)} style={FIELD.select}>
                <option value="vocabulary">Vocabulary</option>
                <option value="grammar">Grammar</option>
                <option value="reading">Reading</option>
              </select>
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Floor Tier">
              <select value={floorTier} onChange={e => setFloor(Number(e.target.value))} style={FIELD.select}>
                <option value={1}>1 — Beginner</option>
                <option value={2}>2 — Elementary</option>
                <option value={3}>3 — Intermediate</option>
                <option value={4}>4 — Advanced</option>
              </select>
            </Field>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ flex: 1 }}>
            <Field label="Count (max 10)">
              <input type="number" min={1} max={10} value={count} onChange={e => setCount(Number(e.target.value))} style={FIELD.input} />
            </Field>
          </div>
          <div style={{ flex: 1 }}>
            <Field label="Tags (pipe-sep)">
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="verb|basic|food" style={FIELD.input} />
            </Field>
          </div>
        </div>

        {/* Generate button */}
        <motion.button
          onClick={handleGenerate} disabled={loading}
          whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
            background: loading ? '#374151' : 'linear-gradient(135deg,#5b21b6,#7c3aed)',
            color: loading ? '#6b7280' : '#fff', fontWeight: 700, fontSize: '0.85rem',
            cursor: loading ? 'not-allowed' : 'pointer', marginBottom: '12px',
          }}
        >
          {loading ? '⟳ Generating…' : '✨ Generate Questions'}
        </motion.button>

        {/* Status line */}
        {status && (
          <div style={{ fontSize: '0.75rem', color: status.startsWith('❌') ? '#fca5a5' : status.startsWith('⚠') ? '#fcd34d' : '#6ee7b7', marginBottom: '12px', lineHeight: 1.5 }}>
            {status}
          </div>
        )}

        {/* Errors from validation */}
        {errors.length > 0 && (
          <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', marginBottom: '12px' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, color: '#fca5a5', marginBottom: '4px' }}>Validation Errors</div>
            {errors.map((e, i) => <div key={i} style={{ fontSize: '0.7rem', color: '#f87171' }}>{e}</div>)}
          </div>
        )}

        {/* Question preview list */}
        {generated.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {generated.length} Generated
              </div>
              <button onClick={handleApproveAll}
                style={{ padding: '5px 12px', borderRadius: '7px', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', color: '#6ee7b7', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                ✓ Add All
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {generated.map(q => (
                <AIQuestionPreview key={q.id} question={q} onApprove={() => handleApproveOne(q)} onReject={() => handleRejectOne(q)} />
              ))}
            </div>
          </div>
        )}

        {/* Raw response toggle */}
        {rawResp && (
          <div style={{ marginTop: '12px' }}>
            <button onClick={() => setShowRaw(p => !p)}
              style={{ background: 'none', border: 'none', color: '#4b5563', fontSize: '0.68rem', cursor: 'pointer', padding: 0 }}>
              {showRaw ? '▲ Hide' : '▼ Show'} raw model response
            </button>
            {showRaw && (
              <textarea readOnly value={rawResp}
                style={{ ...FIELD.input, marginTop: '6px', height: '140px', fontFamily: 'monospace', fontSize: '0.65rem', color: '#6b7280', resize: 'vertical' }}
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
