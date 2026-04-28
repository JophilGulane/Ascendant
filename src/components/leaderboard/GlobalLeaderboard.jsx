// components/leaderboard/GlobalLeaderboard.jsx
// Three campaign tabs (Japanese / Korean / Spanish).
// Top-100 by floor DESC → mastery DESC → totalCorrect DESC.
// Your position shown below the list even if outside top 100.

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAccountStore from '../../stores/accountStore.js'
import { getGlobalBoard } from '../../account/leaderboardService.js'
import { LeaderboardRow, YourPositionRow } from './LeaderboardRow.jsx'

const CAMPAIGN_TABS = [
  { id: 'japanese', label: '🗾 Japanese', accent: '#fca5a5' },
  { id: 'korean',   label: '🌆 Korean',   accent: '#93c5fd' },
  { id: 'spanish',  label: '🌎 Spanish',  accent: '#fde047' },
]

function EmptyGlobal({ campaign }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px 0', color: '#4b5563' }}>
      <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🏔️</div>
      <div style={{ fontSize: '0.9rem' }}>No runs recorded for {campaign} yet.</div>
      <div style={{ fontSize: '0.75rem', marginTop: '6px' }}>
        Complete a run to claim the first spot!
      </div>
    </div>
  )
}

export function GlobalLeaderboard() {
  const { session, profile } = useAccountStore()
  const [activeTab, setActiveTab] = useState('japanese')
  const username  = session?.username

  // Read board for active campaign (memo = don't re-sort every render)
  const board = useMemo(() => getGlobalBoard(activeTab), [activeTab])

  // Find logged-in user's position
  const yourIndex = username ? board.findIndex(e => e.username === username) : -1
  const yourRank  = yourIndex >= 0 ? yourIndex + 1 : null
  const yourEntry = yourIndex >= 0 ? board[yourIndex] : null
  // If outside top-100, still display position (board has max 100 entries)
  // For demo purposes we show position within the full stored board
  const isOutsideTop100 = yourRank && yourRank > 100

  const visible = board.slice(0, 100)
  const tab = CAMPAIGN_TABS.find(t => t.id === activeTab)

  return (
    <div>
      {/* Campaign tabs */}
      <div style={{
        display: 'flex', gap: '4px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '12px', padding: '4px',
        marginBottom: '24px',
      }}>
        {CAMPAIGN_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: 1, padding: '9px 4px', borderRadius: '9px', border: 'none',
              background: activeTab === t.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              color: activeTab === t.id ? t.accent : '#6b7280',
              fontWeight: activeTab === t.id ? 700 : 400,
              fontSize: '0.78rem', cursor: 'pointer',
              transition: 'all 0.2s',
              borderBottom: activeTab === t.id ? `2px solid ${t.accent}` : '2px solid transparent',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Board */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {visible.length === 0 ? (
            <EmptyGlobal campaign={tab?.label} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {/* Header row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '36px 1fr auto auto',
                gap: '10px',
                padding: '4px 14px 8px',
                fontSize: '0.6rem', color: '#6b7280',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                marginBottom: '4px',
              }}>
                <span>Rank</span>
                <span>Player</span>
                <span style={{ textAlign: 'right' }}>Floor · Mastery</span>
              </div>

              {visible.map((entry, i) => (
                <LeaderboardRow
                  key={entry.username}
                  entry={entry}
                  rank={i + 1}
                  isYou={entry.username === username}
                  showMastery
                  index={i}
                />
              ))}
            </div>
          )}

          {/* Your position if outside visible list */}
          {username && !isOutsideTop100 && !yourEntry && visible.length > 0 && (
            <div style={{
              marginTop: '16px', padding: '12px 14px',
              background: 'rgba(245,200,66,0.05)',
              border: '1px solid rgba(245,200,66,0.15)',
              borderRadius: '10px',
              fontSize: '0.78rem', color: '#9ca3af',
              textAlign: 'center',
            }}>
              You haven't completed a {activeTab} run yet. Your rank will appear here after your first run.
            </div>
          )}

          {isOutsideTop100 && yourEntry && (
            <YourPositionRow rank={yourRank} entry={yourEntry} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Privacy notice */}
      <div style={{ marginTop: '20px', fontSize: '0.65rem', color: '#374151', textAlign: 'center' }}>
        🔒 Global boards show username and campaign stats only — no class affiliation or personal details.
      </div>
    </div>
  )
}
