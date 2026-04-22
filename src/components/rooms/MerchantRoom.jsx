// components/rooms/MerchantRoom.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useRunStore from '../../stores/runStore.js'
import { HoverTranslate } from '../shared/HoverTranslate.jsx'
import { CARD_TYPE_META, CARD_RARITY_META } from '../../constants/cardTypes.js'
import { shuffle } from '../../utils/deck.js'
import { ScreenTransition } from '../shared/ScreenTransition.jsx'

const MERCHANT_DIALOGUE = [
  { text: 'いらっしゃいませ！', translation: 'Welcome!' },
  { text: '何が必要ですか？', translation: 'What do you need?' },
  { text: '良い品揃えですよ。', translation: 'I have a fine selection.' },
]

const CARD_PRICES = { common: 40, uncommon: 80, rare: 140 }
const REMOVE_PRICE = 75

export function MerchantRoom() {
  const navigate = useNavigate()
  const store = useRunStore()
  const [shopCards, setShopCards] = useState([])
  const [cardMap, setCardMap] = useState({})
  const [purchased, setPurchased] = useState(new Set())
  const [removeMode, setRemoveMode] = useState(false)
  const [dialogueIdx, setDialogueIdx] = useState(0)
  const [notification, setNotification] = useState(null)

  useEffect(() => {
    import('../../data/japanese/cards.json').then(mod => {
      const allCards = mod.default
      const map = {}
      allCards.forEach(c => { map[c.id] = c })
      setCardMap(map)

      // Sample 1 common, 1 uncommon, 1 rare
      const commons = allCards.filter(c => c.rarity === 'common')
      const uncommons = allCards.filter(c => c.rarity === 'uncommon')
      const rares = allCards.filter(c => c.rarity === 'rare')

      const picked = [
        ...shuffle(commons).slice(0, 1),
        ...shuffle(uncommons).slice(0, 1),
        ...shuffle(rares).slice(0, 1),
      ].filter(Boolean)
      setShopCards(picked)
    })
  }, [])

  // Cycle merchant dialogue
  useEffect(() => {
    const t = setInterval(() => {
      setDialogueIdx(i => (i + 1) % MERCHANT_DIALOGUE.length)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const buyCard = (card) => {
    const price = CARD_PRICES[card.rarity] || 80
    if (store.gold < price) {
      setNotification('Not enough gold!')
      setTimeout(() => setNotification(null), 1500)
      return
    }
    store.spendGold(price)
    store.addCardToDeck(card.id)
    setPurchased(prev => new Set([...prev, card.id]))
    setNotification(`${card.name_native} added to deck!`)
    setTimeout(() => setNotification(null), 1800)
  }

  const removeCard = (cardId) => {
    if (store.gold < REMOVE_PRICE) {
      setNotification('Not enough gold!')
      setTimeout(() => setNotification(null), 1500)
      return
    }
    store.spendGold(REMOVE_PRICE)
    store.removeCardFromDeck(cardId)
    setRemoveMode(false)
    setNotification('Card removed!')
    setTimeout(() => setNotification(null), 1800)
  }

  const dialogue = MERCHANT_DIALOGUE[dialogueIdx]
  const has_compass = store.relics.includes('merchants_scale')

  return (
    <ScreenTransition>
      <div
        className="w-full h-screen flex flex-col overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0a0516 0%, #001a00 100%)' }}
      >
        <div className="absolute inset-0 opacity-15"
          style={{ backgroundImage: 'radial-gradient(ellipse at 50% 30%, #00AA44 0%, transparent 60%)' }}
        />

        <div className="relative z-10 max-w-2xl mx-auto w-full px-4 py-6 flex flex-col h-full">
          {/* Merchant header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="text-5xl">🏮</div>
            <div className="flex-1">
              <div className="text-xl font-bold text-green-200">Mountain Merchant</div>
              <div className="flex items-center gap-2 mt-1">
                <HoverTranslate translation={dialogue.translation} className="text-sm text-green-400 italic">
                  「{dialogue.text}」
                </HoverTranslate>
              </div>
            </div>
            <div className="text-right">
              <div className="text-yellow-400 font-bold text-lg">🪙 {store.gold}</div>
              <div className="text-xs text-gray-500">Gold</div>
            </div>
          </div>

          {/* Shop cards */}
          <div className="flex-1">
            <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">— For Sale —</h2>
            <div className="flex gap-4 flex-wrap">
              {shopCards.map((card) => {
                const typeMeta = CARD_TYPE_META[card.type] || {}
                const rarityMeta = CARD_RARITY_META[card.rarity] || {}
                const price = Math.floor((CARD_PRICES[card.rarity] || 80) * (has_compass ? 0.8 : 1))
                const isSold = purchased.has(card.id)
                const canAfford = store.gold >= price

                return (
                  <div key={card.id} className="flex flex-col items-center gap-2">
                    <div
                      className={`
                        w-36 p-3 rounded-xl border-2 ${rarityMeta.borderClass}
                        ${typeMeta.bgClass} transition-all
                        ${isSold ? 'opacity-40' : ''}
                      `}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm">{typeMeta.icon}</span>
                        <span className={`text-xs font-bold ${rarityMeta.gemClass?.replace('bg-', 'text-')}`}>
                          {card.rarity}
                        </span>
                      </div>
                      <div className={`font-bold text-sm ${typeMeta.colorClass} mb-1`}>
                        <HoverTranslate translation={card.name_native}>{card.name_target}</HoverTranslate>
                      </div>
                      <div className="text-xs text-gray-400 mb-1">Cost: {card.energy_cost} energy</div>
                      <div className="text-xs text-gray-300">{getEffectSummary(card)}</div>
                    </div>

                    <motion.button
                      whileHover={!isSold && canAfford ? { scale: 1.05 } : {}}
                      whileTap={!isSold && canAfford ? { scale: 0.95 } : {}}
                      onClick={() => !isSold && buyCard(card)}
                      disabled={isSold || !canAfford}
                      className={`
                        px-4 py-1.5 rounded-lg text-sm font-bold border transition-all
                        ${isSold ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-default' :
                          canAfford ? 'bg-green-900/60 border-green-600 text-green-200 hover:bg-green-800/60 cursor-pointer' :
                          'bg-gray-800 border-gray-700 text-gray-600 cursor-default opacity-60'}
                      `}
                    >
                      {isSold ? '✓ Sold' : `🪙 ${price}`}
                    </motion.button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Remove card service */}
          <div className="border-t border-gray-800 pt-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-300">Remove a Card</div>
                <div className="text-xs text-gray-500">Permanently remove a card from your deck</div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setRemoveMode(!removeMode)}
                disabled={store.gold < REMOVE_PRICE}
                className={`
                  px-4 py-2 rounded-lg text-sm border transition-all
                  ${store.gold >= REMOVE_PRICE
                    ? 'bg-red-950/60 border-red-700 text-red-300 hover:bg-red-900/60 cursor-pointer'
                    : 'bg-gray-800 border-gray-700 text-gray-600 cursor-default opacity-50'}
                `}
              >
                🪙 {REMOVE_PRICE} — Remove
              </motion.button>
            </div>

            {/* Remove mode: show deck */}
            {removeMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-3 max-h-32 overflow-y-auto"
              >
                <div className="flex flex-wrap gap-2">
                  {store.deck.map((cardId, i) => {
                    const card = cardMap[cardId]
                    if (!card) return null
                    return (
                      <button
                        key={i}
                        onClick={() => removeCard(cardId)}
                        className="text-xs px-2 py-1 bg-red-950/40 border border-red-800 rounded text-red-200 hover:bg-red-900/60"
                      >
                        {card.name_native}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </div>

          {/* Leave button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/map')}
            className="w-full py-3 rounded-xl border border-gray-700 bg-gray-800/40 text-gray-300 hover:bg-gray-700/40 transition-all font-medium"
          >
            Leave Shop
          </motion.button>
        </div>

        {/* Notification toast */}
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-700 text-white text-sm px-4 py-2 rounded-xl shadow-xl z-50"
          >
            {notification}
          </motion.div>
        )}
      </div>
    </ScreenTransition>
  )
}

function getEffectSummary(card) {
  const e = card.effect || {}
  const parts = []
  if (e.damage) parts.push(`${e.damage} dmg`)
  if (e.block) parts.push(`${e.block} block`)
  if (e.heal) parts.push(`heal ${e.heal}`)
  if (e.draw) parts.push(`draw ${e.draw}`)
  return parts.join(' / ') || 'Special'
}
