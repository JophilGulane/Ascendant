// components/combat/PotionSlots.jsx
// 3-slot potion tray. Sits in the combat HUD above the card hand area.
// Blocked during active question prompt.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { POTIONS } from '../../data/potions.js'

const TIER_GLOW = {
  common:   '0 0 8px rgba(255,255,255,0.2)',
  uncommon: '0 0 12px rgba(99,102,241,0.6)',
  rare:     '0 0 18px rgba(245,158,11,0.8)',
}

const TIER_BORDER = {
  common:   '#4b5563',
  uncommon: '#6366f1',
  rare:     '#f59e0b',
}

function PotionTooltip({ potion }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 2 }}
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none"
      style={{ width: 200 }}
    >
      <div
        className="rounded-xl border p-3 text-xs shadow-2xl"
        style={{
          background: 'linear-gradient(160deg, #1a1208, #0d0d0d)',
          borderColor: TIER_BORDER[potion.tier],
          boxShadow: TIER_GLOW[potion.tier],
        }}
      >
        <div className="font-bold text-sm mb-1" style={{ color: potion.color, fontFamily: "'Cinzel', serif" }}>
          {potion.icon} {potion.name}
        </div>
        <div className="text-[10px] uppercase tracking-widest mb-2" style={{ color: potion.color, opacity: 0.7 }}>
          {potion.tier}
        </div>
        <p className="text-gray-300 leading-relaxed mb-2">{potion.description}</p>
        <p className="text-gray-600 italic">{potion.flavor}</p>
      </div>
      {/* Arrow */}
      <div className="flex justify-center">
        <div className="w-2 h-2 rotate-45 -mt-1" style={{ background: TIER_BORDER[potion.tier] }} />
      </div>
    </motion.div>
  )
}

function PotionBottle({ potionId, index, onUse, isLocked, campaign }) {
  const [hovered, setHovered] = useState(false)
  const [popping, setPopping] = useState(false)
  const potion = potionId ? POTIONS[potionId] : null

  const handleClick = () => {
    if (!potion || isLocked || popping) return
    setPopping(true)
    setTimeout(() => {
      onUse(index)
      setPopping(false)
    }, 200)
  }

  // Campaign bottle shape: Japanese = ceramic, Korean = circuit vial, Spanish = clay
  const bottleShape = campaign === 'korean' ? '🧪' : campaign === 'spanish' ? '🏺' : '⚱️'

  return (
    <div className="relative flex flex-col items-center">
      <AnimatePresence>
        {hovered && potion && <PotionTooltip key="tip" potion={potion} />}
      </AnimatePresence>

      <motion.button
        whileHover={potion && !isLocked ? { scale: 1.12, y: -3 } : {}}
        whileTap={potion && !isLocked ? { scale: 0.9 } : {}}
        animate={popping ? { scale: [1, 1.3, 0], opacity: [1, 1, 0] } : {}}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={handleClick}
        className="relative w-11 h-14 flex flex-col items-center justify-center rounded-lg border-2 transition-all"
        style={{
          background: potion
            ? `radial-gradient(ellipse at 50% 30%, ${potion.color}33, #0d0d0d 80%)`
            : 'rgba(0,0,0,0.3)',
          borderColor: potion ? TIER_BORDER[potion.tier] : '#374151',
          boxShadow: potion ? TIER_GLOW[potion.tier] : 'none',
          cursor: potion && !isLocked ? 'pointer' : 'default',
          opacity: isLocked && potion ? 0.5 : 1,
        }}
      >
        {potion ? (
          <>
            {/* Tier swirl indicator */}
            {potion.tier === 'uncommon' && (
              <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none">
                <motion.div
                  className="absolute inset-0 opacity-20"
                  style={{ background: `conic-gradient(from 0deg, ${potion.color}, transparent, ${potion.color})` }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            )}
            {potion.tier === 'rare' && (
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{ boxShadow: `inset 0 0 12px ${potion.color}` }}
              />
            )}
            <div className="text-xl leading-none">{potion.icon}</div>
            <div className="text-[9px] text-gray-400 mt-0.5 leading-none text-center truncate w-9">
              {potion.name.split(' ')[0]}
            </div>
          </>
        ) : (
          // Empty slot
          <div className="text-gray-700 text-xl opacity-40">{bottleShape}</div>
        )}

        {/* Locked indicator */}
        {isLocked && potion && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60">
            <span className="text-xs text-red-500">🔒</span>
          </div>
        )}
      </motion.button>
    </div>
  )
}

// Shatter animation when full and a drop is attempted
export function PotionFullFlash({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-red-400 whitespace-nowrap"
          style={{ textShadow: '0 0 8px red' }}
        >
          💢 FULL
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function PotionSlots({ potions = [], onUse, isLocked = false, campaign = 'japanese' }) {
  const MAX_SLOTS = 3
  const slots = Array.from({ length: MAX_SLOTS }, (_, i) => potions[i] ?? null)

  return (
    <div className="flex items-end gap-2 relative">
      {slots.map((potionId, i) => (
        <PotionBottle
          key={i}
          index={i}
          potionId={potionId}
          onUse={onUse}
          isLocked={isLocked}
          campaign={campaign}
        />
      ))}
    </div>
  )
}
