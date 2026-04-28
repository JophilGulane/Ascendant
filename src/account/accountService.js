// account/accountService.js
// Pure service layer — no React. Handles all account CRUD, auth, and data migration.
// Storage layout:
//   lq_accounts           : { [username]: AccountRecord }
//   lq_session            : { username, accountType } | null
//   lq_graveyard          : per-user key = lq_graveyard_u_<username>
//   lq_progress           : per-user key = lq_progress_u_<username>
//   lq_pantheon           : per-user key = lq_pantheon_u_<username>
//   lq_active_run         : per-user key = lq_active_run_u_<username>

export const ACCOUNT_KEYS = {
  ACCOUNTS_DB:  'lq_accounts_v1',
  SESSION:      'lq_session_v1',
  // Guest legacy keys (zustand persist defaults)
  GUEST_GRAVEYARD: 'lq_graveyard',
  GUEST_PROGRESS:  'lq_progress',
  GUEST_PANTHEON:  'ascendant_pantheon_v1',
  GUEST_RUN:       'lq_active_run',
}

// ─── Tiny hash (no crypto API needed for client-side low-stakes auth) ─────────
// FNV-1a 32-bit, salted with username. Good enough for local classroom use.
function fnv1a(str) {
  let hash = 2166136261
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = (hash * 16777619) >>> 0
  }
  return hash.toString(16)
}

export function hashPassword(username, password) {
  // salt = username + fixed app salt so same password ≠ same hash across accounts
  return fnv1a(`ASCENDANT::${username.toLowerCase()}::${password}`)
}

// ─── DB helpers ───────────────────────────────────────────────────────────────
function readDb() {
  try { return JSON.parse(localStorage.getItem(ACCOUNT_KEYS.ACCOUNTS_DB) || '{}') } catch { return {} }
}
function writeDb(db) {
  try { localStorage.setItem(ACCOUNT_KEYS.ACCOUNTS_DB, JSON.stringify(db)) } catch {}
}

// ─── Session helpers ──────────────────────────────────────────────────────────
export function readSession() {
  try { return JSON.parse(localStorage.getItem(ACCOUNT_KEYS.SESSION) || 'null') } catch { return null }
}
function writeSession(session) {
  try {
    if (session) localStorage.setItem(ACCOUNT_KEYS.SESSION, JSON.stringify(session))
    else localStorage.removeItem(ACCOUNT_KEYS.SESSION)
  } catch {}
}

// ─── Per-user storage keys ────────────────────────────────────────────────────
export function userKey(baseKey, username) {
  return `${baseKey}_u_${username.toLowerCase()}`
}

// ─── Migration: copy guest data into a freshly created/logged-in account ──────
function migrateGuestData(username) {
  const keys = [
    [ACCOUNT_KEYS.GUEST_GRAVEYARD, 'lq_graveyard'],
    [ACCOUNT_KEYS.GUEST_PROGRESS,  'lq_progress'],
    [ACCOUNT_KEYS.GUEST_PANTHEON,  'ascendant_pantheon_v1'],
    [ACCOUNT_KEYS.GUEST_RUN,       'lq_active_run'],
  ]
  let migrated = false
  for (const [guestKey, baseKey] of keys) {
    const raw = localStorage.getItem(guestKey)
    if (!raw) continue
    const destKey = userKey(baseKey, username)
    // Only migrate if account slot is empty (don't overwrite existing account data)
    if (!localStorage.getItem(destKey)) {
      try { localStorage.setItem(destKey, raw) } catch {}
      migrated = true
    }
  }
  return migrated
}

// ─── Account record shape ─────────────────────────────────────────────────────
// {
//   username:    string (lowercase)
//   displayName: string | null
//   passwordHash:string
//   accountType: 'student' | 'teacher'
//   email:       string | null          (required for teacher)
//   classes:     Class[]               (teacher only)
//   createdAt:   number
// }
// Class: { id, name, code, studentUsernames: string[], createdAt }

