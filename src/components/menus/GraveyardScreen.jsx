import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useGraveyardStore from '../../stores/graveyardStore.js'
import useSettingsStore from '../../stores/settingsStore.js'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'

export function GraveyardScreen() {
  const navigate = useNavigate()
  const { getSortedEntries, getUnclearedCount, clearAll } = useGraveyardStore()
  const settings = useSettingsStore()
  
  const entries = getSortedEntries()
  const unclearedCount = getUnclearedCount()

  const [confirmClear, setConfirmClear] = useState(false)

  return (
    <ScreenTransition>
      <div className="relative w-full h-screen bg-[#0a0a0c] text-gray-200 flex flex-col p-8 overflow-hidden font-serif">
        <div className="absolute inset-0 bg-[url('/images/ui/dungeon_combat_bg.png')] bg-cover bg-center opacity-10 pointer-events-none" />
        
        <div className="relative z-10 flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-red-400 tracking-widest uppercase" style={{ fontFamily: "'Cinzel', serif" }}>Mistake Graveyard</h1>
            <p className="text-gray-400 mt-2">Unmastered spirits: <span className="text-red-300 font-bold">{unclearedCount}</span> / {entries.length}</p>
          </div>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-2 border border-gray-600 rounded hover:bg-gray-800 transition-colors"
          >
            Return to Menu
          </button>
        </div>

        <div className="relative z-10 flex-1 bg-gray-900/60 border border-gray-700 rounded-lg p-6 flex flex-col overflow-hidden">
          
          <div className="flex justify-between items-center mb-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={settings.spacedRepetition !== false}
                onChange={(e) => useSettingsStore.getState().setSpacedRepetition(e.target.checked)}
                className="w-5 h-5 accent-red-600 bg-gray-800 border-gray-600 rounded"
              />
              <span className="text-lg text-gray-300 group-hover:text-red-300 transition-colors">
                Haunting Toggle (Spaced Repetition)
              </span>
            </label>

            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-red-400 text-sm">Are you sure?</span>
                <button onClick={() => { clearAll(); setConfirmClear(false) }} className="px-3 py-1 bg-red-900 text-red-200 rounded hover:bg-red-800">Yes, Clear</button>
                <button onClick={() => setConfirmClear(false)} className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600">Cancel</button>
              </div>
            ) : (
              <button 
                onClick={() => setConfirmClear(true)}
                className="text-sm text-gray-500 hover:text-red-400 transition-colors"
              >
                Clear Graveyard
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
            {entries.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <span className="text-6xl mb-4">🪦</span>
                <p>The graveyard is empty.</p>
                <p className="text-sm mt-2">Play the game to populate it.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-12">
                {entries.map(entry => (
                  <motion.div 
                    key={entry.id}
                    layout
                    className={`p-4 rounded-lg border flex flex-col ${
                      entry.mastered 
                        ? 'bg-emerald-950/30 border-emerald-900/50' 
                        : 'bg-red-950/30 border-red-900/50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-2xl font-bold text-white">{entry.label}</h3>
                      <div className="flex gap-1">
                        {[1, 2, 3].map(star => (
                          <span key={star} className={`text-sm ${star <= entry.correctStreak ? 'text-yellow-400' : 'text-gray-700'}`}>★</span>
                        ))}
                      </div>
                    </div>
                    {entry.reading && <p className="text-gray-400 text-sm mb-3">{entry.reading}</p>}
                    
                    <div className="mt-auto flex justify-between text-xs">
                      <span className="text-red-400">Mistakes: {entry.wrongCount}</span>
                      {entry.mastered ? (
                        <span className="text-emerald-400 font-bold">MASTERED</span>
                      ) : (
                        <span className="text-gray-500">Streak: {entry.correctStreak}/3</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </ScreenTransition>
  )
}
