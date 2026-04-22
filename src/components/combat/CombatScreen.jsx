// components/combat/CombatScreen.jsx — v2
// Turn state machine: PLAYER_DRAW → PLAYER_TURN → ENEMY_TURN → FIGHT_END
// Assembles all combat components. Owns phase transitions.

import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import { useCombat } from '../../hooks/useCombat.js'
import { useEnemyTurn } from '../../hooks/useEnemyTurn.js'
import { useDraft } from '../../hooks/useDraft.js'
import { useAudio } from '../../hooks/useAudio.js'
import { generateFloorMap } from '../../utils/map.js'
import { EnemyDisplay } from './EnemyDisplay.jsx'
import { PlayerStatus } from './PlayerStatus.jsx'
import { EnergyBar } from './EnergyBar.jsx'
import { ChainIndicator } from './ChainIndicator.jsx'
import { EnemyTurnResolver } from './EnemyTurnResolver.jsx'
import CardHand from './CardHand.jsx'
import { QuestionPrompt } from './QuestionPrompt.jsx'
import { JournalOverlay } from '../journal/JournalOverlay.jsx'
import DraftScreen from '../menus/DraftScreen.jsx'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'

// Turn phases — explicit state machine per AGENT.md v2
const PHASE = {
  PLAYER_DRAW: 'PLAYER_DRAW',
  PLAYER_TURN: 'PLAYER_TURN',
  ENEMY_TURN:  'ENEMY_TURN',
  FIGHT_END:   'FIGHT_END',
}

