// teacher/components/StepEnemyBuilder.jsx
// Step 3: Define up to 8 enemies (2 per floor). Auto-assigns intent patterns by floor.
// Boss on floor 4 is auto-generated from the campaign name + teacher's floor 4 questions.

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { makeBlankEnemy, saveEnemies } from '../teacherService.js'

const FLOORS = [1, 2, 3, 4]
const TIERS  = ['regular', 'elite', 'boss']
const PORTRAIT_PRESETS = [
  { id: 'silhouette_1', label: '👤 Scholar',     color: '#1a2a4a' },
  { id: 'silhouette_2', label: '🤖 Automaton',   color: '#2a1a0a' },
  { id: 'silhouette_3', label: '👾 Entity',       color: '#1a0a2a' },
  { id: 'silhouette_4', label: '🐉 Creature',     color: '#0a2a1a' },
  { id: 'silhouette_5', label: '⚔️ Rival',        color: '#2a0a0a' },
  { id: 'silhouette_6', label: '✨ Spirit',        color: '#0a1a2a' },
]

const FLOOR_INFO = {
  1: { label: 'Floor 1', desc: '1 action/turn, basic patterns', actsPerTurn: 1, hpRange: '35–50', atkRange: '6–9' },
  2: { label: 'Floor 2', desc: '1 action/turn + special unlock', actsPerTurn: 1, hpRange: '55–75', atkRange: '9–13' },
  3: { label: 'Floor 3', desc: '2 actions/turn', actsPerTurn: 2, hpRange: '80–100', atkRange: '12–15' },
  4: { label: 'Floor 4', desc: '3 actions/turn, boss phases auto-generated', actsPerTurn: 3, hpRange: '140–200', atkRange: '15–20' },
}

