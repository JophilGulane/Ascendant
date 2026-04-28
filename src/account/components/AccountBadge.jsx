// account/components/AccountBadge.jsx
// Top-left HUD badge. Shows login prompt for guests, username + type badge for logged-in users.
// Teacher badge is visible only to the teacher — never on leaderboards.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAccountStore from '../../stores/accountStore.js'
import { AuthModal } from './AuthModal.jsx'
import { AccountMenu } from './AccountMenu.jsx'

export function AccountBadge() {
  const { isLoggedIn, session, profile, migrationDone, clearMigrationFlag } = useAccountStore()
  const [showAuth, setShowAuth]   = useState(false)
  const [showMenu, setShowMenu]   = useState(false)

  const isTeacher = session?.accountType === 'teacher'
  const name = profile?.displayName || profile?.username || 'Player'

  const handleBadgeClick = () => {
    if (isLoggedIn) setShowMenu(true)
    else setShowAuth(true)
  }

  return (
    <>
      {/* Badge */}
      <motion.button
        id="account-badge"
        onClick={handleBadgeClick}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        style={{
          position: 'absolute', top: '16px', left: '16px', zIndex: 20,
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'rgba(0,0,0,0.5)',
          border: isLoggedIn
            ? isTeacher ? '1px solid rgba(168,85,247,0.5)' : '1px solid rgba(245,200,66,0.3)'
            : '1px solid rgba(255,255,255,0.12)',
          borderRadius: '10px',
          padding: '8px 14px 8px 10px',
          cursor: 'pointer',
          backdropFilter: 'blur(8px)',
          boxShadow: isLoggedIn ? '0 4px 20px rgba(0,0,0,0.4)' : 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
        }}
      >
        {/* Avatar circle */}
        <div style={{
          width: '30px', height: '30px',
          borderRadius: '50%',
          background: isLoggedIn
            ? isTeacher
              ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
              : 'linear-gradient(135deg, #b45309, #F5C842)'
            : 'rgba(75,85,99,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.8rem', fontWeight: 700, color: '#fff',
          flexShrink: 0,
        }}>
          {isLoggedIn ? name[0].toUpperCase() : '?'}
        </div>

        {/* Text */}
        <div style={{ textAlign: 'left' }}>
          <div style={{
            fontSize: '0.78rem', fontWeight: 700,
            color: isLoggedIn ? '#f3f4f6' : '#9ca3af',
            lineHeight: 1.2,
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            {isLoggedIn ? name : 'Guest'}
            {/* Teacher badge — private, not on leaderboard */}
            {isLoggedIn && isTeacher && (
              <span style={{
                background: 'rgba(168,85,247,0.2)',
                border: '1px solid rgba(168,85,247,0.5)',
                color: '#c084fc',
                fontSize: '0.55rem',
                padding: '1px 5px',
                borderRadius: '4px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                Teacher
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.6rem', color: isLoggedIn ? '#F5C842' : '#6b7280', marginTop: '1px' }}>
            {isLoggedIn ? 'click to manage' : 'click to sign in'}
          </div>
        </div>
      </motion.button>

      {/* Migration toast */}
      <AnimatePresence>
        {migrationDone && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            style={{
              position: 'absolute', top: '72px', left: '16px', zIndex: 25,
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.4)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: '#6ee7b7',
              fontSize: '0.75rem',
              maxWidth: '260px',
              backdropFilter: 'blur(6px)',
            }}
          >
            ✓ Guest progress migrated to your account!
            <button
              onClick={clearMigrationFlag}
              style={{ background: 'none', border: 'none', color: '#6ee7b7', cursor: 'pointer', marginLeft: '8px', fontWeight: 700 }}
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {showMenu && <AccountMenu onClose={() => setShowMenu(false)} />}
      </AnimatePresence>
    </>
  )
}