export function CombatScreen() {
  const navigate = useNavigate()
  const store = useRunStore()

  const {
    cardMap, activeQuestion, activeCardId, animState, damageNumbers,
    isEnemyDefeated, isPlayerDefeated,
    drawHand, selectCard, resolveAnswer, revealHint, getCard,
  } = useCombat()

  const { draftCards, isDrafting, openDraft, pickCard, skipDraft } = useDraft()
  const { playMusic } = useAudio()

  // ── Turn state machine ──
  const [turnPhase, setTurnPhase] = useState(PHASE.PLAYER_DRAW)
  const [bossPhase, setBossPhase] = useState(1)
  const [isShakingEnemy, setIsShakingEnemy] = useState(false)
  const [isHitPlayer, setIsHitPlayer] = useState(false)
  const [wrongFlash, setWrongFlash] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)

  // Fight-start ref guard (prevents StrictMode double-fire)
  const fightStarted = useRef(false)

  // Derive silenced card types from active player debuffs
  const silencedTypes = store.activePlayerDebuffs
    .filter(d => d.type === 'silence')
    .map(d => d.target)

  // ── Enemy turn hook ──
  const { executeEnemyTurn, isExecuting: isEnemyTurnRunning, currentAction: enemyAction } = useEnemyTurn({
    onTurnComplete: () => {
      // After enemy turn finishes → transition back to PLAYER_DRAW
      setTurnPhase(PHASE.PLAYER_DRAW)
    },
  })

  // ── Music on mount ──
  useEffect(() => {
    playMusic(store.campaign || 'japanese', store.floor)
  }, [])

  // ── Fight initialization on mount ──
  useEffect(() => {
    if (fightStarted.current) return
    fightStarted.current = true
    if (store.currentEnemy) {
      // v2: use store.startFight() which atomically resets all fight state
      useRunStore.getState().startFight(store.currentEnemy)
      setTurnPhase(PHASE.PLAYER_DRAW)
    }
  }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Phase transitions ──
  useEffect(() => {
    if (turnPhase === PHASE.PLAYER_DRAW) {
      drawHand()
      // Small delay so unlock flash is visible, then open player turn
      setTimeout(() => setTurnPhase(PHASE.PLAYER_TURN), 200)
    }
  }, [turnPhase])  // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-end turn when energy reaches 0 during PLAYER_TURN
  useEffect(() => {
    if (turnPhase === PHASE.PLAYER_TURN && store.energy === 0 && !activeQuestion) {
      handleEndTurn()
    }
  }, [store.energy, turnPhase, activeQuestion])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Win/Lose detection ──
  useEffect(() => {
    if (isEnemyDefeated && turnPhase !== PHASE.FIGHT_END) {
      setTurnPhase(PHASE.FIGHT_END)
      handleVictory()
    }
  }, [isEnemyDefeated])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isPlayerDefeated && turnPhase !== PHASE.FIGHT_END) {
      setTurnPhase(PHASE.FIGHT_END)
      navigate('/summary', { replace: true })
    }
  }, [isPlayerDefeated])  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Boss phase transition ──
  useEffect(() => {
    const enemy = store.currentEnemy
    if (!enemy?.phases) return
    const phase2trigger = enemy.phases[1]?.hp_threshold
    if (phase2trigger && store.enemyHp <= phase2trigger && bossPhase === 1 && store.enemyHp > 0) {
      setBossPhase(2)
    }
  }, [store.enemyHp, bossPhase])

  // ── animState reactions ──
  useEffect(() => {
    if (animState === 'correct') {
      setIsShakingEnemy(true)
      setTimeout(() => setIsShakingEnemy(false), 400)
    }
    if (animState === 'wrong') {
      setWrongFlash(true)
      setTimeout(() => setWrongFlash(false), 600)
    }
  }, [animState])

  // ── Player hit flash (triggered during enemy turn) ──
  useEffect(() => {
    if (isEnemyTurnRunning && enemyAction?.type === 'damage' && enemyAction.value > 0) {
      setIsHitPlayer(true)
      setTimeout(() => setIsHitPlayer(false), 600)
    }
  }, [enemyAction])

  // ── Handlers ──
  const handleEndTurn = useCallback(() => {
    if (turnPhase !== PHASE.PLAYER_TURN) return
    if (activeQuestion) return
    setTurnPhase(PHASE.ENEMY_TURN)
    executeEnemyTurn()
  }, [turnPhase, activeQuestion, executeEnemyTurn])

  const handleVictory = useCallback(async () => {
    const s = useRunStore.getState()

    // CRITICAL: capture boss status BEFORE endFight nulls currentEnemy
    const isBoss = s.currentEnemy?.tier === 'boss'
    const accuracy = s.fightTotal > 0 ? s.fightCorrect / s.fightTotal : 1

    s.endFight()
    s.addGold(Math.floor(10 + accuracy * 20))

    // Boss defeat → advance to next floor and regenerate map
    if (isBoss) {
      const newFloor = s.floor + 1
      s.setFloor(newFloor)
      const { nodes, paths } = generateFloorMap(newFloor, s.masteryLevel)
      s.setMap(nodes, paths)
      s.setCurrentNode(null)
    }

    openDraft(accuracy)
  }, [openDraft])


  const handleDraftDone = useCallback((card) => {
    pickCard(card)
    navigate('/map')
  }, [pickCard, navigate])

  // ── Render draft screen ──
  if (isDrafting) {
    const accuracy = store.fightTotal > 0 ? store.fightCorrect / store.fightTotal : 1
    return (
      <DraftScreen
        cards={draftCards}
        cardMap={cardMap}
        onPick={handleDraftDone}
        onSkip={() => { skipDraft(); navigate('/map') }}
        accuracy={accuracy}
      />
    )
  }

  const isPlayerTurn = turnPhase === PHASE.PLAYER_TURN
  const isEnemyPhase = turnPhase === PHASE.ENEMY_TURN

  return (
    <ScreenTransition>
      <div
        className="relative w-full h-screen flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0a0516 0%, #1a0a00 60%, #0d0d0d 100%)' }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'radial-gradient(circle at 50% 0%, #C41E3A33 0%, transparent 70%)' }}
        />

        {/* Wrong answer flash */}
        <AnimatePresence>
          {wrongFlash && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-600 pointer-events-none z-10"
            />
          )}
        </AnimatePresence>

        {/* ─── TOP: Enemy area ─── */}
        <div className="flex-1 flex flex-col items-center justify-center pt-4 px-4 relative">
          {/* Deck / discard / gold */}
          <div className="absolute top-3 right-4 flex gap-3 text-xs text-gray-500">
            <span>📚 {store.deck.length}</span>
            <span>🗑️ {store.discardPile.length}</span>
          </div>
          <div className="absolute top-3 left-4 flex items-center gap-1 text-xs text-yellow-400">
            <span>🪙</span><span>{store.gold}</span>
          </div>

          {/* Turn phase badge */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2">
            <AnimatePresence mode="wait">
              <motion.div
                key={turnPhase}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded
                  ${isEnemyPhase ? 'text-red-400 bg-red-950/60' : 'text-gray-500 bg-transparent'}`}
              >
                {isEnemyPhase ? '⚔ Enemy Turn' : isPlayerTurn ? 'Your Turn' : ''}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Enemy display */}
          <EnemyDisplay
            enemy={store.currentEnemy}
            hp={store.enemyHp}
            maxHp={store.enemyMaxHp}
            block={store.enemyArmor}
            armor={store.enemyArmor}
            furyStacks={store.enemyFuryStacks}
            intentIndex={store.intentIndex}
            activeBuffs={store.activeEnemyBuffs}
            isShaking={isShakingEnemy}
            phase={bossPhase > 1 ? bossPhase : undefined}
          />

          {/* Floating damage numbers */}
          <div className="absolute inset-0 pointer-events-none">
            <AnimatePresence>
              {damageNumbers.map(({ id, value, type }) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 1, y: 0, x: type === 'player_damage' ? -30 : 40 }}
                  animate={{ opacity: 0, y: -70 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className={`absolute top-1/2 left-1/2 font-black text-2xl pointer-events-none
                    ${type === 'damage' ? 'text-red-400' : 'text-orange-400'}
                    drop-shadow-lg`}
                >
                  -{value}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Chain indicator */}
          <div className="mt-2">
            <ChainIndicator chainActive={store.chainActive} chainType={store.chainType} />
          </div>
        </div>

        {/* ─── BOTTOM: Player area ─── */}
        <div className="flex flex-col gap-2 pb-2">
          {/* Player status row — z-20 ensures it renders above card z-indexes */}
          <div className="relative z-20 flex items-center justify-between px-4">
            <PlayerStatus
              hp={store.hp}
              maxHp={store.maxHp}
              block={store.block}
              energy={store.energy}
              maxEnergy={store.maxEnergy}
              debuffs={store.activePlayerDebuffs}
              isHit={isHitPlayer}
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
                  whileHover={isPlayerTurn && !activeQuestion ? { scale: 1.05 } : {}}
                  whileTap={isPlayerTurn && !activeQuestion ? { scale: 0.97 } : {}}
                  onClick={handleEndTurn}
                  disabled={!isPlayerTurn || !!activeQuestion}
                  className={`
                    px-5 py-2 rounded-xl font-bold text-sm border transition-all
                    ${(!isPlayerTurn || activeQuestion)
                      ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-default'
                      : 'bg-red-900/60 border-red-700 text-red-200 hover:bg-red-800/60 hover:border-red-500 cursor-pointer'}
                  `}
                >
                  {isEnemyPhase ? 'Enemy...' : 'End Turn'}
                </motion.button>
              </div>
            </div>
          </div>

          {/* Card hand — isolation:isolate contains card z-indexes */}
          <div style={{ isolation: 'isolate' }}>
            <CardHand
              handIds={store.hand}
              cardMap={cardMap}
              currentEnergy={store.energy}
              lockedCards={store.lockedCards}
              silencedTypes={silencedTypes}
              selectedCardId={activeCardId}
              chainActive={store.chainActive}
              chainType={store.chainType}
              disabled={!isPlayerTurn || !!activeQuestion}
              onCardSelect={selectCard}
            />
          </div>
        </div>

        {/* ─── OVERLAYS ─── */}

        {/* Question Prompt */}
        <AnimatePresence>
          {activeQuestion && (
            <QuestionPrompt
              questionData={activeQuestion}
              masteryLevel={store.masteryLevel}
              canHint={store.energy >= 1 && !store.hintUsedThisFight}
              onAnswer={resolveAnswer}
              onHint={revealHint}
            />
          )}
        </AnimatePresence>

        {/* Enemy Turn Resolver — animated action banner */}
        <EnemyTurnResolver isActive={isEnemyTurnRunning} action={enemyAction} />

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
