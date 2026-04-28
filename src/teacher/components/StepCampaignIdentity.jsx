// teacher/components/StepCampaignIdentity.jsx
// Step 1 of Lesson Builder: Campaign name, theme preset, description, subject tag.

import { motion } from 'framer-motion'
import { THEME_PRESETS, SUBJECT_TAGS } from '../teacherService.js'

function Label({ children, required }) {
  return (
    <label style={{ fontSize: '0.68rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '6px' }}>
      {children}{required && <span style={{ color: '#fca5a5', marginLeft: '4px' }}>*</span>}
    </label>
  )
}

function TextInput({ id, value, onChange, placeholder, maxLength, multiline }) {
  const shared = {
    id,
    value,
    onChange: e => onChange(e.target.value),
    placeholder,
    maxLength,
    style: {
      width: '100%', background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
      padding: '10px 14px', color: '#f3f4f6', fontSize: '0.88rem',
      outline: 'none', boxSizing: 'border-box', resize: multiline ? 'vertical' : 'none',
      fontFamily: 'inherit',
    },
    onFocus: e => e.target.style.borderColor = '#F5C842',
    onBlur:  e => e.target.style.borderColor = 'rgba(255,255,255,0.12)',
  }
  return multiline
    ? <textarea {...shared} rows={3} />
    : <input {...shared} type="text" />
}

export function StepCampaignIdentity({ data, onChange }) {
  const update = (key, value) => onChange({ ...data, [key]: value })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontFamily: "'Cinzel', serif", color: '#F5C842', fontSize: '1.2rem', margin: '0 0 4px' }}>
          Step 1 — Campaign Identity
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>
          Set up your campaign's name, world, and description. Students will see this on the campaign select screen.
        </p>
      </div>

      {/* Campaign Name */}
      <div>
        <Label required>Campaign Name</Label>
        <TextInput
          id="camp-name"
          value={data.name}
          onChange={v => update('name', v)}
          placeholder='e.g., "C Programming Fundamentals"'
          maxLength={60}
        />
        <div style={{ textAlign: 'right', fontSize: '0.62rem', color: '#4b5563', marginTop: '4px' }}>
          {(data.name || '').length}/60
        </div>
      </div>

      {/* World Theme */}
      <div>
        <Label>World Theme</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {THEME_PRESETS.map(theme => (
            <motion.button
              key={theme.id}
              onClick={() => update('themeId', theme.id)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '12px 10px',
                borderRadius: '12px',
                border: data.themeId === theme.id
                  ? `2px solid ${theme.accent}`
                  : '2px solid rgba(255,255,255,0.08)',
                background: data.themeId === theme.id
                  ? `${theme.bg}, rgba(255,255,255,0.04)`
                  : 'rgba(255,255,255,0.03)',
                color: data.themeId === theme.id ? theme.accent : '#9ca3af',
                fontSize: '0.75rem',
                fontWeight: data.themeId === theme.id ? 700 : 400,
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s',
              }}
            >
              {theme.label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Description */}
      <div>
        <Label required>Campaign Description</Label>
        <TextInput
          id="camp-desc"
          value={data.description}
          onChange={v => update('description', v)}
          placeholder='e.g., "Master C syntax and programming logic across 4 floors"'
          maxLength={200}
          multiline
        />
        <div style={{ textAlign: 'right', fontSize: '0.62rem', color: '#4b5563', marginTop: '4px' }}>
          {(data.description || '').length}/200
        </div>
      </div>

      {/* Subject Tag */}
      <div>
        <Label>Subject Tag</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {SUBJECT_TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => update('subject', tag)}
              style={{
                padding: '6px 16px',
                borderRadius: '20px',
                border: data.subject === tag ? '1px solid #F5C842' : '1px solid rgba(255,255,255,0.12)',
                background: data.subject === tag ? 'rgba(245,200,66,0.12)' : 'rgba(255,255,255,0.04)',
                color: data.subject === tag ? '#F5C842' : '#9ca3af',
                fontSize: '0.78rem',
                fontWeight: data.subject === tag ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.18s',
              }}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div>
        <Label>Visibility</Label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[
            { id: 'class', label: '🔒 Class Only', desc: 'Only students with your Campaign Code can access it.' },
            { id: 'public', label: '🌐 Public', desc: 'Listed in the community library for any teacher to discover.' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => update('visibility', opt.id)}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', textAlign: 'left',
                border: data.visibility === opt.id ? '2px solid #F5C842' : '2px solid rgba(255,255,255,0.08)',
                background: data.visibility === opt.id ? 'rgba(245,200,66,0.08)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, color: data.visibility === opt.id ? '#F5C842' : '#f3f4f6', fontSize: '0.82rem', marginBottom: '4px' }}>
                {opt.label}
              </div>
              <div style={{ color: '#6b7280', fontSize: '0.68rem' }}>{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
