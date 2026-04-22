// components/combat/EnemyDisplay.jsx — v2
// Enemy portrait, HP bar, name, armor, fury, intent panel — NO player state knowledge

import { motion } from 'framer-motion'
import { HoverTranslate } from '../shared/HoverTranslate.jsx'
import { EnemyIntentPanel } from './EnemyIntentPanel.jsx'

const INTENT_ICONS = {
  vocabulary: { icon: '📖', label: 'Vocabulary incoming', color: 'text-red-400', bg: 'bg-red-950/60' },
  grammar: { icon: '✏️', label: 'Grammar incoming', color: 'text-blue-400', bg: 'bg-blue-950/60' },
  reading: { icon: '📜', label: 'Reading incoming', color: 'text-emerald-400', bg: 'bg-emerald-950/60' },
  attack: { icon: '💢', label: 'Attacking directly!', color: 'text-orange-400', bg: 'bg-orange-950/60' },
  debuff: { icon: '🌀', label: 'Applying a debuff', color: 'text-purple-400', bg: 'bg-purple-950/60' },
}

const BUFF_ICONS = {
  confusion:          { icon: '😵', label: 'Confusion',          desc: '+ATK this turn' },
  conjugation_armor:  { icon: '🛡️', label: 'Conj. Armor',       desc: 'Wrong grammar → armor' },
  fortify:            { icon: '💪', label: 'Fortify',             desc: '+HP bonus' },
}

/**
 * @param {Object} enemy         - enemy data from JSON
 * @param {number} hp            - current enemy HP
 * @param {number} maxHp         - max enemy HP
 * @param {number} block         - current enemy block
 * @param {number} armor         - v2: flat damage reduction (from armor_up)
 * @param {number} furyStacks    - v2: fury stacks from power_up
 * @param {number} intentIndex   - v2: current intent index
 * @param {Object[]} activeBuffs - v2: activeEnemyBuffs from wrong answers
 * @param {boolean} isShaking    - trigger shake animation on being hit
 * @param {number} [phase]       - boss phase number
 */
export function EnemyDisplay({
  enemy,
  hp = 0,
  maxHp = 1,
  block = 0,
  armor = 0,
  furyStacks = 0,
  intentIndex = 0,
  activeBuffs = [],
  isShaking = false,
  phase,
}) {
  if (!enemy) return null

  const hpPercent = Math.max(0, (hp / maxHp) * 100)
  const hpColor = hpPercent > 50 ? 'bg-red-500' : hpPercent > 25 ? 'bg-orange-500' : 'bg-red-700'

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Phase badge */}
      {phase && phase > 1 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="bg-red-900 border border-red-600 text-red-200 text-xs px-3 py-1 rounded-full font-bold"
        >
          PHASE {phase}
        </motion.div>
      )}

      {/* Enemy portrait */}
      <motion.div
        animate={isShaking ? {
          x: [-8, 8, -6, 6, -3, 3, 0],
          transition: { duration: 0.4, ease: 'easeInOut' }
        } : { x: 0 }}
        className="relative"
      >
        <div className="w-36 h-44 rounded-2xl overflow-hidden border-2 border-gray-700/60 shadow-2xl shadow-black/60">
          {enemy.portrait ? (
            <img
              src={enemy.portrait}
              alt={enemy.name_native}
              className="w-full h-full object-cover object-top"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-6xl"
              style={{ background: `linear-gradient(135deg, ${enemy.portrait_placeholder_color || '#1a1a3a'}88, ${enemy.portrait_placeholder_color || '#1a1a3a'}cc)` }}
            >
              👹
            </div>
          )}
        </div>

        {/* v2: Fury stacks indicator */}
        {furyStacks > 0 && (
          <div className="absolute -top-2 -left-2 bg-orange-900/90 border border-orange-600 rounded-full px-2 py-0.5 text-[9px] font-bold text-orange-300">
            🔥×{furyStacks}
          </div>
        )}

        {/* Enemy wrong-answer buffs */}
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

      {/* Enemy name */}
      <div className="text-center">
        <div className="text-sm font-bold text-white">
          <HoverTranslate translation={enemy.name_native}>
            {enemy.name_target}
          </HoverTranslate>
        </div>
        <div className="text-[10px] text-gray-500">{enemy.name_native}</div>
      </div>

      {/* HP + Armor bar */}
      <div className="w-44">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">HP</span>
          <div className="flex items-center gap-2">
            {armor > 0 && <span className="text-[10px] text-blue-300">🛡️{armor}</span>}
            <span className="text-xs text-white font-mono">{hp} / {maxHp}</span>
          </div>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
          <motion.div
            className={`h-full rounded-full ${hpColor}`}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* v2: Intent Panel — shows full upcoming action chain */}
      <EnemyIntentPanel enemy={enemy} intentIndex={intentIndex} />
    </div>
  )
}

