// hooks/useEnemyTurn.js — v2
// Executes the enemy's full action chain sequentially after the player ends their turn.
// Returns { executeEnemyTurn, isExecuting, currentAction }
// currentAction is passed to EnemyTurnResolver for animation display.

import { useState, useCallback } from 'react'
import useRunStore from '../stores/runStore.js'
import { useAudio } from './useAudio.js'
import { resolveEnemyAction } from '../utils/enemyTurn.js'

const ACTION_DELAY_MS = 700 // pause between sequential actions

export function useEnemyTurn({ onTurnComplete } = {}) {
  const store = useRunStore()
  const { playSFX } = useAudio()

  const [isExecuting, setIsExecuting] = useState(false)
  const [currentAction, setCurrentAction] = useState(null) // { icon, message, type }

  const executeEnemyTurn = useCallback(async () => {
    const s = useRunStore.getState()
    const { currentEnemy, intentIndex } = s
    if (!currentEnemy) return

    setIsExecuting(true)

    // Get the action list for this intent slot (array of move strings)
    const actionList = currentEnemy.intent_pattern[intentIndex % currentEnemy.intent_pattern.length] || ['strike']

    playSFX?.('enemy_turn_start')

    // Execute each action in sequence with a gap between them
    for (const action of actionList) {
      const freshStore = useRunStore.getState()
      const result = await resolveEnemyAction(action, currentEnemy, freshStore, playSFX)
      setCurrentAction(result)
      await new Promise(r => setTimeout(r, ACTION_DELAY_MS))
    }

    // Post-turn bookkeeping — always read fresh state
    const sAfter = useRunStore.getState()
    sAfter.advanceIntent()
    sAfter.clearEnemyBuffs()       // wrong-answer buffs consumed
    sAfter.tickPlayerDebuffs()     // debuff durations tick down
    sAfter.unlockAllCards()        // locked cards unlock for next player turn

    // Brief pause so the last action animation is visible
    await new Promise(r => setTimeout(r, 400))

    setCurrentAction(null)
    setIsExecuting(false)

    onTurnComplete?.()
  }, [playSFX, onTurnComplete])

  return { executeEnemyTurn, isExecuting, currentAction }
}
