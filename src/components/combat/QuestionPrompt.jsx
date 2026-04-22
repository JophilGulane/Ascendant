// components/combat/QuestionPrompt.jsx
// Mounts when a card is selected. Completely decoupled from combat state.
// Receives question data, fires onAnswer callback with result.
// NO KNOWLEDGE of cards, enemies, or damage.

import { motion, AnimatePresence } from 'framer-motion'
import { useQuestion } from '../../hooks/useQuestion.js'
import { shuffleOptions } from '../../utils/questions.js'
import { useState, useEffect } from 'react'

const OPTION_LABELS = ['A', 'B', 'C', 'D']

/**
 * @param {Object} questionData - { question, shuffledOptions, newCorrectIndex, card }
 * @param {number} masteryLevel
 * @param {boolean} canHint - player has energy to spend on hint
 * @param {function} onAnswer({ result, selectedIndex, timeUsed, isFirstTry })
 * @param {function} onHint - called when hint is requested (returns bool: was energy deducted)
 */
export function QuestionPrompt({ questionData, masteryLevel = 0, canHint = true, onAnswer, onHint }) {
  const { question, shuffledOptions, newCorrectIndex, card } = questionData

  const {
    timeLeft,
    timerProgress,
    hintShown,
    answered,
    selectedIndex,
    selectAnswer,
    revealHint,
  } = useQuestion({
    question: { ...question, correct_index: newCorrectIndex },
    masteryLevel,
    onResult: onAnswer,
  })

  const [flashIndex, setFlashIndex] = useState(null) // for answer feedback flash

  // Flash correct/wrong answer on selection
  useEffect(() => {
    if (selectedIndex !== null && answered) {
      setFlashIndex(selectedIndex)
    }
  }, [selectedIndex, answered])

  const handleHint = () => {
    if (!canHint || hintShown) return
    const success = onHint?.()
    if (success) revealHint()
  }

  const getOptionClass = (idx) => {
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
              {question.question}
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

          {/* Answer options */}
          <div className="px-4 pb-4 grid grid-cols-1 gap-2">
            {shuffledOptions.map((option, idx) => (
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
            ))}
          </div>

          {/* Hint button */}
          <div className="border-t border-gray-800 px-4 py-2 flex items-center justify-between">
            <button
              className={`
                text-xs px-3 py-1 rounded-lg border transition-all flex items-center gap-1.5
                ${hintShown || !canHint || answered
                  ? 'text-gray-600 border-gray-700 cursor-default opacity-50'
                  : 'text-amber-400 border-amber-700 hover:bg-amber-950/50 cursor-pointer'}
              `}
              onClick={handleHint}
              disabled={hintShown || !canHint || answered}
            >
              💡 Hint <span className="text-gray-500">(costs 1 energy)</span>
            </button>
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
      </div>
    </motion.div>
  )
}
