// components/menus/CharacterSelect.jsx — STS style redesign
// Two states: selection row (choose tile) → expanded detail (character info + embark)
// Matches Slay the Spire: icon tiles at bottom, large portrait + info on selected

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import { CARDS as CAMPAIGN_CHARS } from '../../constants/campaigns.js'
import { buildStartingDeck } from '../../utils/deck.js'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'
import { useAudio } from '../../hooks/useAudio.js'

// Floating ember
function Ember({ delay }) {
  const x = 30 + Math.random() * 50
  const size = 2 + Math.random() * 4
  return (
    <motion.div
      initial={{ opacity: 0, x: `${x}vw`, y: '95vh' }}
      animate={{ opacity: [0, 0.8, 0], y: '-5vh', x: [`${x}vw`, `${x + (Math.random()-0.5)*10}vw`] }}
      transition={{ duration: 5 + Math.random()*4, delay, repeat: Infinity, repeatDelay: Math.random()*3 }}
      style={{ position:'absolute', width: size, height: size, borderRadius:'50%',
        background:'radial-gradient(circle,#ffaa44,#ff6600)', boxShadow:`0 0 ${size*2}px #ff6600`, pointerEvents:'none' }}
    />
  )
}

// STS-style scroll-banner button
function BannerButton({ children, color = 'red', onClick, side = 'left' }) {
  const colors = {
    red:  { bg: '#8B1A1A', border: '#c0392b', text: '#f8d7b0', shadow: '#c0392b' },
    teal: { bg: '#1A5F7A', border: '#2980b9', text: '#b8e8f8', shadow: '#2980b9' },
  }
  const c = colors[color]
  return (
    <motion.button
      whileHover={{ scale: 1.05, x: side === 'left' ? -3 : 3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      style={{
        background: `linear-gradient(135deg, ${c.bg}, ${c.bg}cc)`,
        border: `2px solid ${c.border}`,
        borderRadius: side === 'left' ? '0 8px 8px 0' : '8px 0 0 8px',
        boxShadow: `0 4px 15px ${c.shadow}44, inset 0 1px 0 rgba(255,255,255,0.1)`,
        color: c.text,
        fontFamily: "'Cinzel', Georgia, serif",
        fontWeight: 700,
        fontSize: '1.1rem',
        padding: '10px 28px',
        cursor: 'pointer',
        letterSpacing: '0.05em',
        position: 'relative',
      }}
    >
      {/* Wave cutout effect on inner edge */}
      <span
        style={{
          position: 'absolute',
          [side === 'left' ? 'right' : 'left']: -8,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 16,
          height: '140%',
          background: 'rgba(0,0,0,0)',
          borderRadius: side === 'left' ? '0 50% 50% 0' : '50% 0 0 50%',
          boxShadow: side === 'left' ? `4px 0 0 rgba(0,0,0,0.5)` : `-4px 0 0 rgba(0,0,0,0.5)`,
        }}
      />
      {children}
    </motion.button>
  )
}

// Square character icon tile (like STS)
function CharTile({ char, isSelected, onClick }) {
  return (
    <motion.button
      whileHover={!char.locked ? { scale: 1.08, y: -4 } : {}}
      whileTap={!char.locked ? { scale: 0.95 } : {}}
      onClick={onClick}
      style={{
        width: 90,
        height: 90,
        borderRadius: 8,
        border: isSelected
          ? '3px solid #F5C842'
          : '2px solid #555',
        background: isSelected
          ? 'linear-gradient(145deg, #3a2800, #1a1200)'
          : 'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
        cursor: char.locked ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: isSelected
          ? '0 0 20px #F5C84244, 0 4px 12px rgba(0,0,0,0.6)'
          : '0 2px 8px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      {/* Gold border glow on selected */}
      {isSelected && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at center, #F5C84222, transparent 70%)',
        }} />
      )}

      {char.locked ? (
        // Padlock icon (like STS)
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <div style={{
            width: 32, height: 32,
            border: '3px solid #666',
            borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative',
            background: '#3a3a3a',
          }}>
            {/* Lock shackle */}
            <div style={{
              position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
              width: 16, height: 14,
              border: '3px solid #666',
              borderBottom: 'none',
              borderRadius: '8px 8px 0 0',
            }} />
            <div style={{ width: 4, height: 4, background: '#888', borderRadius: '50%' }} />
          </div>
        </div>
      ) : (
        // Character icon
        <div style={{ fontSize: 36, lineHeight: 1 }}>
          {char.id === 'kenji' ? '⚔️' : char.id === 'hana' ? '🌸' : char.id === 'yuki' ? '❄️' : '?'}
        </div>
      )}
    </motion.button>
  )
}



export function CharacterSelect() {
  const navigate = useNavigate()
  const store = useRunStore()
  const { playSFX, stopMusic } = useAudio()
  const [selectedChar, setSelectedChar] = useState(null)
  
  const campaignId = sessionStorage.getItem('selected_campaign') || 'japanese'
  const CHARS = CAMPAIGN_CHARS[campaignId]?.characters || []

  const handleTileClick = (char) => {
    if (char.locked) return
    setSelectedChar(prev => prev?.id === char.id ? null : char)
  }

  const handleEmbark = () => {
    if (!selectedChar) return
    playSFX('button_click')
    stopMusic()
    const campaign = CAMPAIGN_CHARS[campaignId]
    
    // Choose rare card based on character
    const rareCard = selectedChar.id === 'hana' ? 'jp_read_newcomers_luck'
                   : selectedChar.id === 'yuki' ? 'jp_read_returnees_insight'
                   : 'jp_read_travelers_wisdom'

    const deck = buildStartingDeck(
      campaign.startingVocabCards || [],
      campaign.startingGrammarCards || [],
      campaign.startingReadingCards || [],
      rareCard
    )
    // Store run config in sessionStorage — startRun will be called by ModifierSelect
    // after the modifier is chosen, so starting HP/energy/gold apply correctly.
    sessionStorage.setItem('pending_run', JSON.stringify({
      campaignId,
      character: selectedChar,
      deck,
      starterRelic: selectedChar.starterRelic,
    }))
    sessionStorage.removeItem('active_encounter')
    navigate('/modifier-select')
  }

  return (
    <ScreenTransition>
      <div className="relative w-full h-screen overflow-hidden" style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
        {/* Background — same tower art, heavily dimmed */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/ui/main_menu_tower_bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.35) saturate(0.6)',
          }}
        />
        {/* Extra dark overlay */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Floating embers */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => <Ember key={i} delay={i * 0.6} />)}
        </div>

        {/* ── Selected character detail — left side ── */}
        <AnimatePresence>
          {selectedChar && (
            <motion.div
              key={selectedChar.id}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
              className="absolute left-0 top-0 bottom-0 z-10 flex flex-col justify-center"
              style={{ width: '45%', padding: '3rem 3rem 7rem 3.5rem' }}
            >
              {/* Character name */}
              <div
                style={{
                  fontSize: 'clamp(1.8rem, 3.5vw, 3rem)',
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontWeight: 700,
                  color: '#F5C842',
                  textShadow: '0 0 40px #F5C84244, 0 4px 8px rgba(0,0,0,0.9)',
                  marginBottom: '0.5rem',
                  lineHeight: 1,
                }}
              >
                {selectedChar.name}
              </div>
              <div className="text-amber-500/80 text-sm mb-4" style={{ fontFamily: "'Cinzel', serif" }}>
                {selectedChar.title}
              </div>

              {/* HP + Gold stats */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <span className="flex items-center gap-1.5 text-red-400">
                  ❤️ <span className="font-bold text-white">HP: {selectedChar.startingHp || 80}/{selectedChar.startingHp || 80}</span>
                </span>
                <span className="flex items-center gap-1.5 text-yellow-400">
                  🪙 <span className="font-bold text-white">Gold: 99</span>
                </span>
              </div>

              {/* Lore description */}
              <p className="text-gray-300 text-sm leading-relaxed mb-4 max-w-xs">
                {selectedChar.description}
              </p>

              {/* Starting relic / passive */}
              {selectedChar.starterRelic && (
                <div className="flex items-start gap-2 mb-4">
                  <span className="text-xl mt-0.5">🔥</span>
                  <div>
                    <div className="text-amber-300 text-xs font-bold mb-0.5"
                      style={{ fontFamily: "'Cinzel', serif" }}>
                      {selectedChar.starterRelic.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </div>
                    <div className="text-gray-400 text-xs">
                      Starter relic — active throughout your journey.
                    </div>
                  </div>
                </div>
              )}

              {/* Deck breakdown */}
              <div className="text-gray-500 text-xs mb-2">Starting Deck</div>
              <div className="flex gap-2 flex-wrap mb-6">
                {[
                  { label: `⚔️ ×${selectedChar.startingDeckBreakdown?.vocabulary || 4}`, color: '#991b1b', border: '#b91c1c', text: '#fca5a5' },
                  { label: `🛡️ ×${selectedChar.startingDeckBreakdown?.grammar || 3}`,    color: '#1e3a5f', border: '#2563eb', text: '#93c5fd' },
                  { label: `📖 ×${selectedChar.startingDeckBreakdown?.reading || 2}`,    color: '#14532d', border: '#16a34a', text: '#86efac' },
                  { label: `★ ×${selectedChar.startingDeckBreakdown?.rare || 1}`,       color: '#78350f', border: '#d97706', text: '#fcd34d' },
                ].map(tag => (
                  <span
                    key={tag.label}
                    style={{
                      background: tag.color,
                      border: `1px solid ${tag.border}`,
                      color: tag.text,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Character portrait — right side ── */}
        <AnimatePresence>
          {selectedChar && (
            <motion.div
              key={`portrait-${selectedChar.id}`}
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.4 }}
              className="absolute right-0 top-0 bottom-0 z-10"
              style={{ width: '55%', paddingBottom: '6rem' }}
            >
              {['kenji', 'hana', 'yuki', 'minjun', 'jiwoo', 'mateo', 'elena'].includes(selectedChar.id) ? (
                <div className="relative w-full h-full">
                  <img
                    src={`/images/characters/${campaignId}/${selectedChar.id}.png`}
                    alt={selectedChar.name}
                    className="absolute inset-0 w-full h-full object-contain object-bottom z-10"
                    onError={e => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex' }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-40" style={{ display: 'none' }}>
                    {selectedChar.id === 'hana' ? '🌸' : selectedChar.id === 'yuki' ? '❄️' : '👤'}
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl opacity-40">
                  👤
                </div>
              )}
              {/* Radial glow behind portrait */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse 60% 80% at 50% 90%, #8B1A1A33, transparent 70%)',
              }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── "Choose Your Character" title (shown when nothing selected) ── */}
        <AnimatePresence>
          {!selectedChar && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
              style={{ paddingBottom: '160px' }}
            >
              <div
                style={{
                  fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontWeight: 700,
                  color: '#e8e8e8',
                  textShadow: '0 2px 12px rgba(0,0,0,0.9)',
                  letterSpacing: '0.05em',
                }}
              >
                Choose Your Character
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Character tiles row — bottom center ── */}
        <div
          className="absolute bottom-6 left-0 right-0 z-20 flex items-center justify-center gap-3"
        >
          {(CHARS.length > 0 ? CHARS : [
            { id: 'kenji', name: 'Kenji', locked: false },
            { id: 'locked1', locked: true },
            { id: 'locked2', locked: true },
            { id: 'locked3', locked: true },
          ]).map(char => (
            <CharTile
              key={char.id}
              char={char}
              isSelected={selectedChar?.id === char.id}
              onClick={() => handleTileClick(char)}
            />
          ))}
        </div>

        {/* ── Back button (bottom-left red banner) ── */}
        <div className="absolute bottom-8 left-0 z-20">
          <BannerButton color="red" side="left" onClick={() => navigate('/')}>
            Back
          </BannerButton>
        </div>

        {/* ── Embark button (bottom-right teal banner) ── */}
        <AnimatePresence>
          {selectedChar && (
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute bottom-8 right-0 z-20"
            >
              <BannerButton color="teal" side="right" onClick={handleEmbark}>
                Embark
              </BannerButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ScreenTransition>
  )
}
