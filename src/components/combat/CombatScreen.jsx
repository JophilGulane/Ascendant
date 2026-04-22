// components/combat/CombatScreen.jsx — STS style redesign
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
import { ChainIndicator } from './ChainIndicator.jsx'
import { EnemyTurnResolver } from './EnemyTurnResolver.jsx'
import CardHand from './CardHand.jsx'
import { QuestionPrompt } from './QuestionPrompt.jsx'
import { JournalOverlay } from '../journal/JournalOverlay.jsx'
import DraftScreen from '../menus/DraftScreen.jsx'
import { BossDefeatScreen } from './BossDefeatScreen.jsx'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'
import { TopBar, DeckOverlay } from '../shared/TopBar.jsx'
import { getRandomPotionDrop, getPotionDropRate } from '../../data/potions.js'

// Turn phases — explicit state machine per AGENT.md v2
const PHASE = {
  PLAYER_DRAW: 'PLAYER_DRAW',
  PLAYER_TURN: 'PLAYER_TURN',
  ENEMY_TURN: 'ENEMY_TURN',
  BOSS_DEFEAT: 'BOSS_DEFEAT',
  FIGHT_END: 'FIGHT_END',
}

// Energy Orb (STS style bottom-left)
function EnergyOrb({ energy, maxEnergy }) {
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-[6px] border-[#8a4a1c]"
        style={{
          boxShadow: '0 0 15px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.8)',
          background: '#3a1804'
        }}
      />
      {/* Inner glowing core */}
      <motion.div
        className="absolute inset-2 rounded-full"
        animate={{
          background: energy > 0
            ? ['radial-gradient(circle, #ffaa00, #ff4400, #3a1804)', 'radial-gradient(circle, #ffcc33, #ff5500, #3a1804)']
            : 'radial-gradient(circle, #553311, #221100)',
          scale: energy > 0 ? [1, 1.05, 1] : 1,
        }}
        transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
      />
      {/* Numbers */}
      <div className="relative z-10 text-white font-black text-3xl" style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}>
        {energy}/{maxEnergy}
      </div>
    </div>
  )
}

