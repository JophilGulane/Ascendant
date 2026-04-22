// components/map/MapScreen.jsx
// Slay the Spire accurate Map Design
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import { generateFloorMap, unlockNextNodes, visitNode } from '../../utils/map.js'
import { NODE_TYPES } from '../../constants/nodeTypes.js'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'
import enemiesData from '../../data/japanese/enemies.json'
import eventsData from '../../data/japanese/events.json'

// STS-style node icons (dark grey line art style on parchment)
const NODE_META = {
  [NODE_TYPES.COMBAT]:   { icon: '💀', label: 'Enemy',    size: 32 },
  [NODE_TYPES.ELITE]:    { icon: '🕱', label: 'Elite',    size: 44 }, // slightly different skull if possible, or horned
  [NODE_TYPES.BOSS]:     { icon: '☠️', label: 'Boss',     size: 56 },
  [NODE_TYPES.REST]:     { icon: '🔥', label: 'Rest',     size: 36 },
  [NODE_TYPES.MERCHANT]: { icon: '💰', label: 'Merchant', size: 32 },
  [NODE_TYPES.EVENT]:    { icon: '?',  label: 'Unknown',  size: 36 },
  [NODE_TYPES.START]:    { icon: '⛺', label: 'Start',    size: 36 },
}

// Map Node Component
function MapNodeSTS({ node, x, y, isUnlocked, isVisited, isCurrent, onClick }) {
  const meta = NODE_META[node.type] || NODE_META[NODE_TYPES.COMBAT]
  const canClick = isUnlocked && !isVisited

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: isCurrent ? 20 : isUnlocked ? 10 : 5,
      }}
    >
      <motion.button
        whileHover={canClick ? { scale: 1.2 } : {}}
        whileTap={canClick ? { scale: 0.95 } : {}}
        onClick={() => canClick && onClick(node)}
        title={meta.label}
        style={{
          width: meta.size + 10,
          height: meta.size + 10,
          background: 'transparent',
          border: 'none',
          cursor: canClick ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: meta.size,
          fontWeight: 900,
          color: isVisited ? 'transparent' : '#111',
          textShadow: isVisited 
            ? '0 0 2px rgba(0,0,0,0.5)'
            : isCurrent 
              ? '0 0 10px #fff, 0 0 20px #F5C842'
              : '0 2px 4px rgba(0,0,0,0.4)',
          opacity: isVisited ? 0.3 : isUnlocked ? 1 : 0.4,
          fontFamily: "'Cinzel', serif",
          position: 'relative'
        }}
      >
        <span style={{ 
          filter: isVisited ? 'grayscale(100%) opacity(50%)' : 'grayscale(100%) drop-shadow(0 2px 2px rgba(0,0,0,0.5))',
          opacity: isVisited ? 0.5 : 1
        }}>
          {meta.icon}
        </span>

        {isCurrent && (
          <motion.div
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            style={{
              position: 'absolute',
              inset: -10,
              borderRadius: '50%',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              pointerEvents: 'none',
            }}
          />
        )}
      </motion.button>
    </div>
  )
}

