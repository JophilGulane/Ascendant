// components/combat/EnemyDisplay.jsx — v3
// STS-style: minimal floating intent above head, full detail panel on hover.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOVE_ICONS, MOVE_COLORS, MOVE_CATEGORY } from '../../constants/enemyMoves.js'

const BUFF_ICONS = {
  confusion:          { icon: '😵', label: 'Confusion',          desc: '+ATK this turn' },
  conjugation_armor:  { icon: '🛡️', label: 'Conj. Armor',       desc: 'Wrong grammar → armor' },
  fortify:            { icon: '💪', label: 'Fortify',             desc: '+HP bonus' },
}

/** Builds a natural-language Strategic description of the current intent */
function buildStrategicText(actions, enemy) {
  const parts = []
  let totalDmg = 0
  let hasDebuff = false
  let hasBuff = false

  for (const action of actions) {
    const cat = MOVE_CATEGORY[action] || 'special'
    if (cat === 'damage') {
      if (action === 'strike_heavy') totalDmg += Math.floor(enemy.base_attack * 1.8)
      else if (action === 'strike_swift') totalDmg += Math.floor(enemy.base_attack * 0.6) * 2
      else totalDmg += enemy.base_attack
    }
    if (cat === 'debuff') hasDebuff = true
    if (cat === 'selfbuff') hasBuff = true
  }

  if (hasDebuff && totalDmg > 0) return `This enemy intends to inflict a Negative Effect on you and Attack for ${totalDmg} damage.`
  if (hasDebuff) return `This enemy intends to inflict a Negative Effect on you.`
  if (hasBuff && totalDmg > 0) return `This enemy intends to Strengthen itself and Attack for ${totalDmg} damage.`
  if (hasBuff) return `This enemy intends to Strengthen itself.`
  if (totalDmg > 0) return `This enemy intends to Attack for ${totalDmg} damage.`
  return `This enemy is planning something...`
}

