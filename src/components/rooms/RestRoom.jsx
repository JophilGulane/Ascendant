// components/rooms/RestRoom.jsx
// v4: Review option now includes a quiz → card upgrade flow
import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import useGraveyardStore from '../../stores/graveyardStore.js'
import useSettingsStore from '../../stores/settingsStore.js'
import { isRuleActive } from '../../constants/masteryRules.js'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'
import { useAudio } from '../../hooks/useAudio.js'
import { TopBar } from '../shared/TopBar.jsx'
import { VaultScreen } from '../menus/VaultScreen.jsx'
import { HoverTranslate } from '../shared/HoverTranslate.jsx'
import { CARD_TYPE_META } from '../../constants/cardTypes.js'

export function RestRoom() {
  const navigate = useNavigate()
  const store = useRunStore()
  const graveyard = useGraveyardStore()
  const settings = useSettingsStore()
  const { playSFX, playMusic } = useAudio()
  const [chosen, setChosen] = useState(null)

  // Review flow state machine: null → 'quiz' → 'upgrade' → 'done'
  const [reviewPhase, setReviewPhase] = useState(null)
  const [reviewQuestion, setReviewQuestion] = useState(null)
  const [reviewResult, setReviewResult] = useState(null) // 'correct' | 'wrong'
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [cardMap, setCardMap] = useState({})

  useEffect(() => {
    playMusic(store.campaign || 'japanese', store.floor)
  }, [playMusic, store.campaign, store.floor])

  // Load card data for upgrade picker
  useEffect(() => {
    import(`../../data/${store.campaign || 'japanese'}/cards.json`).then(mod => {
      const map = {}
      mod.default.forEach(c => { map[c.id] = c })
      setCardMap(map)
    })
  }, [store.campaign])

  // Load questions data for the review quiz
  const [questions, setQuestions] = useState([])
  useEffect(() => {
    import(`../../data/${store.campaign || 'japanese'}/questions.json`).then(mod => {
      setQuestions(mod.default)
    })
  }, [store.campaign])

  const restReviewOnly = isRuleActive('rest_review_only', store.masteryLevel)
  const healAmount = Math.floor(store.maxHp * 0.25)
  const canHeal = store.hp < store.maxHp
  // Curse: no_rest_heal—rest sites cannot heal
  const noRestHeal = store.activeModifier?.curse?.effect?.type === 'no_rest_heal'

  const handleHeal = () => {
    setChosen('heal')
    playSFX('correct')
    store.healHp(healAmount)
    sessionStorage.removeItem('active_encounter')
    setTimeout(() => navigate('/map'), 1200)
  }

  // v4: Review now starts the quiz flow instead of immediately leaving
  const handleReview = () => {
    setChosen('review')
    playSFX('button_click')

    // Pick a graveyard question for the quiz
    const graveyardEntries = graveyard.getSortedEntries().filter(e => !e.mastered)
    if (graveyardEntries.length === 0 || questions.length === 0) {
      // No graveyard entries — skip straight to upgrade picker
      setReviewPhase('upgrade')
      setReviewResult('correct')
      return
    }

    // Pick a random un-mastered entry and find its matching question
    const shuffled = [...graveyardEntries].sort(() => Math.random() - 0.5)
    const target = shuffled[0]
    const matchingQ = questions.find(q => q.id === target.id)

    if (!matchingQ) {
      // If question not found, skip to upgrade
      setReviewPhase('upgrade')
      setReviewResult('correct')
      return
    }

    // Shuffle options for display
    const correctIdx = matchingQ.correct_index
    const options = [...matchingQ.options]
    const indices = options.map((_, i) => i).sort(() => Math.random() - 0.5)
    const shuffledOpts = indices.map(i => options[i])
    const newCorrectIdx = indices.indexOf(correctIdx)

    setReviewQuestion({
      ...matchingQ,
      shuffledOptions: shuffledOpts,
      newCorrectIndex: newCorrectIdx,
      graveyardEntry: target,
    })
    setReviewPhase('quiz')
  }

  const handleQuizAnswer = (idx) => {
    if (selectedAnswer !== null) return
    setSelectedAnswer(idx)

    const isCorrect = idx === reviewQuestion.newCorrectIndex
    if (isCorrect) {
      playSFX('correct')
      graveyard.recordCorrect(
        reviewQuestion.id,
        reviewQuestion.graveyardEntry.label,
        reviewQuestion.graveyardEntry.reading
      )
      setReviewResult('correct')
      setTimeout(() => setReviewPhase('upgrade'), 1200)
    } else {
      playSFX('wrong')
      setReviewResult('wrong')
      // Wrong answer — no upgrade, but still count as review
      setTimeout(() => {
        sessionStorage.removeItem('active_encounter')
        navigate('/map')
      }, 2000)
    }
  }

  const handleUpgradeCard = (cardId) => {
    store.upgradeCard(cardId)
    playSFX('relic_obtain')
    setReviewPhase('done')
    sessionStorage.removeItem('active_encounter')
    setTimeout(() => navigate('/map'), 1500)
  }

  const handleSkipUpgrade = () => {
    playSFX('button_click')
    setReviewPhase('done')
    sessionStorage.removeItem('active_encounter')
    setTimeout(() => navigate('/map'), 800)
  }

  // Get unique non-upgraded cards for the upgrade picker
  const upgradeableDeck = useMemo(() => {
    const seen = new Set()
    return store.deck
      .map(id => cardMap[id])
      .filter(Boolean)
      .filter(card => {
        if (seen.has(card.id)) return false
        if (store.upgradedCards?.includes(card.id)) return false
        seen.add(card.id)
        return true
      })
  }, [store.deck, store.upgradedCards, cardMap])

  const [vaultOpen, setVaultOpen] = useState(false)
  const hasVaultRelics = (store.vaultRelics?.length ?? 0) > 0

  const handleVault = () => {
    playSFX('button_click')
    setVaultOpen(true)
  }

  return (
    <ScreenTransition>
      <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full z-50">
          <TopBar />
        </div>

        <div
          className="w-full h-full flex flex-col items-center justify-center px-6 pt-16"
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
          {/* ── Review Quiz Phase ── */}
          <AnimatePresence mode="wait">
            {reviewPhase === 'quiz' && reviewQuestion && (
              <motion.div
                key="quiz"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-950/95 border border-blue-700/50 rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="bg-blue-900/40 px-4 py-3 border-b border-blue-700/30 text-center">
                  <span className="text-sm text-blue-200 font-bold uppercase tracking-widest">
                    📚 Review Quiz
                  </span>
                </div>
                <div className="px-6 py-5">
                  <p className="text-base text-white font-medium mb-1 leading-relaxed">
                    {reviewQuestion.question}
                  </p>
                  {reviewQuestion.hint && (
                    <p className="text-xs text-gray-400 italic mb-4">{reviewQuestion.hint}</p>
                  )}
                  <div className="flex flex-col gap-2 mt-4">
                    {reviewQuestion.shuffledOptions.map((opt, idx) => {
                      let btnClass = 'bg-gray-800/80 border-gray-600 hover:bg-gray-700/80 text-gray-100'
                      if (selectedAnswer !== null) {
                        if (idx === reviewQuestion.newCorrectIndex) {
                          btnClass = 'bg-green-900/80 border-green-500 text-green-100'
                        } else if (idx === selectedAnswer && idx !== reviewQuestion.newCorrectIndex) {
                          btnClass = 'bg-red-900/80 border-red-500 text-red-100'
                        } else {
                          btnClass = 'bg-gray-800/40 border-gray-700 text-gray-500'
                        }
                      }
                      return (
                        <motion.button
                          key={idx}
                          whileHover={selectedAnswer === null ? { scale: 1.01 } : {}}
                          whileTap={selectedAnswer === null ? { scale: 0.99 } : {}}
                          onClick={() => handleQuizAnswer(idx)}
                          disabled={selectedAnswer !== null}
                          className={`w-full text-left px-4 py-2.5 rounded-lg border text-sm transition-all ${btnClass} ${selectedAnswer !== null ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          <span className={`inline-flex w-6 h-6 rounded items-center justify-center text-xs font-bold mr-3 flex-shrink-0 ${
                            selectedAnswer !== null && idx === reviewQuestion.newCorrectIndex ? 'bg-green-600' :
                            selectedAnswer !== null && idx === selectedAnswer ? 'bg-red-600' : 'bg-gray-700'
                          }`}>
                            {['A', 'B', 'C', 'D'][idx]}
                          </span>
                          {opt}
                        </motion.button>
                      )
                    })}
                  </div>
                  {reviewResult === 'correct' && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-green-400 font-bold mt-4 text-sm">
                      ✓ Correct! Choose a card to upgrade...
                    </motion.p>
                  )}
                  {reviewResult === 'wrong' && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-red-400 font-bold mt-4 text-sm">
                      ✗ Wrong! The review is over. Returning to the map...
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Upgrade Picker Phase ── */}
            {reviewPhase === 'upgrade' && (
              <motion.div
                key="upgrade"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-gray-950/95 border border-amber-700/50 rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="bg-amber-900/40 px-4 py-3 border-b border-amber-700/30 text-center">
                  <span className="text-sm text-amber-200 font-bold uppercase tracking-widest">
                    ⚔️ Upgrade a Card
                  </span>
                </div>
                <p className="text-xs text-gray-400 text-center px-4 pt-3">
                  Choose a card to permanently upgrade. Upgraded cards deal +3 damage, +3 block, +2 heal, or +1 draw.
                </p>
                <div className="px-4 py-4 max-h-72 overflow-y-auto">
                  {upgradeableDeck.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">All cards are already upgraded!</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-2">
                      {upgradeableDeck.map(card => {
                        const typeMeta = CARD_TYPE_META[card.type] || {}
                        const e = card.effect || {}
                        const boostText = e.damage ? `+3 dmg` : e.block ? `+3 blk` : e.heal ? `+2 heal` : e.draw ? `+1 draw` : '+buff'
                        return (
                          <motion.button
                            key={card.id}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleUpgradeCard(card.id)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-700 bg-gray-900/60 hover:border-amber-500 hover:bg-amber-950/30 transition-all cursor-pointer text-left group"
                          >
                            <span className="text-lg flex-shrink-0">{typeMeta.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className={`font-bold text-sm ${typeMeta.colorClass} truncate`}>
                                <HoverTranslate translation={card.name_native}>
                                  {card.name_target}
                                </HoverTranslate>
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {e.damage ? `${e.damage} dmg` : ''}{e.block ? `${e.block} blk` : ''}{e.heal ? `heal ${e.heal}` : ''}{e.draw ? `draw ${e.draw}` : ''}
                                {' · '}{card.type}
                              </div>
                            </div>
                            <div className="flex-shrink-0 px-2 py-1 rounded-lg bg-amber-900/50 border border-amber-700/50 text-amber-300 text-xs font-bold group-hover:bg-amber-800/60">
                              → {boostText}
                            </div>
                          </motion.button>
                        )
                      })}
                    </div>
                  )}
                </div>
                <div className="px-4 pb-4">
                  <button
                    onClick={handleSkipUpgrade}
                    className="w-full py-2 text-sm text-gray-500 hover:text-gray-300 transition-colors cursor-pointer"
                  >
                    Skip upgrade
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── Done Phase ── */}
            {reviewPhase === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <div className="text-4xl mb-3">✨</div>
                <p className="text-amber-200 font-bold text-lg">Card Upgraded!</p>
                <p className="text-gray-400 text-sm mt-1">Returning to the map...</p>
              </motion.div>
            )}

            {/* ── Main Rest Options (default view) ── */}
            {!reviewPhase && (
              <motion.div key="options" exit={{ opacity: 0 }}>
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
                      whileHover={!chosen && !noRestHeal ? { scale: 1.02 } : {}}
                      whileTap={!chosen && !noRestHeal ? { scale: 0.98 } : {}}
                      onClick={!chosen && !noRestHeal ? handleHeal : undefined}
                      disabled={!!chosen || !canHeal || noRestHeal}
                      className={`
                        p-5 rounded-2xl border-2 text-left transition-all
                        ${chosen === 'heal' ? 'border-emerald-500 bg-emerald-900/30' :
                          noRestHeal ? 'border-red-900/50 bg-red-950/20 opacity-50' :
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
                        {noRestHeal && <span className="text-red-400"> (Cursed — healing forbidden)</span>}
                      </div>
                    </motion.button>
                  )}

                  {/* Review & Upgrade */}
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
                        <div className="font-bold text-white">Review & Upgrade</div>
                        <div className="text-xs text-gray-400">Answer a review question — upgrade a card if correct</div>
                      </div>
                      {chosen === 'review' && <span className="ml-auto text-blue-400 text-lg">✓</span>}
                    </div>
                    <div className="text-xs text-gray-500">
                      Correct answer = permanently boost a card's stats (+3 dmg / +3 blk / +2 heal)
                    </div>
                  </motion.button>

                  {/* Vault */}
                  <motion.button
                    whileHover={!chosen ? { scale: 1.02 } : {}}
                    whileTap={!chosen ? { scale: 0.98 } : {}}
                    onClick={!chosen ? handleVault : undefined}
                    disabled={!!chosen}
                    className={`
                      p-5 rounded-2xl border-2 text-left transition-all
                      ${!hasVaultRelics
                        ? 'border-gray-800 bg-gray-900/10 opacity-40 cursor-default'
                        : 'border-amber-700/60 bg-amber-950/20 hover:border-amber-500 hover:bg-amber-950/40 cursor-pointer'}
                    `}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">🗄️</span>
                      <div>
                        <div className="font-bold text-white">Visit The Vault</div>
                        <div className="text-xs text-gray-400">Freely swap your relic loadout</div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {hasVaultRelics
                        ? `${store.vaultRelics.length} relic${store.vaultRelics.length !== 1 ? 's' : ''} stored in your Vault`
                        : 'Your Vault is empty — find and swap relics to fill it'}
                    </div>
                  </motion.button>
                </div>

                {/* Flavor */}
                <p className="text-center text-xs text-gray-600 mt-6 italic">
                  「少し休め。山はまだ続く。」— Rest a while. The mountain goes on.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </div>
      </div>

      {/* Vault overlay */}
      <AnimatePresence>
        {vaultOpen && <VaultScreen onClose={() => setVaultOpen(false)} />}
      </AnimatePresence>
    </ScreenTransition>
  )
}
