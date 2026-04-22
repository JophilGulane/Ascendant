// components/combat/QuestionPrompt.jsx
// Mounts when a card is selected. Completely decoupled from combat state.
// Receives question data, fires onAnswer callback with result.
// NO KNOWLEDGE of cards, enemies, or damage.

import { motion, AnimatePresence } from 'framer-motion'
import { useQuestion } from '../../hooks/useQuestion.js'
import { useState, useEffect } from 'react'
import useRunStore from '../../stores/runStore.js'
import useGraveyardStore from '../../stores/graveyardStore.js'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

/**
 * @param {Object} questionData - { question, shuffledOptions, newCorrectIndex, card }
 * @param {number} masteryLevel
 * @param {boolean} canHint - player has energy to spend on hint
 * @param {function} onAnswer({ result, selectedIndex, timeUsed, isFirstTry })
 * @param {function} onHint - called when hint is requested (returns bool: was energy deducted)
 */
export function QuestionPrompt({ questionData, masteryLevel = 0, canHint = true, onAnswer, onHint, bossPhase = 1 }) {
  const { question, shuffledOptions, newCorrectIndex, card } = questionData

  const s = useRunStore.getState()
  const graveyardEntries = useGraveyardStore(s => s.entries)
  const isUnseen = !graveyardEntries[question.id]
  const [discoveryMode, setDiscoveryMode] = useState(isUnseen)

  const hasHourglass = s.relics.includes('cracked_hourglass')
  const hasOldNotes = s.relics.includes('returnees_old_notes') && card.type === 'grammar'
  const canUseWornDict = s.relics.includes('worn_dictionary') && !s.wornDictionaryUsedThisFight && card.type === 'vocabulary'

  const isNoRomanization = masteryLevel >= 1
  const displayQuestion = isNoRomanization
    ? question.question.replace(/\s\([^)]+\)/g, '')
    : question.question

  const isBlind = masteryLevel >= 3 && s.blindCardId === card.id

  const {
    timeLeft,
    timerProgress,
    hintShown,
    answered,
    selectedIndex,
    selectAnswer,
    revealHint,
    halfDamage,
    setHalfDamage,
    hasFreeHints,
  } = useQuestion({
    question: { ...question, correct_index: newCorrectIndex },
    masteryLevel,
    onResult: onAnswer,
    noTimer: hasHourglass,
    autoHint: hasOldNotes,
    isPaused: discoveryMode,
  })

  // free_hints blessing must be derived after useQuestion (hasFreeHints comes from it)
  // then actualCanHint depends on both — so both live here together.
  const effectiveCanHint = hasFreeHints ? true : canHint
  const actualCanHint = effectiveCanHint && !isBlind

  const isTypedPhase = masteryLevel >= 10 && bossPhase >= 4 && s.currentEnemy?.id === 'jp_dragon_spirit'

  const [flashIndex, setFlashIndex] = useState(null) // for answer feedback flash
  const [wornDictActive, setWornDictActive] = useState(false)
  const [typedAnswer, setTypedAnswer] = useState('')

  // Flash correct/wrong answer on selection
  useEffect(() => {
    if (selectedIndex !== null && answered) {
      setFlashIndex(selectedIndex)
    }
  }, [selectedIndex, answered])

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (answered || isTypedPhase || discoveryMode) return
      if (e.key === '1') selectAnswer(0)
      if (e.key === '2') selectAnswer(1)
      if (e.key === '3') selectAnswer(2)
      if (e.key === '4') selectAnswer(3)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [answered, isTypedPhase, discoveryMode, selectAnswer])

  const handleHint = () => {
    if (!actualCanHint || hintShown) return
    // free_hints blessing: skip energy cost but still call onHint so server knows
    if (hasFreeHints) {
      revealHint()
      return
    }
    const success = onHint?.()
    if (success) revealHint()
  }

  const handleTypeSubmit = (e) => {
    e.preventDefault()
    if (answered || !typedAnswer.trim()) return
    const correctStr = question.options[question.correct_index].toLowerCase().trim()
    const isMatch = typedAnswer.toLowerCase().trim() === correctStr
    selectAnswer(isMatch ? question.correct_index : -1)
  }

  const getOptionClass = (idx) => {
    if (wornDictActive && idx === newCorrectIndex) return 'bg-emerald-900/80 border-emerald-500 text-emerald-100 shadow-[0_0_15px_#10b98188]'
    if (!answered || flashIndex === null) {
      return 'bg-gray-800/80 border-gray-600 hover:bg-gray-700/80 hover:border-gray-400 text-gray-100'
    }
    if (idx === newCorrectIndex) return 'bg-green-900/80 border-green-500 text-green-100'
    if (idx === flashIndex && idx !== newCorrectIndex) return 'bg-red-900/80 border-red-500 text-red-100'
    return 'bg-gray-800/40 border-gray-700 text-gray-500'
  }

  const timerColor = timerProgress > 50
    ? 'bg-green-500'
    : timerProgress > 25
      ? 'bg-yellow-500'
      : 'bg-red-500'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      // Once answered, stop intercepting clicks so End Turn / cards are immediately clickable
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 ${answered ? 'pointer-events-none' : ''}`}
    >
      <div className="w-full max-w-lg">
        {discoveryMode ? (
          <div className="bg-gray-950/95 border border-amber-500/60 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(245,200,66,0.2)]">
            <div className="bg-amber-900/60 px-4 py-3 border-b border-amber-700/40 text-center">
              <span className="text-sm text-amber-200 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                ✨ New Discovery ✨
              </span>
            </div>
            <div className="px-8 py-10 flex flex-col items-center justify-center text-center">
              <div className="text-4xl text-white font-bold mb-4">{question.question.replace(/\s\([^)]+\)/g, '')}</div>
              <div className="text-xl text-amber-400 mb-2">{question.options[question.correct_index]}</div>
              {question.hint && (
                <div className="text-sm text-gray-300 italic mt-6 p-4 bg-gray-900/80 rounded-lg border border-gray-700">
                  {question.hint}
                </div>
              )}
            </div>
            <div className="px-6 pb-6 pt-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDiscoveryMode(false)}
                className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg transition-colors text-lg"
              >
                Got it!
              </motion.button>
            </div>
          </div>
        ) : (
          <>
            {/* Timer bar */}
            {timerProgress !== null && (
              <div className="h-1.5 bg-gray-800 rounded-full mb-4 overflow-hidden">
                <motion.div
                  className={`h-full rounded-full ${timerColor} transition-colors duration-300`}
                  animate={{ width: `${timerProgress}%` }}
                  transition={{ duration: 0.9, ease: 'linear' }}
                />
              </div>
            )}

        {/* Main prompt card */}
        <div className="bg-gray-950/95 border border-gray-700/60 rounded-2xl overflow-hidden shadow-2xl">
          {/* Card type header */}
          <div className="bg-gray-900/80 px-4 py-2 border-b border-gray-700/40 flex items-center justify-between">
            <span className="text-xs text-gray-400 uppercase tracking-widest">
              {card.name_native} · {card.type}
            </span>
            {timerProgress !== null && (
              <span className={`text-xs font-mono ${timerProgress < 30 ? 'text-red-400' : 'text-gray-400'}`}>
                {timeLeft}s
              </span>
            )}
          </div>

          {/* Question text */}
          <div className="px-5 py-4">
            <p className="text-base text-white leading-relaxed font-medium">
              {displayQuestion}
            </p>

            {/* Hint section */}
            <AnimatePresence>
              {hintShown && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3 bg-amber-950/40 border border-amber-700/40 rounded-lg"
                >
                  <p className="text-xs text-amber-300 italic">{question.hint}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Answer options / Typed input */}
          <div className="px-4 pb-4 grid grid-cols-1 gap-2">
            {isTypedPhase ? (
              <form onSubmit={handleTypeSubmit} className="flex flex-col gap-2 mt-2">
                <input
                  type="text"
                  value={typedAnswer}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  disabled={answered}
                  autoFocus
                  placeholder="Type your answer in English..."
                  className={`w-full px-4 py-3 rounded-lg border-2 bg-gray-900 text-white outline-none transition-colors
                    ${answered && flashIndex === question.correct_index ? 'border-green-500 bg-green-900/30' :
                      answered && flashIndex === -1 ? 'border-red-500 bg-red-900/30' :
                      'border-amber-600 focus:border-amber-400'}`}
                />
                {answered && flashIndex === -1 && (
                  <p className="text-red-400 text-sm mt-1">Correct answer: {question.options[question.correct_index]}</p>
                )}
              </form>
            ) : (
              shuffledOptions.map((option, idx) => (
                <motion.button
                  key={idx}
                  className={`
                    w-full text-left px-4 py-2.5 rounded-lg border
                    text-sm transition-all duration-150 flex items-center gap-3
                    ${getOptionClass(idx)}
                    ${answered ? 'cursor-default' : 'cursor-pointer'}
                  `}
                  whileHover={!answered ? { scale: 1.01 } : {}}
                  whileTap={!answered ? { scale: 0.99 } : {}}
                  onClick={() => !answered && selectAnswer(idx)}
                  disabled={answered}
                >
                  <span className={`
                    w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0
                    ${answered && idx === newCorrectIndex ? 'bg-green-600' :
                      answered && idx === flashIndex && idx !== newCorrectIndex ? 'bg-red-600' :
                      'bg-gray-700'}
                  `}>
                    {OPTION_LABELS[idx]}
                  </span>
                  {option}
                </motion.button>
              ))
            )}
          </div>

          {/* Hint button */}
          <div className="border-t border-gray-800 px-4 py-2 flex items-center justify-between">
            <div className="flex gap-2">
              {canUseWornDict && !wornDictActive && (
                <button
                  className="text-xs px-3 py-1 rounded-lg border border-red-800 text-red-400 hover:bg-red-950/50 transition-all flex items-center gap-1.5"
                  onClick={() => {
                    useRunStore.getState().setWornDictionaryUsed()
                    setWornDictActive(true)
                    setHalfDamage(true)
                  }}
                  disabled={answered}
                  title="Worn Dictionary: Reveal answer but deal half damage"
                >
                  📖 Reveal (Half Dmg)
                </button>
              )}
              <button
                className={`
                  text-xs px-3 py-1 rounded-lg border transition-all flex items-center gap-1.5
                  ${hintShown || !actualCanHint || answered || wornDictActive
                    ? 'text-gray-600 border-gray-700 cursor-default opacity-50'
                    : 'text-amber-400 border-amber-700 hover:bg-amber-950/50 cursor-pointer'}
                `}
                onClick={handleHint}
                disabled={hintShown || !actualCanHint || answered || wornDictActive}
              >
                {isBlind ? '🚫 Hint Blocked' : '💡 Hint'} {!isBlind && <span className="text-gray-500">(costs 1 energy)</span>}
              </button>
            </div>
            {answered && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 italic"
              >
                {question.explanation}
              </motion.p>
            )}
          </div>
        </div>
        </>
        )}
      </div>
    </motion.div>
  )
}
