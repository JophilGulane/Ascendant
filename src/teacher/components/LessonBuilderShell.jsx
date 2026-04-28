// teacher/components/LessonBuilderShell.jsx
// Main lesson builder shell: step wizard, sidebar nav, auto-save, teacher gate.
// Route: /teach — accessible only to teacher accounts.

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ScreenTransition } from '../../components/shared/ScreenTransition.jsx'
import useAccountStore from '../../stores/accountStore.js'
import {
  createDraftCampaign,
  saveCampaignDraft,
  getTeacherCampaigns,
  deleteCampaign,
} from '../teacherService.js'
import { StepCampaignIdentity } from './StepCampaignIdentity.jsx'
import { StepQuestionBank }     from './StepQuestionBank.jsx'
import { StepEnemyBuilder }     from './StepEnemyBuilder.jsx'
import { StepPublish }          from './StepPublish.jsx'

const STEPS = [
  { id: 1, label: '1', title: 'Identity',      icon: '📝' },
  { id: 2, label: '2', title: 'Questions',     icon: '❓' },
  { id: 3, label: '3', title: 'Enemies',       icon: '⚔️' },
  { id: 4, label: '4', title: 'Publish',       icon: '🚀' },
]

// ── Teacher gate ──────────────────────────────────────────────────────────────
function TeacherGate({ onBack }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0d0d' }}>
      <div style={{ textAlign: 'center', maxWidth: '420px', padding: '32px' }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔐</div>
        <h2 style={{ fontFamily: "'Cinzel', serif", color: '#F5C842', marginBottom: '12px' }}>Teacher Access Required</h2>
        <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '24px' }}>
          The Lesson Builder is only available to teacher accounts. Sign in with a teacher account or create one from the main menu.
        </p>
        <motion.button onClick={onBack} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
          style={{ padding: '12px 28px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#b45309,#F5C842)', color: '#1a0e00', fontWeight: 700, cursor: 'pointer', fontFamily: "'Cinzel', serif" }}>
          ← Back to Menu
        </motion.button>
      </div>
    </div>
  )
}

// ── Campaign picker (when no draft is selected) ───────────────────────────────
function CampaignPicker({ campaigns, onSelect, onCreate, onDelete }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#0d0d0d',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px', fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <h1 style={{ fontFamily: "'Cinzel', serif", color: '#F5C842', fontSize: '1.8rem', marginBottom: '4px' }}>
          📚 Lesson Builder
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '32px' }}>
          Create custom campaigns for your class. Each campaign is a complete 4-floor RPG experience.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {campaigns.map(c => (
            <div key={c.code} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px', padding: '16px 20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.92rem' }}>
                  {c.name || '(Untitled)'}
                  {c.isDraft && <span style={{ marginLeft: '8px', fontSize: '0.6rem', color: '#fde047', background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '4px', padding: '1px 6px' }}>DRAFT</span>}
                  {!c.isDraft && <span style={{ marginLeft: '8px', fontSize: '0.6rem', color: '#6ee7b7', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '4px', padding: '1px 6px' }}>PUBLISHED</span>}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '3px' }}>
                  Code: <span style={{ fontFamily: 'monospace', color: '#F5C842' }}>{c.code}</span>
                  {' · '}{c.questions?.length || 0} questions · {c.enemies?.length || 0} enemies · {c.subject}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <motion.button onClick={() => onSelect(c)} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  style={{ padding: '7px 16px', borderRadius: '9px', border: '1px solid rgba(245,200,66,0.3)', background: 'rgba(245,200,66,0.1)', color: '#F5C842', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 700 }}>
                  Edit
                </motion.button>
                <button onClick={() => { if (window.confirm(`Delete "${c.name || c.code}"? This cannot be undone.`)) onDelete(c.code) }}
                  style={{ padding: '7px 14px', borderRadius: '9px', border: '1px solid rgba(239,68,68,0.25)', background: 'transparent', color: '#fca5a5', cursor: 'pointer', fontSize: '0.78rem' }}>
                  🗑
                </button>
              </div>
            </div>
          ))}

          {campaigns.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#4b5563', fontSize: '0.88rem' }}>
              No campaigns yet. Create your first one!
            </div>
          )}

          <motion.button onClick={onCreate} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            style={{
              padding: '14px', borderRadius: '14px', border: '2px dashed rgba(245,200,66,0.3)',
              background: 'transparent', color: '#F5C842', fontWeight: 700, fontSize: '0.9rem',
              cursor: 'pointer', fontFamily: "'Cinzel', serif",
            }}>
            + Create New Campaign
          </motion.button>
        </div>
      </div>
    </div>
  )
}

// ── Step wizard sidebar ───────────────────────────────────────────────────────
function StepSidebar({ currentStep, onStep, campaignName, campaignCode }) {
  return (
    <div style={{
      width: '220px', flexShrink: 0,
      background: 'rgba(255,255,255,0.025)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      padding: '28px 16px',
      display: 'flex', flexDirection: 'column', gap: '4px',
    }}>
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontFamily: "'Cinzel', serif", color: '#F5C842', fontSize: '0.85rem', fontWeight: 700 }}>
          {campaignName || 'New Campaign'}
        </div>
        <div style={{ fontFamily: 'monospace', color: '#6b7280', fontSize: '0.68rem', marginTop: '2px' }}>
          {campaignCode}
        </div>
      </div>
      {STEPS.map(step => (
        <button
          key={step.id}
          onClick={() => onStep(step.id)}
          style={{
            padding: '10px 14px', borderRadius: '10px', border: 'none', textAlign: 'left',
            background: currentStep === step.id ? 'rgba(245,200,66,0.12)' : 'transparent',
            borderLeft: currentStep === step.id ? '3px solid #F5C842' : '3px solid transparent',
            color: currentStep === step.id ? '#F5C842' : '#6b7280',
            fontWeight: currentStep === step.id ? 700 : 400,
            fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
            transition: 'all 0.15s',
          }}
        >
          <span>{step.icon}</span>
          <span>{step.title}</span>
        </button>
      ))}
    </div>
  )
}

