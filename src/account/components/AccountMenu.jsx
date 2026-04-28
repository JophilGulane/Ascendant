// account/components/AccountMenu.jsx
// Profile drawer for logged-in users.
// Students see: name edit, class join, logout.
// Teachers see: name edit, class management button, logout.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAccountStore from '../../stores/accountStore.js'
import { TeacherDashboard } from './TeacherDashboard.jsx'

function SectionHeader({ children }) {
  return (
    <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
      {children}
    </div>
  )
}

function ActionBtn({ onClick, danger, children, disabled }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      style={{
        width: '100%', padding: '10px 14px',
        background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.06)',
        border: danger ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.12)',
        borderRadius: '10px',
        color: danger ? '#fca5a5' : '#d1d5db',
        fontSize: '0.82rem', fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </motion.button>
  )
}

export function AccountMenu({ onClose }) {
  const { session, profile, isLoggedIn, logoutUser, updateName, joinClassByCode } = useAccountStore()
  const isTeacher = session?.accountType === 'teacher'

  const [nameEdit, setNameEdit]     = useState(profile?.displayName || '')
  const [nameSaved, setNameSaved]   = useState(false)
  const [classCode, setClassCode]   = useState('')
  const [classMsg, setClassMsg]     = useState(null)
  const [showTeacher, setShowTeacher] = useState(false)

  if (!isLoggedIn) return null

  const handleSaveName = () => {
    if (updateName(nameEdit)) setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  const handleJoinClass = () => {
    if (!classCode.trim()) return
    const result = useAccountStore.getState().joinClassByCode(classCode)
    if (result.ok) setClassMsg(`✓ Joined "${result.className}" — taught by ${result.teacherName}`)
    else setClassMsg(`✗ ${result.error}`)
    setClassCode('')
    setTimeout(() => setClassMsg(null), 4000)
  }

  const handleLogout = () => {
    logoutUser()
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 20 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #1a1208, #0d0d18)',
          border: isTeacher ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(245,200,66,0.2)',
          borderRadius: '20px',
          padding: '28px',
          width: '100%',
          maxWidth: '380px',
          boxShadow: '0 0 80px rgba(0,0,0,0.9)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontFamily: "'Cinzel', serif", color: '#F5C842', fontSize: '1.1rem', margin: 0 }}>
                {profile?.displayName || profile?.username}
              </h2>
              {isTeacher && (
                <span style={{
                  background: 'rgba(168,85,247,0.2)', border: '1px solid rgba(168,85,247,0.5)',
                  color: '#c084fc', fontSize: '0.6rem', padding: '2px 7px',
                  borderRadius: '5px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                }}>Teacher</span>
              )}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '2px' }}>@{profile?.username}</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '1.3rem', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Display name edit */}
          <div>
            <SectionHeader>Display Name</SectionHeader>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={nameEdit}
                onChange={e => setNameEdit(e.target.value)}
                placeholder="Optional display name"
                style={{
                  flex: 1, background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                  padding: '8px 12px', color: '#f3f4f6', fontSize: '0.85rem', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#F5C842'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
              />
              <motion.button
                onClick={handleSaveName}
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                style={{
                  padding: '8px 14px', borderRadius: '8px', border: 'none',
                  background: nameSaved ? 'rgba(16,185,129,0.3)' : 'rgba(245,200,66,0.2)',
                  color: nameSaved ? '#6ee7b7' : '#F5C842',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                {nameSaved ? '✓' : 'Save'}
              </motion.button>
            </div>
          </div>

          {/* Student: join a class */}
          {!isTeacher && (
            <div>
              <SectionHeader>Join a Class</SectionHeader>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={classCode}
                  onChange={e => setClassCode(e.target.value.toUpperCase())}
                  placeholder="6-letter class code"
                  maxLength={6}
                  style={{
                    flex: 1, background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                    padding: '8px 12px', color: '#f3f4f6', fontSize: '0.85rem',
                    outline: 'none', letterSpacing: '0.15em', fontFamily: 'monospace',
                  }}
                  onFocus={e => e.target.style.borderColor = '#F5C842'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
                  onKeyDown={e => e.key === 'Enter' && handleJoinClass()}
                />
                <motion.button
                  onClick={handleJoinClass}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  style={{
                    padding: '8px 14px', borderRadius: '8px', border: 'none',
                    background: 'rgba(245,200,66,0.2)', color: '#F5C842',
                    fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  Join
                </motion.button>
              </div>
              <AnimatePresence>
                {classMsg && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    style={{
                      marginTop: '6px', fontSize: '0.72rem',
                      color: classMsg.startsWith('✓') ? '#6ee7b7' : '#fca5a5',
                    }}
                  >
                    {classMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Teacher: manage classes */}
          {isTeacher && (
            <div>
              <SectionHeader>Teacher Tools</SectionHeader>
              <ActionBtn onClick={() => setShowTeacher(true)}>
                📋 Manage Classes
              </ActionBtn>
            </div>
          )}

          {/* Logout */}
          <ActionBtn danger onClick={handleLogout}>
            🚪 Sign Out
          </ActionBtn>
        </div>
      </motion.div>

      {/* Teacher dashboard */}
      <AnimatePresence>
        {showTeacher && <TeacherDashboard onClose={() => setShowTeacher(false)} />}
      </AnimatePresence>
    </motion.div>
  )
}
