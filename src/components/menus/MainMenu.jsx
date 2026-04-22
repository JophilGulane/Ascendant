// components/menus/MainMenu.jsx
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import { CAMPAIGN_THEMES } from '../../constants/campaigns.js'
import { HoverTranslate } from '../shared/HoverTranslate.jsx'

// Cherry blossom particle for Japanese campaign
function BlossomParticle({ delay }) {
  const startX = Math.random() * 100
  const duration = 6 + Math.random() * 6
  const size = 6 + Math.random() * 8

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, x: `${startX}vw`, rotate: 0 }}
      animate={{
        opacity: [0, 0.8, 0.8, 0],
        y: '110vh',
        x: [`${startX}vw`, `${startX + (Math.random() - 0.5) * 15}vw`],
        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)]
      }}
      transition={{ duration, delay, ease: 'linear', repeat: Infinity, repeatDelay: Math.random() * 4 }}
      style={{
        position: 'absolute',
        width: size, height: size,
        background: '#E8B86D33',
        borderRadius: '50% 0 50% 0',
        fontSize: size,
      }}
    >
      🌸
    </motion.div>
  )
}

const CAMPAIGNS = [
  {
    id: 'japanese',
    theme: CAMPAIGN_THEMES.japanese,
    taglineEn: 'Climb the shrine mountain. Learn through every encounter.',
    locked: false,
    lockedMessage: null,
  },
  {
    id: 'korean',
    theme: CAMPAIGN_THEMES.korean,
    taglineEn: 'Infiltrate the megacorp. Fluency is your access key.',
    locked: true,
    lockedMessage: 'Coming in Phase 3',
  },
  {
    id: 'spanish',
    theme: CAMPAIGN_THEMES.spanish,
    taglineEn: 'Walk the magical roads. Follow the language.',
    locked: true,
    lockedMessage: 'Coming in Phase 3',
  },
]

export function MainMenu() {
  const navigate = useNavigate()
  const store = useRunStore()
  const [hoveredCampaign, setHoveredCampaign] = useState(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const hasActiveRun = Boolean(store.runId)

  return (
    <div
      className="relative w-full h-screen overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(180deg, #050208 0%, #0a0516 40%, #0d0d0d 100%)' }}
    >
      {/* Cherry blossom particles for Japanese theme */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 15 }).map((_, i) => (
          <BlossomParticle key={i} delay={i * 0.5} />
        ))}
      </div>

      {/* Background: main menu art */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage: 'url(/images/ui/main_menu_japanese.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          filter: 'saturate(0.7)',
        }}
      />
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, transparent 40%, #0a0516 70%, #050208 100%)' }}
      />

      {/* Logo / Title */}
      <div className="relative z-10 text-center pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-5xl font-bold tracking-wider text-white mb-1"
            style={{ textShadow: '0 0 40px #C41E3A66, 0 0 80px #C41E3A33' }}
          >
            ASCENDANT
          </div>
          <div className="text-sm text-gray-400 tracking-[0.3em] uppercase">言語で戦え — Fight with Language</div>
        </motion.div>
      </div>

      {/* Campaign Panels */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="flex gap-4 w-full max-w-3xl">
          {CAMPAIGNS.map((camp, i) => {
            const isHovered = hoveredCampaign === camp.id
            const isActive = !camp.locked

            return (
              <motion.div
                key={camp.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
                onHoverStart={() => !camp.locked && setHoveredCampaign(camp.id)}
                onHoverEnd={() => setHoveredCampaign(null)}
                whileHover={isActive ? { scale: 1.03, y: -4 } : {}}
                onClick={() => isActive && navigate('/character-select')}
                className={`
                  flex-1 relative rounded-2xl overflow-hidden border-2 transition-all duration-300
                  ${camp.locked
                    ? 'border-gray-700/30 opacity-50 cursor-not-allowed'
                    : 'border-gray-700/60 hover:border-amber-600/60 cursor-pointer'}
                `}
                style={{
                  minHeight: 280,
                  background: camp.locked
                    ? 'linear-gradient(160deg, #0d0d0d, #111111)'
                    : `linear-gradient(160deg, ${camp.theme.primary}cc, #0d0d0d)`,
                  boxShadow: !camp.locked && isHovered
                    ? `0 0 30px ${camp.theme.accent}22, 0 8px 32px rgba(0,0,0,0.6)`
                    : '0 4px 20px rgba(0,0,0,0.5)',
                }}
              >
                {/* Campaign world art overlay */}
                {camp.id === 'japanese' && (
                  <div
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'url(/images/ui/main_menu_japanese.png)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                )}
                <div className="absolute inset-0"
                  style={{ background: `linear-gradient(180deg, transparent 40%, ${camp.theme.primary}ee 100%)` }}
                />

                {/* Panel content */}
                <div className="relative z-10 p-5 h-full flex flex-col justify-end" style={{ minHeight: 280 }}>
                  {/* Language flag area */}
                  <div className="text-3xl mb-2">
                    {camp.id === 'japanese' ? '🗾' : camp.id === 'korean' ? '🌆' : '🌎'}
                  </div>

                  {/* Campaign name */}
                  <div className="text-lg font-bold text-white mb-0.5">
                    {camp.theme.language}
                  </div>
                  <div className="text-xs font-medium mb-2" style={{ color: camp.theme.accent }}>
                    <HoverTranslate translation={camp.theme.language}>
                      {camp.theme.language_target}
                    </HoverTranslate>
                  </div>

                  {/* Tagline */}
                  <AnimatePresence>
                    {(isHovered || camp.id === 'japanese') && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          <HoverTranslate translation={camp.taglineEn}>
                            {camp.theme.tagline.split(' — ')[0]}
                          </HoverTranslate>
                        </div>
                        <div className="text-[10px] text-gray-600 italic">{camp.taglineEn}</div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Locked badge */}
                  {camp.locked && (
                    <div className="mt-2 text-xs text-gray-500 border border-gray-700 rounded-lg px-2 py-1 inline-block">
                      🔒 {camp.lockedMessage}
                    </div>
                  )}

                  {/* Play button (Japanese only) */}
                  {!camp.locked && (
                    <motion.div
                      animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0.7, y: 4 }}
                      className="mt-3 text-xs font-bold py-2 rounded-lg text-center"
                      style={{ background: camp.theme.accent + '33', color: camp.theme.accent, border: `1px solid ${camp.theme.accent}44` }}
                    >
                      Begin Journey →
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="relative z-10 flex items-center justify-center gap-6 pb-6">
        {hasActiveRun && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/map')}
            className="px-5 py-2 rounded-xl bg-amber-700/40 border border-amber-600/40 text-amber-200 text-sm font-medium hover:bg-amber-700/60 transition-all"
          >
            ↩ Continue Run
          </motion.button>
        )}
        <button
          onClick={() => setSettingsOpen(true)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Settings
        </button>
        <div className="text-xs text-gray-700">v0.1 · Phase 1</div>
      </div>

      {/* Settings overlay (minimal) */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-gray-950 border border-gray-700 rounded-2xl p-6 w-80"
            >
              <h2 className="text-lg font-bold text-white mb-4">Settings</h2>
              <p className="text-sm text-gray-400 mb-6">Full settings panel available in Phase 2.</p>
              <div className="flex flex-col gap-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Timer</span>
                  <span className="text-xs text-gray-500">20s (Normal)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-300">Romanization</span>
                  <span className="text-xs text-gray-500">Progressive Fade</span>
                </div>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-full py-2.5 rounded-xl bg-gray-800 border border-gray-700 text-gray-200 text-sm hover:bg-gray-700 transition-all"
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
