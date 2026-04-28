// components/leaderboard/LeaderboardRow.jsx
// Shared rank row — used by both ClassLeaderboard and GlobalLeaderboard.
// Handles medal emoji, highlighted "you" row, campaign badge, mastery indicator.

import { motion } from 'framer-motion'
import { relativeTime } from '../../account/leaderboardService.js'

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' }

const CAMPAIGN_COLORS = {
  japanese: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#fca5a5', label: '🗾 JP' },
  korean:   { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd', label: '🌆 KR' },
  spanish:  { bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)',  text: '#fde047', label: '🌎 ES' },
}

function MasteryPip({ level }) {
  if (!level || level === 0) return null
  return (
    <span style={{
      fontSize: '0.55rem',
      background: 'rgba(168,85,247,0.2)',
      border: '1px solid rgba(168,85,247,0.4)',
      color: '#c084fc',
      borderRadius: '4px',
      padding: '1px 5px',
      fontWeight: 700,
      letterSpacing: '0.04em',
      marginLeft: '4px',
      flexShrink: 0,
    }}>
      M{level}
    </span>
  )
}

function CampaignBadge({ campaign }) {
  const c = CAMPAIGN_COLORS[campaign]
  if (!c) return null
  return (
    <span style={{
      fontSize: '0.6rem',
      background: c.bg, border: `1px solid ${c.border}`,
      color: c.text, borderRadius: '5px',
      padding: '1px 7px', fontWeight: 700,
      flexShrink: 0,
    }}>
      {c.label}
    </span>
  )
}

export function LeaderboardRow({ entry, rank, isYou, showCampaign = false, showMastery = false, index = 0 }) {
  const medal = MEDALS[rank]
  const isTop3 = rank <= 3

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.4) }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 14px',
        borderRadius: '10px',
        background: isYou
          ? 'rgba(245,200,66,0.08)'
          : isTop3
          ? 'rgba(255,255,255,0.04)'
          : 'transparent',
        border: isYou
          ? '1px solid rgba(245,200,66,0.3)'
          : isTop3
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid transparent',
        transition: 'background 0.2s',
      }}
    >
      {/* Rank */}
      <div style={{
        width: '28px', flexShrink: 0, textAlign: 'center',
        fontSize: isTop3 ? '1.1rem' : '0.75rem',
        color: isTop3 ? undefined : '#6b7280',
        fontWeight: 700,
        fontFamily: 'monospace',
      }}>
        {medal || `#${rank}`}
      </div>

      {/* Username */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.85rem', fontWeight: isYou ? 700 : 500,
          color: isYou ? '#F5C842' : '#f3f4f6',
          display: 'flex', alignItems: 'center', gap: '6px',
          overflow: 'hidden',
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.displayName || entry.username}
          </span>
          {showMastery && <MasteryPip level={entry.masteryLevel} />}
          {isYou && (
            <span style={{ fontSize: '0.6rem', color: '#F5C842', opacity: 0.7, flexShrink: 0 }}>you</span>
          )}
        </div>
      </div>

      {/* Campaign badge */}
      {showCampaign && <CampaignBadge campaign={entry.campaign} />}

      {/* Floor + Mastery pill (global mode) */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f3f4f6' }}>
          Floor {entry.floorReached}
          {showMastery && entry.masteryLevel > 0 && (
            <span style={{ color: '#c084fc', fontWeight: 400, fontSize: '0.72rem', marginLeft: '3px' }}>
              · M{entry.masteryLevel}
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '1px' }}>
          {relativeTime(entry.lastActive)}
        </div>
      </div>
    </motion.div>
  )
}

// ── Sticky "Your position" row shown outside top-100 ─────────────────────────
export function YourPositionRow({ rank, entry }) {
  if (!entry) return null
  return (
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.08)',
      paddingTop: '12px',
      marginTop: '8px',
    }}>
      <div style={{ fontSize: '0.65rem', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Your Position
      </div>
      <LeaderboardRow entry={entry} rank={rank} isYou />
    </div>
  )
}
