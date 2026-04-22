// components/combat/EnemyIntentPanel.jsx — v2 with tooltips
// Displays the enemy's full upcoming action chain with icons, labels, arrows, and hover tooltips.
// Animates when intentIndex changes (slide in from right).

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MOVE_ICONS, MOVE_COLORS, MOVE_CATEGORY } from '../../constants/enemyMoves.js'

/**
 * @param {Object} enemy       - current enemy data (needs intent_pattern, base_attack, silence_type)
 * @param {number} intentIndex - current index in the enemy's intent_pattern array
 */
export function EnemyIntentPanel({ enemy, intentIndex }) {
  if (!enemy?.intent_pattern) return null

  const pattern = enemy.intent_pattern
  const safeIndex = intentIndex % pattern.length
  const currentActions = pattern[safeIndex] || ['strike']

  // Preview next turn's actions (greyed out)
  const nextIndex = (safeIndex + 1) % pattern.length
  const nextActions = pattern[nextIndex]

  return (
    <div className="flex flex-col items-center gap-1">
      {/* Label */}
      <div className="text-[9px] text-gray-500 uppercase tracking-widest">Next action</div>

      {/* Current intent — animated on change */}
      <AnimatePresence mode="wait">
        <motion.div
          key={intentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="flex items-center gap-1.5 bg-gray-900/80 border border-gray-700 rounded-lg px-3 py-1.5"
        >
          {currentActions.map((action, i) => (
            <React.Fragment key={`${action}-${i}`}>
              <IntentAction action={action} enemy={enemy} />
              {i < currentActions.length - 1 && (
                <span className="text-gray-600 text-xs">→</span>
              )}
            </React.Fragment>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Next turn preview (subtle) */}
      {nextActions && nextActions !== currentActions && (
        <div className="flex items-center gap-1 opacity-30 text-[9px]">
          <span className="text-gray-600">then:</span>
          {nextActions.map((action, i) => (
            <span key={`next-${action}-${i}`} className="text-gray-400">
              {MOVE_ICONS[action] || '?'}{i < nextActions.length - 1 ? '→' : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function IntentAction({ action, enemy }) {
  const [showTooltip, setShowTooltip] = useState(false)
  const icon = MOVE_ICONS[action] || '❓'
  const colorClass = MOVE_COLORS[action] || 'text-gray-300'
  const label = getIntentLabel(action, enemy)
  const category = MOVE_CATEGORY[action] || 'special'
  const tooltipText = getIntentTooltip(action, enemy)

  const bgClass = {
    damage:   'bg-red-950/50   border-red-800/50',
    debuff:   'bg-purple-950/50 border-purple-800/50',
    selfbuff: 'bg-blue-950/50  border-blue-800/50',
    special:  'bg-gray-900     border-gray-700',
  }[category] || 'bg-gray-900 border-gray-700'

  return (
    <div className="relative">
      <div
        className={`flex items-center gap-1 px-2 py-0.5 rounded border cursor-help ${bgClass} transition-opacity`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onTouchStart={() => setShowTooltip(v => !v)}
      >
        <span className="text-sm">{icon}</span>
        <span className={`text-[10px] font-semibold ${colorClass} whitespace-nowrap`}>{label}</span>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
          >
            <div className="bg-gray-950 border border-gray-600 rounded-lg px-3 py-2 shadow-2xl w-48">
              <div className="flex items-center gap-1.5 mb-1">
                <span>{icon}</span>
                <span className={`text-[11px] font-bold ${colorClass}`}>{label}</span>
              </div>
              <p className="text-[10px] text-gray-300 leading-snug">{tooltipText}</p>
            </div>
            {/* Arrow */}
            <div className="flex justify-center">
              <div className="w-2 h-2 bg-gray-950 border-b border-r border-gray-600 rotate-45 -mt-1" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function getIntentLabel(action, enemy) {
  switch (action) {
    case 'strike':             return `${enemy.base_attack} dmg`
    case 'debuff_silence':     return `Silence ${enemy.silence_type || 'vocab'}`
    case 'debuff_drain':       return '−1 Energy'
    case 'debuff_fog':         return 'Fog'
    case 'debuff_bind':        return '−1 Draw'
    case 'debuff_confusion':   return 'Shuffle opts'
    case 'self_buff_armor_up': return 'Armor +8'
    case 'self_buff_recover':  return 'Recover +15'
    case 'self_buff_power_up': return 'Fury +1'
    case 'self_buff_focus':    return 'Focus'
    default:                   return 'Special'
  }
}

function getIntentTooltip(action, enemy) {
  switch (action) {
    case 'strike':
      return `Deals ${enemy.base_attack} damage to you. Your Block absorbs it first. If Fury is at 3 stacks, this attack doubles in power.`

    case 'debuff_silence':
      return `Silences your ${enemy.silence_type || 'vocabulary'} cards for 2 turns. Silenced cards cannot be played — clicking them will trigger a shake.`

    case 'debuff_drain':
      return `Drains your energy. Next turn you start with 1 fewer Energy (min 0). Lasts 2 turns.`

    case 'debuff_fog':
      return `Casts Fog on your next question. Hover highlights on answer options are hidden, making it harder to guess. Consumes on use.`

    case 'debuff_bind':
      return `Binds your draw. Next turn you draw 1 fewer card than normal. Lasts 2 turns.`

    case 'debuff_confusion':
      return `Confuses your options. At the 3-second mark on your next question, the answer choices will shuffle positions. Consumes on use.`

    case 'self_buff_armor_up':
      return `Gains 8 Armor. Armor reduces all incoming damage by a flat amount. Chain combos bypass Armor entirely.`

    case 'self_buff_recover':
      return `Attempts to recover 15 HP. Only activates if the enemy is below 50% HP. Has no effect if at higher health.`

    case 'self_buff_power_up':
      return `Gains 1 Fury stack (max 3). At 3 Fury stacks, the next Strike deals double damage and Fury resets to 0.`

    case 'self_buff_focus':
      return `Focuses on your most-used card type this fight. Incoming damage from that card type is reduced by 50% until the focus changes.`

    default:
      return `A special ability unique to this enemy. Stay alert!`
  }
}
