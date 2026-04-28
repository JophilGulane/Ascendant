// components/shared/SettingsMenu.jsx
// Full-featured settings overlay. Opens from MainMenu gear icon or CombatScreen gear icon.
// All changes apply immediately — no save button. Wires directly to settingsStore.
// When open during combat the parent is responsible for pausing turn processing.

import { useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useSettingsStore from '../../stores/settingsStore.js'
import { ROMANIZATION_MODES } from '../../constants/campaigns.js'

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULTS = {
  timerSpeed:        'normal',
  romanization:      ROMANIZATION_MODES.FADE_PROGRESSIVE,
  spacedRepetition:  true,
  sfxVolume:         0.8,
  musicVolume:       0.6,
  cardAnimSpeed:     'normal',
  fontSizeMultiplier: 1,
  highContrast:      false,
  colorblindMode:    false,
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionHeader({ children }) {
  return (
    <div style={{
      fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em',
      textTransform: 'uppercase', color: '#9ca3af',
      paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.07)',
      marginBottom: '4px', fontFamily: "'Cinzel', serif",
    }}>
      {children}
    </div>
  )
}

function SettingRow({ label, description, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', color: '#e5e7eb', fontWeight: 500 }}>{label}</div>
        {description && (
          <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '2px', lineHeight: 1.4 }}>
            {description}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  )
}

// Tri-button group (e.g. Relaxed / Normal / Fast)
function TriButton({ options, value, onChange, accent }) {
  return (
    <div style={{ display: 'flex', gap: '4px' }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          style={{
            padding: '5px 11px', borderRadius: '7px', fontSize: '0.72rem', fontWeight: 600,
            border: value === opt.value ? `1px solid ${accent}` : '1px solid rgba(255,255,255,0.12)',
            background: value === opt.value ? `${accent}22` : 'rgba(255,255,255,0.04)',
            color: value === opt.value ? accent : '#9ca3af',
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

// Toggle switch
function Toggle({ value, onChange, accent }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', position: 'relative',
        background: value ? accent : 'rgba(255,255,255,0.12)',
        border: 'none', cursor: 'pointer', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: value ? 21 : 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{
          position: 'absolute', top: '2px', left: 0,
          width: '20px', height: '20px', borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  )
}

// Volume slider
function VolumeSlider({ value, onChange, accent }) {
  const pct = Math.round(value * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '160px' }}>
      <input
        type="range" min={0} max={100} step={1} value={pct}
        onChange={e => onChange(Number(e.target.value) / 100)}
        style={{ flex: 1, accentColor: accent, cursor: 'pointer' }}
      />
      <span style={{ fontSize: '0.7rem', color: '#9ca3af', width: '30px', textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
// accent: the campaign's accent color token (or a neutral gold for main menu)
export function SettingsMenu({ isOpen, onClose, accent = '#F5C842' }) {
  const s = useSettingsStore()

  // Apply Howler volumes immediately
  const handleSfxVolume = useCallback((vol) => {
    s.setSfxVolume(vol)
    // SFX volume is applied per-play via howl.volume(sfxVolume) in useAudio
  }, [s])

  const handleMusicVolume = useCallback((vol) => {
    s.setMusicVolume(vol)
    // Music volume is live-updated by the useEffect in useAudio that watches musicVolume
  }, [s])

  const handleReset = useCallback(() => {
    s.setTimerSpeed(DEFAULTS.timerSpeed)
    s.setRomanization(DEFAULTS.romanization)
    s.setSpacedRepetition(DEFAULTS.spacedRepetition)
    s.setSfxVolume(DEFAULTS.sfxVolume)
    s.setMusicVolume(DEFAULTS.musicVolume)
    s.setCardAnimSpeed(DEFAULTS.cardAnimSpeed)
    s.setFontSizeMultiplier(DEFAULTS.fontSizeMultiplier)
    s.setHighContrast(DEFAULTS.highContrast)
    s.setColorblindMode(DEFAULTS.colorblindMode)
    // Music volume resets via the useEffect in useAudio watching musicVolume
  }, [s])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="settings-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          <motion.div
            key="settings-panel"
            initial={{ scale: 0.93, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.93, y: 20, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '520px', maxHeight: '88vh',
              overflowY: 'auto', borderRadius: '20px',
              background: 'linear-gradient(160deg, #111827, #0d0d18)',
              border: `1px solid ${accent}44`,
              boxShadow: `0 0 80px rgba(0,0,0,0.95), 0 0 40px ${accent}11`,
              padding: '28px 28px 20px',
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {/* ── Header ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{
                fontFamily: "'Cinzel', serif", fontSize: '1.25rem', fontWeight: 700,
                color: accent, margin: 0, letterSpacing: '0.05em',
              }}>
                ⚙️ Settings
              </h2>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}
              >×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* ── SOUND ── */}
              <div>
                <SectionHeader>🔊 Sound</SectionHeader>
                <SettingRow
                  label="SFX Volume"
                  description="Card plays, combat hits, UI clicks"
                >
                  <VolumeSlider value={s.sfxVolume} onChange={handleSfxVolume} accent={accent} />
                </SettingRow>
                <SettingRow
                  label="Music Volume"
                  description="Background music for menu and combat"
                >
                  <VolumeSlider value={s.musicVolume} onChange={handleMusicVolume} accent={accent} />
                </SettingRow>
              </div>

              {/* ── GAMEPLAY ── */}
              <div>
                <SectionHeader>🎮 Gameplay</SectionHeader>
                <SettingRow
                  label="Timer Speed"
                  description="Time allowed to answer each question"
                >
                  <TriButton
                    accent={accent}
                    value={s.timerSpeed}
                    onChange={s.setTimerSpeed}
                    options={[
                      { label: 'Relaxed (30s)', value: 'relaxed' },
                      { label: 'Normal (20s)', value: 'normal' },
                      { label: 'Fast (12s)',   value: 'fast' },
                    ]}
                  />
                </SettingRow>
                <SettingRow
                  label="Romanization"
                  description="Controls whether romaji / romanization is shown on target-script cards"
                >
                  <TriButton
                    accent={accent}
                    value={s.romanization}
                    onChange={s.setRomanization}
                    options={[
                      { label: 'Always',      value: ROMANIZATION_MODES.ALWAYS_SHOW },
                      { label: 'Progressive', value: ROMANIZATION_MODES.FADE_PROGRESSIVE },
                      { label: 'Never',       value: ROMANIZATION_MODES.ALWAYS_HIDE },
                    ]}
                  />
                </SettingRow>
                <SettingRow
                  label="Graveyard Haunting"
                  description="Spaced repetition — missed questions appear more frequently"
                >
                  <Toggle value={s.spacedRepetition} onChange={s.setSpacedRepetition} accent={accent} />
                </SettingRow>
              </div>

              {/* ── DISPLAY ── */}
              <div>
                <SectionHeader>🖥 Display</SectionHeader>
                <SettingRow
                  label="Card Animation Speed"
                  description="Speed of card play and draw animations"
                >
                  <TriButton
                    accent={accent}
                    value={s.cardAnimSpeed}
                    onChange={s.setCardAnimSpeed}
                    options={[
                      { label: 'Normal',  value: 'normal' },
                      { label: 'Fast',    value: 'fast' },
                      { label: 'Instant', value: 'instant' },
                    ]}
                  />
                </SettingRow>
                <SettingRow
                  label="Font Size"
                  description="Applies to question text and card text globally"
                >
                  <TriButton
                    accent={accent}
                    value={String(s.fontSizeMultiplier)}
                    onChange={v => s.setFontSizeMultiplier(Number(v))}
                    options={[
                      { label: 'Small',  value: '1' },
                      { label: 'Medium', value: '1.25' },
                      { label: 'Large',  value: '1.5' },
                    ]}
                  />
                </SettingRow>
                <SettingRow
                  label="High Contrast"
                  description="Increases contrast on card and UI text for readability"
                >
                  <Toggle value={s.highContrast} onChange={s.setHighContrast} accent={accent} />
                </SettingRow>
              </div>

              {/* ── ACCESSIBILITY ── */}
              <div>
                <SectionHeader>♿ Accessibility</SectionHeader>
                <SettingRow
                  label="Colorblind Mode"
                  description="Card types differentiated by icon shape only, not color"
                >
                  <Toggle value={s.colorblindMode} onChange={s.setColorblindMode} accent={accent} />
                </SettingRow>
              </div>

            </div>

            {/* ── Reset + Close ── */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: '10px' }}>
              <button
                onClick={handleReset}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px',
                  border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.08)',
                  color: '#fca5a5', fontSize: '0.82rem', cursor: 'pointer',
                  fontWeight: 600, transition: 'all 0.15s',
                }}
                onMouseEnter={e => e.target.style.background = 'rgba(239,68,68,0.18)'}
                onMouseLeave={e => e.target.style.background = 'rgba(239,68,68,0.08)'}
              >
                ↺ Reset to Defaults
              </button>
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                  background: `linear-gradient(135deg, ${accent}bb, ${accent})`,
                  color: '#111', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                  fontFamily: "'Cinzel', serif",
                }}
              >
                Done
              </motion.button>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Gear icon trigger — drop anywhere ────────────────────────────────────────
export function GearButton({ onClick, style = {} }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ rotate: 45, scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      title="Settings"
      style={{
        background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '50%', width: '40px', height: '40px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', fontSize: '1.05rem', backdropFilter: 'blur(4px)',
        ...style,
      }}
    >
      ⚙️
    </motion.button>
  )
}