// ── Main shell ────────────────────────────────────────────────────────────────
export function LessonBuilderShell() {
  const navigate = useNavigate()
  const { session, profile } = useAccountStore()
  const isTeacher = session?.accountType === 'teacher'

  const [campaigns, setCampaigns] = useState([])
  const [activeCampaign, setActiveCampaign] = useState(null)
  const [step, setStep] = useState(1)
  const [saveMsg, setSaveMsg] = useState(null)

  // Load teacher's campaigns on mount
  useEffect(() => {
    if (isTeacher && session?.username) {
      setCampaigns(getTeacherCampaigns(session.username))
    }
  }, [isTeacher, session?.username])

  // Auto-save draft when activeCampaign changes (debounced effectively by React batching)
  const autoSave = useCallback((updated) => {
    setActiveCampaign(updated)
    saveCampaignDraft(updated.code, updated)
    setCampaigns(prev => prev.map(c => c.code === updated.code ? updated : c))
    setSaveMsg('Saved')
    setTimeout(() => setSaveMsg(null), 1500)
  }, [])

  const handleCreate = () => {
    const draft = createDraftCampaign(session.username)
    setCampaigns(prev => [...prev, draft])
    setActiveCampaign(draft)
    setStep(1)
  }

  const handleDelete = (code) => {
    deleteCampaign(code)
    setCampaigns(prev => prev.filter(c => c.code !== code))
    if (activeCampaign?.code === code) setActiveCampaign(null)
  }

  if (!isTeacher) return <TeacherGate onBack={() => navigate('/')} />

  if (!activeCampaign) {
    return (
      <ScreenTransition>
        <CampaignPicker
          campaigns={campaigns}
          onSelect={c => { setActiveCampaign(c); setStep(1) }}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
      </ScreenTransition>
    )
  }

  return (
    <ScreenTransition>
      <div style={{ display: 'flex', height: '100vh', background: '#0d0d0d', fontFamily: "'Inter', sans-serif" }}>
        <StepSidebar
          currentStep={step}
          onStep={setStep}
          campaignName={activeCampaign.name}
          campaignCode={activeCampaign.code}
        />

        {/* Main content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Top bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 28px', borderBottom: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setActiveCampaign(null)}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.8rem' }}>
                ← My Campaigns
              </button>
              <span style={{ color: '#374151', fontSize: '0.8rem' }}>/</span>
              <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>
                {activeCampaign.name || 'Untitled Campaign'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {saveMsg && <span style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>✓ {saveMsg}</span>}
              <button onClick={() => navigate('/')}
                style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: '#9ca3af', fontSize: '0.78rem', cursor: 'pointer' }}>
                ← Menu
              </button>
            </div>
          </div>

          {/* Step content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', maxWidth: '860px', width: '100%', margin: '0 auto', boxSizing: 'border-box' }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
              >
                {step === 1 && <StepCampaignIdentity data={activeCampaign} onChange={autoSave} />}
                {step === 2 && <StepQuestionBank campaign={activeCampaign} onUpdate={autoSave} />}
                {step === 3 && <StepEnemyBuilder campaign={activeCampaign} onUpdate={autoSave} />}
                {step === 4 && <StepPublish campaign={activeCampaign} onUpdate={autoSave} onPublished={updated => { setActiveCampaign(updated); setCampaigns(prev => prev.map(c => c.code === updated.code ? updated : c)) }} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom step nav */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 40px', borderTop: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <button
              onClick={() => setStep(s => Math.max(1, s - 1))}
              disabled={step === 1}
              style={{ padding: '8px 20px', borderRadius: '9px', border: '1px solid rgba(255,255,255,0.12)', background: 'transparent', color: step === 1 ? '#374151' : '#d1d5db', cursor: step === 1 ? 'default' : 'pointer', fontSize: '0.82rem' }}
            >
              ← Previous
            </button>
            <div style={{ display: 'flex', gap: '6px' }}>
              {STEPS.map(s => (
                <div key={s.id} style={{ width: '8px', height: '8px', borderRadius: '50%', background: step === s.id ? '#F5C842' : 'rgba(255,255,255,0.15)', transition: 'background 0.2s' }} />
              ))}
            </div>
            {step < 4 ? (
              <button
                onClick={() => setStep(s => Math.min(4, s + 1))}
                style={{ padding: '8px 20px', borderRadius: '9px', border: 'none', background: 'linear-gradient(135deg,#b45309,#F5C842)', color: '#1a0e00', fontWeight: 700, cursor: 'pointer', fontSize: '0.82rem' }}
              >
                Next →
              </button>
            ) : (
              <div style={{ width: '80px' }} />
            )}
          </div>
        </div>
      </div>
    </ScreenTransition>
  )
}
