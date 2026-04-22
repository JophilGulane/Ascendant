// components/combat/PlayerStatus.jsx
// Player HP bar, block indicator, energy pips, active debuff badges

import { motion } from 'framer-motion'
import { DebuffBadges } from './DebuffBadges.jsx'
import { getRelics } from '../../utils/dataLoader.js'
import useRunStore from '../../stores/runStore.js'

/**
 * @param {number} hp
 * @param {number} maxHp
 * @param {number} block
 * @param {number} energy
 * @param {number} maxEnergy
 * @param {Object[]} debuffs  - activePlayerDebuffs from runStore
 * @param {boolean} isHit    - triggers red flash when enemy attacks
 * @param {string[]} relics  - active relic IDs
 */
export function PlayerStatus({ hp, maxHp, block, energy, maxEnergy, debuffs = [], isHit = false, relics = [] }) {
  const campaign = useRunStore(s => s.campaign)
  const hpPercent = Math.max(0, (hp / maxHp) * 100)
  const hpColor = hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-600'
  const criticalHp = hpPercent <= 20

  return (
    <motion.div
      className="flex flex-col gap-2 p-3 bg-gray-950/80 border border-gray-800 rounded-xl min-w-36"
      animate={{
        borderColor: isHit ? '#ef4444' : '#1f2937',
        boxShadow: isHit ? '0 0 16px #ef444488' : '0 0 0px transparent',
      }}
      transition={{ duration: 0.3 }}
    >
      {/* Player label */}
      <div className="flex items-center gap-1.5">
        <span className="text-base">🧘</span>
        <span className="text-xs text-gray-400">Kenji</span>
        {criticalHp && (
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="text-[10px] text-red-400 font-bold"
          >
            CRITICAL
          </motion.span>
        )}
      </div>

      {/* HP bar */}
      <div>
        <div className="flex justify-between mb-0.5">
          <span className="text-[10px] text-gray-500">HP</span>
          <span className="text-[10px] text-white font-mono">{hp} / {maxHp}</span>
        </div>
        <div className="h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/30">
          <motion.div
            className={`h-full rounded-full ${hpColor} transition-colors duration-300`}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Block */}
      {block > 0 && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-1.5"
        >
          <span className="text-base">🛡️</span>
          <span className="text-sm font-bold text-blue-300">{block}</span>
          <span className="text-[10px] text-gray-500">block</span>
        </motion.div>
      )}

      {/* v2: Active player debuffs */}
      <DebuffBadges debuffs={debuffs} />

      {/* Relic strip */}
      {relics.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-0.5">
          {relics.slice(0, 6).map(relicId => (
            <span
              key={relicId}
              className="text-base cursor-help"
              title={relicId.replace(/_/g, ' ')}
            >
              {getRelicIcon(relicId, campaign)}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function getRelicIcon(relicId, campaign) {
  const relicsData = getRelics(campaign)
  const relic = relicsData.find(r => r.id === relicId)
  return relic ? relic.icon : '💎'
}
