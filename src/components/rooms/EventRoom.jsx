// components/rooms/EventRoom.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import { HoverTranslate } from '../shared/HoverTranslate.jsx'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'

export function EventRoom() {
  const navigate = useNavigate()
  const store = useRunStore()
  const [chosen, setChosen] = useState(null)
  const [outcome, setOutcome] = useState(null)

  // Load event from sessionStorage
  const eventData = (() => {
    try {
      const raw = sessionStorage.getItem('lq_current_event')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })()

  if (!eventData) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-950">
        <div className="text-gray-400">No event data found.</div>
        <button onClick={() => navigate('/map')} className="ml-4 text-gray-300 underline">Return to map</button>
      </div>
    )
  }

  const handleChoice = (option, idx) => {
    if (chosen !== null) return
    setChosen(idx)
    setOutcome(option)

    // Apply reward/penalty
    setTimeout(() => {
      const r = option.reward
      if (!r) return
      switch (r.type) {
        case 'heal': store.healHp(r.amount); break
        case 'gold': store.addGold(r.amount); break
        case 'hp_loss': store.setHp(store.hp - r.amount); break
        case 'card_upgrade': break // Phase 2: card upgrade logic
        case 'relic_random': break // Phase 2: relic grant logic
        default: break
      }
    }, 500)
  }

  return (
    <ScreenTransition>
      <div
        className="w-full h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(180deg, #0a0516 0%, #0d0a1a 100%)' }}
      >
        <div className="absolute inset-0 opacity-15"
          style={{ backgroundImage: 'radial-gradient(ellipse at 50% 30%, #9333EA 0%, transparent 60%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-lg w-full"
        >
          {/* Event title */}
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">❓</div>
            <h1 className="text-xl font-bold text-purple-200">{eventData.title}</h1>
            <div className="text-xs text-gray-500 mt-0.5">
              <HoverTranslate translation={eventData.title}>{eventData.title_target}</HoverTranslate>
            </div>
          </div>

          {/* Setup text */}
          <p className="text-sm text-gray-300 mb-3 text-center">{eventData.setup_text}</p>

          {/* NPC dialogue */}
          <div className="bg-gray-900/60 border border-purple-600/30 rounded-xl p-4 mb-6 text-center">
            <HoverTranslate translation={eventData.npc_dialogue_translation} className="text-lg text-purple-200 font-medium">
              {eventData.npc_dialogue}
            </HoverTranslate>
          </div>

          {/* Choices */}
          <div className="flex flex-col gap-3">
            {eventData.options.map((option, idx) => (
              <motion.button
                key={idx}
                whileHover={chosen === null ? { scale: 1.01 } : {}}
                whileTap={chosen === null ? { scale: 0.99 } : {}}
                onClick={() => handleChoice(option, idx)}
                className={`
                  p-4 rounded-xl border-2 text-left transition-all
                  ${chosen === idx
                    ? option.outcome === 'reward' ? 'border-green-500 bg-green-900/30' :
                      option.outcome === 'penalty' ? 'border-red-500 bg-red-900/30' :
                      'border-blue-500 bg-blue-900/30'
                    : chosen !== null ? 'border-gray-700 bg-gray-900/20 opacity-40'
                    : 'border-purple-700/50 bg-purple-950/20 hover:border-purple-500 hover:bg-purple-950/40 cursor-pointer'
                  }
                `}
                disabled={chosen !== null}
              >
                <HoverTranslate translation={option.translation} className="text-white font-medium">
                  {option.text}
                </HoverTranslate>
              </motion.button>
            ))}
          </div>

          {/* Outcome display */}
          <AnimatePresence>
            {outcome && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-3 rounded-xl text-sm text-center
                  ${outcome.outcome === 'reward' ? 'bg-green-900/30 text-green-200 border border-green-700' :
                    outcome.outcome === 'penalty' ? 'bg-red-900/30 text-red-200 border border-red-700' :
                    'bg-blue-900/30 text-blue-200 border border-blue-700'}`}
              >
                <p className="mb-1">{outcome.outcome_text}</p>
                <p className="text-xs text-gray-400">{outcome.reward?.description}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Continue button */}
          {chosen !== null && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/map')}
              className="mt-5 w-full py-3 rounded-xl bg-gray-800/60 border border-gray-700 text-gray-200 hover:bg-gray-700/60 transition-all font-medium"
            >
              Continue →
            </motion.button>
          )}
        </motion.div>
      </div>
    </ScreenTransition>
  )
}
