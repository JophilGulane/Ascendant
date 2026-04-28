// stores/accountStore.js
// Reactive account state — wraps accountService, drives all UI.
// Session persists across page reloads via localStorage (readSession on init).

import { create } from 'zustand'
import {
  readSession,
  createAccount,
  login,
  logout,
  getProfile,
  updateDisplayName,
  createClass,
  deleteClass,
  joinClass,
  leaveClass,
} from '../account/accountService.js'

const useAccountStore = create((set, get) => {
  // Rehydrate session from localStorage immediately at store creation
  const savedSession = readSession()
  const initialProfile = savedSession ? getProfile(savedSession.username) : null

  return {
    // ── State ────────────────────────────────────────────────────────────────
    session: savedSession,      // { username, accountType } | null
    profile: initialProfile,    // full account record (no passwordHash) | null
    isLoggedIn: !!savedSession,
    authError: null,
    authLoading: false,
    migrationDone: false,       // true if guest data was migrated on login

    // ── Derived helpers ───────────────────────────────────────────────────────
    isTeacher: () => get().session?.accountType === 'teacher',
    displayName: () => {
      const p = get().profile
      return p?.displayName || p?.username || 'Player'
    },
    getClasses: () => get().profile?.classes || [],

    // ── Auth actions ──────────────────────────────────────────────────────────
    register: (fields) => {
      set({ authLoading: true, authError: null })
      const result = createAccount(fields)
      if (!result.ok) {
        set({ authLoading: false, authError: result.error })
        return false
      }
      const profile = getProfile(result.session.username)
      set({
        session: result.session,
        profile,
        isLoggedIn: true,
        authLoading: false,
        authError: null,
        migrationDone: result.migrated,
      })
      return true
    },

    loginUser: (fields) => {
      set({ authLoading: true, authError: null })
      const result = login(fields)
      if (!result.ok) {
        set({ authLoading: false, authError: result.error })
        return false
      }
      const profile = getProfile(result.session.username)
      set({
        session: result.session,
        profile,
        isLoggedIn: true,
        authLoading: false,
        authError: null,
        migrationDone: result.migrated,
      })
      return true
    },

    logoutUser: () => {
      logout()
      set({ session: null, profile: null, isLoggedIn: false, migrationDone: false })
    },

    clearAuthError: () => set({ authError: null }),
    clearMigrationFlag: () => set({ migrationDone: false }),

    // ── Profile updates ────────────────────────────────────────────────────────
    updateName: (newName) => {
      const { session } = get()
      if (!session) return false
      const result = updateDisplayName(session.username, newName)
      if (result.ok) {
        const profile = getProfile(session.username)
        set({ profile })
      }
      return result.ok
    },

    // ── Teacher: Class management ─────────────────────────────────────────────
    createNewClass: (className) => {
      const { session } = get()
      if (!session) return { ok: false, error: 'Not logged in.' }
      const result = createClass(session.username, className)
      if (result.ok) {
        const profile = getProfile(session.username)
        set({ profile })
      }
      return result
    },

    deleteExistingClass: (classId) => {
      const { session } = get()
      if (!session) return { ok: false }
      const result = deleteClass(session.username, classId)
      if (result.ok) {
        const profile = getProfile(session.username)
        set({ profile })
      }
      return result
    },

    joinClassByCode: (code) => {
      const { session } = get()
      if (!session) return { ok: false, error: 'Not logged in.' }
      return joinClass(session.username, code)
    },

    leaveClassByCode: (code) => {
      const { session } = get()
      if (!session) return { ok: false }
      const result = leaveClass(session.username, code)
      if (result.ok) {
        const profile = getProfile(session.username)
        set({ profile })
      }
      return result
    },

    // Refresh profile from DB (call after external mutations)
    refreshProfile: () => {
      const { session } = get()
      if (!session) return
      const profile = getProfile(session.username)
      set({ profile })
    },
  }
})

export default useAccountStore
