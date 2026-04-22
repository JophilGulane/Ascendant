// utils/map.js
// Map generation — Slay the Spire accurate pathing and node constraints

import { NODE_TYPES } from '../constants/nodeTypes.js'

export function generateFloorMap(floor, masteryLevel = 0) {
  const ROWS = 15 // STS Acts have exactly 15 floors of content before the boss
  const COLS = 7  // STS maps are exactly 7 columns wide

  const nodesMap = {} // `${row},${col}` -> MapNode
  const paths = [] // [fromId, toId]

  // 1. Initialize grid
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      nodesMap[`${r},${c}`] = {
        id: `node_${r}_${c}`,
        type: NODE_TYPES.COMBAT, // placeholder
        row: r,
        col: c,
        available: false,
        visited: false,
      }
    }
  }

  // 2. Generate Paths (STS Style Walkers)
  // Slay the spire typically spawns 6 starting paths
  const startCols = [0, 1, 2, 4, 5, 6]
  let currentPositions = [...startCols]

  for (let r = 0; r < ROWS - 1; r++) {
    const nextPositions = []
    const connections = [] // Track { fromCol, toCol } to prevent crossing

    for (const c of currentPositions) {
      const choices = []
      if (c > 0) choices.push(c - 1)
      choices.push(c)
      if (c < COLS - 1) choices.push(c + 1)

      // Prevent crossing lines
      const minCol = connections.length > 0 ? connections[connections.length - 1].toCol : 0
      let validChoices = choices.filter(choice => choice >= minCol)
      if (validChoices.length === 0) validChoices = [c]

      // 1 or 2 connections (rarely 3, keeping to 1-2 for cleanliness)
      const numConnections = Math.random() < 0.35 && validChoices.length >= 2 ? 2 : 1
      const selectedChoices = []
      
      for (let i = 0; i < numConnections; i++) {
        if (validChoices.length === 0) break
        const idx = Math.floor(Math.random() * validChoices.length)
        selectedChoices.push(validChoices[idx])
        validChoices.splice(idx, 1)
      }

      // CRITICAL: Sort to prevent the next iteration from thinking minCol is lower than it is
      selectedChoices.sort((a, b) => a - b)

      for (const nextCol of selectedChoices) {
        connections.push({ fromCol: c, toCol: nextCol })
        if (!nextPositions.includes(nextCol)) {
          nextPositions.push(nextCol)
        }
        paths.push([`node_${r}_${c}`, `node_${r+1}_${nextCol}`])
      }
    }
    currentPositions = nextPositions.sort((a,b) => a-b)
  }

  // 3. Filter unused nodes and build parents map
  const usedIds = new Set()
  const parentsMap = {} // childId -> array of parent nodes
  
  paths.forEach(([from, to]) => {
    usedIds.add(from)
    usedIds.add(to)
    if (!parentsMap[to]) parentsMap[to] = []
    parentsMap[to].push(nodesMap[from.replace('node_', '').replace('_', ',')])
  })

  // Add the final Boss node (Row 15)
  const bossId = 'node_boss'
  nodesMap['boss'] = {
    id: bossId,
    type: NODE_TYPES.BOSS,
    row: ROWS,
    col: 3, // Centered
    available: false,
    visited: false,
  }

  // 4. Assign Node Types with STS Constraints
  // Row 0 is Floor 1, Row 14 is Floor 15 (pre-boss rest)
  const finalNodes = []
  
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const node = nodesMap[`${r},${c}`]
      if (!usedIds.has(node.id)) continue

      if (r === 0) {
        // Floor 1: Always available, always Combat
        node.type = NODE_TYPES.COMBAT
        node.available = true
      } else if (r === ROWS - 1) {
        // Floor 15: Always Rest Site
        node.type = NODE_TYPES.REST
      } else if (r === Math.floor(ROWS / 2)) {
        // Middle of act (STS Treasure room replacement)
        node.type = Math.random() > 0.5 ? NODE_TYPES.REST : NODE_TYPES.MERCHANT
      } else {
        // Standard random assignment with constraints
        const parents = parentsMap[node.id] || []
        const parentTypes = parents.map(p => p.type)
        
        node.type = pickValidNodeType(r, parentTypes)
      }
      
      finalNodes.push(node)
      
      // Connect row 14 to Boss
      if (r === ROWS - 1) {
        paths.push([node.id, bossId])
      }
    }
  }

  finalNodes.push(nodesMap['boss'])

  return { nodes: finalNodes, paths }
}

function pickValidNodeType(row, parentTypes) {
  // STS Rules:
  // - No back-to-back Rest Sites, Merchants, or Elites on any path
  // - Elites only spawn on Floor 6 (row 5) or later
  
  const canBeRest = !parentTypes.includes(NODE_TYPES.REST)
  const canBeMerchant = !parentTypes.includes(NODE_TYPES.MERCHANT)
  const canBeElite = row >= 5 && !parentTypes.includes(NODE_TYPES.ELITE)

  // STS approximate spawn weights
  let weights = {
    [NODE_TYPES.COMBAT]: 45,
    [NODE_TYPES.EVENT]: 22,
    [NODE_TYPES.MERCHANT]: canBeMerchant ? 12 : 0,
    [NODE_TYPES.REST]: canBeRest ? 12 : 0,
    [NODE_TYPES.ELITE]: canBeElite ? 16 : 0,
  }

  // Calculate total weight and pick
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let rand = Math.random() * total

  for (const [type, weight] of Object.entries(weights)) {
    if (weight === 0) continue
    rand -= weight
    if (rand <= 0) return type
  }
  
  return NODE_TYPES.COMBAT
}

export function unlockNextNodes(nodes, paths, currentNodeId) {
  const reachable = paths
    .filter(([from]) => from === currentNodeId)
    .map(([, to]) => to)

  return nodes.map(n => ({
    ...n,
    available: reachable.includes(n.id) ? true : n.available,
  }))
}

export function visitNode(nodes, nodeId) {
  const visitedNode = nodes.find(n => n.id === nodeId)
  const visitedRow = visitedNode?.row

  return nodes.map(n => {
    if (n.id === nodeId) {
      return { ...n, visited: true, available: false }
    }
    if (n.row === visitedRow && n.available) {
      return { ...n, available: false }
    }
    return n
  })
}
