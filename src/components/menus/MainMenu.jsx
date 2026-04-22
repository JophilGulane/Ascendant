// components/menus/MainMenu.jsx — STS style redesign
// Inspired by Slay the Spire: full-bleed background, gold title, plain left-side menu items

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import { CAMPAIGN_THEMES } from '../../constants/campaigns.js'

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
  { id: 'play',     label: 'Play' },
  { id: 'pantheon', label: 'The Pantheon' },
  { id: 'graveyard',label: 'Mistake Graveyard' },
  { id: 'settings', label: 'Settings' },
  { id: 'about',    label: 'About' },
]

export function MainMenu() {
  const navigate = useNavigate()
  const store = useRunStore()
  const [hoveredItem, setHoveredItem] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [view, setView] = useState('main') // 'main' | 'campaign'

  const hasActiveRun = Boolean(store.runId)

  const handleMenuClick = (id) => {
    if (id === 'play') setView('campaign')
    if (id === 'graveyard') navigate('/graveyard')
    if (id === 'pantheon') navigate('/pantheon')
    if (id === 'settings') setSettingsOpen(true)
    if (id === 'about') {} // placeholder
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

      {/* ── Player name badge (top-left) ── */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/40 border border-gray-700/50 rounded px-3 py-1.5">
        <div className="w-5 h-5 bg-gray-700 rounded-sm flex items-center justify-center">
          <span className="text-[10px] text-gray-300">◆</span>
        </div>
        <div>
          <div className="text-xs font-bold text-white leading-none">Player</div>
          <div className="text-[9px] text-amber-400/70 leading-none mt-0.5">click to edit</div>
        </div>
      </div>

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
              onClick={() => navigate('/map')}
              onMouseEnter={() => setHoveredItem('continue')}
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

        {MENU_ITEMS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
          >
            <button
              onClick={() => handleMenuClick(item.id)}
              onMouseEnter={() => setHoveredItem(item.id)}
              onMouseLeave={() => setHoveredItem(null)}
              className="flex items-center gap-2 group"
            >
              <motion.span
                animate={{ x: hoveredItem === item.id ? 8 : 0 }}
                style={{
                  fontSize: 'clamp(1.1rem, 2.8vw, 1.8rem)',
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  textShadow: hoveredItem === item.id
                    ? '0 0 30px #F5C842, 0 2px 6px rgba(0,0,0,0.9)'
                    : '0 2px 6px rgba(0,0,0,0.9)',
                  color: hoveredItem === item.id ? '#F5C842' : '#e8e8e8',
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
                onClick={() => setView('main')}
                className="text-gray-400 hover:text-white text-xl font-bold tracking-widest uppercase transition-colors"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                ← Back
              </button>
            </div>
            
            <h2 className="text-4xl text-amber-300 font-bold mb-12" style={{ fontFamily: "'Cinzel', serif", textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
              Select Campaign
            </h2>
            
            <div className="flex gap-6 items-stretch justify-center max-w-6xl px-12 w-full">
              {Object.values(CAMPAIGN_THEMES).map((campaign, i) => (
                <motion.button
                  key={campaign.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={!campaign.locked ? { scale: 1.05, y: -10 } : {}}
                  whileTap={!campaign.locked ? { scale: 0.95 } : {}}
                  onClick={() => {
                    if (!campaign.locked) {
                      sessionStorage.setItem('selected_campaign', campaign.id)
                      navigate('/character-select')
                    }
                  }}
                  className={`
                    relative flex-1 rounded-2xl overflow-hidden border-2 transition-all
                    ${campaign.locked ? 'border-gray-800 cursor-default grayscale' : 'border-gray-600 cursor-pointer'}
                  `}
                  style={{
                    minHeight: '400px',
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Settings Overlay ── */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="rounded-2xl border border-gray-600 p-8 w-96"
              style={{ background: 'linear-gradient(160deg, #1a1208, #0d0d0d)', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}
            >
              <h2 className="text-2xl font-bold text-amber-300 mb-6" style={{ fontFamily: "'Cinzel', serif" }}>Settings</h2>
              <div className="flex flex-col gap-4 mb-6 text-sm text-gray-300">
                <div className="flex justify-between">
                  <span>Answer Timer</span>
                  <span className="text-amber-400">20s</span>
                </div>
                <div className="flex justify-between">
                  <span>Romanization</span>
                  <span className="text-amber-400">Progressive Fade</span>
                </div>
                <p className="text-xs text-gray-500 border-t border-gray-700 pt-3">Full settings available in Phase 2.</p>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-full py-2.5 rounded-lg border border-gray-600 text-gray-200 text-sm hover:border-amber-600 hover:text-amber-200 transition-all"
                style={{ background: '#1a1a1a' }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
