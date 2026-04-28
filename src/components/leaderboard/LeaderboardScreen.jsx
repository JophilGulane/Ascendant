// components/leaderboard/LeaderboardScreen.jsx
// Full-screen leaderboard — two tabs: My Classes | Global
// Accessible via /leaderboard route and 🏆 icon on main menu.
// Must be logged in to see class boards; Global is open to all logged-in users.

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'
import useAccountStore from '../../stores/accountStore.js'
import { ClassLeaderboard } from './ClassLeaderboard.jsx'
import { GlobalLeaderboard } from './GlobalLeaderboard.jsx'

const TABS = [
  { id: 'classes', label: '🏫 My Classes' },
  { id: 'global',  label: '🌐 Global'     },
]

function TabBtn({ tab, active, onClick }) {
  return (
    <button
      onClick={() => onClick(tab.id)}
      style={{
        padding: '10px 24px',
        borderRadius: '10px',
        border: 'none',
        background: active ? 'rgba(245,200,66,0.12)' : 'transparent',
        color: active ? '#F5C842' : '#6b7280',
        fontWeight: active ? 700 : 400,
        fontSize: '0.88rem',
        cursor: 'pointer',
        fontFamily: "'Cinzel', serif",
        letterSpacing: '0.03em',
        borderBottom: active ? '2px solid #F5C842' : '2px solid transparent',
        transition: 'all 0.2s',
      }}
    >
      {tab.label}
    </button>
  )
}

function GuestGate({ onClose }) {
  return (
    <div style={{
      textAlign: 'center', padding: '80px 24px', color: '#6b7280',
    }}>
      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔐</div>
      <h2 style={{ color: '#f3f4f6', fontFamily: "'Cinzel', serif", marginBottom: '12px', fontSize: '1.1rem' }}>
        Account Required
      </h2>
      <p style={{ fontSize: '0.85rem', maxWidth: '340px', margin: '0 auto 24px' }}>
        Sign in or create a free account to access leaderboards. Accounts are optional for solo play.
      </p>
      <motion.button
        onClick={onClose}
        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
        style={{
          padding: '12px 28px', borderRadius: '12px', border: 'none',
          background: 'linear-gradient(135deg, #b45309, #F5C842)',
          color: '#1a0e00', fontWeight: 700, fontSize: '0.9rem',
          fontFamily: "'Cinzel', serif", cursor: 'pointer',
        }}
      >
        Back to Menu
      </motion.button>
    </div>
  )
}

export function LeaderboardScreen() {
  const navigate   = useNavigate()
  const { isLoggedIn, session } = useAccountStore()
  const isTeacher  = session?.accountType === 'teacher'
  const [tab, setTab] = useState('classes')

  return (
    <ScreenTransition>
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #08070f 0%, #0d0d0d 100%)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
      }}>
        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 28px 0',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          paddingBottom: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '14px' }}>
            <h1 style={{
              fontFamily: "'Cinzel', serif", color: '#F5C842',
              fontSize: '1.5rem', fontWeight: 700, margin: 0,
            }}>
              🏆 Leaderboards
            </h1>
            {isTeacher && (
              <span style={{
                fontSize: '0.6rem', color: '#c084fc',
                background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)',
                borderRadius: '5px', padding: '2px 8px', fontWeight: 700, letterSpacing: '0.08em',
              }}>
                TEACHER VIEW
              </span>
            )}
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px', color: '#9ca3af', padding: '8px 16px',
              fontSize: '0.8rem', cursor: 'pointer',
              fontFamily: "'Cinzel', serif",
            }}
          >
            ← Menu
          </button>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: '4px', padding: '12px 28px 0',
        }}>
          {TABS.map(t => (
            <TabBtn key={t.id} tab={t} active={tab === t.id} onClick={setTab} />
          ))}
        </div>

        {/* ── Body ─────────────────────────────────────────────────────── */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '24px 28px',
          maxWidth: '760px', width: '100%', margin: '0 auto',
        }}>
          {!isLoggedIn ? (
            <GuestGate onClose={() => navigate('/')} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >
                {tab === 'classes' ? <ClassLeaderboard /> : <GlobalLeaderboard />}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>
    </ScreenTransition>
  )
}