function EnemyForm({ enemy, onChange, onDelete, campaignName }) {
  const upd = (key, val) => onChange({ ...enemy, [key]: val })
  const isBoss = enemy.tier === 'boss'
  const info = FLOOR_INFO[enemy.floor] || FLOOR_INFO[1]

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '16px', padding: '20px',
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <div style={{ fontWeight: 700, color: '#f3f4f6', fontSize: '0.9rem' }}>
            {enemy.name_native || '(Unnamed Enemy)'}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '2px' }}>
            Floor {enemy.floor} · {info.desc}
          </div>
        </div>
        <button onClick={onDelete} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1rem' }}>🗑</button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Floor + Tier */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Floor</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {FLOORS.map(f => (
                <button key={f} onClick={() => upd('floor', f)} style={{
                  flex: 1, padding: '5px', borderRadius: '7px',
                  border: enemy.floor === f ? '1px solid #F5C842' : '1px solid rgba(255,255,255,0.1)',
                  background: enemy.floor === f ? 'rgba(245,200,66,0.12)' : 'transparent',
                  color: enemy.floor === f ? '#F5C842' : '#9ca3af', fontSize: '0.78rem', cursor: 'pointer',
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Tier</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {TIERS.map(t => (
                <button key={t} onClick={() => upd('tier', t)} style={{
                  flex: 1, padding: '5px', borderRadius: '7px', textTransform: 'capitalize',
                  border: enemy.tier === t ? '1px solid #F5C842' : '1px solid rgba(255,255,255,0.1)',
                  background: enemy.tier === t ? 'rgba(245,200,66,0.12)' : 'transparent',
                  color: enemy.tier === t ? '#F5C842' : '#9ca3af', fontSize: '0.72rem', cursor: 'pointer',
                }}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Name */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              {isBoss ? 'Boss Name (auto: "The [Campaign] Master")' : 'Enemy Name'}
            </div>
            <input
              type="text"
              value={isBoss ? (enemy.name_native || `The ${campaignName || 'Course'} Master`) : enemy.name_native}
              onChange={e => upd('name_native', e.target.value)}
              placeholder={isBoss ? `The ${campaignName || 'Course'} Master` : 'e.g., Rogue Compiler'}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                padding: '8px 12px', color: '#f3f4f6', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Concept Description</div>
            <input
              type="text"
              value={enemy.concept_description || ''}
              onChange={e => upd('concept_description', e.target.value)}
              placeholder='e.g., "Tests basic printf usage"'
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                padding: '8px 12px', color: '#f3f4f6', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* HP + Attack */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[['hp', 'HP', info.hpRange], ['base_attack', 'Attack', info.atkRange]].map(([key, label, range]) => (
            <div key={key}>
              <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                {label} <span style={{ color: '#4b5563', textTransform: 'none', letterSpacing: 0 }}>(suggested {range})</span>
              </div>
              <input
                type="number"
                value={enemy[key] || ''}
                onChange={e => upd(key, parseInt(e.target.value) || 0)}
                min={1} max={key === 'hp' ? 300 : 50}
                style={{
                  width: '100%', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: '8px',
                  padding: '8px 12px', color: '#f3f4f6', fontSize: '0.84rem', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
        </div>

        {/* Portrait preset */}
        <div>
          <div style={{ fontSize: '0.65rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>Portrait Preset</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {PORTRAIT_PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => upd('portrait_preset', p.id)}
                style={{
                  padding: '6px 12px', borderRadius: '8px', fontSize: '0.72rem',
                  border: enemy.portrait_preset === p.id ? '2px solid #F5C842' : '1px solid rgba(255,255,255,0.1)',
                  background: enemy.portrait_preset === p.id ? 'rgba(245,200,66,0.12)' : 'rgba(255,255,255,0.04)',
                  color: enemy.portrait_preset === p.id ? '#F5C842' : '#9ca3af',
                  cursor: 'pointer',
                }}
              >{p.label}</button>
            ))}
          </div>
        </div>

        {/* Auto-intent notice */}
        <div style={{
          fontSize: '0.7rem', color: '#6b7280', padding: '8px 12px',
          background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid rgba(245,200,66,0.3)',
        }}>
          ⚙️ Combat behavior (actions/turn, intent patterns, wrong-answer buffs) is <strong style={{ color: '#d1d5db' }}>automatically assigned</strong> based on floor {enemy.floor}. No configuration needed.
          {isBoss && <span style={{ color: '#F5C842' }}> Boss phases are auto-built from your Floor 4 question bank.</span>}
        </div>
      </div>
    </div>
  )
}

export function StepEnemyBuilder({ campaign, onUpdate }) {
  const enemies = campaign.enemies || []
  const maxEnemies = 8

  const addEnemy = () => {
    if (enemies.length >= maxEnemies) return
    const floor = enemies.length < 2 ? 1 : enemies.length < 4 ? 2 : enemies.length < 6 ? 3 : 4
    const newEnemy = makeBlankEnemy(campaign.code, floor)
    onUpdate({ ...campaign, enemies: [...enemies, newEnemy] })
  }

  const updateEnemy = (idx, updated) => {
    const next = [...enemies]
    next[idx] = updated
    onUpdate({ ...campaign, enemies: next })
  }

  const deleteEnemy = (idx) => {
    onUpdate({ ...campaign, enemies: enemies.filter((_, i) => i !== idx) })
  }

  // Group by floor for display
  const byFloor = FLOORS.map(f => ({ floor: f, enemies: enemies.map((e, i) => ({ ...e, _idx: i })).filter(e => e.floor === f) }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontFamily: "'Cinzel', serif", color: '#F5C842', fontSize: '1.2rem', margin: '0 0 4px' }}>Step 3 — Enemy Builder</h2>
        <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>
          Define up to 8 enemies (2 per floor). Combat behavior is automatically balanced by floor — you only set names, HP, and theme.
        </p>
      </div>

      {/* Add button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <motion.button
          onClick={addEnemy}
          disabled={enemies.length >= maxEnemies}
          whileHover={enemies.length < maxEnemies ? { scale: 1.03 } : {}}
          whileTap={enemies.length < maxEnemies ? { scale: 0.97 } : {}}
          style={{
            padding: '9px 20px', borderRadius: '10px', border: 'none',
            background: enemies.length < maxEnemies ? 'linear-gradient(135deg,#b45309,#F5C842)' : 'rgba(255,255,255,0.08)',
            color: enemies.length < maxEnemies ? '#1a0e00' : '#4b5563',
            fontWeight: 700, fontSize: '0.85rem', cursor: enemies.length < maxEnemies ? 'pointer' : 'not-allowed',
          }}
        >
          + Add Enemy
        </motion.button>
        <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>{enemies.length}/{maxEnemies} enemies defined</span>
      </div>

      {/* Enemies by floor */}
      {enemies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#4b5563' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⚔️</div>
          <div style={{ fontSize: '0.88rem' }}>No enemies yet. Add your first enemy above!</div>
          <div style={{ fontSize: '0.72rem', marginTop: '6px' }}>Aim for 2 per floor — 1 regular + 1 boss.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {byFloor.map(({ floor, enemies: floorEnemies }) => (
            floorEnemies.length > 0 && (
              <div key={floor}>
                <div style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Floor {floor}</span>
                  <span style={{ color: '#4b5563' }}>— {FLOOR_INFO[floor].desc}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {floorEnemies.map(e => (
                    <EnemyForm
                      key={e.id}
                      enemy={e}
                      onChange={updated => updateEnemy(e._idx, updated)}
                      onDelete={() => deleteEnemy(e._idx)}
                      campaignName={campaign.name}
                    />
                  ))}
                </div>
              </div>
            )
          ))}
        </div>
      )}

      {/* Boss note */}
      <div style={{
        background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.25)',
        borderRadius: '12px', padding: '14px 16px', fontSize: '0.76rem', color: '#c084fc',
      }}>
        🏆 <strong>Boss auto-generation:</strong> Set an enemy's Tier to "boss" on Floor 4.
        It will be named "The {campaign.name || '[Campaign]'} Master" by default and its phases are automatically built from your Floor 4 questions.
      </div>
    </div>
  )
}
