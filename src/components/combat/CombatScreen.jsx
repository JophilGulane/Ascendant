// components/combat/CombatScreen.jsx
// Orchestrates all combat components. Reads store, passes props down.
// Handles turn flow by calling useCombat hook actions.

import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import { useCombat } from '../../hooks/useCombat.js'
import { useDraft } from '../../hooks/useDraft.js'
import { useAudio } from '../../hooks/useAudio.js'
import { EnemyDisplay } from './EnemyDisplay.jsx'
import { PlayerStatus } from './PlayerStatus.jsx'
import { EnergyBar } from './EnergyBar.jsx'
import CardHand from './CardHand.jsx'
import { QuestionPrompt } from './QuestionPrompt.jsx'
import { ChainIndicator } from './ChainIndicator.jsx'
import { CARD_TYPES } from '../../constants/cardTypes.js'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'
import { JournalOverlay } from '../journal/JournalOverlay.jsx'
import DraftScreen from '../menus/DraftScreen.jsx'

export function CombatScreen() {
  const navigate = useNavigate()
  const store = useRunStore()
  const {
    cardMap, activeQuestion, activeCardId, animState, damageNumbers, isEnemyDefeated, isPlayerDefeated,
    startFight, selectCard, resolveAnswer, revealHint, endTurn, getCard
  } = useCombat()

  const { draftCards, isDrafting, openDraft, pickCard, skipDraft } = useDraft()
  const { playMusic } = useAudio()

  const [isShaking, setIsShaking] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [combatPhase, setCombatPhase] = useState('fighting') // 'fighting' | 'victory' | 'drafting'
  const [bossPhase, setBossPhase] = useState(1)
  const [wrongFlash, setWrongFlash] = useState(false)

  const hasConjugationArmor = store.enemyBuffs.some(b => b.type === 'conjugation_armor')

  // Start music on mount
  useEffect(() => {
    playMusic(store.campaign || 'japanese', store.floor)
  }, [])

  // Start fight on mount — always reset inCombat so persisted state doesn't block it
  // useRef guard prevents StrictMode double-fire
  const fightStarted = useRef(false)
  useEffect(() => {
    if (fightStarted.current) return
    fightStarted.current = true
    if (store.currentEnemy) {
      startFight(store.currentEnemy)
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // Enemy shake animation on animState=correct (player attacking)
  useEffect(() => {
    if (animState === 'correct') {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 350)
    }
    if (animState === 'wrong') {
      setWrongFlash(true)
      setTimeout(() => setWrongFlash(false), 600)
    }
  }, [animState])

  // Check win condition
  useEffect(() => {
    if (isEnemyDefeated && combatPhase === 'fighting') {
      handleVictory()
    }
  }, [isEnemyDefeated])

  // Check lose condition
  useEffect(() => {
    if (isPlayerDefeated) {
      navigate('/summary', { replace: true })
    }
  }, [isPlayerDefeated])

  // Handle boss phase transitions
  useEffect(() => {
    const enemy = store.currentEnemy
    if (!enemy || !enemy.phases) return
    const phase2trigger = enemy.phases[1]?.hp_threshold
    if (phase2trigger && store.enemyHp <= phase2trigger && bossPhase === 1 && store.enemyHp > 0) {
      setBossPhase(2)
    }
  }, [store.enemyHp, store.currentEnemy, bossPhase])

  const handleVictory = useCallback(async () => {
    store.setInCombat(false)
    const accuracy = store.fightTotal > 0 ? store.fightCorrect / store.fightTotal : 1
    store.addGold(Math.floor(10 + accuracy * 20))

    // Open draft
    setCombatPhase('drafting')
    openDraft(accuracy)
  }, [store, openDraft])

  const handleDraftDone = useCallback((card) => {
    pickCard(card)
    // Navigate back to map
    navigate('/map')
  }, [pickCard, navigate])

  const handleEndTurn = useCallback(() => {
    if (!activeQuestion && combatPhase === 'fighting') {
      endTurn()
    }
  }, [activeQuestion, combatPhase, endTurn])

  const handleRevealHint = useCallback(() => {
    return revealHint()
  }, [revealHint])

  const currentIntent = store.currentEnemy?.intent_pattern?.[store.intentIndex % (store.currentEnemy?.intent_pattern?.length || 1)]
  const nextIntent = store.currentEnemy?.intent_pattern?.[(store.intentIndex + 1) % (store.currentEnemy?.intent_pattern?.length || 1)]

  if (isDrafting) {
    return (
      <DraftScreen
        cards={draftCards}
        cardMap={cardMap}
        onPick={handleDraftDone}
        onSkip={() => { skipDraft(); navigate('/map') }}
        accuracy={store.fightTotal > 0 ? store.fightCorrect / store.fightTotal : 1}
      />
    )
  }

  return (
    <ScreenTransition>
      <div
        className="relative w-full h-screen flex flex-col overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #0a0516 0%, #1a0a00 60%, #0d0d0d 100%)',
        }}
      >
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #C41E3A33 0%, transparent 70%)' }}
        />

        {/* Wrong answer flash overlay */}
        <AnimatePresence>
          {wrongFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.15 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-600 pointer-events-none z-20"
            />
          )}
        </AnimatePresence>

        {/* ========== TOP: Enemy area ========== */}
        <div className="flex-1 flex flex-col items-center justify-center pt-4 px-4 relative">
          {/* Deck / discard count */}
          <div className="absolute top-3 right-4 flex gap-3 text-xs text-gray-500">
            <span>📚 {store.deck.length}</span>
            <span>🗑️ {store.discardPile.length}</span>
          </div>

          {/* Gold */}
          <div className="absolute top-3 left-4 flex items-center gap-1 text-xs text-yellow-400">
            <span>🪙</span>
            <span>{store.gold}</span>
          </div>

          {/* Enemy display */}
          <EnemyDisplay
            enemy={store.currentEnemy}
            hp={store.enemyHp}
            maxHp={store.enemyMaxHp}
            block={store.enemyBlock}
            currentIntent={currentIntent}
            nextIntent={nextIntent}
            activeBuffs={store.enemyBuffs}
            isShaking={isShaking}
            phase={bossPhase > 1 ? bossPhase : undefined}
          />

          {/* Floating damage numbers */}
          <div className="absolute inset-0 pointer-events-none">
            <AnimatePresence>
              {damageNumbers.map(({ id, value, type }) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 1, y: 0, x: 40 }}
                  animate={{ opacity: 0, y: -70, x: type === 'player_damage' ? -40 : 40 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className={`absolute top-1/2 left-1/2 font-bold text-2xl pointer-events-none
                    ${type === 'damage' ? 'text-red-400' : 'text-orange-400'}
                    drop-shadow-lg`}
                >
                  -{value}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Chain indicator */}
          <div className="mt-3">
            <ChainIndicator chainActive={store.chainActive} chainType={store.chainType} />
          </div>
        </div>

        {/* ========== BOTTOM: Player area ========== */}
        <div className="flex flex-col gap-2 pb-2">
          {/* Player status row — z-20 keeps it above card z-indexes that animate upward */}
          <div className="relative z-20 flex items-center justify-between px-4">
            <PlayerStatus
              hp={store.hp}
              maxHp={store.maxHp}
              block={store.block}
              energy={store.energy}
              maxEnergy={store.maxEnergy}
              relics={store.relics}
            />

            {/* Action buttons */}
            <div className="flex flex-col items-end gap-2">
              <EnergyBar energy={store.energy} maxEnergy={store.maxEnergy} />

              <div className="flex gap-2">
                {/* Journal */}
                <button
                  onClick={() => setJournalOpen(true)}
                  className="p-2 text-gray-400 hover:text-amber-300 hover:bg-gray-800/60 rounded-lg transition-colors"
                  title="Open Journal"
                >
                  📖
                </button>

                {/* End Turn */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleEndTurn}
                  disabled={!!activeQuestion}
                  className={`
                    px-5 py-2 rounded-xl font-bold text-sm border transition-all
                    ${activeQuestion
                      ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-default'
                      : 'bg-red-900/60 border-red-700 text-red-200 hover:bg-red-800/60 hover:border-red-500 cursor-pointer'}
                  `}
                >
                  End Turn
                </motion.button>
              </div>
            </div>
          </div>

          {/* Card hand — isolation:isolate contains card z-indexes so they never overlay the status row */}
          <div style={{ isolation: 'isolate' }}>
            <CardHand
              handIds={store.hand}
              cardMap={cardMap}
              currentEnergy={store.energy}
              selectedCardId={activeCardId}
              chainActive={store.chainActive}
              chainType={store.chainType}
              hasConjugationArmor={hasConjugationArmor}
              disabled={!!activeQuestion}
              onCardSelect={selectCard}
            />
          </div>
        </div>

        {/* ========== OVERLAYS ========== */}

        {/* Question Prompt */}
        <AnimatePresence>
          {activeQuestion && (
            <QuestionPrompt
              questionData={activeQuestion}
              masteryLevel={store.masteryLevel}
              canHint={store.energy >= 1 && !store.hintUsedThisFight}
              onAnswer={resolveAnswer}
              onHint={handleRevealHint}
            />
          )}
        </AnimatePresence>

        {/* Journal */}
        <AnimatePresence>
          {journalOpen && (
            <JournalOverlay
              words={store.journalWords}
              grammar={store.journalGrammar}
              onClose={() => setJournalOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </ScreenTransition>
  )
}
