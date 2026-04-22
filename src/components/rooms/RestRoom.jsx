// components/rooms/RestRoom.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import useSettingsStore from '../../stores/settingsStore.js'
import { isRuleActive } from '../../constants/masteryRules.js'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'

export function RestRoom() {
  const navigate = useNavigate()
  const store = useRunStore()
  const settings = useSettingsStore()
  const [chosen, setChosen] = useState(null)

  const restReviewOnly = isRuleActive('rest_review_only', store.masteryLevel)
  const healAmount = Math.floor(store.maxHp * 0.25)
  const canHeal = store.hp < store.maxHp

  const handleHeal = () => {
    setChosen('heal')
    store.healHp(healAmount)
    setTimeout(() => navigate('/map'), 1200)
  }

  const handleReview = () => {
    setChosen('review')
    // For Phase 1, just give a small restoration (full graveyard review in Phase 2)
    setTimeout(() => navigate('/map'), 1500)
  }

  return (
    <ScreenTransition>
      <div
        className="w-full h-screen flex flex-col items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #0a0516 0%, #1a0a00 100%)' }}
      >
        {/* Ambient glow */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(ellipse at 50% 50%, #FF8C00 0%, transparent 60%)' }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 max-w-md w-full px-6"
        >
          {/* Title */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3">🔥</div>
            <h1 className="text-2xl font-bold text-amber-200">Rest Site</h1>
            <p className="text-gray-400 text-sm mt-1">A moment of calm on the mountain path.</p>
          </div>

          {/* Options */}
          <div className="flex flex-col gap-4">
            {/* Heal */}
            {!restReviewOnly && (
              <motion.button
                whileHover={!chosen ? { scale: 1.02 } : {}}
                whileTap={!chosen ? { scale: 0.98 } : {}}
                onClick={!chosen ? handleHeal : undefined}
                disabled={!!chosen || !canHeal}
                className={`
                  p-5 rounded-2xl border-2 text-left transition-all
                  ${chosen === 'heal' ? 'border-emerald-500 bg-emerald-900/30' :
                    !canHeal ? 'border-gray-700 bg-gray-900/30 opacity-50' :
                    'border-amber-700/60 bg-amber-950/20 hover:border-amber-500 hover:bg-amber-950/40 cursor-pointer'}
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">❤️</span>
                  <div>
                    <div className="font-bold text-white">Rest & Heal</div>
                    <div className="text-xs text-gray-400">Restore {healAmount} HP (25% of max)</div>
                  </div>
                  {chosen === 'heal' && <span className="ml-auto text-emerald-400 text-lg">✓</span>}
                </div>
                <div className="text-xs text-gray-500">
                  Current HP: {store.hp} / {store.maxHp}
                  {!canHeal && ' (already at max)'}
                </div>
              </motion.button>
            )}

            {/* Review */}
            <motion.button
              whileHover={!chosen ? { scale: 1.02 } : {}}
              whileTap={!chosen ? { scale: 0.98 } : {}}
              onClick={!chosen ? handleReview : undefined}
              disabled={!!chosen}
              className={`
                p-5 rounded-2xl border-2 text-left transition-all
                ${chosen === 'review' ? 'border-blue-500 bg-blue-900/30' :
                  'border-blue-700/60 bg-blue-950/20 hover:border-blue-500 hover:bg-blue-950/40 cursor-pointer'}
              `}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📚</span>
                <div>
                  <div className="font-bold text-white">Review Mistakes</div>
                  <div className="text-xs text-gray-400">Study a word from your Graveyard — upgrade a card</div>
                </div>
                {chosen === 'review' && <span className="ml-auto text-blue-400 text-lg">✓</span>}
              </div>
              <div className="text-xs text-gray-500">
                Graveyard entries help target your weak points
              </div>
            </motion.button>
          </div>

          {/* Flavor */}
          <p className="text-center text-xs text-gray-600 mt-6 italic">
            「少し休め。山はまだ続く。」— Rest a while. The mountain goes on.
          </p>
        </motion.div>
      </div>
    </ScreenTransition>
  )
}
