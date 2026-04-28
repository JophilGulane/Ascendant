// components/leaderboard/ClassLeaderboard.jsx
// Student view: shows all classes the student is enrolled in,
// each with its own ranked mini-board.
// Teacher view: all their classes with student count + reset button.

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useAccountStore from '../../stores/accountStore.js'
import {
  getClassBoard,
  getStudentClassCodes,
  resetClassLeaderboard,
  relativeTime,
} from '../../account/leaderboardService.js'
import { LeaderboardRow } from './LeaderboardRow.jsx'

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 0', color: '#4b5563' }}>
      <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📭</div>
      <div style={{ fontSize: '0.85rem' }}>{message}</div>
    </div>
  )
}

// ── Single class board card (student view) ────────────────────────────────────
function ClassCard({ classInfo, currentUsername }) {
  const [expanded, setExpanded] = useState(true)
  const board = getClassBoard(classInfo.code)
  const ranked = board.entries

  const yourEntry = ranked.find(e => e.username === currentUsername)
  const yourRank  = ranked.findIndex(e => e.username === currentUsername) + 1
  const isInTop   = yourRank > 0 && yourRank <= ranked.length

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px',
      overflow: 'hidden',
    }}>
      {/* Card header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 18px', background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.95rem' }}>
            {classInfo.name}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '2px' }}>
            {classInfo.teacherName && `Taught by ${classInfo.teacherName} · `}
            {ranked.length} student{ranked.length !== 1 ? 's' : ''}
            {isInTop && ` · Your rank: #${yourRank}`}
          </div>
        </div>
        <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {/* Rankings */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', padding: '0 12px 14px' }}
          >
            {ranked.length === 0 ? (
              <EmptyState message="No runs recorded yet. Complete a run to appear here!" />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {ranked.map((entry, i) => (
                  <LeaderboardRow
                    key={entry.username}
                    entry={entry}
                    rank={i + 1}
                    isYou={entry.username === currentUsername}
                    showCampaign
                    index={i}
                  />
                ))}
              </div>
            )}

            {/* Archive hint */}
            {board.lastReset && (
              <div style={{ marginTop: '10px', fontSize: '0.68rem', color: '#4b5563', textAlign: 'center' }}>
                Board reset {relativeTime(board.lastReset)} · {board.archivedSeasons.length} past season{board.archivedSeasons.length !== 1 ? 's' : ''} archived
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Teacher class row with reset control ──────────────────────────────────────
function TeacherClassRow({ cls }) {
  const [confirm, setConfirm] = useState(false)
  const [resetDone, setResetDone] = useState(false)
  const board = getClassBoard(cls.code)

  const handleReset = () => {
    resetClassLeaderboard(cls.code)
    setConfirm(false)
    setResetDone(true)
    setTimeout(() => setResetDone(false), 3000)
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '14px',
      padding: '16px 18px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
    }}>
      <div>
        <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.9rem' }}>{cls.name}</div>
        <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '3px' }}>
          Code: <span style={{ fontFamily: 'monospace', letterSpacing: '0.12em', color: '#F5C842' }}>{cls.code}</span>
          {' · '}{cls.studentUsernames?.length || 0} student{(cls.studentUsernames?.length || 0) !== 1 ? 's' : ''}
          {' · '}{board.entries.length} run{board.entries.length !== 1 ? 's' : ''} logged
          {board.archivedSeasons.length > 0 && ` · ${board.archivedSeasons.length} past seasons`}
        </div>
      </div>
      {/* Reset control */}
      <div style={{ flexShrink: 0 }}>
        {resetDone ? (
          <span style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>✓ Reset done</span>
        ) : !confirm ? (
          <button
            onClick={() => setConfirm(true)}
            style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: '8px', color: '#fca5a5', fontSize: '0.72rem',
              padding: '6px 12px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            🔄 Reset Board
          </button>
        ) : (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', color: '#fca5a5' }}>Archive & reset?</span>
            <button onClick={handleReset} style={{
              background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)',
              borderRadius: '7px', color: '#fca5a5', fontSize: '0.7rem', cursor: 'pointer', padding: '4px 10px',
            }}>Yes</button>
            <button onClick={() => setConfirm(false)} style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '7px', color: '#9ca3af', fontSize: '0.7rem', cursor: 'pointer', padding: '4px 10px',
            }}>No</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export function ClassLeaderboard() {
  const { session, profile } = useAccountStore()
  const isTeacher = session?.accountType === 'teacher'
  const username  = session?.username

  // Student: look up enrolled classes
  const [studentClasses, setStudentClasses] = useState([])
  useEffect(() => {
    if (!isTeacher && username) {
      setStudentClasses(getStudentClassCodes(username))
    }
  }, [isTeacher, username])

  // ── Teacher view ─────────────────────────────────────────────────────────
  if (isTeacher) {
    const classes = profile?.classes || []
    return (
      <div>
        <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '14px' }}>
          Your Classes
        </div>
        {classes.length === 0 ? (
          <EmptyState message="No classes yet. Create one from your Account Dashboard." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {classes.map(cls => <TeacherClassRow key={cls.id} cls={cls} />)}
          </div>
        )}
      </div>
    )
  }

  // ── Student view ─────────────────────────────────────────────────────────
  if (studentClasses.length === 0) {
    return (
      <EmptyState message="You haven't joined any classes yet. Ask your teacher for a 6-letter class code, then enter it in your Account menu." />
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {studentClasses.map(cls => (
        <ClassCard key={cls.code} classInfo={cls} currentUsername={username} />
      ))}
      <div style={{ fontSize: '0.68rem', color: '#4b5563', textAlign: 'center', marginTop: '4px' }}>
        You can join up to 3 classes. Updates after each run.
      </div>
    </div>
  )
}
