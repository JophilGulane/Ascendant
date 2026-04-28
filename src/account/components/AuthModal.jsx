// account/components/AuthModal.jsx
// Login / Register modal — Student tab (no email) and Teacher tab (requires email)
// Supports: create account, login, and an "I have a class code" join-class input for students

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAccountStore from '../../stores/accountStore.js'

const TABS = ['student', 'teacher']
const TAB_LABELS = { student: '🎒 Student', teacher: '📚 Teacher' }

function Field({ label, id, type = 'text', value, onChange, placeholder, autoFocus }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} style={{ fontSize: '0.7rem', color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        autoFocus={autoFocus}
        autoComplete="off"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '8px',
          padding: '10px 12px',
          color: '#f3f4f6',
          fontSize: '0.9rem',
          outline: 'none',
          transition: 'border-color 0.2s',
          width: '100%',
          boxSizing: 'border-box',
        }}
        onFocus={e => (e.target.style.borderColor = '#f59e0b')}
        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
      />
    </div>
  )
}

function ErrorBanner({ error }) {
  if (!error) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: 'rgba(239,68,68,0.15)',
        border: '1px solid rgba(239,68,68,0.4)',
        borderRadius: '8px',
        padding: '8px 12px',
        color: '#fca5a5',
        fontSize: '0.8rem',
      }}
    >
      {error}
    </motion.div>
  )
}

export function AuthModal({ onClose }) {
  const { register, loginUser, authError, authLoading, clearAuthError } = useAccountStore()

  const [accountTab, setAccountTab] = useState('student') // 'student' | 'teacher'
  const [mode, setMode]  = useState('login')              // 'login' | 'register'

  // Form state
  const [username, setUsername]       = useState('')
  const [password, setPassword]       = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail]             = useState('')

  const reset = () => {
    setUsername(''); setPassword(''); setDisplayName(''); setEmail('')
    clearAuthError()
  }

  const switchMode = (m) => { reset(); setMode(m) }
  const switchTab  = (t) => { reset(); setAccountTab(t); setMode('login') }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'login') {
      const ok = loginUser({ username, password })
      if (ok) onClose()
    } else {
      const ok = register({
        username,
        password,
        displayName: displayName || undefined,
        accountType: accountTab,
        email: accountTab === 'teacher' ? email : undefined,
      })
      if (ok) onClose()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 24 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #1a1208 0%, #0d0d18 100%)',
          border: '1px solid rgba(245,200,66,0.25)',
          borderRadius: '20px',
          padding: '32px',
          width: '100%',
          maxWidth: '420px',
          boxShadow: '0 0 80px rgba(0,0,0,0.9), 0 0 30px rgba(245,200,66,0.06)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontFamily: "'Cinzel', serif", color: '#F5C842', fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
              {mode === 'login' ? 'Sign In' : 'Create Account'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.75rem', margin: '4px 0 0' }}>Ascendant — Language Roguelike</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, padding: '4px' }}
          >
            ×
          </button>
        </div>

        {/* Account type tabs */}
        <div style={{
          display: 'flex', gap: '4px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '10px', padding: '4px',
          marginBottom: '24px',
        }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              style={{
                flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                background: accountTab === tab ? 'rgba(245,200,66,0.15)' : 'transparent',
                color: accountTab === tab ? '#F5C842' : '#9ca3af',
                fontWeight: accountTab === tab ? 700 : 400,
                fontSize: '0.8rem', cursor: 'pointer',
                transition: 'all 0.2s',
                borderBottom: accountTab === tab ? '2px solid #F5C842' : '2px solid transparent',
              }}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <ErrorBanner error={authError} />

          <Field id="auth-username" label="Username" value={username} onChange={setUsername}
            placeholder="e.g. sakura_tanaka" autoFocus />

          <Field id="auth-password" label="Password" type="password" value={password} onChange={setPassword}
            placeholder="Min. 4 characters" />

          <AnimatePresence>
            {mode === 'register' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '14px' }}
              >
                <Field id="auth-displayname" label="Display Name (optional)" value={displayName}
                  onChange={setDisplayName} placeholder="How you appear to others" />

                {accountTab === 'teacher' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Field id="auth-email" label="Email (required for teachers)" type="email"
                      value={email} onChange={setEmail} placeholder="teacher@school.edu" />
                    <p style={{ color: '#6b7280', fontSize: '0.7rem', marginTop: '6px' }}>
                      📌 Used for account recovery & class management. Never shown on leaderboards.
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={authLoading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              marginTop: '4px',
              padding: '12px',
              borderRadius: '10px',
              border: 'none',
              background: authLoading ? 'rgba(245,200,66,0.3)' : 'linear-gradient(135deg, #F5C842, #e08c00)',
              color: '#1a0e00',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: authLoading ? 'not-allowed' : 'pointer',
              fontFamily: "'Cinzel', serif",
              letterSpacing: '0.05em',
            }}
          >
            {authLoading ? '...' : mode === 'login' ? 'Enter the Ascent' : 'Begin Your Journey'}
          </motion.button>
        </form>

        {/* Mode toggle */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.8rem', color: '#6b7280' }}>
          {mode === 'login' ? (
            <>No account yet?{' '}
              <button onClick={() => switchMode('register')} style={{ background: 'none', border: 'none', color: '#F5C842', cursor: 'pointer', fontWeight: 600 }}>
                Create one
              </button>
            </>
          ) : (
            <>Already have one?{' '}
              <button onClick={() => switchMode('login')} style={{ background: 'none', border: 'none', color: '#F5C842', cursor: 'pointer', fontWeight: 600 }}>
                Sign in
              </button>
            </>
          )}
        </div>

        {/* Guest note */}
        <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.68rem', color: '#4b5563' }}>
          Accounts are optional — play as guest anytime. Progress migrates on first login.
        </p>
      </motion.div>
    </motion.div>
  )
}
