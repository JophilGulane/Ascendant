// teacher/components/StepPublish.jsx
// Step 4: Validation summary, publish/unpublish, campaign code display, update flow.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { validateCampaign, publishCampaign, saveCampaignDraft, THEME_PRESETS, SUBJECT_TAGS } from '../teacherService.js'

function SectionCard({ title, children, accent = '#F5C842' }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.09)`,
      borderRadius: '14px', padding: '18px',
    }}>
      <div style={{ fontSize: '0.68rem', color: accent, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px', fontWeight: 700 }}>
        {title}
      </div>
      {children}
    </div>
  )
}

function StatRow({ label, value, ok, warn, detail }) {
  const color = ok ? '#6ee7b7' : warn ? '#fde047' : '#fca5a5'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontSize: '0.82rem', color: '#d1d5db' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontWeight: 700, color, fontSize: '0.82rem' }}>{value}</span>
        {detail && <div style={{ fontSize: '0.62rem', color: '#6b7280' }}>{detail}</div>}
      </div>
    </div>
  )
}

function CampaignCodeBox({ code }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '12px 0' }}>
      <div style={{
        fontFamily: 'monospace', fontSize: '2rem', fontWeight: 900, letterSpacing: '0.25em',
        color: '#F5C842', background: 'rgba(245,200,66,0.1)',
        border: '2px solid rgba(245,200,66,0.3)', borderRadius: '12px',
        padding: '12px 24px',
      }}>{code}</div>
      <motion.button
        onClick={copy}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        style={{
          padding: '10px 18px', borderRadius: '10px', border: 'none',
          background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.08)',
          color: copied ? '#6ee7b7' : '#d1d5db',
          fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {copied ? '✓ Copied!' : '📋 Copy'}
      </motion.button>
    </div>
  )
}

export function StepPublish({ campaign, onUpdate, onPublished }) {
  const [publishing, setPublishing] = useState(false)
  const [result, setResult] = useState(null)

  const { errors, warnings } = validateCampaign(campaign)
  const isPublished = !campaign.isDraft && !!campaign.publishedAt
  const theme = THEME_PRESETS.find(t => t.id === campaign.themeId) || THEME_PRESETS[0]

  const questions   = campaign.questions || []
  const enemies     = campaign.enemies   || []
  const totalQ      = questions.length
  const totalE      = enemies.length
  const uniqueFloors = [...new Set(questions.map(q => q.floor_tier))].length

  const handlePublish = () => {
    setPublishing(true)
    // Save latest state first, then publish
    saveCampaignDraft(campaign.code, campaign)
    const pub = publishCampaign(campaign.code)
    setPublishing(false)
    setResult(pub)
    if (pub.ok) onPublished?.(pub.campaign)
  }

  const handleSaveDraft = () => {
    saveCampaignDraft(campaign.code, campaign)
    setResult({ ok: true, message: 'Draft saved!' })
    setTimeout(() => setResult(null), 2000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontFamily: "'Cinzel', serif", color: '#F5C842', fontSize: '1.2rem', margin: '0 0 4px' }}>
          Step 4 — Publish & Share
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>
          Review your campaign, fix any issues, then publish. Students enter the Campaign Code to unlock it.
        </p>
      </div>

      {/* Campaign summary */}
      <SectionCard title="Campaign Summary">
        <StatRow label="Name"        value={campaign.name || '(none)'}   ok={!!campaign.name} />
        <StatRow label="Theme"       value={theme.label}                  ok />
        <StatRow label="Subject"     value={campaign.subject || 'Other'}  ok />
        <StatRow label="Visibility"  value={campaign.visibility === 'public' ? '🌐 Public' : '🔒 Class Only'} ok />
        <StatRow label="Description" value={campaign.description?.length ? `${campaign.description.length} chars` : '(none)'} ok={!!campaign.description} />
        <StatRow label="Questions"   value={totalQ} ok={totalQ >= 40} warn={totalQ > 0 && totalQ < 40} detail={totalQ < 40 ? `Aim for 40+ total (10/floor minimum)` : undefined} />
        <StatRow label="Floors covered" value={`${uniqueFloors}/4`}  ok={uniqueFloors === 4} warn={uniqueFloors > 0 && uniqueFloors < 4} />
        <StatRow label="Enemies"     value={totalE} ok={totalE >= 4} warn={totalE > 0 && totalE < 4} detail={totalE < 4 ? 'Aim for 2 per floor (8 total)' : undefined} />
      </SectionCard>

      {/* Errors */}
      {errors.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '14px' }}>
          <div style={{ fontWeight: 700, color: '#fca5a5', marginBottom: '8px', fontSize: '0.82rem' }}>
            ✗ Fix before publishing:
          </div>
          {errors.map((e, i) => (
            <div key={i} style={{ fontSize: '0.78rem', color: '#fca5a5', marginBottom: '4px' }}>• {e}</div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: '12px', padding: '14px' }}>
          <div style={{ fontWeight: 700, color: '#fde047', marginBottom: '8px', fontSize: '0.82rem' }}>
            ⚠ Recommendations (optional):
          </div>
          <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {warnings.map((w, i) => (
              <div key={i} style={{ fontSize: '0.72rem', color: '#fde047' }}>• {w}</div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Code (shown after publish) */}
      {isPublished && (
        <SectionCard title="Campaign Code — Share with Students" accent="#F5C842">
          <p style={{ color: '#9ca3af', fontSize: '0.78rem', margin: '0 0 8px' }}>
            Students enter this code in the Campaign Select screen to unlock your campaign.
          </p>
          <CampaignCodeBox code={campaign.code} />
          <div style={{ fontSize: '0.7rem', color: '#4b5563' }}>
            Published {campaign.publishedAt ? new Date(campaign.publishedAt).toLocaleDateString() : ''}
            {campaign.updatedAt > campaign.publishedAt && ' · Updates saved (republish to push to students)'}
          </div>
        </SectionCard>
      )}

      {/* Result message */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{
              padding: '12px 16px', borderRadius: '10px',
              background: result.ok ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
              border: `1px solid ${result.ok ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
              color: result.ok ? '#6ee7b7' : '#fca5a5', fontSize: '0.82rem',
            }}
          >
            {result.ok ? (result.message || `✓ Campaign published! Code: ${campaign.code}`) : `✗ ${result.errors?.join(', ') || result.error}`}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleSaveDraft}
          style={{
            padding: '11px 20px', borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
            color: '#d1d5db', fontSize: '0.85rem', cursor: 'pointer',
          }}
        >
          💾 Save Draft
        </button>
        <motion.button
          onClick={handlePublish}
          disabled={errors.length > 0 || publishing}
          whileHover={errors.length === 0 ? { scale: 1.03 } : {}}
          whileTap={errors.length === 0 ? { scale: 0.97 } : {}}
          style={{
            flex: 1, padding: '11px 20px', borderRadius: '10px', border: 'none',
            background: errors.length > 0 || publishing
              ? 'rgba(245,200,66,0.2)' : 'linear-gradient(135deg, #b45309, #F5C842)',
            color: errors.length > 0 || publishing ? '#6b7280' : '#1a0e00',
            fontWeight: 700, fontSize: '0.9rem',
            cursor: errors.length > 0 || publishing ? 'not-allowed' : 'pointer',
            fontFamily: "'Cinzel', serif",
          }}
        >
          {publishing ? 'Publishing...' : isPublished ? '🔄 Republish (Push Updates)' : '🚀 Publish Campaign'}
        </motion.button>
      </div>

      {/* Integration callout */}
      <div style={{
        background: 'rgba(168,85,247,0.07)', border: '1px solid rgba(168,85,247,0.2)',
        borderRadius: '12px', padding: '14px 16px', fontSize: '0.75rem', color: '#c084fc',
        display: 'flex', flexDirection: 'column', gap: '5px',
      }}>
        <div style={{ fontWeight: 700, marginBottom: '4px' }}>🔗 What happens when you publish:</div>
        <div>• Students enter <strong style={{ color: '#F5C842' }}>{campaign.code}</strong> on the Campaign Select screen</div>
        <div>• Your campaign appears alongside Japanese, Korean, and Spanish</div>
        <div>• All core mechanics carry over: cards, relics, Graveyard, Journal, Pantheon XP</div>
        <div>• A class leaderboard tab is auto-created for your campaign</div>
        <div>• Mastery Levels unlock after first clear — no extra config needed</div>
      </div>
    </div>
  )
}
