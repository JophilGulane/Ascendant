// components/menus/ModeSelect.jsx
// Two-step screen:
//   Step 1: Choose mode (🌍 World Languages | 💻 Programming)
//   Step 2: Choose campaign (filtered by mode)
// Sets modeStore.activeMode, sets sessionStorage.selected_campaign, navigates to CharacterSelect.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudio } from '../../hooks/useAudio.js'
import useModeStore from '../../stores/modeStore.js'
import useAccountStore from '../../stores/accountStore.js'
import { CAMPAIGN_THEMES } from '../../constants/campaigns.js'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'
import { getUnlockedCustomThemes } from '../../utils/customCampaignLoader.js'
import { unlockCustomCampaign } from '../../teacher/teacherService.js'

// ── Mode definitions ──────────────────────────────────────────────────────────
const MODES = [
  {
    id: 'languages',
    emoji: '🌍',
    title: 'World Languages',
    tagline: 'Master the languages of the world',
    accent: '#F5C842',
    bg: 'linear-gradient(145deg, #1a1000, #1a0a00)',
    border: 'rgba(245,200,66,0.35)',
    glow: 'rgba(245,200,66,0.12)',
    badges: [
      { emoji: '🌸', label: 'Japanese' },
      { emoji: '✨', label: 'Korean' },
      { emoji: '🌿', label: 'Spanish' },
    ],
  },
  {
    id: 'programming',
    emoji: '💻',
    title: 'Programming Languages',
    tagline: 'Master the languages of machines',
    accent: '#60a5fa',
    bg: 'linear-gradient(145deg, #00040f, #000e1a)',
    border: 'rgba(96,165,250,0.35)',
    glow: 'rgba(96,165,250,0.12)',
    badges: [
      { emoji: '⚙️', label: 'C' },
      { emoji: '🐍', label: 'Python' },
      { emoji: '🟨', label: 'JavaScript' },
    ],
  },
]

// Map each mode to which campaign IDs are shown
const CAMPAIGN_MODES = {
  languages:   ['japanese', 'korean', 'spanish'],
  programming: [], // no built-in programming campaigns yet
}

// Placeholder programming campaign cards shown as "coming soon"
const PROGRAMMING_PLACEHOLDERS = [
  { id: 'c',          name: 'C Fundamentals',         emoji: '⚙️',  accent: '#6ee7b7', tagline: 'From pointers to mastery' },
  { id: 'python',     name: 'Python Essentials',       emoji: '🐍',  accent: '#fde68a', tagline: 'Readable, powerful, Pythonic' },
  { id: 'javascript', name: 'JavaScript: The Language', emoji: '🟨',  accent: '#60a5fa', tagline: 'The language of the web' },
]

