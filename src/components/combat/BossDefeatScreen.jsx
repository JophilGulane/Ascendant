// components/combat/BossDefeatScreen.jsx
import { motion } from 'framer-motion'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'
import { useAudio } from '../../hooks/useAudio.js'

export function BossDefeatScreen({ enemy, onChoice }) {
  const { playSFX } = useAudio()
  if (!enemy || !enemy.defeat_dialogue || !enemy.defeat_choices) {
    return null
  }

  return (
    <ScreenTransition>
      <div className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden" style={{ fontFamily: "'Crimson Text', Georgia, serif" }}>
        
        {/* Background */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: 'url(/images/ui/dungeon_combat_bg.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.3) blur(4px)',
          }}
        />

        <div className="relative z-10 max-w-2xl w-full px-6 flex flex-col items-center">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="mb-12 text-center"
          >
            <h2 className="text-4xl text-amber-500 font-bold mb-6" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
              Victory
            </h2>
            
            <div className="bg-gray-900/80 border border-gray-700 rounded-xl p-8 shadow-2xl relative">
              {/* Enemy Portrait Placeholder */}
              <div 
                className="w-20 h-20 rounded-full mx-auto -mt-14 mb-4 border-2 border-gray-600 flex items-center justify-center text-3xl"
                style={{ backgroundColor: enemy.portrait_placeholder_color || '#1a1a3a' }}
              >
                👻
              </div>

              <div className="space-y-4 text-center">
                {Array.isArray(enemy.defeat_dialogue) ? (
                  enemy.defeat_dialogue.map((d, i) => (
                    <div key={i}>
                      <p className="text-xl text-gray-200">{d.line}</p>
                      <p className="text-sm text-gray-500 italic mt-1">{d.translation}</p>
                    </div>
                  ))
                ) : (
                  <div>
                    <p className="text-xl text-gray-200">{enemy.defeat_dialogue}</p>
                    <p className="text-sm text-gray-500 italic mt-1">{enemy.defeat_dialogue_translation}</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Choices */}
          <div className="w-full space-y-4">
            {enemy.defeat_choices.map((choice, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1 + (i * 0.2) }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(55, 65, 81, 0.9)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { playSFX('button_click'); onChoice(choice); }}
                className="w-full text-left bg-gray-800/90 border border-gray-600 rounded-lg p-5 flex flex-col gap-1 shadow-lg"
              >
                <span className="text-lg text-white font-medium">{choice.text}</span>
                <span className="text-sm text-gray-400 italic">{choice.translation}</span>
                
                {/* Reward hint */}
                <div className="mt-3 text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-2">
                  {choice.reward.type === 'card' && `Reward: ${choice.reward.rarity} Card Draft`}
                  {choice.reward.type === 'gold' && `Reward: +${choice.reward.amount} Gold`}
                  {choice.reward.type === 'relic' && `Reward: Random Relic`}
                </div>
              </motion.button>
            ))}
          </div>

        </div>
      </div>
    </ScreenTransition>
  )
}
