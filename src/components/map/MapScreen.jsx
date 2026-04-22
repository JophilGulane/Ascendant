// components/map/MapScreen.jsx
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import { generateFloorMap, unlockNextNodes, visitNode } from '../../utils/map.js'
import { NODE_TYPES } from '../../constants/nodeTypes.js'
import { MapNode } from './MapNode.jsx'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'
import enemiesData from '../../data/japanese/enemies.json'
import eventsData from '../../data/japanese/events.json'

export function MapScreen() {
  const navigate = useNavigate()
  const store = useRunStore()

  // Generate map if not yet generated
  useEffect(() => {
    if (!store.mapNodes || store.mapNodes.length === 0) {
      const { nodes, paths } = generateFloorMap(store.floor, store.masteryLevel)
      store.setMap(nodes, paths)
    }
  }, [store.floor])

  // Group nodes by row for rendering
  const nodesByRow = useMemo(() => {
    const grouped = {}
    for (const node of store.mapNodes || []) {
      if (!grouped[node.row]) grouped[node.row] = []
      grouped[node.row].push(node)
    }
    return grouped
  }, [store.mapNodes])

  const sortedRows = useMemo(() =>
    Object.keys(nodesByRow).map(Number).sort((a, b) => a - b),
    [nodesByRow]
  )

  const handleNodeClick = (node) => {
    // Mark node visited, unlock next nodes
    const updatedNodes = visitNode(store.mapNodes, node.id)
    const unlockedNodes = unlockNextNodes(updatedNodes, store.mapPaths, node.id)
    store.setMapNodes(unlockedNodes)
    store.setCurrentNode(node.id)

    // Route to correct room
    switch (node.type) {
      case NODE_TYPES.COMBAT:
      case NODE_TYPES.ELITE: {
        // Pick an enemy appropriate for this floor
        const floorEnemies = enemiesData.filter(e =>
          e.floor === store.floor &&
          (node.type === NODE_TYPES.ELITE ? e.tier === 'elite' : e.tier === 'regular') &&
          e.tier !== 'boss'
        )
        const fallbackEnemies = enemiesData.filter(e => e.floor === store.floor && e.tier !== 'boss')
        const pool = floorEnemies.length > 0 ? floorEnemies : fallbackEnemies
        const enemy = pool[Math.floor(Math.random() * pool.length)]
        if (enemy) store.setEnemy(enemy)
        navigate('/combat')
        break
      }
      case NODE_TYPES.BOSS: {
        // Primary: find boss for this exact floor. Fallback: any boss in dataset.
        const boss = enemiesData.find(e => e.floor === store.floor && e.tier === 'boss')
          || enemiesData.find(e => e.tier === 'boss')
        if (boss) store.setEnemy(boss)
        navigate('/combat')
        break
      }
      case NODE_TYPES.REST:
        navigate('/rest')
        break
      case NODE_TYPES.MERCHANT:
        navigate('/merchant')
        break
      case NODE_TYPES.EVENT: {
        const floorEvents = eventsData.filter(e => e.floor_tier <= store.floor)
        const event = floorEvents[Math.floor(Math.random() * floorEvents.length)]
        if (event) {
          // Store event in sessionStorage temporarily
          sessionStorage.setItem('lq_current_event', JSON.stringify(event))
        }
        navigate('/event')
        break
      }
      default:
        break
    }
  }

  return (
    <ScreenTransition>
      <div
        className="relative w-full h-screen flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0a0516 0%, #100720 50%, #0d0d0d 100%)' }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(ellipse at 50% 20%, #C41E3A 0%, transparent 60%)' }}
        />

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-bold text-white">
              Floor {store.floor}
              <span className="text-gray-500 text-sm ml-2">of {store.campaign === 'japanese' ? 2 : 4}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5">山の巡礼 — The Mountain Pilgrimage</div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-yellow-400">🪙 {store.gold}</span>
            <span className="text-red-400">❤️ {store.hp}/{store.maxHp}</span>
          </div>
        </div>

        {/* Map — rendered bottom-to-top so player moves upward */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-4 py-6 gap-4">
          {[...sortedRows].reverse().map(rowNum => (
            <motion.div
              key={rowNum}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: rowNum * 0.05 }}
              className="flex gap-3 justify-center w-full"
            >
              {nodesByRow[rowNum].map(node => (
                <MapNode
                  key={node.id}
                  node={node}
                  onNavigate={handleNodeClick}
                  isCurrentNode={store.currentNodeId === node.id}
                />
              ))}
            </motion.div>
          ))}
        </div>

        {/* Footer — deck size, relic count */}
        <div className="flex items-center justify-center gap-4 pb-4 text-xs text-gray-500">
          <span>📚 Deck: {store.deck.length + store.hand.length + store.discardPile.length} cards</span>
          <span>💎 Relics: {store.relics.length}</span>
        </div>
      </div>
    </ScreenTransition>
  )
}