// ─── CREATE ACCOUNT ───────────────────────────────────────────────────────────
export function createAccount({ username, password, displayName, accountType, email }) {
  if (!username || username.length < 3) return { ok: false, error: 'Username must be at least 3 characters.' }
  if (!password || password.length < 4) return { ok: false, error: 'Password must be at least 4 characters.' }
  if (accountType === 'teacher' && !email) return { ok: false, error: 'Email is required for teacher accounts.' }
  if (accountType === 'teacher' && !isValidEmail(email)) return { ok: false, error: 'Please enter a valid email.' }

  const key = username.toLowerCase().trim()
  if (!/^[a-z0-9_]+$/.test(key)) return { ok: false, error: 'Username: letters, numbers, underscores only.' }

  const db = readDb()
  if (db[key]) return { ok: false, error: 'Username already taken.' }

  const record = {
    username: key,
    displayName: displayName?.trim() || null,
    passwordHash: hashPassword(key, password),
    accountType: accountType || 'student',
    email: email?.trim() || null,
    classes: [],
    createdAt: Date.now(),
  }
  db[key] = record
  writeDb(db)

  // Migrate any existing guest data on first account creation
  const migrated = migrateGuestData(key)

  const session = { username: key, accountType: record.accountType }
  writeSession(session)

  return { ok: true, session, migrated }
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────
export function login({ username, password }) {
  if (!username || !password) return { ok: false, error: 'Enter username and password.' }
  const key = username.toLowerCase().trim()
  const db = readDb()
  const record = db[key]
  if (!record) return { ok: false, error: 'Account not found.' }
  if (record.passwordHash !== hashPassword(key, password)) return { ok: false, error: 'Incorrect password.' }

  // Migrate guest data on first login (in case they played before creating account)
  const migrated = migrateGuestData(key)

  const session = { username: key, accountType: record.accountType }
  writeSession(session)
  return { ok: true, session, migrated }
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
export function logout() {
  writeSession(null)
}

// ─── GET PROFILE ──────────────────────────────────────────────────────────────
export function getProfile(username) {
  const db = readDb()
  const record = db[username?.toLowerCase()]
  if (!record) return null
  // Never expose passwordHash
  const { passwordHash: _, ...safe } = record
  return safe
}

// ─── UPDATE DISPLAY NAME ──────────────────────────────────────────────────────
export function updateDisplayName(username, newName) {
  const key = username.toLowerCase()
  const db = readDb()
  if (!db[key]) return { ok: false, error: 'Account not found.' }
  db[key].displayName = newName?.trim() || null
  writeDb(db)
  return { ok: true }
}

// ─── TEACHER: Class management ─────────────────────────────────────────────────
function generateClassCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
  return code
}

export function createClass(teacherUsername, className) {
  if (!className?.trim()) return { ok: false, error: 'Class name cannot be empty.' }
  const key = teacherUsername.toLowerCase()
  const db = readDb()
  const record = db[key]
  if (!record || record.accountType !== 'teacher') return { ok: false, error: 'Teacher account required.' }

  const newClass = {
    id: crypto.randomUUID(),
    name: className.trim(),
    code: generateClassCode(),
    studentUsernames: [],
    createdAt: Date.now(),
  }
  record.classes = [...(record.classes || []), newClass]
  writeDb(db)
  return { ok: true, class: newClass }
}

export function deleteClass(teacherUsername, classId) {
  const key = teacherUsername.toLowerCase()
  const db = readDb()
  const record = db[key]
  if (!record || record.accountType !== 'teacher') return { ok: false, error: 'Teacher account required.' }
  record.classes = (record.classes || []).filter(c => c.id !== classId)
  writeDb(db)
  return { ok: true }
}

export function joinClass(studentUsername, classCode) {
  const db = readDb()
  const code = classCode.toUpperCase().trim()
  // Find the teacher who owns this class
  for (const record of Object.values(db)) {
    if (record.accountType !== 'teacher') continue
    const cls = (record.classes || []).find(c => c.code === code)
    if (cls) {
      if (!cls.studentUsernames.includes(studentUsername)) {
        cls.studentUsernames.push(studentUsername)
        writeDb(db)
      }
      return { ok: true, className: cls.name, teacherName: record.displayName || record.username }
    }
  }
  return { ok: false, error: 'Class code not found. Check with your teacher.' }
}

export function leaveClass(studentUsername, classCode) {
  const db = readDb()
  const code = classCode.toUpperCase()
  for (const record of Object.values(db)) {
    if (record.accountType !== 'teacher') continue
    const cls = (record.classes || []).find(c => c.code === code)
    if (cls) {
      cls.studentUsernames = cls.studentUsernames.filter(u => u !== studentUsername)
      writeDb(db)
      return { ok: true }
    }
  }
  return { ok: false }
}

// ─── Validation helpers ───────────────────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '')
}
