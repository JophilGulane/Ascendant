// components/menus/PantheonScreen.jsx
// Meta-progression hub. Accessible from the Main Menu.
// Shows: Pantheon Level, XP bar, stats, and the unlockable rewards.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'
import usePantheonStore, { PANTHEON_UNLOCKS } from '../../stores/pantheonStore.js'

const TABS = ['Overview', 'Unlocks', 'Stats']

export function PantheonScreen() {
  const navigate = useNavigate()
  const pantheon = usePantheonStore()
  const [tab, setTab] = useState('Overview')

  const level = pantheon.getLevel()
  const xpProgress = pantheon.getXpProgress()
  const nextLevelXp = pantheon.getXpToNextLevel()
  const available = pantheon.getAvailableUnlocks()

  return (
    <ScreenTransition>
      <div
        className="relative w-full h-screen flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #070412 0%, #0d0516 50%, #0a0d1a 100%)', fontFamily: "'Crimson Text', Georgia, serif" }}
      >
        {/* Starfield background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 60 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() > 0.8 ? 2 : 1,
                height: Math.random() > 0.8 ? 2 : 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: 0.2 + Math.random() * 0.5,
              }}
            />
          ))}
        </div>

        {/* Header */}
        <div
          className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-gray-800/50"
          style={{ background: 'linear-gradient(180deg, #12082a 0%, transparent 100%)' }}
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition-colors text-lg font-bold cursor-pointer"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              ← Back
            </button>
            <div className="text-gray-700">|</div>
            <h1 className="text-3xl font-bold text-purple-200" style={{ fontFamily: "'Cinzel Decorative', serif", textShadow: '0 0 30px rgba(167,139,250,0.4)' }}>
              The Pantheon
            </h1>
          </div>

          {/* Level badge */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-purple-400 uppercase tracking-widest">Pantheon Level</div>
              <div className="text-3xl font-black text-purple-200" style={{ fontFamily: "'Cinzel', serif" }}>
                {level}
              </div>
            </div>
            {/* XP bar */}
            <div className="w-48">
              <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                <span>{pantheon.xp} XP</span>
                {nextLevelXp && <span>Next: {nextLevelXp} XP</span>}
              </div>
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-purple-700 to-purple-400"
                  initial={{ width: 0 }}
                  animate={{ width: `${xpProgress}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="relative z-10 flex border-b border-gray-800 px-8">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer border-b-2 -mb-px
                ${tab === t ? 'text-purple-300 border-purple-400' : 'text-gray-600 border-transparent hover:text-gray-400'}`}
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {t}
              {t === 'Unlocks' && available.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-4 h-4 text-[10px] bg-amber-500 text-black rounded-full font-black">
                  {available.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="relative z-10 flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {tab === 'Overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <OverviewTab pantheon={pantheon} level={level} />
              </motion.div>
            )}
            {tab === 'Unlocks' && (
              <motion.div key="unlocks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <UnlocksTab pantheon={pantheon} />
              </motion.div>
            )}
            {tab === 'Stats' && (
              <motion.div key="stats" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <StatsTab pantheon={pantheon} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ScreenTransition>
  )
}

function OverviewTab({ pantheon, level }) {
  const available = pantheon.getAvailableUnlocks()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-12">
        <div className="text-8xl mb-4">✦</div>
        <h2 className="text-2xl text-purple-200 font-bold mb-2" style={{ fontFamily: "'Cinzel', serif" }}>
          The Pantheon honors your journey
        </h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto leading-relaxed">
          Every run you complete, every word you master, every floor you survive — it all accumulates here. 
          Grow strong enough, and the Pantheon rewards you with new paths.
        </p>
      </div>

      {/* XP Sources */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Per Correct Answer', value: '+2 XP', icon: '✓' },
          { label: 'Per Floor Cleared', value: '+20 XP', icon: '🗺️' },
          { label: 'Victory Bonus', value: '+100 XP', icon: '🏆' },
        ].map(item => (
          <div key={item.label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="text-purple-300 font-bold text-lg">{item.value}</div>
            <div className="text-gray-500 text-xs mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {/* Available unlocks banner */}
      {available.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-amber-900/30 border border-amber-700/50 rounded-xl p-4 flex items-center gap-4"
        >
          <div className="text-3xl">🎁</div>
          <div>
            <div className="text-amber-300 font-bold">{available.length} unlock{available.length > 1 ? 's' : ''} ready to claim!</div>
            <div className="text-amber-400/70 text-xs">Visit the Unlocks tab to claim your rewards.</div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function UnlocksTab({ pantheon }) {
  const available = pantheon.getAvailableUnlocks()

  const handleClaimAll = () => {
    pantheon.claimAllAvailable()
  }

  return (
    <div className="max-w-3xl mx-auto">
      {available.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-amber-300" style={{ fontFamily: "'Cinzel', serif" }}>
            Ready to Claim
          </h2>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleClaimAll}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-lg transition-colors cursor-pointer"
          >
            Claim All ({available.length})
          </motion.button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mb-8">
        {PANTHEON_UNLOCKS.map(unlock => {
          const isClaimed = pantheon.isUnlocked(unlock.id)
          const canClaim = pantheon.xp >= unlock.xpRequired && !isClaimed
          const progress = Math.min(100, Math.round((pantheon.xp / unlock.xpRequired) * 100))

          return (
            <div
              key={unlock.id}
              className={`relative rounded-xl border p-5 transition-all ${
                isClaimed ? 'border-green-800/50 bg-green-950/20' :
                canClaim ? 'border-amber-700/50 bg-amber-950/20' :
                'border-gray-800 bg-gray-900/30'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{unlock.label.split(' ')[0]}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`font-bold text-sm ${isClaimed ? 'text-green-400' : canClaim ? 'text-amber-300' : 'text-gray-400'}`}
                      style={{ fontFamily: "'Cinzel', serif" }}>
                      {unlock.label.split(' ').slice(1).join(' ')}
                    </span>
                    <span className="text-xs text-gray-500">{unlock.xpRequired} XP required</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{unlock.description}</p>
                  {!isClaimed && (
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-600 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                </div>
                <div className="ml-4 flex-shrink-0">
                  {isClaimed ? (
                    <div className="w-8 h-8 rounded-full bg-green-800 flex items-center justify-center text-green-400 font-bold">✓</div>
                  ) : canClaim ? (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => pantheon.claimUnlock(unlock.id)}
                      className="w-20 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Claim
                    </motion.button>
                  ) : (
                    <div className="text-xs text-gray-600">{progress}%</div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatsTab({ pantheon }) {
  const accuracy = pantheon.totalCorrectAnswers + pantheon.totalWrongAnswers > 0
    ? Math.round((pantheon.totalCorrectAnswers / (pantheon.totalCorrectAnswers + pantheon.totalWrongAnswers)) * 100)
    : 0

  const stats = [
    { label: 'Total Runs', value: pantheon.totalRuns, icon: '🎮' },
    { label: 'Victories', value: pantheon.totalVictories, icon: '🏆' },
    { label: 'Win Rate', value: pantheon.totalRuns > 0 ? `${Math.round((pantheon.totalVictories / pantheon.totalRuns) * 100)}%` : '—', icon: '📈' },
    { label: 'Total XP', value: `${pantheon.xp} XP`, icon: '✦' },
    { label: 'Correct Answers', value: pantheon.totalCorrectAnswers, icon: '✓' },
    { label: 'Wrong Answers', value: pantheon.totalWrongAnswers, icon: '✗' },
    { label: 'Accuracy', value: `${accuracy}%`, icon: '🎯' },
    { label: 'Floors Cleared', value: pantheon.totalFloors, icon: '🗺️' },
  ]

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-purple-300 mb-6" style={{ fontFamily: "'Cinzel', serif" }}>
        Lifetime Statistics
      </h2>
      <div className="grid grid-cols-2 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-gray-900/60 border border-gray-800 rounded-xl p-5 flex items-center gap-4">
            <div className="text-2xl">{stat.icon}</div>
            <div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
