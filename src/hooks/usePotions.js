// hooks/usePotions.js
// Resolves potion effects and applies them to runStore immediately.
// Called by PotionSlots when a player clicks a potion.

import { useCallback } from 'react'
import useRunStore from '../stores/runStore.js'
import { POTIONS } from '../data/potions.js'
import { drawCards } from '../utils/deck.js'

export function usePotions({ isQuestionOpen = false, playSFX } = {}) {
  const store = useRunStore()

  const usePotion = useCallback((index) => {
    // Block use during active question prompt
    if (isQuestionOpen) return false

    const s = useRunStore.getState()
    const potionId = s.potions[index]
    if (!potionId) return false

    const potion = POTIONS[potionId]
    if (!potion) return false

    const { effect } = potion

    switch (effect.type) {
      case 'heal':
        s.healHp(effect.value)
        playSFX?.('correct')
        break

      case 'gain_energy':
        // Capped at max energy
        useRunStore.setState(st => ({
          energy: Math.min(st.maxEnergy, st.energy + effect.value)
        }))
        playSFX?.('chain_activate')
        break

      case 'gain_energy_exceed':
        // Can exceed max — up to 6
        useRunStore.setState(st => ({
          energy: Math.min(6, st.energy + effect.value)
        }))
        playSFX?.('chain_activate')
        break

      case 'gain_block':
        s.addBlock(effect.value)
        playSFX?.('button_click')
        break

      case 'heal_and_block':
        s.healHp(effect.heal)
        s.addBlock(effect.block)
        playSFX?.('correct')
        break

      case 'clarity':
        s.setPotionEffect('clarityActive', true)
        playSFX?.('button_click')
        break

      case 'activate_chain': {
        // Activate chain immediately — next card gets bonus regardless of type
        const lastType = s.lastCardTypePlayed || 'vocabulary'
        s.activateChain(lastType)
        s.setPotionEffect('echoTonicActive', false) // just chain, not echo
        playSFX?.('chain_activate')
        break
      }

      case 'freeze_timer':
        s.setPotionEffect('memoryFlaskActive', true)
        playSFX?.('button_click')
        break

      case 'clear_debuffs':
        useRunStore.setState({ activePlayerDebuffs: [] })
        playSFX?.('correct')
        break

      case 'echo_next_card':
        s.setPotionEffect('echoTonicActive', true)
        playSFX?.('chain_activate')
        break

      case 'pull_from_discard': {
        const fresh = useRunStore.getState()
        if (fresh.discardPile.length === 0) return false
        const randomIdx = Math.floor(Math.random() * fresh.discardPile.length)
        const pulled = fresh.discardPile[randomIdx]
        const newDiscard = fresh.discardPile.filter((_, i) => i !== randomIdx)
        useRunStore.setState({
          hand: [...fresh.hand, pulled],
          discardPile: newDiscard,
        })
        playSFX?.('card_draw_vocab')
        break
      }

      case 'auto_correct':
        s.setPotionEffect('autoCorrectActive', true)
        playSFX?.('chain_activate')
        break

      case 'scholars_blood':
        s.setPotionEffect('scholarsBloodActive', true)
        playSFX?.('correct')
        break

      case 'graveyard_dust': {
        // Draw 1 card
        const fresh = useRunStore.getState()
        if (fresh.deck.length > 0 || fresh.discardPile.length > 0) {
          const { drawn, deck: newDeck, discard: newDiscard } = drawCards(
            fresh.deck, fresh.discardPile, 1
          )
          useRunStore.setState({
            hand: [...fresh.hand, ...drawn],
            deck: newDeck,
            discardPile: newDiscard,
          })
        }
        // Graveyard advancement is handled by the graveyard store separately
        playSFX?.('correct')
        break
      }

      default:
        break
    }

    // Consume the potion
    s.removePotionByIndex(index)
    return true
  }, [isQuestionOpen, playSFX])

  return { usePotion }
}
