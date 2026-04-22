// components/shared/TopBar.jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import useRunStore from '../../stores/runStore.js'
import { useAudio } from '../../hooks/useAudio.js'
import { JournalOverlay } from '../journal/JournalOverlay.jsx'

export function TopBar({ hideMapButton = false }) {
  const store = useRunStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { playSFX } = useAudio()

  const [openModal, setOpenModal] = useState(null) // 'deck' | 'relics' | 'map' | 'settings' | 'journal'

  const closeModal = () => setOpenModal(null)
  
  const handleOpen = (modal) => {
    playSFX('button_click')
    setOpenModal(modal)
  }

  return (
    <>
      <div
        className="relative z-40 flex items-center justify-between px-4 py-1.5 w-full"
        style={{
          background: 'linear-gradient(180deg, #2b353f 0%, #1a2228 100%)',
          borderBottom: '2px solid #111',
          boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
          color: '#ddd',
          fontSize: '0.85rem'
        }}
      >
        {/* Left: Player Info */}
        <div className="flex items-center gap-4">
          <div className="font-bold text-white text-base mr-2">{store.character?.name || 'Traveler'}</div>
          <div className="flex items-center gap-1">
            <span className="text-red-400">❤️</span>
            <span className="font-bold text-red-100">{store.hp}/{store.maxHp}</span>
          </div>
          <div className="flex items-center gap-1 ml-2">
            <span className="text-yellow-400">🪙</span>
            <span className="font-bold text-yellow-100">{store.gold}</span>
          </div>
          
          {/* Relics Button */}
          <button 
            onClick={() => handleOpen('relics')}
            className="ml-4 flex gap-1 items-center hover:bg-gray-700/50 p-1 rounded transition-colors cursor-pointer"
            title="View Relics"
          >
            {store.relics.length === 0 ? (
              <span className="text-xs text-gray-500 italic">No relics</span>
            ) : (
              store.relics.slice(0, 3).map((r, i) => (
                <div key={i} className="w-5 h-5 bg-gray-700 border border-gray-500 rounded-sm" />
              ))
            )}
            {store.relics.length > 3 && <span className="text-xs text-gray-400">+{store.relics.length - 3}</span>}
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <div className="bg-gray-800/80 px-2 py-0.5 rounded border border-gray-600 font-bold mr-2">
            Floor {store.floor}
          </div>
          
          <button onClick={() => handleOpen('deck')} className="text-xl hover:scale-110 transition-transform cursor-pointer" title="View Deck">
            🃏
          </button>
          
          {!hideMapButton && location.pathname !== '/map' && (
            <button onClick={() => handleOpen('map')} className="text-xl hover:scale-110 transition-transform cursor-pointer" title="View Map">
              🗺️
            </button>
          )}

          <button onClick={() => handleOpen('journal')} className="text-xl hover:scale-110 transition-transform cursor-pointer" title="Open Journal">
            📖
          </button>

          <button onClick={() => handleOpen('settings')} className="text-xl hover:scale-110 transition-transform cursor-pointer" title="Settings">
            ⚙️
          </button>
        </div>
      </div>

      {/* OVERLAYS */}
      <AnimatePresence>
        {openModal === 'settings' && (
          <SettingsOverlay onClose={closeModal} />
        )}
        {openModal === 'deck' && (
          <DeckOverlay onClose={closeModal} deck={store.deck} />
        )}
        {openModal === 'relics' && (
          <RelicsOverlay onClose={closeModal} relics={store.relics} />
        )}
        {openModal === 'journal' && (
          <JournalOverlay onClose={closeModal} words={store.journalWords} grammar={store.journalGrammar} />
        )}
      </AnimatePresence>
    </>
  )
}

function SettingsOverlay({ onClose }) {
  const navigate = useNavigate()
  const { playSFX } = useAudio()
  
  const handleQuit = () => {
    playSFX('button_click')
    navigate('/')
  }
  
  const handleAbandon = () => {
    playSFX('button_click')
    useRunStore.getState().endRun()
    navigate('/')
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="rounded-2xl border border-gray-600 p-8 w-96 flex flex-col gap-4"
        style={{ background: 'linear-gradient(160deg, #1a1208, #0d0d0d)', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}
      >
        <h2 className="text-2xl font-bold text-amber-300 text-center mb-4" style={{ fontFamily: "'Cinzel', serif" }}>Settings</h2>
        
        <button className="w-full py-3 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-800 transition-colors cursor-pointer">
          Options
        </button>
        
        <button 
          onClick={handleAbandon}
          className="w-full py-3 rounded-lg border border-gray-600 text-gray-200 hover:bg-gray-800 transition-colors cursor-pointer"
        >
          Abandon Run
        </button>
        
        <button 
          onClick={handleQuit}
          className="w-full py-3 rounded-lg border border-amber-800 bg-amber-950/30 text-amber-200 hover:bg-amber-900/50 hover:border-amber-600 transition-all font-bold cursor-pointer"
        >
          Save & Quit to Menu
        </button>

        <button 
          onClick={onClose}
          className="w-full py-3 mt-4 rounded-lg border border-gray-700 bg-gray-900 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          Return to Game
        </button>
      </motion.div>
    </motion.div>
  )
}

export function DeckOverlay({ onClose, deck, title = "Master Deck" }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex flex-col p-8 overflow-hidden backdrop-blur-md"
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-white" style={{ fontFamily: "'Cinzel', serif" }}>{title} ({deck.length} Cards)</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-4xl cursor-pointer">×</button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 justify-items-center">
          {deck.map((cardId, i) => (
             <div key={i} className="w-32 h-44 bg-gray-800 rounded-lg border-2 border-gray-600 flex items-center justify-center text-center p-2 text-xs">
                {cardId}
             </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

function RelicsOverlay({ onClose, relics }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="rounded-2xl border border-gray-600 p-8 max-w-2xl w-full"
        style={{ background: '#111', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-amber-300" style={{ fontFamily: "'Cinzel', serif" }}>Your Relics</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-3xl cursor-pointer">×</button>
        </div>
        
        {relics.length === 0 ? (
          <p className="text-gray-500 italic text-center py-8">You have no relics.</p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {relics.map((r, i) => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700 w-24">
                <div className="w-12 h-12 bg-gray-900 border border-gray-600 flex items-center justify-center text-xl">
                  🏺
                </div>
                <div className="text-[10px] text-gray-300 text-center font-bold break-words w-full">{r}</div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
