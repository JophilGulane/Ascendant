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
    case 'strike':              return `${enemy.base_attack} dmg`
    case 'strike_heavy':        return `${Math.floor(enemy.base_attack * 1.8)} dmg`
    case 'strike_swift':        return `${Math.floor(enemy.base_attack * 0.6)}×2 dmg`
    case 'debuff_silence':      return `Silence ${enemy.silence_type || 'vocab'}`
    case 'debuff_drain':        return '−1 Energy'
    case 'debuff_fog':          return 'Fog'
    case 'debuff_bind':         return '−1 Draw'
    case 'debuff_confusion':    return 'Shuffle opts'
    case 'debuff_curse':        return 'Curse!'
    case 'debuff_taunt':        return 'Taunt!'
    case 'self_buff_armor_up':  return 'Armor +8'
    case 'self_buff_harden':    return 'Armor +15'
    case 'self_buff_recover':   return 'Recover +15'
    case 'self_buff_power_up':  return 'Fury +1'
    case 'self_buff_enrage':    return 'Fury +2'
    case 'self_buff_focus':     return 'Focus'
    default:                    return 'Special'
  }
}

function getIntentTooltip(action, enemy) {
  switch (action) {
    case 'strike':
      return `Deals ${enemy.base_attack} damage. Your Block absorbs it first. At Fury 3, this doubles.`
    case 'strike_heavy':
      return `A heavy blow dealing ${Math.floor(enemy.base_attack * 1.8)} damage. Slower but hits much harder.`
    case 'strike_swift':
      return `Two rapid hits of ${Math.floor(enemy.base_attack * 0.6)} each. Split damage can pierce small blocks.`
    case 'debuff_silence':
      return `Silences your ${enemy.silence_type || 'vocabulary'} cards for 2 turns. Silenced cards cannot be played.`
    case 'debuff_drain':
      return `Drains your energy. Next turn you start with 1 fewer Energy (min 0). Lasts 2 turns.`
    case 'debuff_fog':
      return `Casts Fog. Hover highlights on answer options are hidden, making it harder to guess.`
    case 'debuff_bind':
      return `Binds your draw. Next turn you draw 1 fewer card than normal. Lasts 2 turns.`
    case 'debuff_confusion':
      return `Confuses your options. At 3 seconds, answer choices will shuffle positions.`
    case 'debuff_curse':
      return `Applies both Silence AND Drain simultaneously. A brutal two-in-one debuff!`
    case 'debuff_taunt':
      return `Taunts you. Applies Bind (−1 Draw) and Confusion in a single action.`
    case 'self_buff_armor_up':
      return `Gains 8 Armor. Armor reduces incoming damage. Chain combos bypass Armor entirely.`
    case 'self_buff_harden':
      return `Hardens its shell for +15 Armor. Much stronger than a normal Armor Up.`
    case 'self_buff_recover':
      return `Attempts to recover 15 HP. Only activates if below 50% HP.`
    case 'self_buff_power_up':
      return `Gains 1 Fury stack (max 3). At Fury 3, the next Strike deals double damage.`
    case 'self_buff_enrage':
      return `Gains 2 Fury stacks at once. A rapid escalation — watch out for a double-damage hit!`
    case 'self_buff_focus':
      return `Focuses on your most-used card type. Incoming damage from that type is reduced by 50%.`
    default:
      return `A special ability unique to this enemy. Stay alert!`
  }
}
