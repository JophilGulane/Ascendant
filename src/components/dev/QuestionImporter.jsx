// components/dev/QuestionImporter.jsx
// Dev-only GUI: paste or upload a CSV, preview rows, copy merged JSON.
// Only accessible at /dev/import — hidden in production.
// Built-in campaigns (japanese/korean/spanish): shows merged JSON to copy into the file.
// Custom campaigns (localStorage): saves directly.

import { useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

// ── CSV parser (handles quoted fields) ────────────────────────────────────────
function parseCSV(raw) {
  const rows = []
  let cur = '', inQ = false, cells = []

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i], nx = raw[i + 1]
    if (ch === '"') { if (inQ && nx === '"') { cur += '"'; i++ } else inQ = !inQ }
    else if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = '' }
    else if ((ch === '\n' || (ch === '\r' && nx === '\n')) && !inQ) {
      if (ch === '\r') i++
      cells.push(cur.trim()); rows.push(cells); cells = []; cur = ''
    } else cur += ch
  }
  if (cur.trim() || cells.length) { cells.push(cur.trim()); if (cells.some(Boolean)) rows.push(cells) }
  return rows
}

const CAMPAIGNS = ['japanese', 'korean', 'spanish']
const TYPES = ['vocabulary', 'grammar', 'reading']
const TIERS = [1, 2, 3, 4]

const REQUIRED_COLS = [
  'id','campaign','floor_tier','type','question',
  'opt1','opt2','opt3','opt4','correct_index',
  'hint','graveyard_label','graveyard_reading','tags',
]

function validateRow(row, i) {
  const errs = []
  if (!row.id)          errs.push('Missing id')
  if (!CAMPAIGNS.includes(row.campaign)) errs.push(`Invalid campaign "${row.campaign}"`)
  if (!TIERS.includes(row.floor_tier))   errs.push(`Invalid floor_tier "${row.floor_tier}"`)
  if (!TYPES.includes(row.type))         errs.push(`Invalid type "${row.type}"`)
  if (!row.question)    errs.push('Missing question')
  if (!row.opt1 || !row.opt2 || !row.opt3 || !row.opt4) errs.push('Need 4 options')
  if (![0,1,2,3].includes(row.correct_index)) errs.push(`Invalid correct_index "${row.correct_index}"`)
  if (!row.graveyard_label) errs.push('Missing graveyard_label')
  return errs
}

