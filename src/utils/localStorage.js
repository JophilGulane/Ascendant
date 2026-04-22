// utils/localStorage.js
// Typed read/write helpers with try/catch — always use these, never raw localStorage

export const STORAGE_KEYS = {
  ACTIVE_RUN: 'lq_active_run',
  GRAVEYARD: 'lq_graveyard',
  PROGRESS: 'lq_progress',
  SETTINGS: 'lq_settings',
  JOURNAL: 'lq_journal',
}

let _degraded = false

/**
 * Check if localStorage is available. Sets degraded mode if not.
 */
function checkAvailable() {
  try {
    const test = '__lq_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    if (!_degraded) {
      _degraded = true
      console.warn('[Ascendant] localStorage unavailable — progress will not be saved this session.')
    }
    return false
  }
}

/**
 * Read and parse a value from localStorage
 * @param {string} key
 * @param {*} fallback - returned if key is missing or parse fails
 */
export function lqRead(key, fallback = null) {
  if (!checkAvailable()) return fallback
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch (e) {
    console.warn(`[Ascendant] Failed to read ${key}:`, e)
    return fallback
  }
}

/**
 * Stringify and write a value to localStorage
 * @param {string} key
 * @param {*} value
 * @returns {boolean} success
 */
export function lqWrite(key, value) {
  if (!checkAvailable()) return false
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (e) {
    console.warn(`[Ascendant] Failed to write ${key}:`, e)
    return false
  }
}

/**
 * Remove a key from localStorage
 */
export function lqRemove(key) {
  if (!checkAvailable()) return
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.warn(`[Ascendant] Failed to remove ${key}:`, e)
  }
}

/**
 * Returns true if the app is running in degraded (no-storage) mode
 */
export function isStorageDegraded() {
  return _degraded
}
