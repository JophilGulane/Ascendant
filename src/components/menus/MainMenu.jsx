// components/menus/MainMenu.jsx — STS style redesign
// Inspired by Slay the Spire: full-bleed background, gold title, plain left-side menu items

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudio } from '../../hooks/useAudio.js'
import useRunStore from '../../stores/runStore.js'
import { CAMPAIGN_THEMES } from '../../constants/campaigns.js'
import { AccountBadge } from '../../account/components/AccountBadge.jsx'
import useAccountStore from '../../stores/accountStore.js'
import { getUnlockedCustomThemes, getCustomCampaignTheme } from '../../utils/customCampaignLoader.js'
import { unlockCustomCampaign } from '../../teacher/teacherService.js'
import { SettingsMenu } from '../shared/SettingsMenu.jsx'

// Floating ember particle (like STS burning embers)
function Ember({ delay }) {
  const startX = 5 + Math.random() * 25 // mostly left side near tower
  const size = 2 + Math.random() * 4
  const duration = 4 + Math.random() * 6

  return (
    <motion.div
      initial={{ opacity: 0, x: `${startX}vw`, y: '100vh' }}
      animate={{
        opacity: [0, 0.9, 0.9, 0],
        y: '-10vh',
        x: [`${startX}vw`, `${startX + (Math.random() - 0.5) * 8}vw`],
      }}
      transition={{ duration, delay, ease: 'easeOut', repeat: Infinity, repeatDelay: Math.random() * 3 }}
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle, #ffaa44, #ff6600)`,
        boxShadow: `0 0 ${size * 2}px #ff6600`,
        pointerEvents: 'none',
      }}
    />
  )
}

const MENU_ITEMS = [
  { id: 'play',           label: 'Play' },
  { id: 'lesson_builder', label: '📚 Lesson Builder', teacherOnly: true },
  { id: 'leaderboard',   label: 'Leaderboard' },
  { id: 'pantheon',      label: 'The Pantheon' },
  { id: 'graveyard',     label: 'Mistake Graveyard' },
  { id: 'settings',      label: 'Settings' },
  { id: 'about',         label: 'About' },
]

