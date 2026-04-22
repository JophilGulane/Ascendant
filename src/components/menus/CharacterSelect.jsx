// components/menus/CharacterSelect.jsx
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import { CARDS as CAMPAIGN_CHARS } from '../../constants/campaigns.js'
import { buildStartingDeck } from '../../utils/deck.js'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'

const CHARS = CAMPAIGN_CHARS.japanese.characters

export function CharacterSelect() {
  const navigate = useNavigate()
  const store = useRunStore()

  const startRun = (character) => {
    if (character.locked) return

    const campaign = CAMPAIGN_CHARS.japanese
    const deck = buildStartingDeck(
      campaign.startingVocabCards,
      campaign.startingGrammarCards,
      campaign.startingReadingCards,
      'jp_read_travelers_wisdom' // Kenji's rare
    )

    store.startRun('japanese', character, 0, deck, character.starterRelic)

    navigate('/map')
  }

  return (
    <ScreenTransition>
      <div
        className="w-full h-screen flex flex-col items-center justify-center px-4"
        style={{ background: 'linear-gradient(180deg, #0a0516 0%, #100720 60%, #0d0d0d 100%)' }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(ellipse at 50% 30%, #C41E3A 0%, transparent 60%)' }}
        />

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -3 }}
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 text-gray-500 hover:text-gray-300 text-sm flex items-center gap-1 transition-colors"
        >
          ← Back
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 text-center mb-8"
        >
          <div className="text-sm text-gray-500 uppercase tracking-widest mb-1">Japanese Campaign</div>
          <h1 className="text-2xl font-bold text-white">Choose Your Traveler</h1>
          <p className="text-sm text-gray-400 mt-1">Your choice IS the placement. No quiz required.</p>
        </motion.div>

        {/* Character cards */}
        <div className="relative z-10 flex gap-5 justify-center flex-wrap">
          {CHARS.map((char, i) => (
            <motion.div
              key={char.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              whileHover={!char.locked ? { y: -6, scale: 1.02 } : {}}
              onClick={() => startRun(char)}
              className={`
                w-52 rounded-2xl border-2 overflow-hidden transition-all
                ${char.locked
                  ? 'border-gray-700 opacity-50 cursor-not-allowed'
                  : 'border-amber-700/60 hover:border-amber-500 cursor-pointer shadow-lg shadow-amber-900/20'}
              `}
              style={{ background: 'linear-gradient(160deg, #12121888, #08080ccc)' }}
            >
              {/* Character portrait area */}
              <div
                className="h-48 relative overflow-hidden"
                style={{ background: !char.locked ? 'linear-gradient(180deg, #1a0a0066, #0a051688)' : '#0d0d0d88' }}
              >
                {char.id === 'kenji' ? (
                  <img
                    src="/images/characters/japanese/kenji.png"
                    alt="Kenji"
                    className="w-full h-full object-cover object-top"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-5xl">
                    {char.locked ? '🔒' : '👤'}
                  </div>
                )}

                {/* Locked overlay */}
                {char.locked && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                    <span className="text-3xl mb-2">🔒</span>
                    <span className="text-xs text-gray-400">Phase 2</span>
                  </div>
                )}

                {/* Fluency badge */}
                {!char.locked && (
                  <div className="absolute bottom-2 left-2 bg-black/70 text-xs text-amber-300 px-2 py-0.5 rounded-lg">
                    {char.fluency}
                  </div>
                )}
              </div>

              {/* Character info */}
              <div className="p-4">
                <div className="font-bold text-white text-base">{char.name}</div>
                <div className="text-xs text-amber-400 mb-2">{char.title}</div>
                <p className="text-xs text-gray-400 leading-relaxed mb-3">{char.description}</p>

                {/* Deck breakdown */}
                {!char.locked && (
                  <div className="border-t border-gray-700/50 pt-2">
                    <div className="text-[10px] text-gray-500 mb-1.5">Starting Deck</div>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-[9px] px-1.5 py-0.5 bg-red-950/50 border border-red-800 text-red-300 rounded">
                        ⚔️×{char.startingDeckBreakdown.vocabulary}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-blue-950/50 border border-blue-800 text-blue-300 rounded">
                        🛡️×{char.startingDeckBreakdown.grammar}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded">
                        📖×{char.startingDeckBreakdown.reading}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-yellow-950/50 border border-yellow-700 text-yellow-300 rounded">
                        ★×{char.startingDeckBreakdown.rare}
                      </span>
                    </div>
                  </div>
                )}

                {!char.locked && (
                  <motion.div
                    className="mt-3 text-center text-xs font-bold text-amber-300 py-1.5 rounded-lg bg-amber-900/20 border border-amber-700/30"
                  >
                    Begin Journey →
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </ScreenTransition>
  )
}
