// account/components/TeacherDashboard.jsx
// Teacher-only class management: create class, copy join code, see enrolled students, delete class.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAccountStore from '../../stores/accountStore.js'

function ClassCard({ cls, onDelete }) {
  const [copied, setCopied] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const copyCode = () => {
    navigator.clipboard.writeText(cls.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '14px',
        padding: '16px',
      }}
    >
      {/* Class name + delete */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.95rem' }}>{cls.name}</div>
          <div style={{ color: '#6b7280', fontSize: '0.68rem', marginTop: '2px' }}>
            {cls.studentUsernames.length} student{cls.studentUsernames.length !== 1 ? 's' : ''} enrolled
          </div>
        </div>
        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '0.75rem', cursor: 'pointer' }}
          >
            🗑 Delete
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ color: '#fca5a5', fontSize: '0.7rem' }}>Sure?</span>
            <button onClick={onDelete}
              style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '6px', color: '#fca5a5', fontSize: '0.7rem', cursor: 'pointer', padding: '2px 8px' }}>
              Yes
            </button>
            <button onClick={() => setConfirmDelete(false)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#9ca3af', fontSize: '0.7rem', cursor: 'pointer', padding: '2px 8px' }}>
              No
            </button>
          </div>
        )}
      </div>

      {/* Join code */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, letterSpacing: '0.2em',
          color: '#F5C842', background: 'rgba(245,200,66,0.1)',
          border: '1px solid rgba(245,200,66,0.25)', borderRadius: '8px',
          padding: '6px 14px', flexShrink: 0,
        }}>
          {cls.code}
        </div>
        <motion.button
          onClick={copyCode}
          whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
          style={{
            background: copied ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.07)',
            border: copied ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px',
            color: copied ? '#6ee7b7' : '#d1d5db',
            fontSize: '0.75rem', cursor: 'pointer', padding: '6px 12px',
            transition: 'all 0.2s',
          }}
        >
          {copied ? '✓ Copied!' : '📋 Copy Code'}
        </motion.button>
      </div>

      {/* Student list (collapsible if > 0) */}
      {cls.studentUsernames.length > 0 && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
            Enrolled Students
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {cls.studentUsernames.map(u => (
              <span key={u} style={{
                background: 'rgba(255,255,255,0.06)', borderRadius: '6px',
                padding: '2px 8px', fontSize: '0.72rem', color: '#9ca3af',
              }}>
                {u}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  )
}

export function TeacherDashboard({ onClose }) {
  const { session, profile, createNewClass, deleteExistingClass } = useAccountStore()
  const [newClassName, setNewClassName] = useState('')
  const [createError, setCreateError]   = useState(null)
  const [createSuccess, setCreateSuccess] = useState(null)

  const classes = profile?.classes || []

  const handleCreate = () => {
    setCreateError(null); setCreateSuccess(null)
    const result = createNewClass(newClassName)
    if (!result.ok) { setCreateError(result.error); return }
    setCreateSuccess(`Class "${result.class.name}" created! Code: ${result.class.code}`)
    setNewClassName('')
    setTimeout(() => setCreateSuccess(null), 5000)
  }

  const handleDelete = (classId) => {
    deleteExistingClass(classId)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0, zIndex: 110,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.93, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 24 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #130b1a, #0d0d18)',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: '22px',
          padding: '32px',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 0 80px rgba(0,0,0,0.95), 0 0 30px rgba(168,85,247,0.08)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontFamily: "'Cinzel', serif", color: '#c084fc', fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
              Teacher Dashboard
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.72rem', margin: '4px 0 0' }}>
              @{session?.username} · {classes.length} class{classes.length !== 1 ? 'es' : ''}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '1.4rem', cursor: 'pointer' }}>×</button>
        </div>

        {/* Create new class */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
            Create New Class
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={newClassName}
              onChange={e => setNewClassName(e.target.value)}
              placeholder="e.g. Period 3 Japanese"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              style={{
                flex: 1, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px',
                padding: '10px 14px', color: '#f3f4f6', fontSize: '0.88rem', outline: 'none',
              }}
              onFocus={e => e.target.style.borderColor = '#a855f7'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
            />
            <motion.button
              onClick={handleCreate}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              style={{
                padding: '10px 18px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              }}
            >
              + Create
            </motion.button>
          </div>
          <AnimatePresence>
            {createError && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ color: '#fca5a5', fontSize: '0.72rem', marginTop: '6px' }}>
                {createError}
              </motion.p>
            )}
            {createSuccess && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ color: '#6ee7b7', fontSize: '0.72rem', marginTop: '6px' }}>
                {createSuccess}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Class list */}
        <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
          Your Classes
        </div>
        {classes.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#4b5563', padding: '40px 0', fontSize: '0.85rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
            No classes yet. Create one above and share the code with your students!
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {classes.map(cls => (
                <ClassCard key={cls.id} cls={cls} onDelete={() => handleDelete(cls.id)} />
              ))}
            </div>
          </AnimatePresence>
        )}
      </motion.div>
    </motion.div>
  )
}
