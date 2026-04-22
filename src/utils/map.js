// utils/map.js
// Map generation — floors, node placement, path branching
// Always guarantees: ≥1 rest site and ≥1 merchant per floor, boss always after rest node

import { NODE_TYPES } from '../constants/nodeTypes.js'
import { shuffle } from './deck.js'

/**
 * Generate a full floor map
 * @param {number} floor - floor number (1-4)
 * @param {number} masteryLevel
 * @returns {{ nodes: MapNode[], paths: [string, string][] }}
 *
 * MapNode: { id, type, row, col, available, visited }
 * paths: arrays of [fromId, toId]
 */
export function generateFloorMap(floor, masteryLevel = 0) {
  const rows = 6 // rows of nodes before boss
  const cols = 3 // branching paths

  const nodes = []
  const paths = []

  // Row 0: Single start node
  const startNode = {
    id: `node_start`,
    type: NODE_TYPES.START,
    row: 0,
    col: 1,
    available: true,
    visited: false,
  }
  nodes.push(startNode)

  // Rows 1-5: Content nodes
  // Guaranteed slots to place (injected at tracked positions)
  let restPlaced = false
  let merchantPlaced = false

  for (let row = 1; row <= rows; row++) {
    if (row === rows) break // row 5 reserved for pre-boss rest

    const colCount = row <= 2 ? 3 : row <= 4 ? 2 : 3 // slight variation
    for (let col = 0; col < colCount; col++) {
      const type = pickNodeType(floor, masteryLevel, { restPlaced, merchantPlaced, row, rows })
      if (type === NODE_TYPES.REST) restPlaced = true
      if (type === NODE_TYPES.MERCHANT) merchantPlaced = true

      nodes.push({
        id: `node_${row}_${col}`,
        type,
        row,
        col,
        available: false,
        visited: false,
      })
    }
  }

  // Pre-boss rest (always)
  nodes.push({
    id: 'node_preboss_rest',
    type: NODE_TYPES.REST,
    row: rows,
    col: 1,
    available: false,
    visited: false,
  })

  // Boss node
  nodes.push({
    id: 'node_boss',
    type: NODE_TYPES.BOSS,
    row: rows + 1,
    col: 1,
    available: false,
    visited: false,
  })

  // Create paths: connect start to row1, row rows to rows, ending at boss
  const nodesByRow = {}
  for (const node of nodes) {
    if (!nodesByRow[node.row]) nodesByRow[node.row] = []
    nodesByRow[node.row].push(node)
  }

  const sortedRows = Object.keys(nodesByRow).map(Number).sort((a, b) => a - b)
  for (let ri = 0; ri < sortedRows.length - 1; ri++) {
    const thisRowNodes = nodesByRow[sortedRows[ri]]
    const nextRowNodes = nodesByRow[sortedRows[ri + 1]]

    for (const from of thisRowNodes) {
      // Each node connects to 1-2 nodes in the next row
      const targets = nextRowNodes.length === 1
        ? nextRowNodes
        : shuffle([...nextRowNodes]).slice(0, Math.min(2, nextRowNodes.length))
      for (const to of targets) {
        paths.push([from.id, to.id])
      }
    }
  }

  // Make row-1 nodes available from start
  for (const node of nodesByRow[1] || []) {
    node.available = true
  }

  return { nodes, paths }
}

/**
 * Determine node type based on weights and guarantees
 */
function pickNodeType(floor, masteryLevel, { restPlaced, merchantPlaced, row, rows }) {
  // If nearing end without rest/merchant, force them
  const isLastContentRow = row >= rows - 1
  if (isLastContentRow && !restPlaced) return NODE_TYPES.REST
  if (isLastContentRow && !merchantPlaced) return NODE_TYPES.MERCHANT

  const weights = getNodeWeights(floor)
  const total = Object.values(weights).reduce((a, b) => a + b, 0)
  let rand = Math.random() * total

  for (const [type, weight] of Object.entries(weights)) {
    rand -= weight
    if (rand <= 0) return type
  }
  return NODE_TYPES.COMBAT
}

function getNodeWeights(floor) {
  if (floor >= 3) {
    return {
      [NODE_TYPES.COMBAT]: 30,
      [NODE_TYPES.ELITE]: 25,
      [NODE_TYPES.REST]: 20,
      [NODE_TYPES.MERCHANT]: 15,
      [NODE_TYPES.EVENT]: 10,
    }
  }
  return {
    [NODE_TYPES.COMBAT]: 40,
    [NODE_TYPES.ELITE]: 15,
    [NODE_TYPES.REST]: 20,
    [NODE_TYPES.MERCHANT]: 15,
    [NODE_TYPES.EVENT]: 10,
  }
}

/**
 * Mark reachable nodes from the current node as available
 * Also locks any remaining available nodes in the current row (you chose your path)
 * @param {MapNode[]} nodes
 * @param {[string, string][]} paths
 * @param {string} currentNodeId
 * @returns {MapNode[]} updated nodes
 */
export function unlockNextNodes(nodes, paths, currentNodeId) {
  const reachable = paths
    .filter(([from]) => from === currentNodeId)
    .map(([, to]) => to)

  return nodes.map(n => ({
    ...n,
    available: reachable.includes(n.id) ? true : n.available,
  }))
}

/**
 * Mark a node as visited AND lock all sibling nodes at the same row.
 * Once you walk into a room, the other doors in that row close.
 */
export function visitNode(nodes, nodeId) {
  const visitedNode = nodes.find(n => n.id === nodeId)
  const visitedRow = visitedNode?.row

  return nodes.map(n => {
    if (n.id === nodeId) {
      // This node: mark visited
      return { ...n, visited: true, available: false }
    }
    if (n.row === visitedRow && n.available) {
      // Sibling at same row: lock it — you chose your path
      return { ...n, available: false }
    }
    return n
  })
}