export function EnemyDisplay({
  enemy,
  hp = 0,
  maxHp = 1,
  armor = 0,
  furyStacks = 0,
  intentIndex = 0,
  activeBuffs = [],
  isShaking = false,
  enemyAction = null,
  phase,
}) {
  const [isHovered, setIsHovered] = useState(false)
  if (!enemy) return null

  const hpPercent = Math.max(0, (hp / maxHp) * 100)
  const hpColor = hpPercent > 50 ? 'bg-red-500' : hpPercent > 25 ? 'bg-orange-500' : 'bg-red-700'

  const pattern = enemy.intent_pattern || []
  const safeIndex = intentIndex % (pattern.length || 1)
  const currentActions = pattern[safeIndex] || ['strike']

  // Pick primary icon for the floating head indicator
  const primaryAction = currentActions[0] || 'strike'
  const primaryIcon = MOVE_ICONS[primaryAction] || '❓'
  const primaryColor = MOVE_COLORS[primaryAction] || 'text-gray-300'
  const primaryCat = MOVE_CATEGORY[primaryAction] || 'special'

  // Total damage for the floating number
  let floatDmg = 0
  for (const a of currentActions) {
    if (MOVE_CATEGORY[a] === 'damage') {
      if (a === 'strike_heavy') floatDmg += Math.floor(enemy.base_attack * 1.8)
      else if (a === 'strike_swift') floatDmg += Math.floor(enemy.base_attack * 0.6) * 2
      else floatDmg += enemy.base_attack
    }
  }

  const strategicText = buildStrategicText(currentActions, enemy)

  return (
    <div
      className="relative flex flex-col items-center"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ── Hover Detail Panel (floats to the LEFT) ── */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.18 }}
            className="absolute right-full top-0 mr-3 w-56 flex flex-col gap-2 z-50 pointer-events-none"
          >
            {/* Strategic block */}
            <div className="bg-gray-950/95 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-amber-400 font-bold text-sm">Strategic</span>
                <span className="text-base">{primaryIcon}</span>
              </div>
              <p className="text-gray-200 text-xs leading-relaxed">
                {strategicText.split(/(\d+)/).map((part, i) =>
                  /^\d+$/.test(part)
                    ? <span key={i} className="text-amber-400 font-bold">{part}</span>
                    : part.includes('Negative Effect')
                      ? <span key={i}><span className="text-amber-400">Negative Effect</span></span>
                      : part.includes('Attack')
                        ? <span key={i}>{part.replace('Attack', '')}<span className="text-amber-400">Attack</span></span>
                        : part.includes('Strengthen')
                          ? <span key={i}><span className="text-blue-400">Strengthen</span>{part.replace('Strengthen', '')}</span>
                          : <span key={i}>{part}</span>
                )}
              </p>
            </div>

            {/* Special ability block */}
            {enemy.special_ability && (
              <div className="bg-gray-950/95 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-amber-400 font-bold text-sm">{enemy.special_ability.name}</span>
                  {enemy.special_ability.description?.includes('∞') && (
                    <span className="text-gray-400 text-xs">∞</span>
                  )}
                </div>
                <p className="text-gray-200 text-xs leading-relaxed">
                  {enemy.special_ability.description}
                </p>
              </div>
            )}

            {/* Phase info */}
            {phase && phase > 1 && (
              <div className="bg-red-950/90 border border-red-700 rounded-xl px-4 py-2 shadow-2xl">
                <span className="text-red-300 font-bold text-xs">PHASE {phase}</span>
              </div>
            )}

            {/* Enemy name */}
            <div className="bg-gray-950/95 border border-gray-700 rounded-xl px-4 py-2 shadow-2xl text-center">
              <div className="text-white font-bold text-sm">{enemy.name_native}</div>
              <div className="text-gray-500 text-[10px]">{enemy.name_target}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Intent (above head, always visible) ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={intentIndex}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 mb-1"
        >
          {/* Icon badge */}
          <div className={`
            flex items-center justify-center w-9 h-9 rounded-full border-2 shadow-lg
            ${primaryCat === 'damage' ? 'bg-red-950 border-red-600' :
              primaryCat === 'debuff' ? 'bg-purple-950 border-purple-600' :
              'bg-blue-950 border-blue-600'}
          `}>
            <span className="text-lg leading-none">{primaryIcon}</span>
          </div>
          {/* Damage number (only if attack) */}
          {floatDmg > 0 && (
            <span className={`text-2xl font-black ${primaryCat === 'damage' ? 'text-red-400' : 'text-gray-300'}`}
              style={{ textShadow: '1px 1px 0 #000, -1px -1px 0 #000' }}
            >
              {floatDmg}
            </span>
          )}
          {/* Multi-action dots */}
          {currentActions.length > 1 && (
            <div className="flex gap-0.5 ml-0.5">
              {currentActions.slice(1).map((a, i) => (
                <span key={i} className="text-xs opacity-70">{MOVE_ICONS[a] || '?'}</span>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Enemy Portrait ── */}
      <motion.div
        animate={
          isShaking ? {
            x: [-12, 12, -10, 10, -6, 6, 0],
            filter: ['brightness(2) sepia(1) hue-rotate(-50deg) saturate(5)', 'brightness(1)', 'brightness(1)'],
            transition: { duration: 0.45, ease: 'easeInOut' }
          } : enemyAction?.type === 'telegraph' ? (
            enemyAction.actionType === 'strike' ? {
              x: [0, 15, 15], y: [0, -10, -10],
              transition: { duration: 0.35, ease: 'easeOut' }
            } : {
              scale: [1, 1.1, 1.1],
              filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1.5)'],
              transition: { duration: 0.35, ease: 'easeOut' }
            }
          ) : enemyAction?.type === 'damage' ? {
            x: [15, -40, 0], y: [-10, 20, 0],
            transition: { duration: 0.4, ease: 'backOut' }
          } : enemyAction?.type === 'buff' || enemyAction?.type === 'debuff' ? {
            scale: [1.1, 1, 1],
            filter: ['brightness(1.5)', 'brightness(1)', 'brightness(1)'],
            transition: { duration: 0.4, ease: 'easeOut' }
          } : { x: 0, y: 0, scale: 1, filter: 'brightness(1)' }
        }
        className="relative"
      >
        <div className="flex items-end justify-center relative" style={{ height: '200px', width: '200px' }}>
          {/* Fury aura */}
          {furyStacks > 0 && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none z-0"
              animate={{
                boxShadow: furyStacks >= 2
                  ? ['0 0 20px #ef444466', '0 0 40px #ef4444aa', '0 0 20px #ef444466']
                  : ['0 0 10px #f9731666', '0 0 20px #f9731688', '0 0 10px #f9731666']
              }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
            />
          )}
          {/* Phase 3+ aura */}
          {phase && phase >= 3 && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none z-0"
              animate={{ boxShadow: ['0 0 30px #a855f766', '0 0 60px #a855f7bb', '0 0 30px #a855f766'] }}
              transition={{ repeat: Infinity, duration: 0.8, ease: 'easeInOut' }}
            />
          )}

          {enemy.portrait ? (
            <img
              src={enemy.portrait}
              alt={enemy.name_native}
              className="max-h-full max-w-full object-contain object-bottom relative z-10"
              style={{
                imageRendering: 'pixelated',
                filter: `drop-shadow(0 8px 10px rgba(0,0,0,0.8))${furyStacks >= 3 ? ' sepia(0.5) hue-rotate(-20deg) saturate(2)' : ''}${phase >= 2 ? ' brightness(1.2)' : ''}`
              }}
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <motion.div
              className="w-36 h-44 rounded-2xl overflow-hidden border-2 flex items-center justify-center text-6xl relative z-10 shadow-xl"
              animate={{
                borderColor: furyStacks >= 3 ? ['#ef4444', '#f97316', '#ef4444'] :
                  phase >= 2 ? ['#a855f7', '#8b5cf6', '#a855f7'] :
                  [enemy.portrait_placeholder_color || '#374151', enemy.portrait_placeholder_color || '#374151']
              }}
              transition={{ repeat: furyStacks >= 3 || phase >= 2 ? Infinity : 0, duration: 1.0 }}
              style={{
                background: `linear-gradient(135deg, ${enemy.portrait_placeholder_color || '#1a1a3a'}88, ${enemy.portrait_placeholder_color || '#1a1a3a'}cc)`,
                filter: furyStacks >= 3 ? 'brightness(1.3) saturate(1.5)' : phase >= 2 ? 'brightness(1.15)' : 'none'
              }}
            >
              {furyStacks >= 3 ? '💢' : phase >= 3 ? '👾' : phase >= 2 ? '😤' : '👹'}
            </motion.div>
          )}
        </div>

        {/* Fury counter badge */}
        {furyStacks > 0 && (
          <div className="absolute -top-2 -left-2 bg-orange-900/90 border border-orange-600 rounded-full px-2 py-0.5 text-[9px] font-bold text-orange-300">
            🔥×{furyStacks}
          </div>
        )}

        {/* Wrong-answer buffs */}
        {activeBuffs.length > 0 && (
          <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1">
            {activeBuffs.map((buff, idx) => {
              const meta = BUFF_ICONS[buff.type] || { icon: '❓', label: buff.type, desc: '' }
              return (
                <span key={`${buff.type}-${idx}`} title={`${meta.label}: ${meta.desc}`} className="text-sm cursor-help">
                  {meta.icon}
                </span>
              )
            })}
          </div>
        )}
      </motion.div>

      {/* ── HP Bar (STS style) ── */}
      <div className="w-44 mt-2">
        {/* Armor badge */}
        {armor > 0 && (
          <div className="flex justify-start mb-1">
            <div className="flex items-center gap-1 bg-gray-800/90 border border-cyan-700 rounded-full px-2 py-0.5">
              <span className="text-cyan-400 text-sm">🛡️</span>
              <span className="text-cyan-300 text-xs font-bold">{armor}</span>
            </div>
          </div>
        )}
        {/* Bar with number centered on it */}
        <div className="relative h-6 bg-gray-900 rounded border border-gray-700 overflow-hidden shadow-inner">
          <motion.div
            className={`absolute inset-y-0 left-0 rounded ${hpColor}`}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
          <span
            className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white"
            style={{ textShadow: '1px 1px 0 #000,-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000' }}
          >
            {hp} / {maxHp}
          </span>
        </div>
      </div>
    </div>
  )
}