function csvRowToQuestion(row) {
  return {
    id:               row.id,
    campaign:         row.campaign,
    floor_tier:       row.floor_tier,
    type:             row.type,
    question:         row.question,
    options:          [row.opt1, row.opt2, row.opt3, row.opt4],
    correct_index:    row.correct_index,
    hint:             row.hint || '',
    graveyard_label:  row.graveyard_label,
    graveyard_reading: row.graveyard_reading || '',
    explanation:      row.explanation || '',
    tags:             (row.tags || '').split('|').map(t => t.trim()).filter(Boolean),
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:    { minHeight: '100vh', background: '#0d0d0d', color: '#e5e7eb', fontFamily: "'Inter', sans-serif", padding: '32px' },
  card:    { background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '24px', marginBottom: '20px' },
  label:   { fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7280', marginBottom: '6px' },
  input:   { width: '100%', background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#f3f4f6', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' },
  btn:     (color) => ({ padding: '10px 20px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', background: color, color: '#111', transition: 'opacity 0.15s' }),
  tag:     (ok) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: '5px', fontSize: '0.65rem', fontWeight: 700, background: ok ? '#065f46' : '#7f1d1d', color: ok ? '#6ee7b7' : '#fca5a5' }),
}

const TEMPLATE = `id,campaign,floor_tier,type,question,opt1,opt2,opt3,opt4,correct_index,hint,graveyard_label,graveyard_reading,explanation,tags
jp_vocab_NEW,japanese,1,vocabulary,What does 猫 (neko) mean?,Cat,Dog,Fish,Bird,0,Used in: 猫が好き — I like cats.,猫,neko,Common noun for cat.,animal|noun|basic`

// ── Main component ────────────────────────────────────────────────────────────
export function QuestionImporter() {
  const navigate = useNavigate()
  const fileRef  = useRef(null)

  const [csvText,   setCsvText]   = useState('')
  const [rows,      setRows]      = useState([])   // parsed + validated
  const [errors,    setErrors]    = useState([])   // per-row errors
  const [overwrite, setOverwrite] = useState(false)
  const [copied,    setCopied]    = useState(false)
  const [jsonOut,   setJsonOut]   = useState('')
  const [status,    setStatus]    = useState(null) // { ok, msg }

  // Only available in dev mode
  if (!import.meta.env.DEV) {
    return (
      <div style={{ ...S.page, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: '1rem' }}>🔒 Dev tool — not available in production.</div>
      </div>
    )
  }

  const handleParse = useCallback(() => {
    setStatus(null); setJsonOut(''); setRows([]); setErrors([])
    if (!csvText.trim()) return

    const parsed = parseCSV(csvText)
    if (parsed.length < 2) { setStatus({ ok: false, msg: 'CSV looks empty — need at least a header row and one data row.' }); return }

    const headers = parsed[0].map(h => h.toLowerCase().trim())
    const missing = REQUIRED_COLS.filter(c => !headers.includes(c))
    if (missing.length) { setStatus({ ok: false, msg: `Missing columns: ${missing.join(', ')}` }); return }

    const col = h => headers.indexOf(h)
    const parsedRows = [], rowErrors = []

    parsed.slice(1).forEach((cells, i) => {
      if (cells.every(c => !c)) return
      const lineNum = i + 2
      const row = {
        id:               cells[col('id')] || '',
        campaign:         cells[col('campaign')] || '',
        floor_tier:       parseInt(cells[col('floor_tier')], 10),
        type:             cells[col('type')] || '',
        question:         cells[col('question')] || '',
        opt1:             cells[col('opt1')] || '',
        opt2:             cells[col('opt2')] || '',
        opt3:             cells[col('opt3')] || '',
        opt4:             cells[col('opt4')] || '',
        correct_index:    parseInt(cells[col('correct_index')], 10),
        hint:             cells[col('hint')] || '',
        graveyard_label:  cells[col('graveyard_label')] || '',
        graveyard_reading: cells[col('graveyard_reading')] || '',
        explanation:      headers.includes('explanation') ? (cells[col('explanation')] || '') : '',
        tags:             cells[col('tags')] || '',
        _line:            lineNum,
        _errs:            validateRow({ ...cells, ...({ id: cells[col('id')] || '', campaign: cells[col('campaign')] || '', floor_tier: parseInt(cells[col('floor_tier')], 10), type: cells[col('type')] || '', question: cells[col('question')] || '', opt1: cells[col('opt1')], opt2: cells[col('opt2')], opt3: cells[col('opt3')], opt4: cells[col('opt4')], correct_index: parseInt(cells[col('correct_index')], 10), graveyard_label: cells[col('graveyard_label')] || '' }) }, lineNum),
      }
      row._errs = validateRow(row, lineNum)
      parsedRows.push(row)
      if (row._errs.length) rowErrors.push({ line: lineNum, id: row.id, errs: row._errs })
    })

    setRows(parsedRows)
    setErrors(rowErrors)
    if (rowErrors.length === 0) setStatus({ ok: true, msg: `✓ ${parsedRows.length} rows parsed — no errors.` })
    else setStatus({ ok: false, msg: `${rowErrors.length} row(s) have errors (shown below). Fix them before generating JSON.` })
  }, [csvText])

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => { setCsvText(ev.target.result); setRows([]); setErrors([]) }
    reader.readAsText(file)
  }

  const handleGenerateJSON = useCallback(async () => {
    if (rows.length === 0 || errors.length > 0) return

    // Group by campaign
    const byCampaign = {}
    for (const row of rows) {
      if (!byCampaign[row.campaign]) byCampaign[row.campaign] = []
      byCampaign[row.campaign].push(csvRowToQuestion(row))
    }

    // Load existing questions for each campaign via fetch (Vite serves them as static)
    const output = {}
    for (const [camp, newQs] of Object.entries(byCampaign)) {
      try {
        const res  = await fetch(`/src/data/${camp}/questions.json`)
        const existing = res.ok ? await res.json() : []
        const existMap = new Map(existing.map(q => [q.id, q]))

        let added = 0, skipped = 0, replaced = 0
        for (const q of newQs) {
          if (existMap.has(q.id)) {
            if (overwrite) { existMap.set(q.id, q); replaced++ }
            else skipped++
          } else { existMap.set(q.id, q); added++ }
        }
        output[camp] = { merged: Array.from(existMap.values()), added, replaced, skipped }
      } catch {
        output[camp] = { merged: newQs, added: newQs.length, replaced: 0, skipped: 0, error: 'Could not load existing file — showing new rows only' }
      }
    }

    // Show JSON for copy-paste
    const parts = Object.entries(output).map(([camp, { merged, added, replaced, skipped, error }]) =>
      `/* ── ${camp.toUpperCase()} ── added:${added} replaced:${replaced} skipped:${skipped}${error ? ' ⚠ ' + error : ''}\n   Paste this into src/data/${camp}/questions.json */\n` +
      JSON.stringify(merged, null, 2)
    )
    setJsonOut(parts.join('\n\n'))
  }, [rows, errors, overwrite])

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonOut).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const validRows   = rows.filter(r => r._errs.length === 0)
  const invalidRows = rows.filter(r => r._errs.length > 0)

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
        <button onClick={() => navigate('/')} style={{ ...S.btn('#374151'), color: '#d1d5db', padding: '8px 14px' }}>← Menu</button>
        <div>
          <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.4rem', color: '#F5C842', margin: 0 }}>📋 Bulk Question Importer</h1>
          <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '2px' }}>Dev tool — paste or upload a CSV to bulk-add questions to any campaign</div>
        </div>
        <div style={{ marginLeft: 'auto', padding: '4px 12px', borderRadius: '6px', background: '#7c3aed22', border: '1px solid #7c3aed66', color: '#a78bfa', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em' }}>
          DEV ONLY
        </div>
      </div>

      {/* CSV Input */}
      <div style={S.card}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 600, flex: 1 }}>1. Paste CSV or upload a file</div>
          <button onClick={() => fileRef.current?.click()} style={{ ...S.btn('#1f2937'), color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
            📁 Upload .csv
          </button>
          <button onClick={() => { setCsvText(TEMPLATE); setRows([]); setErrors([]) }} style={{ ...S.btn('#1f2937'), color: '#9ca3af', border: '1px solid rgba(255,255,255,0.1)' }}>
            📄 Load Template
          </button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} style={{ display: 'none' }} />
        </div>

        <div style={{ ...S.label }}>
          Required columns: id, campaign, floor_tier, type, question, opt1–opt4, correct_index, hint, graveyard_label, graveyard_reading, tags&nbsp;
          <span style={{ color: '#4b5563' }}>(pipe-separated: verb|food|basic)</span>
        </div>

        <textarea
          value={csvText}
          onChange={e => { setCsvText(e.target.value); setRows([]); setErrors([]) }}
          placeholder={TEMPLATE}
          style={{ ...S.input, height: '180px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.78rem', lineHeight: 1.5 }}
        />

        <div style={{ display: 'flex', gap: '12px', marginTop: '12px', alignItems: 'center' }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleParse}
            style={{ ...S.btn('linear-gradient(135deg,#b45309,#F5C842)'), padding: '11px 28px' }}>
            Parse CSV
          </motion.button>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#9ca3af', cursor: 'pointer', userSelect: 'none' }}>
            <input type="checkbox" checked={overwrite} onChange={e => setOverwrite(e.target.checked)} style={{ accentColor: '#F5C842' }} />
            Overwrite existing IDs
          </label>
        </div>
      </div>

      {/* Status */}
      <AnimatePresence>
        {status && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.83rem', fontWeight: 600,
              background: status.ok ? '#064e3b' : '#450a0a', border: `1px solid ${status.ok ? '#059669' : '#dc2626'}`,
              color: status.ok ? '#6ee7b7' : '#fca5a5' }}>
            {status.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Validation errors */}
      {invalidRows.length > 0 && (
        <div style={{ ...S.card, border: '1px solid #7f1d1d' }}>
          <div style={{ color: '#fca5a5', fontWeight: 700, marginBottom: '10px', fontSize: '0.85rem' }}>
            ✗ {invalidRows.length} row(s) with errors — these will be skipped:
          </div>
          {errors.map(({ line, id, errs }) => (
            <div key={line} style={{ marginBottom: '6px', fontSize: '0.78rem', color: '#f87171' }}>
              Line {line} ({id || 'no id'}): {errs.join(' · ')}
            </div>
          ))}
        </div>
      )}

      {/* Preview table */}
      {validRows.length > 0 && (
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>2. Preview — {validRows.length} valid row(s)</div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleGenerateJSON}
              style={{ ...S.btn('linear-gradient(135deg,#1d4ed8,#3b82f6)'), color: '#fff', marginLeft: 'auto' }}>
              Generate Merged JSON →
            </motion.button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Line','ID','Campaign','Tier','Type','Question','Correct Ans','Tags'].map(h => (
                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: '#6b7280', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {validRows.map((row, i) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    <td style={{ padding: '6px 10px', color: '#4b5563' }}>{row._line}</td>
                    <td style={{ padding: '6px 10px', fontFamily: 'monospace', color: '#a78bfa' }}>{row.id}</td>
                    <td style={{ padding: '6px 10px' }}><span style={S.tag(true)}>{row.campaign}</span></td>
                    <td style={{ padding: '6px 10px', color: '#fbbf24' }}>{row.floor_tier}</td>
                    <td style={{ padding: '6px 10px' }}><span style={S.tag(TYPES.includes(row.type))}>{row.type}</span></td>
                    <td style={{ padding: '6px 10px', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.question}>{row.question}</td>
                    <td style={{ padding: '6px 10px', color: '#6ee7b7' }}>{['opt1','opt2','opt3','opt4'][row.correct_index] ? row[['opt1','opt2','opt3','opt4'][row.correct_index]] : '?'}</td>
                    <td style={{ padding: '6px 10px', color: '#60a5fa', fontFamily: 'monospace', fontSize: '0.7rem' }}>{row.tags}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* JSON output */}
      {jsonOut && (
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>3. Copy JSON → paste into <code style={{ color: '#a78bfa' }}>src/data/[campaign]/questions.json</code></div>
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleCopy}
              style={{ ...S.btn(copied ? '#064e3b' : '#F5C842'), marginLeft: 'auto', border: copied ? '1px solid #059669' : 'none' }}>
              {copied ? '✓ Copied!' : '📋 Copy JSON'}
            </motion.button>
          </div>
          <textarea
            readOnly value={jsonOut}
            style={{ ...S.input, height: '340px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.72rem', lineHeight: 1.5, color: '#86efac' }}
          />
          <div style={{ marginTop: '10px', fontSize: '0.72rem', color: '#6b7280', lineHeight: 1.6 }}>
            ① Copy the JSON above &nbsp;→&nbsp; ② Open <code>src/data/[campaign]/questions.json</code> in your editor &nbsp;→&nbsp; ③ Replace the file contents &nbsp;→&nbsp; ④ Vite hot-reloads automatically.
          </div>
        </div>
      )}
    </div>
  )
}
