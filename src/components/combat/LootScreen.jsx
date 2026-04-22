import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import { getPotionData } from '../../data/potions.js'
import { RELICS } from '../../data/relics.js'
import { useAudio } from '../../hooks/useAudio.js'

export function LootScreen({ loot, onClaim, onSkip, onOpenDraft }) {
  const { playSFX } = useAudio()

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      style={{ fontFamily: "'Crimson Text', Georgia, serif" }}
    >
      <div className="relative w-full max-w-[400px]">
        
        {/* Scroll Header */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-full max-w-[350px] z-20">
          <svg viewBox="0 0 400 80" className="w-full drop-shadow-lg" preserveAspectRatio="none">
            <path d="M 30,40 Q 20,20 10,35 Q 0,50 15,60 Q 20,65 30,60 L 370,60 Q 380,65 385,60 Q 400,50 390,35 Q 380,20 370,40 Z" fill="#D9CDB6" stroke="#A29478" strokeWidth="2" />
            <path d="M 40,30 L 360,30 L 360,70 L 40,70 Z" fill="#E8DCC4" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center pt-2">
            <h2 className="text-3xl font-bold text-[#333] tracking-wider" style={{ fontFamily: "'Cinzel', serif" }}>
              Loot!
            </h2>
          </div>
        </div>

        {/* Scroll Body */}
        <div 
          className="relative bg-[#3A4A5A] pt-14 pb-8 px-6 min-h-[300px]"
          style={{
            clipPath: 'polygon(5% 0, 95% 0, 100% 5%, 100% 95%, 95% 100%, 5% 100%, 0 95%, 0 5%)',
            boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)',
            border: '2px solid #2A3A4A'
          }}
        >
          {/* Tattered bottom edge illusion via clip path above */}
          
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {loot.map((item) => (
                <LootItem 
                  key={item.id} 
                  item={item} 
                  onClaim={() => {
                    playSFX('button_click')
                    if (item.type === 'card') {
                      onOpenDraft(item)
                    } else {
                      onClaim(item.id)
                    }
                  }} 
                />
              ))}
            </AnimatePresence>
            
            {loot.length === 0 && (
              <div className="text-center text-gray-400 italic mt-8">
                All rewards claimed.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Skip Rewards Button (Right Side) */}
      <motion.button
        initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => { playSFX('button_click'); onSkip() }}
        className="absolute right-[10%] top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer group"
      >
        <svg width="200" height="80" viewBox="0 0 200 80">
          {/* Arrow shape */}
          <path 
            d="M 20,40 Q 10,20 30,10 Q 50,0 70,10 L 150,10 L 190,40 L 150,70 L 70,70 Q 50,80 30,70 Q 10,60 20,40 Z" 
            fill="#B23A3A" 
            stroke="#F5C842" 
            strokeWidth="3" 
            className="group-hover:fill-[#C24A4A] transition-colors"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-bold text-yellow-100 uppercase tracking-widest pl-4" style={{ fontFamily: "'Cinzel', serif" }}>
          Proceed
        </span>
      </motion.button>
    </motion.div>
  )
}

function LootItem({ item, onClaim }) {
  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
      onClick={onClaim}
      className="w-full flex items-center gap-4 bg-[#506A7A] hover:bg-[#607A8A] transition-colors p-3 rounded shadow-md border border-[#3A4A5A] cursor-pointer"
    >
      <div className="text-2xl w-8 text-center drop-shadow-md">
        {item.icon}
      </div>
      <div className="text-white text-lg tracking-wide font-medium">
        {item.label}
      </div>
    </motion.button>
  )
}