export function MapScreen() {
  const navigate = useNavigate()
  const store = useRunStore()
  const [showLegend, setShowLegend] = useState(true)

  useEffect(() => {
    // Detect old map format (which had a single START node) and force regeneration
    const isOldFormat = store.mapNodes?.some(n => n.type === NODE_TYPES.START)
    if (!store.mapNodes || store.mapNodes.length === 0 || isOldFormat) {
      const { nodes, paths } = generateFloorMap(store.floor, store.masteryLevel)
      store.setMap(nodes, paths)
    }
  }, [store.floor])

  const handleNodeClick = (node) => {
    const updatedNodes = visitNode(store.mapNodes, node.id)
    const unlockedNodes = unlockNextNodes(updatedNodes, store.mapPaths, node.id)
    store.setMapNodes(unlockedNodes)
    store.setCurrentNode(node.id)

    switch (node.type) {
      case NODE_TYPES.START:
        break
      case NODE_TYPES.COMBAT:
      case NODE_TYPES.ELITE: {
        const floorEnemies = enemiesData.filter(e =>
          e.floor === store.floor &&
          (node.type === NODE_TYPES.ELITE ? e.tier === 'elite' : e.tier === 'regular') &&
          e.tier !== 'boss'
        )
        const fallback = enemiesData.filter(e => e.floor === store.floor && e.tier !== 'boss')
        const pool = floorEnemies.length > 0 ? floorEnemies : fallback
        const enemy = pool[Math.floor(Math.random() * pool.length)]
        if (enemy) store.setEnemy(enemy)
        navigate('/combat')
        break
      }
      case NODE_TYPES.BOSS: {
        const boss = enemiesData.find(e => e.floor === store.floor && e.tier === 'boss')
          || enemiesData.find(e => e.tier === 'boss')
        if (boss) store.setEnemy(boss)
        navigate('/combat')
        break
      }
      case NODE_TYPES.REST:  navigate('/rest'); break
      case NODE_TYPES.MERCHANT: navigate('/merchant'); break
      case NODE_TYPES.EVENT: {
        const floorEvents = eventsData.filter(e => e.floor_tier <= store.floor)
        const event = floorEvents[Math.floor(Math.random() * floorEvents.length)]
        if (event) sessionStorage.setItem('lq_current_event', JSON.stringify(event))
        navigate('/event')
        break
      }
      default: break
    }
  }

  // Map coordinate generation
  const MAP_WIDTH = 500
  const ROW_HEIGHT = 90
  const START_Y_PADDING = 100
  const MAX_COLS = 7 // Matches map.js generation

  const { positionedNodes, pathLines, maxRow } = useMemo(() => {
    if (!store.mapNodes) return { positionedNodes: [], pathLines: [], maxRow: 0 }

    const byRow = {}
    let maxR = 0
    store.mapNodes.forEach(node => {
      if (!byRow[node.row]) byRow[node.row] = []
      byRow[node.row].push(node)
      if (node.row > maxR) maxR = node.row
    })

    const nodeCoords = {}
    const posNodes = []
    const mapHeightTotal = maxR * ROW_HEIGHT + START_Y_PADDING * 2

    for (let r = 0; r <= maxR; r++) {
      const rowNodes = byRow[r] || []
      const y = mapHeightTotal - (r * ROW_HEIGHT) - START_Y_PADDING
      const spacing = MAP_WIDTH / (MAX_COLS + 1)

      rowNodes.forEach((node) => {
        // Minimal jitter for an organic path look
        const jitterX = (r === 0 || r === maxR) ? 0 : (Math.random() - 0.5) * 30
        const jitterY = (r === 0 || r === maxR) ? 0 : (Math.random() - 0.5) * 20

        // Position exactly by logical column, ensuring straight vertical lines when c1 == c2
        const x = (node.col + 1) * spacing + jitterX
        const finalY = y + jitterY
        
        nodeCoords[node.id] = { x, y: finalY }
        posNodes.push({ ...node, x, y: finalY })
      })
    }

    const pLines = []
    store.mapPaths?.forEach(([fromId, toId]) => {
      const p1 = nodeCoords[fromId]
      const p2 = nodeCoords[toId]
      if (p1 && p2) {
        // Line is dark solid if route is active/available
        const fromNode = store.mapNodes.find(n => n.id === fromId)
        const isPathActive = fromNode?.visited || fromNode?.type === NODE_TYPES.START
        
        pLines.push({
          id: `${fromId}-${toId}`,
          x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
          active: isPathActive
        })
      }
    })

    return { positionedNodes: posNodes, pathLines: pLines, maxRow: maxR }
  }, [store.mapNodes, store.mapPaths])

  const mapHeightTotal = maxRow * ROW_HEIGHT + START_Y_PADDING * 2

  return (
    <ScreenTransition>
      <div
        className="relative w-full h-screen flex flex-col overflow-hidden"
        style={{ background: '#111318', fontFamily: "'Crimson Text', Georgia, serif" }} // Dark outer background
      >
        {/* ── Header Bar ── */}
        <div
          className="relative z-30 flex items-center justify-between px-6 py-1.5"
          style={{
            background: 'linear-gradient(180deg, #2b353f 0%, #1a2228 100%)',
            borderBottom: '2px solid #111',
            boxShadow: '0 4px 10px rgba(0,0,0,0.6)',
            color: '#ddd',
            fontSize: '0.85rem'
          }}
        >
          <div className="flex items-center gap-4">
            <div className="font-bold text-white text-base mr-2">{store.character?.name || 'Traveler'}</div>
            <div className="flex items-center gap-1 text-red-400 font-bold">❤️ {store.hp}/{store.maxHp}</div>
            <div className="flex items-center gap-1 text-yellow-400 font-bold">🪙 {store.gold}</div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setShowLegend(!showLegend)} className="text-gray-400 hover:text-white" title="Map Legend">📜 Legend</button>
            <div className="bg-gray-800 px-3 py-0.5 rounded border border-gray-600 font-bold">Floor {store.floor}</div>
            <button className="text-xl" title="Settings">⚙️</button>
          </div>
        </div>

        {/* ── Main Map Area ── */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden">
          {/* Scrollable Container */}
          <div 
            className="w-full max-w-[800px] h-full overflow-y-auto overflow-x-hidden relative"
            style={{
              // Light parchment background, imitating STS paper map
              background: '#D9CDB6', 
              boxShadow: '0 0 50px rgba(0,0,0,0.8)',
            }}
          >
            <div className="relative w-full mx-auto" style={{ height: mapHeightTotal, maxWidth: MAP_WIDTH }}>
              
              {/* Paper texture overlays */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
                mixBlendMode: 'multiply',
              }} />
              {/* Edge vignetting (aged paper) */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse 150% 120% at 50% 50%, transparent 60%, rgba(50,40,20,0.4) 100%)',
              }} />

              {/* ── Draw Paths (Dashed lines, dark grey) ── */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                {pathLines.map(line => (
                  <line
                    key={line.id}
                    x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                    stroke="#222"
                    strokeWidth={line.active ? 4 : 2}
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                    opacity={line.active ? 0.7 : 0.25}
                  />
                ))}
              </svg>

              {/* ── Draw Nodes ── */}
              {positionedNodes.map(node => (
                <MapNodeSTS
                  key={node.id}
                  node={node}
                  x={node.x}
                  y={node.y}
                  isUnlocked={node.available === true}
                  isVisited={node.visited === true}
                  isCurrent={store.currentNodeId === node.id}
                  onClick={handleNodeClick}
                />
              ))}
            </div>
          </div>

          {/* ── STS-style Legend Scroll (Right side) ── */}
          <AnimatePresence>
            {showLegend && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-4 top-10 z-30 pointer-events-none"
              >
                <div 
                  style={{
                    background: '#C1B296',
                    padding: '20px 24px',
                    borderRadius: '2px 10px 2px 10px',
                    boxShadow: '-4px 4px 15px rgba(0,0,0,0.5)',
                    border: '1px solid #A29478',
                    position: 'relative'
                  }}
                >
                  {/* Paper roll effect top/bottom */}
                  <div className="absolute -top-3 left-0 right-2 h-4 bg-[#B2A385] rounded-t-lg shadow-inner" />
                  <div className="absolute -bottom-3 left-2 right-0 h-4 bg-[#A29478] rounded-b-lg shadow-md" />

                  <h3 className="text-[#222] font-bold text-center mb-4 uppercase tracking-widest text-sm" style={{ fontFamily: "'Cinzel', serif" }}>
                    Legend
                  </h3>
                  
                  <div className="flex flex-col gap-3">
                    {Object.entries(NODE_META).filter(([k]) => k !== 'start').map(([type, meta]) => (
                      <div key={type} className="flex items-center gap-3">
                        <span className="text-[#111] text-xl grayscale w-6 text-center drop-shadow-md">
                          {meta.icon === '?' ? <b className="text-xl">?</b> : meta.icon}
                        </span>
                        <span className="text-[#333] font-bold text-sm tracking-wide">{meta.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Footer ── */}
        <div
          className="relative z-30 text-center py-2 text-sm uppercase"
          style={{
            background: 'linear-gradient(0deg, #111, #1a1a1a)',
            borderTop: '2px solid #000',
            color: '#a08040',
            fontFamily: "'Cinzel', serif",
            letterSpacing: '0.05em',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.8)'
          }}
        >
          Select a Starting Room
        </div>
      </div>
    </ScreenTransition>
  )
}