export function MainMenu() {
  const navigate = useNavigate()
  const store = useRunStore()
  const { playMusic, playSFX } = useAudio()
  const { session, isLoggedIn } = useAccountStore()

  const [hoveredItem, setHoveredItem] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [view, setView] = useState('main') // 'main' | 'campaign'
  const [customCampaigns, setCustomCampaigns] = useState([])
  const [codeInput, setCodeInput] = useState('')
  const [codeMsg, setCodeMsg] = useState(null)

  const hasActiveRun = Boolean(store.runId)


  // Load unlocked custom campaigns when campaign view opens
  useEffect(() => {
    if (view === 'campaign') {
      setCustomCampaigns(getUnlockedCustomThemes(session?.username))
    }
  }, [view, session?.username])

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

  useEffect(() => {
    // Attempt to play immediately (works if navigating back to menu)
    playMusic('menu', 1)

    // Browsers block autoplay on first load until user interaction.
    // This ensures the music starts as soon as they click anywhere.
    const handleInteraction = () => {
      playMusic('menu', 1)
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }

    window.addEventListener('click', handleInteraction)
    window.addEventListener('keydown', handleInteraction)

    return () => {
      window.removeEventListener('click', handleInteraction)
      window.removeEventListener('keydown', handleInteraction)
    }
  }, [playMusic])

  const handleMenuClick = (id) => {
    playSFX('button_click')
    if (id === 'play')           setView('campaign')
    if (id === 'lesson_builder') navigate('/teach')
    if (id === 'graveyard')      navigate('/graveyard')
    if (id === 'pantheon')       navigate('/pantheon')
    if (id === 'leaderboard')    navigate('/leaderboard')
    if (id === 'settings')       setSettingsOpen(true)
    if (id === 'about') { } // placeholder
  }

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ fontFamily: "'Crimson Text', 'Georgia', serif" }}>
      {/* ── Full-bleed background art ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/images/ui/main_menu_tower_bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      {/* Dark vignette overlay — heavier at bottom */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.75) 100%)',
      }} />
      {/* Left edge darkening (menu area) */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(90deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 30%, transparent 55%)',
      }} />

      {/* Floating embers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => <Ember key={i} delay={i * 0.4} />)}
      </div>

      {/* ── Account badge (top-left) ── */}
      <AccountBadge />

      {/* ── Title (center) ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
        style={{ paddingBottom: '8vh' }}
      >
        <div className="text-center" style={{ marginLeft: '10vw' }}>
          {/* Main title — big gold display font */}
          <div
            className="font-bold leading-none select-none"
            style={{
              fontSize: 'clamp(3rem, 8vw, 7rem)',
              color: '#F5C842',
              textShadow: '0 0 60px #F5C84266, 0 4px 8px rgba(0,0,0,0.8), -2px -2px 0 #7a5f00, 2px 2px 0 #7a5f00',
              fontFamily: "'Cinzel Decorative', 'Cinzel', 'Crimson Text', Georgia, serif",
              letterSpacing: '0.05em',
            }}
          >
            ASCENDANT
          </div>
          {/* Subtitle */}
          <div
            className="text-gray-300 mt-2 tracking-widest"
            style={{ fontSize: 'clamp(0.6rem, 1.2vw, 0.9rem)', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
          >
            言語で戦え — Fight with Language
          </div>
        </div>
      </motion.div>

      {/* ── Menu items (lower-left, STS style) ── */}
      <div className="absolute bottom-0 left-0 z-20 flex flex-col gap-1 p-8 pb-12">
        {/* Continue run — shown above Play if active run */}
        {hasActiveRun && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-3"
          >
            <button
              onClick={() => {
                playSFX('button_click')
                navigate('/map')
              }}
              onMouseEnter={() => {
                setHoveredItem('continue')
                playSFX('button_hover')
              }}
              onMouseLeave={() => setHoveredItem(null)}
              className="flex items-center gap-2 group"
            >
              <motion.span
                animate={{ x: hoveredItem === 'continue' ? 6 : 0 }}
                className="text-amber-300"
                style={{
                  fontSize: 'clamp(1rem, 2.5vw, 1.5rem)',
                  fontFamily: "'Cinzel', Georgia, serif",
                  textShadow: hoveredItem === 'continue'
                    ? '0 0 20px #F5C842, 0 2px 4px rgba(0,0,0,0.8)'
                    : '0 2px 4px rgba(0,0,0,0.8)',
                  color: hoveredItem === 'continue' ? '#F5C842' : '#d4a843',
                }}
              >
                Continue
              </motion.span>
            </button>
          </motion.div>
        )}

        {MENU_ITEMS
          .filter(item => !item.teacherOnly || session?.accountType === 'teacher')
          .map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
          >
            <button
              onClick={() => handleMenuClick(item.id)}
              onMouseEnter={() => {
                setHoveredItem(item.id)
                playSFX('button_hover')
              }}
              onMouseLeave={() => setHoveredItem(null)}
              className="flex items-center gap-2 group"
            >
              <motion.span
                animate={{ x: hoveredItem === item.id ? 8 : 0 }}
                style={{
                  fontSize: item.teacherOnly
                    ? 'clamp(0.9rem, 2.2vw, 1.45rem)'
                    : 'clamp(1.1rem, 2.8vw, 1.8rem)',
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  textShadow: hoveredItem === item.id
                    ? '0 0 30px #c084fc, 0 2px 6px rgba(0,0,0,0.9)'
                    : '0 2px 6px rgba(0,0,0,0.9)',
                  color: item.teacherOnly
                    ? (hoveredItem === item.id ? '#c084fc' : '#a855f7')
                    : (hoveredItem === item.id ? '#F5C842' : '#e8e8e8'),
                  transition: 'color 0.15s, text-shadow 0.15s',
                }}
              >
                {item.label}
              </motion.span>
            </button>
          </motion.div>
        ))}

        {/* Version */}
        <div className="mt-4 text-[10px] text-gray-600" style={{ fontFamily: 'monospace' }}>
          v0.2 · Phase 3
        </div>
      </div>

      {/* ── Campaign Select View ── */}
      <AnimatePresence>
        {view === 'campaign' && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
            exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60"
          >
            <div className="absolute top-12 left-12">
              <button
                onClick={() => {
                  playSFX('button_click')
                  setView('main')
                }}
                className="text-gray-400 hover:text-white text-xl font-bold tracking-widest uppercase transition-colors"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                ← Back
              </button>
            </div>

            <h2 className="text-4xl text-amber-300 font-bold mb-12" style={{ fontFamily: "'Cinzel', serif", textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              Select Campaign
            </h2>

            <div className="flex gap-6 items-stretch justify-center max-w-6xl px-12 w-full flex-wrap">
              {/* Built-in campaigns */}
              {Object.values(CAMPAIGN_THEMES).map((campaign, i) => (
                <motion.button
                  key={campaign.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onHoverStart={() => !campaign.locked && playSFX('button_hover')}
                  whileHover={!campaign.locked ? { scale: 1.05, y: -10 } : {}}
                  whileTap={!campaign.locked ? { scale: 0.95 } : {}}
                  onClick={() => {
                    if (!campaign.locked) {
                      playSFX('button_click')
                      sessionStorage.setItem('selected_campaign', campaign.id)
                      navigate('/character-select')
                    }
                  }}
                  className={`
                    relative flex-1 rounded-2xl overflow-hidden border-2 transition-all
                    ${campaign.locked ? 'border-gray-800 cursor-default grayscale' : 'border-gray-600 cursor-pointer'}
                  `}
                  style={{
                    minHeight: '400px', minWidth: '200px',
                    background: campaign.bgGradient,
                    boxShadow: campaign.locked ? 'none' : `0 10px 30px rgba(0,0,0,0.8), 0 0 20px ${campaign.accent}44`,
                  }}
                >
                  <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center">
                    <div className="text-6xl mb-6 drop-shadow-lg">{campaign.particleEmoji}</div>
                    <h3 className="text-2xl font-bold mb-2 text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                      {campaign.name}
                    </h3>
                    <div className="text-sm font-bold tracking-widest mb-6 uppercase" style={{ color: campaign.accent }}>
                      {campaign.language}
                    </div>
                    <p className="text-gray-300 text-sm italic mb-auto">
                      "{campaign.tagline}"
                    </p>
                    {campaign.locked && (
                      <div className="mt-8 bg-gray-900/80 text-gray-500 font-bold uppercase tracking-widest px-4 py-2 rounded-lg border border-gray-700">
                        Locked
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}

              {/* Custom campaigns — styled identically to built-in campaign cards */}
              {customCampaigns.map((campaign, i) => (
                <motion.button
                  key={campaign.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (Object.values(CAMPAIGN_THEMES).length + i) * 0.1 }}
                  onHoverStart={() => playSFX('button_hover')}
                  whileHover={{ scale: 1.05, y: -10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    playSFX('button_click')
                    sessionStorage.setItem('selected_campaign', campaign.id)
                    navigate('/character-select')
                  }}
                  className="relative flex-1 rounded-2xl overflow-hidden border-2 cursor-pointer transition-all"
                  style={{
                    minHeight: '400px', minWidth: '200px',
                    background: campaign.bgGradient,
                    borderColor: campaign.accent + 'aa',
                    boxShadow: `0 10px 30px rgba(0,0,0,0.8), 0 0 20px ${campaign.accent}44`,
                  }}
                >
                  {/* Inner glow overlay matching built-in style */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: `radial-gradient(ellipse 80% 60% at 50% 100%, ${campaign.accent}18, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />

                  <div className="absolute inset-0 p-8 flex flex-col items-center justify-center text-center">
                    {/* Emoji — same size as built-in cards */}
                    <div className="text-6xl mb-6 drop-shadow-lg">{campaign.particleEmoji || '📚'}</div>

                    {/* Campaign name — Cinzel, 2xl like built-in */}
                    <h3 className="text-2xl font-bold mb-2 text-white" style={{ fontFamily: "'Cinzel', serif" }}>
                      {campaign.name}
                    </h3>

                    {/* Subject tag — same accent colour + tracking as language line */}
                    <div className="text-sm font-bold tracking-widest mb-6 uppercase" style={{ color: campaign.accent }}>
                      {campaign.subject || 'Custom'}
                    </div>

                    {/* Description as tagline — italic gray, same as built-in */}
                    <p className="text-gray-300 text-sm italic mb-auto">
                      "{campaign.tagline?.slice(0, 100) || 'A teacher-built campaign'}"
                    </p>

                    {/* Campaign code — subtle, bottom of card */}
                    <div style={{ marginTop: '16px', fontSize: '0.6rem', color: `${campaign.accent}99`, fontFamily: 'monospace', letterSpacing: '0.15em', fontWeight: 700 }}>
                      {campaign.code}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Campaign Code unlock input */}
            <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
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

      {/* ── Settings Overlay ── */}
      <SettingsMenu
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        accent="#F5C842"
      />
    </div>
  )
}
