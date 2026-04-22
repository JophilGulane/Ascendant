// components/map/MapNode.jsx
import { motion } from 'framer-motion'
import { NODE_TYPE_META } from '../../constants/nodeTypes.js'

export function MapNode({ node, onNavigate, isCurrentNode }) {
  const meta = NODE_TYPE_META[node.type] || NODE_TYPE_META['combat']

  const canClick = node.available && !node.visited

  return (
    <motion.button
      whileHover={canClick ? { scale: 1.1 } : {}}
      whileTap={canClick ? { scale: 0.95 } : {}}
      onClick={() => canClick && onNavigate?.(node)}
      className={`
        relative flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all
        ${node.visited ? 'opacity-40 border-gray-700 bg-gray-900/40 cursor-default' : ''}
        ${node.available && !node.visited
          ? `${meta.bgColor}/40 border-yellow-500/60 cursor-pointer shadow-lg shadow-yellow-500/20`
          : ''}
        ${!node.available && !node.visited ? 'border-gray-700/30 bg-gray-900/20 cursor-default opacity-50' : ''}
        ${isCurrentNode ? 'border-white ring-2 ring-white/20' : ''}
      `}
      disabled={!canClick}
      style={{ minWidth: 52 }}
    >
      {/* Glow ring for available nodes */}
      {node.available && !node.visited && (
        <motion.div
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-xl border border-yellow-400/40 pointer-events-none"
        />
      )}

      <span className="text-2xl">{meta.icon}</span>
      <span className={`text-[9px] font-medium ${node.available && !node.visited ? meta.color : 'text-gray-600'}`}>
        {meta.label}
      </span>

      {/* Visited checkmark */}
      {node.visited && (
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-gray-600 rounded-full text-[8px] flex items-center justify-center">✓</span>
      )}
    </motion.button>
  )
}