// ── Mode card (step 1) ─────────────────────────────────────────────────────────
function ModeCard({ mode, onClick }) {
  return (
    <motion.button
      onClick={() => onClick(mode.id)}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        flex: '1 1 280px', maxWidth: '400px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: '20px', padding: '48px 32px', borderRadius: '24px',
        background: mode.bg, border: `2px solid ${mode.border}`,
        boxShadow: `0 0 60px ${mode.glow}, 0 8px 32px rgba(0,0,0,0.6)`,
        cursor: 'pointer', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}
    >
      <motion.div
        animate={{ opacity: [0.04, 0.1, 0.04] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% 30%, ${mode.accent}30, transparent 70%)`, pointerEvents: 'none' }}
      />
      <div style={{ fontSize: '3.5rem', lineHeight: 1 }}>{mode.emoji}</div>
      <div>
        <h2 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.35rem', fontWeight: 700, color: mode.accent, margin: '0 0 6px', letterSpacing: '0.04em', textShadow: `0 0 20px ${mode.accent}66` }}>
          {mode.title}
        </h2>
        <p style={{ fontSize: '0.78rem', color: '#9ca3af', margin: 0, lineHeight: 1.5 }}>{mode.tagline}</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {mode.badges.map(b => (
          <div key={b.label} style={{ padding: '5px 12px', borderRadius: '999px', background: `${mode.accent}18`, border: `1px solid ${mode.accent}44`, fontSize: '0.75rem', fontWeight: 600, color: mode.accent }}>
            {b.emoji} {b.label}
          </div>
        ))}
      </div>
      <motion.div animate={{ x: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity }} style={{ fontSize: '1.1rem', color: mode.accent, opacity: 0.7 }}>→</motion.div>
    </motion.button>
  )
}

// ── Campaign card (step 2) ─────────────────────────────────────────────────────
function CampaignCard({ campaign, index, onSelect, comingSoon }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}
      whileHover={!comingSoon ? { scale: 1.04, y: -8 } : {}} whileTap={!comingSoon ? { scale: 0.97 } : {}}
      onClick={() => !comingSoon && onSelect(campaign.id)}
      style={{
        flex: '1 1 180px', maxWidth: '260px', minHeight: '320px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: '14px', padding: '36px 24px', borderRadius: '20px', cursor: comingSoon ? 'default' : 'pointer',
        background: comingSoon ? 'rgba(255,255,255,0.03)' : (campaign.bgGradient || `linear-gradient(160deg, #111, #0d0d0d)`),
        border: comingSoon ? '1px solid rgba(255,255,255,0.08)' : `2px solid ${campaign.accent}55`,
        boxShadow: comingSoon ? 'none' : `0 8px 28px rgba(0,0,0,0.6), 0 0 18px ${campaign.accent}22`,
        textAlign: 'center', position: 'relative', overflow: 'hidden',
        opacity: comingSoon ? 0.5 : 1,
        filter: comingSoon ? 'grayscale(0.5)' : 'none',
      }}
    >
      <div style={{ fontSize: '3rem', lineHeight: 1 }}>{campaign.particleEmoji || campaign.emoji || '📚'}</div>
      <div>
        <h3 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.05rem', fontWeight: 700, color: '#f3f4f6', margin: '0 0 4px' }}>
          {campaign.name}
        </h3>
        <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: campaign.accent }}>
          {campaign.language || campaign.id}
        </div>
      </div>
      {campaign.tagline && (
        <p style={{ fontSize: '0.72rem', color: '#9ca3af', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
          "{campaign.tagline.slice(0, 80)}"
        </p>
      )}
      {comingSoon && (
        <div style={{ padding: '4px 12px', borderRadius: '6px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: '0.65rem', fontWeight: 700, color: '#6b7280', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Coming Soon
        </div>
      )}
    </motion.button>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ModeSelect() {
  const navigate    = useNavigate()
  const { playSFX } = useAudio()
  const setMode     = useModeStore(s => s.setMode)
  const { session, isLoggedIn } = useAccountStore()

  const [step,       setStep]       = useState('mode') // 'mode' | 'campaign'
  const [activeMode, setActiveMode] = useState(null)
  const [customCampaigns, setCustomCampaigns] = useState([])
  const [codeInput,  setCodeInput]  = useState('')
  const [codeMsg,    setCodeMsg]    = useState(null)

  // Load unlocked custom campaigns when campaign step opens
  useEffect(() => {
    if (step === 'campaign') {
      setCustomCampaigns(getUnlockedCustomThemes(session?.username))
    }
  }, [step, session?.username])

  const handleModeSelect = (modeId) => {
    playSFX('button_click')
    setMode(modeId)
    setActiveMode(modeId)
    setStep('campaign')
  }

  const handleCampaignSelect = (campaignId) => {
    playSFX('button_click')
    sessionStorage.setItem('selected_campaign', campaignId)
    navigate('/character-select')
  }

  const handleUnlockCode = () => {
    const code = codeInput.trim().toUpperCase()
    if (!code) return
    if (!isLoggedIn) { setCodeMsg({ ok: false, msg: 'Sign in to unlock campaigns.' }); return }
    const result = unlockCustomCampaign(session.username, code)
    if (result.ok) {
      setCodeMsg({ ok: true, msg: `✓ Unlocked: ${result.campaign.name}` })
      setCustomCampaigns(getUnlockedCustomThemes(session.username))
      setCodeInput('')
    } else {
      setCodeMsg({ ok: false, msg: result.error })
    }
    setTimeout(() => setCodeMsg(null), 4000)
  }

  const handleBack = () => {
    playSFX('button_click')
    if (step === 'campaign') { setStep('mode'); setActiveMode(null) }
    else navigate('/')
  }

  const currentMode   = MODES.find(m => m.id === activeMode)
  const builtInIds    = activeMode ? (CAMPAIGN_MODES[activeMode] || []) : []
  const builtInCards  = builtInIds.map(id => CAMPAIGN_THEMES[id]).filter(Boolean)
  const showPlaceholders = activeMode === 'programming'

  return (
    <ScreenTransition>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #08070f 0%, #0d0d0d 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', fontFamily: "'Inter', sans-serif", position: 'relative',
      }}>
        {/* Back */}
        <button onClick={handleBack} style={{
          position: 'absolute', top: '24px', left: '24px',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '10px', color: '#9ca3af', padding: '8px 16px',
          fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'Cinzel', serif",
        }}>← Back</button>

        <AnimatePresence mode="wait">

          {/* ── Step 1: Mode selection ── */}
          {step === 'mode' && (
            <motion.div key="mode" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', width: '100%', maxWidth: '900px' }}
            >
              <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center' }}>
                <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '2rem', fontWeight: 700, color: '#F5C842', margin: '0 0 10px', letterSpacing: '0.06em', textShadow: '0 0 40px rgba(245,200,66,0.3)' }}>
                  Choose Your Path
                </h1>
                <p style={{ color: '#6b7280', fontSize: '0.88rem', margin: 0 }}>Select a mode to see its campaigns</p>
              </motion.div>

              <div style={{ display: 'flex', gap: '28px', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
                {MODES.map((mode, i) => (
                  <motion.div key={mode.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.12 }}>
                    <ModeCard mode={mode} onClick={handleModeSelect} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Campaign selection ── */}
          {step === 'campaign' && (
            <motion.div key="campaign" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '40px', width: '100%', maxWidth: '960px' }}
            >
              <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: currentMode?.accent || '#F5C842', marginBottom: '8px', fontFamily: "'Cinzel', serif" }}>
                  {currentMode?.emoji} {currentMode?.title}
                </div>
                <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: '1.8rem', fontWeight: 700, color: '#f3f4f6', margin: 0, letterSpacing: '0.04em' }}>
                  Select Campaign
                </h1>
              </motion.div>

              <div style={{ display: 'flex', gap: '24px', width: '100%', flexWrap: 'wrap', justifyContent: 'center' }}>
                {builtInCards.map((c, i) => (
                  <CampaignCard key={c.id} campaign={c} index={i} onSelect={handleCampaignSelect} comingSoon={false} />
                ))}
                {showPlaceholders && PROGRAMMING_PLACEHOLDERS.map((c, i) => (
                  <CampaignCard key={c.id} campaign={c} index={builtInCards.length + i} onSelect={handleCampaignSelect} comingSoon={true} />
                ))}
                {customCampaigns.map((c, i) => (
                  <CampaignCard key={c.id} campaign={c} index={builtInCards.length + i} onSelect={handleCampaignSelect} comingSoon={false} />
                ))}
              </div>

              {/* ── Campaign Code unlock ── */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginTop: '-16px' }}>
                <div style={{ fontSize: '0.7rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Have a Campaign Code from your teacher?
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    value={codeInput}
                    onChange={e => setCodeInput(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && handleUnlockCode()}
                    placeholder="Enter code e.g. CP-7731"
                    style={{
                      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '10px', padding: '10px 16px', color: '#f3f4f6',
                      fontSize: '0.88rem', outline: 'none', fontFamily: 'monospace',
                      letterSpacing: '0.1em', width: '200px',
                    }}
                  />
                  <motion.button
                    onClick={handleUnlockCode}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    style={{
                      padding: '10px 20px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg,#b45309,#F5C842)',
                      color: '#1a0e00', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                      fontFamily: "'Cinzel', serif",
                    }}
                  >
                    Unlock
                  </motion.button>
                </div>
                {codeMsg && (
                  <div style={{ fontSize: '0.78rem', color: codeMsg.ok ? '#6ee7b7' : '#fca5a5' }}>
                    {codeMsg.msg}
                  </div>
                )}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </ScreenTransition>
  )
}
