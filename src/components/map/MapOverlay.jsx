import { useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import { NODE_TYPES } from '../../constants/nodeTypes.js'

const NODE_META = {
  [NODE_TYPES.COMBAT]:   { icon: '💀', label: 'Enemy',    size: 32 },
  [NODE_TYPES.ELITE]:    { icon: '🕱', label: 'Elite',    size: 44 },
  [NODE_TYPES.BOSS]:     { icon: '☠️', label: 'Boss',     size: 56 },
  [NODE_TYPES.REST]:     { icon: '🔥', label: 'Rest',     size: 36 },
  [NODE_TYPES.MERCHANT]: { icon: '💰', label: 'Merchant', size: 32 },
  [NODE_TYPES.EVENT]:    { icon: '?',  label: 'Unknown',  size: 36 },
  [NODE_TYPES.START]:    { icon: '⛺', label: 'Start',    size: 36 },
}

function MapNodeReadOnly({ node, x, y, isCurrent, isVisited }) {
  const meta = NODE_META[node.type] || NODE_META[NODE_TYPES.COMBAT]
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: 'translate(-50%, -50%)',
        zIndex: isCurrent ? 20 : 10,
      }}
    >
      <div
        title={meta.label}
        style={{
          width: meta.size + 10,
          height: meta.size + 10,
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: meta.size,
          fontWeight: 900,
          color: isVisited ? 'transparent' : '#111',
          textShadow: isVisited 
            ? '0 0 2px rgba(0,0,0,0.5)'
            : isCurrent 
              ? '0 0 15px rgba(255,0,0,0.8), 0 0 5px rgba(255,255,255,0.8)' 
              : '0 0 4px rgba(255,255,255,0.6)',
          opacity: isVisited ? 0.4 : isCurrent ? 1 : 0.8,
        }}
      >
        {isCurrent ? (
          <div className="relative">
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} className="absolute inset-0 bg-red-500/20 rounded-full blur-md" />
            <span className="relative z-10 text-red-900">{meta.icon}</span>
          </div>
        ) : (
          <span className="grayscale">{meta.icon === '?' ? <b className="text-xl">?</b> : meta.icon}</span>
        )}
      </div>
    </div>
  )
}

export function MapOverlay({ onClose }) {
  const store = useRunStore()

  const MAP_WIDTH = 500
  const ROW_HEIGHT = 90
  const START_Y_PADDING = 100
  const MAX_COLS = 7

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
        const jitterX = (r === 0 || r === maxR) ? 0 : (Math.random() - 0.5) * 30
        const jitterY = (r === 0 || r === maxR) ? 0 : (Math.random() - 0.5) * 20
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

  const scrollContainerRef = useRef(null)

  useEffect(() => {
    if (!scrollContainerRef.current) return
    
    const timeoutId = setTimeout(() => {
      let targetY = null
      const currentNode = positionedNodes.find(n => n.id === store.currentNodeId)
      if (currentNode) {
        targetY = currentNode.y
      } else {
        const availableNodes = positionedNodes.filter(n => n.available)
        if (availableNodes.length > 0) {
          targetY = availableNodes[0].y
        }
      }

      if (targetY !== null && scrollContainerRef.current) {
        const containerHeight = scrollContainerRef.current.clientHeight
        scrollContainerRef.current.scrollTo({
          top: Math.max(0, targetY - containerHeight * 0.6),
          behavior: 'smooth'
        })
      } else if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight
      }
    }, 100)

    return () => clearTimeout(timeoutId)
  }, [positionedNodes, store.currentNodeId])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/90 flex flex-col p-4 md:p-8 backdrop-blur-sm"
    >
      <div className="flex justify-between items-center mb-4 max-w-[800px] w-full mx-auto">
        <h2 className="text-3xl font-bold text-amber-200" style={{ fontFamily: "'Cinzel', serif" }}>World Map</h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-4xl cursor-pointer">×</button>
      </div>

      <div className="flex-1 w-full max-w-[800px] mx-auto rounded-xl overflow-hidden relative" style={{ background: '#D9CDB6', boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}>
        <div ref={scrollContainerRef} className="w-full h-full overflow-y-auto overflow-x-hidden relative">
          <div className="relative w-full mx-auto" style={{ height: mapHeightTotal, maxWidth: MAP_WIDTH }}>
            {/* Paper textures */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.04' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
              mixBlendMode: 'multiply',
            }} />
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'radial-gradient(ellipse 150% 120% at 50% 50%, transparent 60%, rgba(50,40,20,0.4) 100%)',
            }} />

            {/* Paths */}
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

            {/* Nodes */}
            {positionedNodes.map(node => (
              <MapNodeReadOnly
                key={node.id}
                node={node}
                x={node.x}
                y={node.y}
                isCurrent={store.currentNodeId === node.id}
                isVisited={node.visited === true}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
