// components/menus/PostRunSummary.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import useProgressStore from '../../stores/progressStore.js'
import { useGraveyard } from '../../hooks/useGraveyard.js'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'

function generatePattern(correct, total, journalWords, journalGrammar) {
  if (total === 0) return 'No questions answered this run.'
  const acc = correct / total
  const vocabHeavy = journalWords.length > journalGrammar.length * 1.5
  const grammarHeavy = journalGrammar.length > journalWords.length * 1.5

  if (acc >= 0.8 && vocabHeavy) return 'Vocabulary specialist — try building a grammar combo deck next run.'
  if (acc >= 0.8 && grammarHeavy) return 'Grammar fortress — your defense is solid. Add more vocabulary cards.'
  if (acc >= 0.8) return 'Well-rounded accuracy. Ready to push to a harder floor.'
  if (acc >= 0.6) return 'Good instincts, room to sharpen. Review your Graveyard before the next run.'
  return 'Still finding your footing — that\'s normal. The mountain teaches patience.'
}

export function PostRunSummary() {
  const navigate = useNavigate()
  const store = useRunStore()
  const progressStore = useProgressStore()
  const graveyard = useGraveyard()
  const [phase, setPhase] = useState(0) // 0=learned, 1=struggled, 2=pattern

  const isWin = store.enemyHp <= 0 && store.floor >= 2
  const accuracy = store.sessionTotal > 0 ? store.sessionCorrect / store.sessionTotal : 1

  const topMissed = store.sessionMistakes
    .reduce((acc, m) => {
      const existing = acc.find(a => a.questionId === m.questionId)
      if (existing) existing.count++
      else acc.push({ ...m, count: 1 })
      return acc
    }, [])
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)

  useEffect(() => {
    // Merge session mistakes to graveyard
    graveyard.mergeSessionToGraveyard()
    // Record run end in progress store
    progressStore.recordRunEnd(
      store.campaign || 'japanese',
      store.character?.id || 'kenji',
      isWin,
      accuracy
    )
    // Advance through phases
    const timer = setTimeout(() => setPhase(1), 1200)
    const timer2 = setTimeout(() => setPhase(2), 2400)
    return () => { clearTimeout(timer); clearTimeout(timer2) }
  }, [])

  return (
    <ScreenTransition>
      <div
        className="w-full h-screen flex flex-col items-center justify-center px-4 overflow-y-auto"
        style={{ background: 'linear-gradient(180deg, #0a0516 0%, #0d0d0d 100%)' }}
      >
        {/* Win/Lose header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-8"
        >
          <div className="text-5xl mb-3">{isWin ? '🏯' : '💀'}</div>
          <h1 className={`text-3xl font-bold ${isWin ? 'text-amber-200' : 'text-gray-200'}`}>
            {isWin ? 'Summit Reached!' : 'The Path Ends Here'}
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Floor {store.floor} · {Math.round(accuracy * 100)}% accuracy · {store.sessionTotal} questions
          </p>
        </motion.div>

        <div className="w-full max-w-lg flex flex-col gap-6">
          {/* SECTION 1: What You Learned */}
          <AnimatePresence>
            {phase >= 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-900/60 border border-gray-700 rounded-2xl p-5"
              >
                <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider mb-3">
                  📚 What You Learned
                </h2>
                {store.journalWords.length === 0 && store.journalGrammar.length === 0 ? (
                  <p className="text-sm text-gray-500">No content recorded this run.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {store.journalWords.slice(0, 8).map(w => (
                      <span key={w.questionId} className="text-xs bg-red-950/50 border border-red-800 text-red-200 px-2 py-1 rounded-lg">
                        {w.word} = {w.translation}
                      </span>
                    ))}
                    {store.journalGrammar.slice(0, 4).map(g => (
                      <span key={g.questionId} className="text-xs bg-blue-950/50 border border-blue-800 text-blue-200 px-2 py-1 rounded-lg">
                        {g.concept}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* SECTION 2: Where You Struggled */}
          <AnimatePresence>
            {phase >= 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-900/60 border border-gray-700 rounded-2xl p-5"
              >
                <h2 className="text-sm font-bold text-red-300 uppercase tracking-wider mb-3">
                  🎯 Where You Struggled
                </h2>
                {topMissed.length === 0 ? (
                  <p className="text-sm text-gray-500">Perfect run — no mistakes recorded!</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {topMissed.map((m, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-white font-medium">{m.label}</span>
                        {m.reading && <span className="text-gray-500 ml-1 text-xs">({m.reading})</span>}
                        <span className="text-gray-500 ml-1 text-xs">— missed {m.count}×</span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* SECTION 3: Pattern */}
          <AnimatePresence>
            {phase >= 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gray-900/60 border border-gray-700 rounded-2xl p-5"
              >
                <h2 className="text-sm font-bold text-purple-300 uppercase tracking-wider mb-3">
                  💡 Your Pattern
                </h2>
                <p className="text-sm text-gray-200">
                  {generatePattern(
                    store.sessionCorrect,
                    store.sessionTotal,
                    store.journalWords,
                    store.journalGrammar
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action buttons */}
        {phase >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 mt-8"
          >
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                store.endRun()
                navigate('/character-select')
              }}
              className="px-6 py-3 rounded-xl bg-amber-700/60 border border-amber-600 text-amber-100 font-bold hover:bg-amber-600/60 transition-all text-sm cursor-pointer"
            >
              New Run
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                store.endRun()
                navigate('/')
              }}
              className="px-6 py-3 rounded-xl bg-gray-800/60 border border-gray-700 text-gray-200 font-medium hover:bg-gray-700/60 transition-all text-sm cursor-pointer"
            >
              Main Menu
            </motion.button>
          </motion.div>
        )}
      </div>
    </ScreenTransition>
  )
}
