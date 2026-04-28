// account/leaderboardService.js
// Pure service — no React. Manages all leaderboard read/write against localStorage.
//
// Storage key: lq_leaderboard_v1
// Shape:
//   {
//     global: {
//       japanese: LeaderboardEntry[],
//       korean:   LeaderboardEntry[],
//       spanish:  LeaderboardEntry[],
//     },
//     classes: {
//       [classCode]: {
//         entries:         LeaderboardEntry[],
//         archivedSeasons: ArchivedSeason[],
//         lastReset:       number | null,
//       }
//     }
//   }
//
// LeaderboardEntry:
//   { username, displayName, campaign, floorReached, masteryLevel,
//     totalFloors, totalCorrect, lastActive }
//
// ArchivedSeason: { resetAt, entries: LeaderboardEntry[] }

import { ACCOUNT_KEYS } from './accountService.js'

const LB_KEY = 'lq_leaderboard_v1'
export const CAMPAIGNS = ['japanese', 'korean', 'spanish']

// ── DB helpers ────────────────────────────────────────────────────────────────
function readLb() {
  try {
    const raw = localStorage.getItem(LB_KEY)
    if (!raw) return defaultDb()
    return JSON.parse(raw)
  } catch { return defaultDb() }
}

function writeLb(db) {
  try { localStorage.setItem(LB_KEY, JSON.stringify(db)) } catch {}
}

function defaultDb() {
  return {
    global: { japanese: [], korean: [], spanish: [] },
    classes: {},
  }
}

function ensureClass(db, classCode) {
  const key = classCode.toUpperCase()
  if (!db.classes[key]) {
    db.classes[key] = { entries: [], archivedSeasons: [], lastReset: null }
  }
  return db.classes[key]
}

// ── Ranking helpers ───────────────────────────────────────────────────────────
// Global rank: floor DESC → masteryLevel DESC → totalCorrect DESC
export function rankGlobal(entries) {
  return [...entries].sort((a, b) => {
    if (b.floorReached !== a.floorReached) return b.floorReached - a.floorReached
    if (b.masteryLevel !== a.masteryLevel) return b.masteryLevel - a.masteryLevel
    return (b.totalCorrect || 0) - (a.totalCorrect || 0)
  })
}

// Class rank: floor DESC → totalFloors DESC (tie = more runs at that floor)
export function rankClass(entries) {
  return [...entries].sort((a, b) => {
    if (b.floorReached !== a.floorReached) return b.floorReached - a.floorReached
    return (b.totalFloors || 0) - (a.totalFloors || 0)
  })
}

// ── Submit run stats ──────────────────────────────────────────────────────────
// Called from PostRunSummary after each run completes.
// Updates both the global board (for this campaign) and all class boards
// the student belongs to.
export function submitRunStats({
  username,
  displayName,
  campaign,
  floorReached,
  masteryLevel,
  totalFloors,     // floors cleared in THIS run (= floor - 1 on death, floor on win)
  totalCorrect,
  classCodes = [], // class codes this student is enrolled in
}) {
  if (!username || !campaign) return

  const db = readLb()

  const entry = {
    username,
    displayName: displayName || username,
    campaign,
    floorReached,
    masteryLevel: masteryLevel || 0,
    totalFloors:  totalFloors  || 0,
    totalCorrect: totalCorrect || 0,
    lastActive: Date.now(),
  }

  // ── Update global board ──────────────────────────────────────────────────
  const globalBoard = db.global[campaign] || []
  const existingGlobal = globalBoard.find(e => e.username === username)
  if (!existingGlobal) {
    db.global[campaign] = [...globalBoard, entry]
  } else {
    // Keep best floor; accumulate totalFloors and totalCorrect across runs
    const updatedGlobal = {
      ...existingGlobal,
      displayName:  entry.displayName,
      floorReached: Math.max(existingGlobal.floorReached || 0, floorReached),
      masteryLevel: Math.max(existingGlobal.masteryLevel || 0, masteryLevel || 0),
      totalFloors:  (existingGlobal.totalFloors || 0) + (totalFloors || 0),
      totalCorrect: (existingGlobal.totalCorrect || 0) + (totalCorrect || 0),
      lastActive:   Date.now(),
    }
    db.global[campaign] = globalBoard.map(e =>
      e.username === username ? updatedGlobal : e
    )
  }

  // ── Update each class board ──────────────────────────────────────────────
  for (const code of classCodes) {
    const cls = ensureClass(db, code)
    const existing = cls.entries.find(e => e.username === username)
    if (!existing) {
      cls.entries.push(entry)
    } else {
      const updated = {
        ...existing,
        displayName:  entry.displayName,
        campaign,                                   // most-recent campaign shown
        floorReached: Math.max(existing.floorReached || 0, floorReached),
        totalFloors:  (existing.totalFloors || 0) + (totalFloors || 0),
        totalCorrect: (existing.totalCorrect || 0) + (totalCorrect || 0),
        masteryLevel: Math.max(existing.masteryLevel || 0, masteryLevel || 0),
        lastActive:   Date.now(),
      }
      cls.entries = cls.entries.map(e => e.username === username ? updated : e)
    }
  }

  writeLb(db)
}

// ── Read boards ────────────────────────────────────────────────────────────────
export function getGlobalBoard(campaign) {
  const db = readLb()
  const entries = db.global[campaign] || []
  return rankGlobal(entries).slice(0, 100)
}

export function getClassBoard(classCode) {
  const db = readLb()
  const cls = db.classes[classCode?.toUpperCase()]
  if (!cls) return { entries: [], archivedSeasons: [], lastReset: null }
  return {
    entries: rankClass(cls.entries),
    archivedSeasons: cls.archivedSeasons || [],
    lastReset: cls.lastReset || null,
  }
}

// ── Teacher: reset class leaderboard ─────────────────────────────────────────
export function resetClassLeaderboard(classCode) {
  const db = readLb()
  const key = classCode.toUpperCase()
  const cls = ensureClass(db, key)

  // Archive current season before clearing
  if (cls.entries.length > 0) {
    cls.archivedSeasons = [
      ...(cls.archivedSeasons || []),
      { resetAt: Date.now(), entries: rankClass(cls.entries) },
    ]
  }
  cls.entries = []
  cls.lastReset = Date.now()

  writeLb(db)
  return { ok: true }
}

// ── Get all class codes a student is enrolled in ──────────────────────────────
// Looks through the accounts DB to find classes where username appears in studentUsernames.
export function getStudentClassCodes(username) {
  try {
    const db = JSON.parse(localStorage.getItem(ACCOUNT_KEYS.ACCOUNTS_DB) || '{}')
    const codes = []
    for (const record of Object.values(db)) {
      if (record.accountType !== 'teacher') continue
      for (const cls of record.classes || []) {
        if (cls.studentUsernames?.includes(username)) {
          codes.push({ code: cls.code, name: cls.name, teacherName: record.displayName || record.username })
        }
      }
    }
    return codes
  } catch { return [] }
}

// ── Relative time label ────────────────────────────────────────────────────────
export function relativeTime(ts) {
  if (!ts) return '—'
  const diff = Date.now() - ts
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins < 2)    return 'Just now'
  if (mins < 60)   return `${mins}m ago`
  if (hours < 24)  return `${hours}h ago`
  if (days === 1)  return 'Yesterday'
  if (days < 7)    return `${days} days ago`
  return new Date(ts).toLocaleDateString()
}
