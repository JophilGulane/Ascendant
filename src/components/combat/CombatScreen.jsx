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
import CardHand from './CardHand.jsx'
import { QuestionPrompt } from './QuestionPrompt.jsx'
import { JournalOverlay } from '../journal/JournalOverlay.jsx'
import DraftScreen from '../menus/DraftScreen.jsx'
import { BossDefeatScreen } from './BossDefeatScreen.jsx'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'
import { TopBar, DeckOverlay } from '../shared/TopBar.jsx'
import { getRandomPotionDrop, getPotionDropRate, getPotionData } from '../../data/potions.js'
import { LootScreen } from './LootScreen.jsx'

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
  const { playMusic, playSFX, stopMusic } = useAudio()

  const [turnPhase, setTurnPhase] = useState(null)
  const [bossPhase, setBossPhase] = useState(1)
  const [isShakingEnemy, setIsShakingEnemy] = useState(false)
  const [isHitPlayer, setIsHitPlayer] = useState(false)
  const [wrongFlash, setWrongFlash] = useState(false)
  const [journalOpen, setJournalOpen] = useState(false)
  const [openPile, setOpenPile] = useState(null) // 'draw' | 'discard' | null
  const [potionDropped, setPotionDropped] = useState(null) // { id, shattered } or null
  const [loot, setLoot] = useState(null) // Array of loot items when fight ends

  const fightStarted = useRef(false)

  const silencedTypes = store.activePlayerDebuffs
    .filter(d => d.type === 'silence')
    .map(d => d.target)

  // type_lock curse: visually silence the last played card type so player knows it's unplayable
  if (store.activeModifier?.curse?.effect?.type === 'type_lock' && store.lastCardTypePlayed) {
    if (!silencedTypes.includes(store.lastCardTypePlayed)) {
      silencedTypes.push(store.lastCardTypePlayed)
    }
  }

  const { executeEnemyTurn, isExecuting: isEnemyTurnRunning, currentAction: enemyAction } = useEnemyTurn({
    onTurnComplete: () => {
      setTurnPhase(PHASE.PLAYER_DRAW)
    },
  })

  useEffect(() => {
    playMusic(store.campaign || 'japanese', store.currentEnemy?.tier === 'boss' ? 'boss' : 'combat')
  }, [playMusic, store.campaign, store.currentEnemy?.tier])

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
            for (let i = 0; i < 3; i++) s.addEnemyFury()
          }
          if (phaseData.on_enter === 'add_fury_5') {
            for (let i = 0; i < 5; i++) s.addEnemyFury()
          }
        }
      }
      playSFX('boss_appear')
      setBossPhase(newPhase)
    }
  }, [store.enemyHp, bossPhase, playSFX])

  useEffect(() => {
    if (animState === 'wrong') {
      setWrongFlash(true)
      setTimeout(() => setWrongFlash(false), 600)
    }
  }, [animState])

  // Enemy hit shake — triggered whenever a new 'damage' number appears (player dealt damage)
  useEffect(() => {
    const latest = damageNumbers[damageNumbers.length - 1]
    if (latest && latest.type === 'damage') {
      setIsShakingEnemy(true)
      setTimeout(() => setIsShakingEnemy(false), 450)
    }
  }, [damageNumbers])

  useEffect(() => {
    if (isEnemyTurnRunning && enemyAction?.type === 'damage' && enemyAction.value > 0) {
      setIsHitPlayer(true)
      setTimeout(() => setIsHitPlayer(false), 600)
    }
  }, [enemyAction, isEnemyTurnRunning])


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

    s.resetPotionEffects()
    s.endFight()

    if (isBoss) {
      const newFloor = s.floor + 1
      s.setFloor(newFloor)
      const { nodes, paths } = generateFloorMap(newFloor, s.masteryLevel)
      s.setMap(nodes, paths)
      s.setCurrentNode(null)
    } else {
      stopMusic()
      playSFX('victory')
    }

    const generatedLoot = []

    // 1. Gold
    let baseGold = Math.floor(10 + accuracy * 20)
    if (choice?.reward?.type === 'gold') baseGold += choice.reward.amount
    const relicGold = s.relics.includes('lucky_coin') ? 15 : 0
    generatedLoot.push({ id: 'gold', type: 'gold', amount: baseGold + relicGold, icon: '🪙', label: `${baseGold + relicGold} Gold` })

    // 2. Potion
    const dropRate = getPotionDropRate(s.currentEnemy?.tier, isBoss)
    if (Math.random() < dropRate) {
      const potionId = getRandomPotionDrop(s.floor)
      const potionData = getPotionData(potionId)
      generatedLoot.push({ id: 'potion', type: 'potion', potionId, icon: potionData?.icon || '🧪', label: potionData?.name || 'Unknown Potion' })
    }

    // 3. Card Draft
    let draftRarity = null
    if (choice?.reward?.type === 'card') draftRarity = choice.reward.rarity
    generatedLoot.push({ id: 'card', type: 'card', rarity: draftRarity, icon: '🃏', label: 'Add a card to your deck' })

    setLoot(generatedLoot)
    playSFX('loot_appear')
  }, [playSFX])

  const handleClaimLoot = useCallback((lootId) => {
    const s = useRunStore.getState()
    const item = loot.find(l => l.id === lootId)
    if (!item) return

    if (item.type === 'gold') {
      playSFX('gold_gain')
      s.addGold(item.amount)
    } else if (item.type === 'potion') {
      if (s.potions.length >= 3) {
        setPotionDropped({ id: item.potionId, shattered: true })
        playSFX('wrong') // placeholder for shatter
        setTimeout(() => setPotionDropped(null), 2000)
      } else {
        playSFX('relic_obtain') // placeholder for potion gain
        s.addPotion(item.potionId)
      }
    }
    setLoot(prev => prev.filter(l => l.id !== lootId))
  }, [loot])

  const handleLootDone = useCallback(() => {
    playSFX('button_click')
    sessionStorage.removeItem('active_encounter')
    navigate('/map')
  }, [navigate, playSFX])

  const handleOpenDraftLoot = useCallback((item) => {
    playSFX('draft_open')
    const accuracy = store.fightTotal > 0 ? store.fightCorrect / store.fightTotal : 1
    openDraft(accuracy, item.rarity)
  }, [openDraft, store.fightTotal, store.fightCorrect, playSFX])

  const handleDraftDone = useCallback((card) => {
    pickCard(card)
    setLoot(prev => prev.filter(l => l.id !== 'card'))
  }, [pickCard])

  if (isDrafting) {
    const accuracy = store.fightTotal > 0 ? store.fightCorrect / store.fightTotal : 1
    return (
      <DraftScreen
        cards={draftCards}
        cardMap={cardMap}
        onPick={handleDraftDone}
        onSkip={() => handleDraftDone(null)}
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
            backgroundSize: '100%',
            backgroundPosition: 'center bottom',

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
          <div className="absolute left-[18%] bottom-[5%] flex flex-col items-center">
            <motion.div
              animate={
                isHitPlayer ? {
                  x: [-10, 10, -10, 10, 0],
                  filter: 'brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)',
                  transition: { duration: 0.3 }
                } : animState === 'player_telegraph_damage' ? {
                  x: [0, -20, -20],
                  y: [0, -5, -5],
                  transition: { duration: 0.35, ease: 'easeOut' }
                } : animState === 'player_telegraph_buff' ? {
                  scale: [1, 1.15, 1.15],
                  filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1.5)'],
                  transition: { duration: 0.35, ease: 'easeOut' }
                } : animState === 'player_attack' ? {
                  x: [-20, 50, 0], // Smoothly leap forward from pullback and return
                  y: [-5, 15, 0],
                  scale: [1.15, 1],
                  filter: ['brightness(1.5)', 'brightness(1)'],
                  transition: { duration: 0.6, times: [0, 0.2, 1], ease: 'easeOut' }
                } : animState === 'player_buff' ? {
                  scale: [1.15, 1], // Snap back from swell
                  filter: ['brightness(1.5)', 'brightness(1)'],
                  transition: { duration: 0.6, ease: 'easeOut' }
                } : { x: 0, y: 0, scale: 1, filter: 'brightness(1)' }
              }
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

            {/* STS-style Player HP + Block */}
            <div className="w-48 mt-2">
              {/* Block badge */}
              {store.block > 0 && (
                <div className="flex justify-start mb-1">
                  <div className="flex items-center gap-1 bg-gray-800/90 border border-cyan-700 rounded-full px-2 py-0.5">
                    <span className="text-cyan-400 text-sm">🛡️</span>
                    <span className="text-cyan-300 text-xs font-bold">{store.block}</span>
                  </div>
                </div>
              )}
              {/* HP bar with number on it */}
              <div className="relative h-6 bg-gray-900 rounded border border-gray-700 overflow-hidden shadow-inner">
                <motion.div
                  className={`absolute inset-y-0 left-0 rounded ${
                    store.hp / store.maxHp > 0.5 ? 'bg-red-600' :
                    store.hp / store.maxHp > 0.25 ? 'bg-orange-600' : 'bg-red-800'
                  }`}
                  animate={{ width: `${Math.max(0, (store.hp / store.maxHp) * 100)}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white"
                  style={{ textShadow: '1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000' }}>
                  {store.hp} / {store.maxHp}
                </span>
              </div>

              {/* Debuff icons below HP bar */}
              {store.activePlayerDebuffs.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {store.activePlayerDebuffs.map((d, i) => {
                    const icons = { silence: '🔇', drain: '⚡', fog: '🌫️', bind: '🔗', confusion: '🔀' }
                    const colors = { silence: 'border-purple-600 bg-purple-950/80', drain: 'border-yellow-600 bg-yellow-950/80', fog: 'border-blue-500 bg-blue-950/80', bind: 'border-orange-500 bg-orange-950/80', confusion: 'border-pink-500 bg-pink-950/80' }
                    const labels = { silence: 'Silenced', drain: 'Drained', fog: 'Fogged', bind: 'Bound', confusion: 'Confused' }
                    const descs = { silence: `${d.target || ''} cards muted`, drain: '−1 Energy/turn', fog: 'Options hidden', bind: '−1 Draw/turn', confusion: 'Options shuffle' }
                    return (
                      <div key={i} className="relative group">
                        <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[10px] font-bold cursor-help ${colors[d.type] || 'border-gray-600 bg-gray-900'}`}>
                          <span>{icons[d.type] || '❓'}</span>
                          <span className="text-white">{d.duration}</span>
                        </div>
                        {/* Hover tooltip */}
                        <div className="absolute bottom-full left-0 mb-1.5 hidden group-hover:block z-50 pointer-events-none w-40">
                          <div className="bg-gray-950 border border-gray-600 rounded-lg px-3 py-2 shadow-2xl">
                            <div className="text-amber-400 font-bold text-xs mb-0.5">{labels[d.type] || d.type}</div>
                            <div className="text-gray-300 text-[10px]">{descs[d.type] || ''} ({d.duration} turns)</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Enemy Display (Right) */}
          <div className="absolute right-[18%] bottom-[5%] flex flex-col items-center">
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
              enemyAction={enemyAction}
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

            {/* Floating Enemy Action Text (Buffs/Debuffs/Misc/Damage) */}
            <AnimatePresence mode="wait">
              {enemyAction?.message && enemyAction.type !== 'telegraph' && (
                <motion.div
                  key={enemyAction.id}
                  initial={{ opacity: 1, y: 0, scale: 0.8 }}
                  animate={{ opacity: 0, y: -50, scale: 1.1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className={`absolute top-[35%] font-black pointer-events-none -translate-x-1/2
                    ${enemyAction.type === 'debuff' ? 'text-purple-400 text-2xl left-[30%]' :
                      enemyAction.type === 'damage' ? 'text-red-500 text-5xl left-[30%]' :
                        enemyAction.type === 'selfbuff' ? 'text-blue-400 text-2xl left-[70%]' : 'text-gray-200 text-2xl left-[30%]'}`}
                  style={{ textShadow: '2px 2px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000' }}
                >
                  {enemyAction.type === 'damage' ? (enemyAction.value > 0 ? `-${enemyAction.value}` : 'Blocked!') : enemyAction.message}
                </motion.div>
              )}
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
              animate={(isPlayerTurn && !activeQuestion && !store.hand.some(id => cardMap[id] && !store.lockedCards.includes(id) && store.energy >= cardMap[id].energy_cost)) ? {
                boxShadow: ['0px 4px 10px rgba(0,0,0,0.6)', '0px 0px 25px rgba(74, 158, 192, 1)', '0px 4px 10px rgba(0,0,0,0.6)'],
                borderColor: ['#4a9ec0', '#8be9fd', '#4a9ec0']
              } : {
                boxShadow: '0px 4px 10px rgba(0,0,0,0.6)',
                borderColor: (!isPlayerTurn || activeQuestion) ? '#111' : '#4a9ec0'
              }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              whileHover={isPlayerTurn && !activeQuestion ? { scale: 1.05 } : {}}
              whileTap={isPlayerTurn && !activeQuestion ? { scale: 0.95 } : {}}
              onClick={handleEndTurn}
              disabled={!isPlayerTurn || !!activeQuestion}
              className={`
                px-6 py-4 rounded font-bold text-lg border-2
                transition-colors
                ${(!isPlayerTurn || activeQuestion)
                  ? 'bg-[#1a2228] text-gray-600 cursor-default'
                  : 'bg-gradient-to-b from-[#2a627a] to-[#163e52] text-white hover:brightness-110 cursor-pointer'}
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

        {/* Removed EnemyTurnResolver to stop cutscene feeling */}

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
        {/* ── LOOT SCREEN ── */}
        <AnimatePresence>
          {loot && !isDrafting && (
            <LootScreen
              loot={loot}
              onClaim={handleClaimLoot}
              onSkip={handleLootDone}
              onOpenDraft={handleOpenDraftLoot}
            />
          )}
        </AnimatePresence>

      </div>
    </ScreenTransition>
  )
}
