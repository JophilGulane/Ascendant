// teacher/components/AIQuestionPreview.jsx
// Single-question approval card shown inside AIGeneratorPanel.
// Displays question text, answer options (correct highlighted), hint, graveyard label.
// Approve → adds to bank. Reject → removes from generated list.

import { useState } from 'react'
import { motion } from 'framer-motion'

export function AIQuestionPreview({ question, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false)
  const q = question

  const typeColor = {
    vocabulary: '#fbbf24',
    grammar:    '#60a5fa',
    reading:    '#4ade80',
  }[q.type] || '#9ca3af'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: '10px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Collapsed header — always visible */}
      <div
        onClick={() => setExpanded(p => !p)}
        style={{
          padding: '10px 12px', cursor: 'pointer',
          display: 'flex', alignItems: 'flex-start', gap: '8px',
        }}
      >
        <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: `${typeColor}20`, color: typeColor, flexShrink: 0, marginTop: '1px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {q.type?.slice(0, 4)}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.78rem', color: '#e5e7eb', lineHeight: 1.4, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded ? 'normal' : 'nowrap' }}>
            {q.question}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '2px' }}>
            ✓ {q.options?.[q.correct_index]}
            {q.graveyard_label && <span style={{ marginLeft: '6px', color: '#4b5563' }}>· {q.graveyard_label}</span>}
          </div>
        </div>
        <span style={{ color: '#4b5563', fontSize: '0.7rem', flexShrink: 0 }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: '0 12px 10px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px' }}>
            {q.options?.map((opt, i) => (
              <div key={i} style={{
                padding: '5px 10px', borderRadius: '6px', fontSize: '0.75rem',
                background: i === q.correct_index ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${i === q.correct_index ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.06)'}`,
                color: i === q.correct_index ? '#6ee7b7' : '#9ca3af',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>{['A','B','C','D'][i]}</span>
                {opt}
                {i === q.correct_index && <span style={{ marginLeft: 'auto', fontSize: '0.65rem', color: '#4ade80' }}>✓</span>}
              </div>
            ))}
          </div>

          {/* Hint */}
          {q.hint && (
            <div style={{ marginTop: '8px', padding: '6px 10px', borderRadius: '6px', background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.12)', fontSize: '0.72rem', color: '#93c5fd', fontStyle: 'italic' }}>
              💡 {q.hint}
            </div>
          )}

          {/* Explanation */}
          {q.explanation && (
            <div style={{ marginTop: '6px', fontSize: '0.7rem', color: '#6b7280', lineHeight: 1.5 }}>
              {q.explanation}
            </div>
          )}

          {/* Tags */}
          {q.tags?.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '8px' }}>
              {q.tags.map(t => (
                <span key={t} style={{ padding: '2px 7px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', fontSize: '0.6rem', color: '#6b7280' }}>{t}</span>
              ))}
            </div>
          )}

          {/* AI badge */}
          <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.58rem', color: '#7c3aed', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: '4px', padding: '1px 5px', fontWeight: 700 }}>AI</span>
            <span style={{ fontSize: '0.6rem', color: '#374151', fontFamily: 'monospace' }}>{q.id}</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={onApprove}
          style={{
            flex: 1, padding: '7px', border: 'none', borderRight: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(34,197,94,0.08)', color: '#6ee7b7', fontSize: '0.72rem',
            fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(34,197,94,0.18)'}
          onMouseLeave={e => e.target.style.background = 'rgba(34,197,94,0.08)'}
        >
          ✓ Add to Bank
        </button>
        <button
          onClick={onReject}
          style={{
            flex: 1, padding: '7px', border: 'none',
            background: 'rgba(239,68,68,0.06)', color: '#fca5a5', fontSize: '0.72rem',
            fontWeight: 700, cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.14)'}
          onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.06)'}
        >
          ✗ Discard
        </button>
      </div>
    </motion.div>
  )
}
