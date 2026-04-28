// utils/dataLoader.js
// Synchronously load small JSON datasets based on campaign

import jpEnemies from '../data/japanese/enemies.json'
import jpEvents from '../data/japanese/events.json'
import jpRelics from '../data/japanese/relics.json'

import krEnemies from '../data/korean/enemies.json'
import krEvents from '../data/korean/events.json'
import krRelics from '../data/korean/relics.json'

import esEnemies from '../data/spanish/enemies.json'
import esEvents from '../data/spanish/events.json'
import esRelics from '../data/spanish/relics.json'

import { tryGetCustomEnemies } from './customCampaignLoader.js'

export function getEnemies(campaignId) {
  // Transparent custom campaign branch — returns teacher-built enemies if applicable
  const custom = tryGetCustomEnemies(campaignId)
  if (custom !== null) return custom

  if (campaignId === 'korean') return krEnemies
  if (campaignId === 'spanish') return esEnemies
  return jpEnemies
}

export function getEvents(campaignId) {
  if (campaignId === 'korean') return krEvents
  if (campaignId === 'spanish') return esEvents
  return jpEvents
}

export function getRelics(campaignId) {
  if (campaignId === 'korean') return krRelics
  if (campaignId === 'spanish') return esRelics
  return jpRelics
}