// Deck/Discard Pile (STS style bottom corners)
function CardPile({ count, type, side, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="relative flex flex-col items-center justify-end h-20 w-16 cursor-pointer hover:scale-105 transition-transform" 
      title={type === 'draw' ? 'Draw Pile' : 'Discard Pile'}
    >
      {/* Stack of cards visuals */}
      <div className="relative w-12 h-16 bg-gray-300 rounded border-2 border-gray-600"
        style={{
          boxShadow: '0 4px 6px rgba(0,0,0,0.6)',
          transform: `rotate(${side === 'left' ? '-5deg' : '5deg'})`
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center opacity-30 text-2xl">
          {type === 'draw' ? '📚' : '🗑️'}
        </div>
      </div>
      {/* Count badge */}
      <div className="absolute -bottom-2 -right-2 bg-black border-2 border-gray-500 rounded-full w-8 h-8 flex items-center justify-center text-white font-bold text-sm">
        {count}
      </div>
    </button>
  )
}

export function CombatScreen() {
  const navigate = useNavigate()
  const store = useRunStore()

  const {
    cardMap, activeQuestion, activeCardId, animState, damageNumbers,
    isEnemyDefeated, isPlayerDefeated,
    drawHand, selectCard, resolveAnswer, revealHint,
  } = useCombat()

  const { draftCards, isDrafting, openDraft, pickCard, skipDraft } = useDraft()
  const { playMusic, playSFX } = useAudio()

  const [turnPhase, setTurnPhase] = useState(null)
  const [bossPhase, setBossPhase] = useState(1)
  const [isShakingEnemy, setIsShakingEnemy] = useState(false)
  const [isHitPlayer, setIsHitPlayer] = useState(false)
  const [wrongFlash, setWrongFlash] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [openPile, setOpenPile] = useState(null) // 'draw' | 'discard' | null
  const [potionDropped, setPotionDropped] = useState(null) // { id, shattered } or null

  const fightStarted = useRef(false)

  const silencedTypes = store.activePlayerDebuffs
    .filter(d => d.type === 'silence')
    .map(d => d.target)

  const { executeEnemyTurn, isExecuting: isEnemyTurnRunning, currentAction: enemyAction } = useEnemyTurn({
    onTurnComplete: () => {
      setTurnPhase(PHASE.PLAYER_DRAW)
    },
  })

  useEffect(() => {
    playMusic(store.campaign || 'japanese', store.floor)
  }, [])

  useEffect(() => {
    if (fightStarted.current) return
    fightStarted.current = true

    // Check if we are resuming an ongoing fight (e.g. after a page refresh)
    if (store.currentEnemy) {
      if (!store.inCombat) {
        // Fresh encounter
        useRunStore.getState().startFight(store.currentEnemy)
        setTurnPhase(PHASE.PLAYER_DRAW)
      } else {
        // Resuming encounter: skip draw phase if we already have a hand
        if (store.hand.length > 0) {
          setTurnPhase(PHASE.PLAYER_TURN)
        } else {
          setTurnPhase(PHASE.PLAYER_DRAW)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (turnPhase === PHASE.PLAYER_DRAW) {
      drawHand()
      setTimeout(() => setTurnPhase(PHASE.PLAYER_TURN), 200)
    }
  }, [turnPhase])

  useEffect(() => {
    if (turnPhase === PHASE.PLAYER_TURN && store.energy === 0 && !activeQuestion) {
      handleEndTurn()
    }
  }, [store.energy, turnPhase, activeQuestion])

  useEffect(() => {
    if (isEnemyDefeated && turnPhase !== PHASE.FIGHT_END && turnPhase !== PHASE.BOSS_DEFEAT) {
      if (store.currentEnemy?.tier === 'boss' && store.currentEnemy?.defeat_choices) {
        setTurnPhase(PHASE.BOSS_DEFEAT)
      } else {
        setTurnPhase(PHASE.FIGHT_END)
        handleVictory()
        playSFX('victory')
      }
    }
  }, [isEnemyDefeated, playSFX])

  useEffect(() => {
    if (isPlayerDefeated && turnPhase !== PHASE.FIGHT_END) {
      setTurnPhase(PHASE.FIGHT_END)
      sessionStorage.removeItem('active_encounter')
      navigate('/summary', { replace: true })
    }
  }, [isPlayerDefeated])

  useEffect(() => {
    const enemy = store.currentEnemy
    if (!enemy?.phases) return
    
    let newPhase = 1
    for (const phase of enemy.phases) {
      if (store.enemyHp <= phase.hp_threshold && store.enemyHp > 0) {
        newPhase = Math.max(newPhase, phase.phase)
      }
    }

    if (newPhase > bossPhase) {
      for (let p = bossPhase + 1; p <= newPhase; p++) {
        const phaseData = enemy.phases.find(x => x.phase === p)
        if (phaseData?.on_enter) {
          const s = useRunStore.getState()
          if (phaseData.on_enter === 'add_chain_armor_15') s.addEnemyArmor(15)
          if (phaseData.on_enter === 'add_chain_armor_20') s.addEnemyArmor(20)
          if (phaseData.on_enter === 'add_fury_3') {
            for(let i=0; i<3; i++) s.addEnemyFury()
          }
          if (phaseData.on_enter === 'add_fury_5') {
            for(let i=0; i<5; i++) s.addEnemyFury()
          }
        }
      }
      playSFX('boss_appear')
      setBossPhase(newPhase)
    }
  }, [store.enemyHp, bossPhase, playSFX])

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

  useEffect(() => {
    if (isEnemyTurnRunning && enemyAction?.type === 'damage' && enemyAction.value > 0) {
      setIsHitPlayer(true)
      setTimeout(() => setIsHitPlayer(false), 600)
    }
  }, [enemyAction])

  const handleEndTurn = useCallback(() => {
    if (turnPhase !== PHASE.PLAYER_TURN) return
    if (activeQuestion) return
    playSFX('button_click')
    setTurnPhase(PHASE.ENEMY_TURN)
    executeEnemyTurn()
  }, [turnPhase, activeQuestion, executeEnemyTurn, playSFX])

  const handleVictory = useCallback(async (choice = null) => {
    const s = useRunStore.getState()
    const isBoss = s.currentEnemy?.tier === 'boss'
    const accuracy = s.fightTotal > 0 ? s.fightCorrect / s.fightTotal : 1

    // Potion drop logic
    const dropRate = getPotionDropRate(s.currentEnemy?.tier, isBoss)
    if (Math.random() < dropRate) {
      const potionId = getRandomPotionDrop(s.floor)
      if (s.potions.length >= 3) {
        // Slots full — show shatter notification only
        setPotionDropped({ id: potionId, shattered: true })
        setTimeout(() => setPotionDropped(null), 2000)
      } else {
        s.addPotion(potionId)
        setPotionDropped({ id: potionId, shattered: false })
        setTimeout(() => setPotionDropped(null), 1800)
      }
    }

    // Reset potion combat effects for next fight
    s.resetPotionEffects()
    s.endFight()
    
    let baseGold = Math.floor(10 + accuracy * 20)
    if (choice?.reward?.type === 'gold') baseGold += choice.reward.amount
    
    const relicGold = s.relics.includes('lucky_coin') ? 15 : 0
    s.addGold(baseGold + relicGold)
    
    let draftRarity = null
    if (choice?.reward?.type === 'card') {
      draftRarity = choice.reward.rarity
    }

    if (isBoss) {
      const newFloor = s.floor + 1
      s.setFloor(newFloor)
      const { nodes, paths } = generateFloorMap(newFloor, s.masteryLevel)
      s.setMap(nodes, paths)
      s.setCurrentNode(null)
    }

    openDraft(accuracy, draftRarity)
  }, [openDraft])

  const handleDraftDone = useCallback((card) => {
    pickCard(card)
    sessionStorage.removeItem('active_encounter')
    navigate('/map')
  }, [pickCard, navigate])

  if (isDrafting) {
    const accuracy = store.fightTotal > 0 ? store.fightCorrect / store.fightTotal : 1
    return (
      <DraftScreen
        cards={draftCards}
        cardMap={cardMap}
        onPick={handleDraftDone}
        onSkip={() => { skipDraft(); sessionStorage.removeItem('active_encounter'); navigate('/map') }}
        accuracy={accuracy}
      />
    )
  }

  if (turnPhase === PHASE.BOSS_DEFEAT) {
    return (
      <BossDefeatScreen 
        enemy={store.currentEnemy}
        onChoice={(choice) => {
          setTurnPhase(PHASE.FIGHT_END)
          handleVictory(choice)
        }}
      />
    )
  }

  const isPlayerTurn = turnPhase === PHASE.PLAYER_TURN
  const isEnemyPhase = turnPhase === PHASE.ENEMY_TURN

  return (
    <ScreenTransition>
      <div
        className="relative w-full h-screen flex flex-col overflow-hidden"
        style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
      >
        {/* ── Background: Dungeon Art ── */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/ui/dungeon_combat_bg.png)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '110%',
            backgroundPosition: 'center bottom',
            filter: 'brightness(0.7) contrast(1.1)',
          }}
        />

        <TopBar hideMapButton={true} potionsLocked={!!activeQuestion || !isPlayerTurn} />

        {/* Wrong answer flash */}
        <AnimatePresence>
          {wrongFlash && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.2 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-red-600 pointer-events-none z-10"
            />
          )}
        </AnimatePresence>

        {/* ── Main Combat Arena ── */}
        <div className="flex-1 relative">

          {/* Player Character Sprite (Left) */}
          <div className="absolute left-[30%] bottom-[5%] flex flex-col items-center">
            <motion.div
              animate={isHitPlayer ? { x: [-10, 10, -10, 10, 0], filter: 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)' } : {}}
              transition={{ duration: 0.3 }}
              className="relative flex items-end justify-center"
              style={{ height: '200px' }}
            >
              {store.character?.id === 'kenji' ? (
                <img
                  src="/images/characters/japanese/kenji.png"
                  alt="Player"
                  className="max-h-full max-w-full object-contain object-bottom"
                  style={{ imageRendering: 'pixelated', filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.8))' }}
                />
              ) : (
                <div className="w-36 h-44 bg-gray-800/80 border-2 border-gray-600 rounded flex items-center justify-center text-4xl">
                  👤
                </div>
              )}
            </motion.div>
            {/* Player Name */}
            <div className="text-center mt-2">
              <div className="text-sm font-bold text-white">
                {store.character?.name || 'Traveler'}
              </div>
            </div>

            {/* Player HP Bar (Matching Enemy Design) */}
            <div className="w-44 mt-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">HP</span>
                <div className="flex items-center gap-2">
                  {store.block > 0 && <span className="text-[10px] text-blue-300">🛡️{store.block}</span>}
                  <span className="text-xs text-white font-mono">{store.hp} / {store.maxHp}</span>
                </div>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                <motion.div
                  className="h-full rounded-full bg-emerald-500"
                  animate={{ width: `${Math.max(0, (store.hp / store.maxHp) * 100)}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            </div>
            {/* Debuffs */}
            {store.activePlayerDebuffs.length > 0 && (
              <div className="flex gap-1 mt-2">
                {store.activePlayerDebuffs.map((d, i) => (
                  <span key={i} className="text-xs bg-purple-900/80 text-purple-200 px-1 rounded border border-purple-500">
                    {d.type} {d.duration}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Enemy Display (Right) */}
          <div className="absolute right-[30%] bottom-[5%] flex flex-col items-center">
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
          </div>

          {/* Floating damage numbers */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <AnimatePresence>
              {damageNumbers.map(({ id, value, type }) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 1, y: 0, x: type === 'player_damage' ? '-25vw' : '25vw' }}
                  animate={{ opacity: 0, y: -70 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                  className={`absolute top-[40%] left-1/2 font-black text-4xl pointer-events-none
                    ${type === 'damage' ? 'text-red-500' : 'text-orange-400'}`}
                  style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}
                >
                  {type === 'damage' ? `-${value}` : `+${value}`}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Potion drop notification */}
            <AnimatePresence>
              {potionDropped && (
                <motion.div
                  key={potionDropped.id + potionDropped.shattered}
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.5 }}
                  className="absolute right-[25%] top-[30%] flex flex-col items-center gap-1 z-30"
                >
                  {potionDropped.shattered ? (
                    <>
                      <div className="text-3xl">💢</div>
                      <div className="text-xs font-bold text-red-400 bg-black/80 px-2 py-1 rounded">Bag Full!</div>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl animate-bounce">🧪</div>
                      <div className="text-xs font-bold text-green-400 bg-black/80 px-2 py-1 rounded">Potion Found!</div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Chain indicator (Top Center) */}
          <div className="absolute top-10 left-1/2 -translate-x-1/2">
            <ChainIndicator chainActive={store.chainActive} chainType={store.chainType} />
          </div>

          {/* Turn phase badge (Top Center below chain) */}
          <div className="absolute top-20 left-1/2 -translate-x-1/2">
            <AnimatePresence mode="wait">
              <motion.div
                key={turnPhase}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.2 }}
                className={`text-sm font-bold uppercase tracking-widest px-4 py-1 rounded
                  ${isEnemyPhase ? 'text-red-400 bg-red-950/80 border border-red-800' : 'text-amber-400 bg-amber-950/80 border border-amber-800'}`}
              >
                {isEnemyPhase ? 'Enemy Turn' : isPlayerTurn ? 'Player Turn' : ''}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Bottom HUD ── */}
        <div className="relative z-30 h-[30vh] flex items-end justify-between px-8 pb-6">

          {/* Bottom-Left: Draw Pile & Energy */}
          <div className="flex items-end gap-6 pb-2">
            <CardPile count={store.deck.length} type="draw" side="left" onClick={() => { playSFX('button_click'); setOpenPile('draw') }} />
            <EnergyOrb energy={store.energy} maxEnergy={store.maxEnergy} />
          </div>

          {/* Center: Cards (Absolute positioned so they fan out properly) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-3xl h-48 pointer-events-none" style={{ perspective: 1000 }}>
            <div className="relative w-full h-full flex justify-center pointer-events-auto">
              <CardHand
                handIds={store.hand}
                cardMap={cardMap}
                currentEnergy={store.energy}
                lockedCards={store.lockedCards}
                silencedTypes={silencedTypes}
                retainedCards={store.retainedCards}
                retainGrowthStacks={store.retainGrowthStacks}
                selectedCardId={activeCardId}
                chainActive={store.chainActive}
                chainType={store.chainType}
                disabled={!isPlayerTurn || !!activeQuestion}
                onCardSelect={selectCard}
              />
            </div>
          </div>

          {/* Bottom-Right: End Turn & Discard */}
          <div className="flex items-end gap-6 pb-2 relative z-40">
            <motion.button
              whileHover={isPlayerTurn && !activeQuestion ? { scale: 1.05 } : {}}
              whileTap={isPlayerTurn && !activeQuestion ? { scale: 0.95 } : {}}
              onClick={handleEndTurn}
              disabled={!isPlayerTurn || !!activeQuestion}
              className={`
                px-6 py-4 rounded font-bold text-lg border-2 shadow-[0_4px_10px_rgba(0,0,0,0.6)]
                transition-all
                ${(!isPlayerTurn || activeQuestion)
                  ? 'bg-[#1a2228] border-[#111] text-gray-600 cursor-default'
                  : 'bg-gradient-to-b from-[#2a627a] to-[#163e52] border-[#4a9ec0] text-white hover:brightness-110 cursor-pointer'}
              `}
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              {isEnemyPhase ? 'Enemy Turn' : 'End Turn'}
            </motion.button>

            <CardPile count={store.discardPile.length} type="discard" side="right" onClick={() => { playSFX('button_click'); setOpenPile('discard') }} />
          </div>
        </div>

        {/* ── OVERLAYS ── */}
        <AnimatePresence>
          {activeQuestion && (
            <QuestionPrompt
              questionData={activeQuestion}
              masteryLevel={store.masteryLevel}
              canHint={store.energy >= 1 && !store.hintUsedThisFight}
              onAnswer={resolveAnswer}
              onHint={revealHint}
              bossPhase={bossPhase}
            />
          )}
        </AnimatePresence>

        <EnemyTurnResolver isActive={isEnemyTurnRunning} action={enemyAction} />

        <AnimatePresence>
          {journalOpen && (
            <JournalOverlay
              words={store.journalWords}
              grammar={store.journalGrammar}
              onClose={() => setJournalOpen(false)}
            />
          )}
          {openPile === 'draw' && (
            <DeckOverlay onClose={() => setOpenPile(null)} deck={store.deck} title="Draw Pile" />
          )}
          {openPile === 'discard' && (
            <DeckOverlay onClose={() => setOpenPile(null)} deck={store.discardPile} title="Discard Pile" />
          )}
        </AnimatePresence>
      </div>
    </ScreenTransition>
  )
}
