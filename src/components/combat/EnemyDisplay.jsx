// components/combat/EnemyDisplay.jsx
// Enemy portrait, HP bar, name, intent icon — NO knowledge of player state

import { motion, AnimatePresence } from 'framer-motion'
import { HoverTranslate } from '../shared/HoverTranslate.jsx'

const INTENT_ICONS = {
  vocabulary: { icon: '📖', label: 'Vocabulary incoming', color: 'text-red-400', bg: 'bg-red-950/60' },
  grammar: { icon: '✏️', label: 'Grammar incoming', color: 'text-blue-400', bg: 'bg-blue-950/60' },
  reading: { icon: '📜', label: 'Reading incoming', color: 'text-emerald-400', bg: 'bg-emerald-950/60' },
  attack: { icon: '💢', label: 'Attacking directly!', color: 'text-orange-400', bg: 'bg-orange-950/60' },
  debuff: { icon: '🌀', label: 'Applying a debuff', color: 'text-purple-400', bg: 'bg-purple-950/60' },
}

const BUFF_ICONS = {
  confusion: { icon: '😵', label: 'Confusion', desc: '+2 ATK this turn' },
  conjugation_armor: { icon: '🛡️', label: 'Conjugation Armor', desc: 'Grammar cards blocked' },
  fortify: { icon: '💪', label: 'Fortify', desc: '+5 max HP temporarily' },
  mountain_wrath: { icon: '⛰️', label: 'Mountain Wrath', desc: '+3 ATK this turn' },
  curse_draw: { icon: '💀', label: 'Trick', desc: 'Curse in your deck' },
}

/**
 * @param {Object} enemy - enemy data from JSON
 * @param {number} hp - current enemy HP
 * @param {number} maxHp - max enemy HP
 * @param {number} block - current enemy block (if any)
 * @param {string} currentIntent - current turn intent
 * @param {string} nextIntent - next turn intent (preview)
 * @param {Object[]} activeBuffs - enemy buffs
 * @param {boolean} isShaking - trigger shake animation on being hit
 * @param {number} [phase] - boss phase number
 */
export function EnemyDisplay({
  enemy,
  hp = 0,
  maxHp = 1,
  block = 0,
  currentIntent = 'attack',
  nextIntent,
  activeBuffs = [],
  isShaking = false,
  phase,
}) {
  if (!enemy) return null

  const hpPercent = Math.max(0, (hp / maxHp) * 100)
  const hpColor = hpPercent > 50 ? 'bg-red-500' : hpPercent > 25 ? 'bg-orange-500' : 'bg-red-700'
  const intentMeta = INTENT_ICONS[currentIntent] || INTENT_ICONS.attack

  return (
    <div className="flex flex-col items-center gap-3">
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
          x: [-6, 6, -4, 4, 0],
          transition: { duration: 0.3, ease: 'easeInOut' }
        } : {}}
        className="relative"
      >
        <div className="w-36 h-44 rounded-2xl overflow-hidden border-2 border-gray-700/60 shadow-2xl shadow-black/60">
          {enemy.portrait && !enemy.portrait.includes('placeholder') ? (
            <img
              src={enemy.portrait}
              alt={enemy.name_native}
              className="w-full h-full object-cover object-top"
              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
            />
          ) : null}

          {/* Placeholder portrait */}
          <div
            className="w-full h-full flex items-center justify-center text-6xl"
            style={{
              background: `linear-gradient(135deg, ${enemy.portrait_placeholder_color || '#1a1a3a'}88, ${enemy.portrait_placeholder_color || '#1a1a3a'}cc)`,
              display: enemy.portrait ? 'none' : 'flex',
            }}
          >
            👹
          </div>
        </div>

        {/* Intent icon floating on portrait */}
        <motion.div
          key={currentIntent}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`absolute -top-2 -right-2 ${intentMeta.bg} border border-gray-600/40 
                       rounded-full w-9 h-9 flex items-center justify-center text-lg
                       shadow-lg shadow-black/60`}
          title={intentMeta.label}
        >
          {intentMeta.icon}
        </motion.div>

        {/* Enemy buffs strip */}
        {activeBuffs.length > 0 && (
          <div className="absolute -bottom-2 left-0 right-0 flex justify-center gap-1">
            {activeBuffs.map((buff) => {
              const meta = BUFF_ICONS[buff.type] || { icon: '❓', label: buff.type, desc: '' }
              return (
                <span
                  key={buff.id}
                  title={`${meta.label}: ${meta.desc} (${buff.duration_turns}t)`}
                  className="text-base cursor-help"
                >
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

      {/* HP bar */}
      <div className="w-44">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-gray-400">HP</span>
          <span className="text-xs text-white font-mono">{hp} / {maxHp}</span>
        </div>
        <div className="h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
          <motion.div
            className={`h-full rounded-full ${hpColor} transition-colors duration-300`}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
        {block > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs">🛡️</span>
            <span className="text-xs text-blue-300">{block}</span>
          </div>
        )}
      </div>

      {/* Next turn preview */}
      {nextIntent && (
        <div className="text-[10px] text-gray-500">
          Next: <span className={INTENT_ICONS[nextIntent]?.color}>{INTENT_ICONS[nextIntent]?.icon}</span>
        </div>
      )}
    </div>
  )
}
