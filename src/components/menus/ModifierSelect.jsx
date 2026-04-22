// components/menus/ModifierSelect.jsx
// Blessing & Curse run modifier selection screen.
// Shown after CharacterSelect, before the run starts.
// Player chooses to take a Blessing+Curse pair or skip it. Max 1 pair per run.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'
import { sampleModifierPairs } from '../../data/modifiers.js'
import useRunStore from '../../stores/runStore.js'

const PAIRS_TO_SHOW = 3

export function ModifierSelect() {
  const navigate = useNavigate()
  const store = useRunStore()
  const [pairs, setPairs] = useState([])
  const [hovered, setHovered] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    setPairs(sampleModifierPairs(PAIRS_TO_SHOW))
  }, [])

  const handleSelect = (pair) => {
    if (confirmed) return
    setSelected(prev => prev?.id === pair.id ? null : pair)
  }

  // Reads pending_run from sessionStorage (set by CharacterSelect),
  // applies the chosen modifier, then calls startRun — so HP/energy/gold
  // are calculated with the actual modifier in place.
  const commitRun = (chosenModifier) => {
    try {
      const raw = sessionStorage.getItem('pending_run')
      if (!raw) { navigate('/'); return }
      const { campaignId, character, deck, starterRelic } = JSON.parse(raw)
      sessionStorage.removeItem('pending_run')

      if (chosenModifier) {
        sessionStorage.setItem('chosen_modifier', JSON.stringify(chosenModifier))
      } else {
        sessionStorage.removeItem('chosen_modifier')
      }

      store.startRun(campaignId, character, 0, deck, starterRelic)
      sessionStorage.removeItem('active_encounter')
    } catch (e) {
      console.error('[ModifierSelect] Failed to commit run:', e)
      navigate('/')
    }
  }

  const handleConfirm = () => {
    if (confirmed) return
    setConfirmed(true)
    commitRun(selected || null)
    setTimeout(() => navigate('/map'), 400)
  }

  const handleSkipAll = () => {
    if (confirmed) return
    setConfirmed(true)
    commitRun(null)
    setTimeout(() => navigate('/map'), 300)
  }

  return (
    <ScreenTransition>
      <div
        className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0d0814 0%, #0a0516 50%, #0d0d0d 100%)', fontFamily: "'Crimson Text', Georgia, serif" }}
      >
        {/* Particle bg */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 2 + Math.random() * 3,
                height: 2 + Math.random() * 3,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: i % 2 === 0 ? '#F5C842' : '#C41E3A',
                opacity: 0.3 + Math.random() * 0.4,
              }}
              animate={{ y: [0, -20, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3 + Math.random() * 4, repeat: Infinity, delay: Math.random() * 3 }}
            />
          ))}
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 z-10"
        >
          <div className="text-5xl mb-3">⚖️</div>
          <h1 className="text-4xl font-bold text-amber-300 mb-2" style={{ fontFamily: "'Cinzel', serif", textShadow: '0 0 30px rgba(245,200,66,0.4)' }}>
            Blessing & Curse
          </h1>
          <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
            Every blessing carries a shadow. Choose one pair to take into your run — or walk alone.
          </p>
        </motion.div>

        {/* Modifier pairs */}
        <div className="flex gap-6 z-10 flex-wrap justify-center px-8 max-w-5xl">
          {pairs.map((pair, i) => {
            const isSelected = selected?.id === pair.id
            const isHovered = hovered === pair.id
            return (
              <motion.div
                key={pair.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                onHoverStart={() => setHovered(pair.id)}
                onHoverEnd={() => setHovered(null)}
                onClick={() => handleSelect(pair)}
                className="cursor-pointer relative"
                style={{ width: 280 }}
                whileHover={{ y: -6 }}
              >
                {/* Card container */}
                <div
                  className="rounded-2xl overflow-hidden border-2 transition-all duration-200"
                  style={{
                    borderColor: isSelected ? '#F5C842' : isHovered ? '#555' : '#2a2a2a',
                    background: 'linear-gradient(160deg, #1a1208 0%, #0d0d0d 100%)',
                    boxShadow: isSelected
                      ? '0 0 30px rgba(245,200,66,0.3), 0 8px 24px rgba(0,0,0,0.8)'
                      : '0 8px 24px rgba(0,0,0,0.8)',
                  }}
                >
                  {/* Blessing half */}
                  <div className="p-5 border-b border-gray-800/50">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl mt-0.5">{pair.blessing.icon}</div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-amber-500 mb-1">Blessing</div>
                        <div className="text-base font-bold text-amber-200 mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
                          {pair.blessing.name}
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{pair.blessing.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Divider with "+" */}
                  <div className="flex items-center justify-center py-2 relative">
                    <div className="absolute inset-x-0 top-1/2 h-px bg-gray-800" />
                    <div className="relative z-10 w-6 h-6 rounded-full bg-gray-900 border border-gray-700 flex items-center justify-center text-gray-500 text-xs font-bold">
                      +
                    </div>
                  </div>

                  {/* Curse half */}
                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl mt-0.5">{pair.curse.icon}</div>
                      <div>
                        <div className="text-xs font-bold uppercase tracking-widest text-red-500 mb-1">Curse</div>
                        <div className="text-base font-bold text-red-300 mb-1" style={{ fontFamily: "'Cinzel', serif" }}>
                          {pair.curse.name}
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{pair.curse.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Selected indicator */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none rounded-2xl"
                        style={{ boxShadow: 'inset 0 0 0 2px #F5C842' }}
                      >
                        <div className="absolute top-3 right-3 w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-black font-bold text-sm">
                          ✓
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="z-10 mt-10 flex flex-col items-center gap-4"
        >
          <motion.button
            whileHover={selected ? { scale: 1.04 } : {}}
            whileTap={selected ? { scale: 0.97 } : {}}
            onClick={selected ? handleConfirm : undefined}
            className={`px-10 py-4 rounded-xl font-bold text-lg border-2 transition-all ${
              selected
                ? 'bg-amber-600 border-amber-400 text-white cursor-pointer shadow-[0_0_20px_rgba(245,200,66,0.4)]'
                : 'bg-gray-900 border-gray-700 text-gray-600 cursor-default'
            }`}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            {selected ? `Accept Pact — ${selected.blessing.name} + ${selected.curse.name}` : 'Select a Pact Above'}
          </motion.button>

          <button
            onClick={handleSkipAll}
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer underline underline-offset-2"
          >
            Walk alone — no modifier
          </button>
        </motion.div>
      </div>
    </ScreenTransition>
  )
}
