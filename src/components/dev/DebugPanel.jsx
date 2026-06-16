// components/dev/DebugPanel.jsx — Developer debug overlay
// Floating 🐛 button → opens a tabbed debug menu
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import useAccountStore from '../../stores/accountStore.js'
import useGraveyardStore from '../../stores/graveyardStore.js'
import useProgressStore from '../../stores/progressStore.js'
import usePantheonStore from '../../stores/pantheonStore.js'

export function DebugPanel() {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('stats')
  const [cards, setCards] = useState([])
  const [enemies, setEnemies] = useState([])
  const [relics, setRelics] = useState([])
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const store = useRunStore()

  // Load game data
  useEffect(() => {
    const campaign = store.campaign || 'japanese'
    import(`../../data/${campaign}/cards.json`).then(m => setCards(m.default)).catch(() => {})
    import(`../../data/${campaign}/enemies.json`).then(m => setEnemies(m.default)).catch(() => {})
    import(`../../data/${campaign}/relics.json`).then(m => setRelics(m.default)).catch(() => {})
  }, [store.campaign, open])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] w-10 h-10 rounded-full bg-gray-900/90 border border-gray-600 text-lg flex items-center justify-center hover:bg-gray-800 hover:border-amber-500 transition-all cursor-pointer shadow-lg"
        title="Debug Panel"
      >🐛</button>
    )
  }

  const TABS = ['stats', 'cards', 'combat', 'teleport', 'relics', 'misc']

  const filteredCards = cards.filter(c =>
    !search || c.name_native.toLowerCase().includes(search.toLowerCase()) ||
    c.name_target.includes(search) || c.id.includes(search) || c.type.includes(search)
  )

  const teleportTo = (path, setup) => {
    setup?.()
    sessionStorage.setItem('active_encounter', JSON.stringify({ path }))
    navigate(path)
    setOpen(false)
  }

  const fightEnemy = (enemy) => {
    store.setEnemy(enemy)
    if (!store.runId) {
      // No active run — quick-start one
      store.startRun(store.campaign || 'japanese', store.character || { id: 'kenji', name: 'Kenji' }, 0, store.deck.length ? store.deck : cards.filter(c => c.rarity === 'common').slice(0, 8).map(c => c.id))
      store.setEnemy(enemy)
    }
    teleportTo('/combat')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="fixed bottom-4 right-4 z-[9999] w-[420px] max-h-[85vh] bg-gray-950/98 border border-gray-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-sm"
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
          <span className="text-sm font-bold text-amber-400">🐛 Debug Panel</span>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white text-lg cursor-pointer">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 px-2 bg-gray-900/50">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors border-b-2 -mb-px ${
                tab === t ? 'text-amber-300 border-amber-400' : 'text-gray-500 border-transparent hover:text-gray-300'
              }`}
            >{t}</button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2" style={{ maxHeight: '65vh' }}>

          {/* ═══ STATS TAB ═══ */}
          {tab === 'stats' && (
            <>
              <Section title="Player Stats">
                <StatRow label="HP" value={store.hp} max={store.maxHp}
                  onSet={(v) => useRunStore.setState({ hp: Math.min(v, store.maxHp) })} />
                <StatRow label="Max HP" value={store.maxHp}
                  onSet={(v) => useRunStore.setState({ maxHp: v, hp: Math.min(store.hp, v) })} />
                <StatRow label="Energy" value={store.energy} max={store.maxEnergy}
                  onSet={(v) => useRunStore.setState({ energy: v })} />
                <StatRow label="Max Energy" value={store.maxEnergy}
                  onSet={(v) => useRunStore.setState({ maxEnergy: v })} />
                <StatRow label="Block" value={store.block}
                  onSet={(v) => useRunStore.setState({ block: v })} />
                <StatRow label="Gold" value={store.gold}
                  onSet={(v) => useRunStore.setState({ gold: v })} />
              </Section>
              <Section title="Run Info">
                <StatRow label="Floor" value={store.floor}
                  onSet={(v) => useRunStore.setState({ floor: v })} />
                <StatRow label="Mastery" value={store.masteryLevel}
                  onSet={(v) => useRunStore.setState({ masteryLevel: v })} />
                <div className="text-xs text-gray-500 mt-1">
                  Run ID: {store.runId ? store.runId.slice(0, 8) + '…' : 'none'} · 
                  Campaign: {store.campaign || 'none'} · 
                  Deck: {store.deck?.length || 0} cards
                </div>
              </Section>
              <Section title="Quick Actions">
                <div className="flex flex-wrap gap-1.5">
                  <DebugBtn label="Full Heal" onClick={() => useRunStore.setState({ hp: store.maxHp })} />
                  <DebugBtn label="+100 Gold" onClick={() => useRunStore.setState({ gold: store.gold + 100 })} />
                  <DebugBtn label="+5 Energy" onClick={() => useRunStore.setState({ energy: store.energy + 5 })} />
                  <DebugBtn label="+20 Block" onClick={() => useRunStore.setState({ block: store.block + 20 })} />
                  <DebugBtn label="Set HP to 1" color="red" onClick={() => useRunStore.setState({ hp: 1 })} />
                </div>
              </Section>
            </>
          )}

          {/* ═══ CARDS TAB ═══ */}
          {tab === 'cards' && (
            <>
              <Section title="Add Cards to Deck">
                <input
                  type="text"
                  placeholder="Search cards by name, type, or ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 text-white text-xs outline-none focus:border-amber-500 mb-2"
                />
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {filteredCards.slice(0, 30).map(card => (
                    <div key={card.id} className="flex items-center justify-between px-2 py-1 rounded bg-gray-900/60 hover:bg-gray-800 group">
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs font-bold ${
                          card.type === 'vocabulary' ? 'text-red-400' :
                          card.type === 'grammar' ? 'text-blue-400' : 'text-green-400'
                        }`}>{card.name_native}</span>
                        <span className="text-[10px] text-gray-500 ml-1">({card.name_target})</span>
                        <span className="text-[10px] text-gray-600 ml-1">· {card.type} · {card.rarity}</span>
                      </div>
                      <button
                        onClick={() => store.addCardToDeck(card.id)}
                        className="text-[10px] px-2 py-0.5 bg-green-900/60 border border-green-700 text-green-300 rounded hover:bg-green-800 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      >+ Add</button>
                    </div>
                  ))}
                </div>
              </Section>
              <Section title="Deck Actions">
                <div className="flex flex-wrap gap-1.5">
                  <DebugBtn label="Upgrade All Cards" onClick={() => {
                    const unique = [...new Set(store.deck)]
                    unique.forEach(id => store.upgradeCard(id))
                  }} />
                  <DebugBtn label="Clear Deck" color="red" onClick={() => useRunStore.setState({ deck: [] })} />
                  <DebugBtn label="Draw 5 Cards" onClick={() => {
                    // Add 5 random cards from the full card pool
                    const sample = [...cards].sort(() => Math.random() - 0.5).slice(0, 5)
                    sample.forEach(c => store.addCardToDeck(c.id))
                  }} />
                </div>
              </Section>
              <Section title="Current Deck">
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
                  {store.deck?.map((id, i) => {
                    const card = cards.find(c => c.id === id)
                    const upgraded = store.upgradedCards?.includes(id)
                    return (
                      <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded border ${
                        upgraded ? 'border-amber-600 text-amber-300 bg-amber-950/30' : 'border-gray-700 text-gray-400 bg-gray-900/40'
                      }`}>
                        {card?.name_native || id}{upgraded ? '+' : ''}
                      </span>
                    )
                  })}
                  {(!store.deck || store.deck.length === 0) && (
                    <span className="text-xs text-gray-600">No cards in deck</span>
                  )}
                </div>
              </Section>
            </>
          )}

          {/* ═══ COMBAT TAB ═══ */}
          {tab === 'combat' && (
            <>
              <Section title="Fight Specific Enemy">
                {[1, 2, 3, 4].map(floor => {
                  const floorEnemies = enemies.filter(e => e.floor === floor)
                  if (floorEnemies.length === 0) return null
                  return (
                    <div key={floor} className="mb-2">
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Floor {floor}</div>
                      <div className="space-y-1">
                        {floorEnemies.map(enemy => (
                          <div key={enemy.id} className="flex items-center justify-between px-2 py-1 rounded bg-gray-900/60 hover:bg-gray-800 group">
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-bold ${
                                enemy.tier === 'boss' ? 'text-red-400' :
                                enemy.tier === 'elite' ? 'text-purple-400' : 'text-gray-200'
                              }`}>{enemy.name_native}</span>
                              <span className="text-[10px] text-gray-500 ml-1">({enemy.name_target})</span>
                              <span className="text-[10px] text-gray-600 ml-1">· {enemy.tier} · {enemy.hp}HP</span>
                            </div>
                            <button
                              onClick={() => fightEnemy(enemy)}
                              className="text-[10px] px-2 py-0.5 bg-red-900/60 border border-red-700 text-red-300 rounded hover:bg-red-800 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                            >⚔ Fight</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </Section>
              {store.currentEnemy && (
                <Section title="Current Enemy">
                  <div className="text-xs text-white mb-2">
                    {store.currentEnemy.name_native} — HP: {store.enemyHp}/{store.enemyMaxHp} — Armor: {store.enemyArmor}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <DebugBtn label="Kill Enemy" color="red" onClick={() => useRunStore.setState({ enemyHp: 0 })} />
                    <DebugBtn label="Set Enemy HP to 1" onClick={() => useRunStore.setState({ enemyHp: 1 })} />
                    <DebugBtn label="Heal Enemy Full" onClick={() => useRunStore.setState({ enemyHp: store.enemyMaxHp })} />
                    <DebugBtn label="Clear Armor" onClick={() => useRunStore.setState({ enemyArmor: 0 })} />
                  </div>
                </Section>
              )}
            </>
          )}

          {/* ═══ TELEPORT TAB ═══ */}
          {tab === 'teleport' && (
            <>
              <Section title="Navigate To">
                <div className="grid grid-cols-2 gap-1.5">
                  <TeleportBtn label="🗺️ Map" onClick={() => teleportTo('/map')} />
                  <TeleportBtn label="🔥 Rest Site" onClick={() => teleportTo('/rest')} />
                  <TeleportBtn label="🏮 Merchant" onClick={() => teleportTo('/merchant')} />
                  <TeleportBtn label="❓ Event" onClick={() => teleportTo('/event')} />
                  <TeleportBtn label="📊 Summary" onClick={() => teleportTo('/summary')} />
                  <TeleportBtn label="🏠 Main Menu" onClick={() => { navigate('/'); setOpen(false) }} />
                  <TeleportBtn label="👤 Char Select" onClick={() => { navigate('/character-select'); setOpen(false) }} />
                  <TeleportBtn label="✦ Pantheon" onClick={() => { navigate('/pantheon'); setOpen(false) }} />
                  <TeleportBtn label="💀 Graveyard" onClick={() => { navigate('/graveyard'); setOpen(false) }} />
                  <TeleportBtn label="🏆 Leaderboard" onClick={() => { navigate('/leaderboard'); setOpen(false) }} />
                </div>
              </Section>
              <Section title="Quick Start Run">
                <p className="text-[10px] text-gray-500 mb-2">Start a fresh run with a starter deck and jump to the map.</p>
                <div className="flex flex-wrap gap-1.5">
                  <DebugBtn label="Start as Kenji (Floor 1)" onClick={() => {
                    const starterDeck = cards.filter(c => c.rarity === 'common').slice(0, 8).map(c => c.id)
                    store.startRun('japanese', { id: 'kenji', name: 'Kenji' }, 0, starterDeck, 'travelers_compass')
                    navigate('/map')
                    setOpen(false)
                  }} />
                  <DebugBtn label="Start at Floor 3" onClick={() => {
                    const starterDeck = cards.filter(c => c.rarity !== 'rare').slice(0, 12).map(c => c.id)
                    store.startRun('japanese', { id: 'kenji', name: 'Kenji' }, 0, starterDeck, 'travelers_compass')
                    useRunStore.setState({ floor: 3, gold: 200 })
                    navigate('/map')
                    setOpen(false)
                  }} />
                </div>
              </Section>
            </>
          )}

          {/* ═══ RELICS TAB ═══ */}
          {tab === 'relics' && (
            <>
              <Section title="Add Relics">
                <div className="space-y-1">
                  {relics.map(relic => {
                    const equipped = store.relics?.includes(relic.id)
                    return (
                      <div key={relic.id} className="flex items-center justify-between px-2 py-1 rounded bg-gray-900/60 hover:bg-gray-800 group">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm mr-1">{relic.icon}</span>
                          <span className="text-xs font-bold text-white">{relic.name}</span>
                          <span className="text-[10px] text-gray-500 ml-1">— {relic.description?.slice(0, 50)}…</span>
                        </div>
                        {equipped ? (
                          <span className="text-[10px] text-green-400 px-2">✓ Equipped</span>
                        ) : (
                          <button
                            onClick={() => {
                              const s = useRunStore.getState()
                              if (s.relics.length < 5) {
                                useRunStore.setState({ relics: [...s.relics, relic.id] })
                              }
                            }}
                            className="text-[10px] px-2 py-0.5 bg-purple-900/60 border border-purple-700 text-purple-300 rounded hover:bg-purple-800 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                          >+ Equip</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </Section>
              <Section title="Equipped ({store.relics?.length || 0}/5)">
                <div className="flex flex-wrap gap-1">
                  {store.relics?.map(id => {
                    const r = relics.find(rl => rl.id === id)
                    return (
                      <span key={id} className="text-xs px-2 py-0.5 bg-purple-950/40 border border-purple-700 text-purple-300 rounded flex items-center gap-1">
                        {r?.icon} {r?.name || id}
                        <button onClick={() => {
                          useRunStore.setState(s => ({ relics: s.relics.filter(r => r !== id) }))
                        }} className="text-red-400 hover:text-red-300 cursor-pointer ml-1">✕</button>
                      </span>
                    )
                  })}
                  {(!store.relics || store.relics.length === 0) && (
                    <span className="text-xs text-gray-600">No relics equipped</span>
                  )}
                </div>
              </Section>
            </>
          )}

          {/* ═══ MISC TAB ═══ */}
          {tab === 'misc' && (
            <>
              <Section title="Dummy Accounts">
                <div className="flex flex-wrap gap-1.5">
                  <DebugBtn label="Switch to Dummy Teacher" onClick={() => {
                    const acctStore = useAccountStore.getState()
                    const registered = acctStore.register({ username: 'dummy_teacher', password: 'password', displayName: 'Dummy Teacher', accountType: 'teacher', email: 'teacher@dummy.edu' })
                    if (!registered) acctStore.loginUser({ username: 'dummy_teacher', password: 'password' })
                    navigate('/')
                    setOpen(false)
                  }} />
                  <DebugBtn label="Switch to Dummy Student" onClick={() => {
                    const acctStore = useAccountStore.getState()
                    const registered = acctStore.register({ username: 'dummy_student', password: 'password', displayName: 'Dummy Student', accountType: 'student' })
                    if (!registered) acctStore.loginUser({ username: 'dummy_student', password: 'password' })
                    navigate('/')
                    setOpen(false)
                  }} />
                  <DebugBtn label="Realistic Dummy Student" onClick={() => {
                    const acctStore = useAccountStore.getState()
                    const registered = acctStore.register({ username: 'realistic_student', password: 'password', displayName: 'Realistic Student', accountType: 'student' })
                    if (!registered) acctStore.loginUser({ username: 'realistic_student', password: 'password' })
                    
                    useGraveyardStore.setState({
                      entries: {
                        "q_vocab_taberu": { label: "食べる", reading: "taberu", wrongCount: 14, correctStreak: 1, mastered: false, lastSeen: Date.now() - 3600000 },
                        "q_vocab_nomu": { label: "飲む", reading: "nomu", wrongCount: 8, correctStreak: 2, mastered: false, lastSeen: Date.now() - 7200000 },
                        "q_vocab_iku": { label: "行く", reading: "iku", wrongCount: 5, correctStreak: 3, mastered: true, lastSeen: Date.now() - 86400000 },
                        "q_vocab_neko": { label: "猫", reading: "neko", wrongCount: 18, correctStreak: 0, mastered: false, lastSeen: Date.now() - 100000 },
                        "q_vocab_inu": { label: "犬", reading: "inu", wrongCount: 4, correctStreak: 1, mastered: false, lastSeen: Date.now() - 500000 },
                        "q_kanji_mizu": { label: "水", reading: "mizu", wrongCount: 22, correctStreak: 0, mastered: false, lastSeen: Date.now() - 10000 }
                      }
                    })

                    useProgressStore.setState({
                      runsCompleted: 24,
                      runsWon: 3,
                      enemiesDefeated: 185,
                      wordsMastered: 42,
                      campaignsCompleted: ['japanese'],
                      totalPlayTimeMinutes: 425
                    })

                    usePantheonStore.setState({
                      runs: [{
                        id: "run_real_1", date: Date.now() - 86400000 * 2, character: { name: "Kenji", id: "kenji" }, campaign: "japanese", floor: 4, score: 1450, victory: true, deckSize: 15, relics: 3, timeSeconds: 1200
                      }, {
                        id: "run_real_2", date: Date.now() - 86400000 * 5, character: { name: "Sakura", id: "sakura" }, campaign: "japanese", floor: 2, score: 450, victory: false, deckSize: 10, relics: 1, timeSeconds: 600
                      }]
                    })

                    navigate('/')
                    setOpen(false)
                  }} />
                  <DebugBtn label="Log Out Account" color="red" onClick={() => {
                    useAccountStore.getState().logoutUser()
                    navigate('/')
                    setOpen(false)
                  }} />
                </div>
              </Section>
              <Section title="State Management">
                <div className="flex flex-wrap gap-1.5">
                  <DebugBtn label="Clear All Debuffs" onClick={() => useRunStore.setState({ activePlayerDebuffs: [], activeEnemyBuffs: [] })} />
                  <DebugBtn label="Unlock All Cards" onClick={() => useRunStore.setState({ lockedCards: [] })} />
                  <DebugBtn label="Reset Fight Accuracy" onClick={() => useRunStore.setState({ fightCorrect: 0, fightTotal: 0, fightCorrectStreak: 0 })} />
                  <DebugBtn label="End Current Run" color="red" onClick={() => { store.endRun(); navigate('/'); setOpen(false) }} />
                </div>
              </Section>
              <Section title="Potions">
                <div className="flex flex-wrap gap-1.5">
                  {['healing_draught', 'clarity_potion', 'memory_flask', 'echo_tonic', 'auto_correct_serum', 'scholars_blood'].map(id => (
                    <DebugBtn key={id} label={`+ ${id.replace(/_/g, ' ')}`}
                      onClick={() => store.addPotion(id)} />
                  ))}
                  <DebugBtn label="Clear Potions" color="red" onClick={() => useRunStore.setState({ potions: [] })} />
                </div>
              </Section>
              <Section title="Session Storage">
                <div className="flex flex-wrap gap-1.5">
                  <DebugBtn label="Clear active_encounter" onClick={() => sessionStorage.removeItem('active_encounter')} />
                  <DebugBtn label="Clear All Session" color="red" onClick={() => sessionStorage.clear()} />
                </div>
              </Section>
              <Section title="LocalStorage">
                <div className="flex flex-wrap gap-1.5">
                  <DebugBtn label="Export Run State" onClick={() => {
                    const state = useRunStore.getState()
                    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url; a.download = 'debug_run_state.json'; a.click()
                  }} />
                  <DebugBtn label="Clear Run Store" color="red" onClick={() => {
                    localStorage.removeItem('ascendant-active-run')
                    window.location.reload()
                  }} />
                </div>
              </Section>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-1.5 bg-gray-900 border-t border-gray-800 text-[10px] text-gray-600 text-center">
          Debug panel — dev only · Press Esc to close
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Helper Components ──

function Section({ title, children }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1.5">{title}</div>
      {children}
    </div>
  )
}

function StatRow({ label, value, max, onSet }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-xs text-gray-400 w-20">{label}</span>
      <span className="text-xs text-white font-bold w-16">{value}{max != null ? `/${max}` : ''}</span>
      <div className="flex gap-1">
        <button onClick={() => onSet(Math.max(0, value - 10))} className="text-[10px] px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 cursor-pointer">-10</button>
        <button onClick={() => onSet(Math.max(0, value - 1))} className="text-[10px] px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 cursor-pointer">-1</button>
        <button onClick={() => onSet(value + 1)} className="text-[10px] px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 cursor-pointer">+1</button>
        <button onClick={() => onSet(value + 10)} className="text-[10px] px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-gray-300 hover:bg-gray-700 cursor-pointer">+10</button>
      </div>
    </div>
  )
}

function DebugBtn({ label, onClick, color = 'default' }) {
  const colors = {
    default: 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700',
    red: 'bg-red-950/60 border-red-800 text-red-300 hover:bg-red-900/60',
  }
  return (
    <button onClick={onClick} className={`text-[10px] px-2.5 py-1 rounded-lg border cursor-pointer transition-colors ${colors[color]}`}>
      {label}
    </button>
  )
}

function TeleportBtn({ label, onClick }) {
  return (
    <button onClick={onClick}
      className="text-xs px-3 py-2 rounded-lg bg-gray-800 border border-gray-600 text-gray-200 hover:bg-gray-700 hover:border-amber-500 cursor-pointer transition-all text-left"
    >{label}</button>
  )
}
