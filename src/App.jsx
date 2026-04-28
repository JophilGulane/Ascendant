// App.jsx — React Router routing shell
import { Suspense, lazy } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

const MainMenu = lazy(() => import('./components/menus/MainMenu.jsx').then(m => ({ default: m.MainMenu })))
const CharacterSelect = lazy(() => import('./components/menus/CharacterSelect.jsx').then(m => ({ default: m.CharacterSelect })))
const MapScreen = lazy(() => import('./components/map/MapScreen.jsx').then(m => ({ default: m.MapScreen })))
const CombatScreen = lazy(() => import('./components/combat/CombatScreen.jsx').then(m => ({ default: m.CombatScreen })))
const RestRoom = lazy(() => import('./components/rooms/RestRoom.jsx').then(m => ({ default: m.RestRoom })))
const MerchantRoom = lazy(() => import('./components/rooms/MerchantRoom.jsx').then(m => ({ default: m.MerchantRoom })))
const EventRoom = lazy(() => import('./components/rooms/EventRoom.jsx').then(m => ({ default: m.EventRoom })))
const PostRunSummary = lazy(() => import('./components/menus/PostRunSummary.jsx').then(m => ({ default: m.PostRunSummary })))
const GraveyardScreen = lazy(() => import('./components/menus/GraveyardScreen.jsx').then(m => ({ default: m.GraveyardScreen })))
const ModifierSelect = lazy(() => import('./components/menus/ModifierSelect.jsx').then(m => ({ default: m.ModifierSelect })))
const PantheonScreen = lazy(() => import('./components/menus/PantheonScreen.jsx').then(m => ({ default: m.PantheonScreen })))
const LeaderboardScreen = lazy(() => import('./components/leaderboard/LeaderboardScreen.jsx').then(m => ({ default: m.LeaderboardScreen })))

function LoadingFallback() {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-[#0d0d0d]">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-gray-700 border-t-amber-500 rounded-full" />
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <div className="w-full h-screen overflow-hidden bg-[#0d0d0d]">
      <Suspense fallback={<LoadingFallback />}>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<MainMenu />} />
            <Route path="/character-select" element={<CharacterSelect />} />
            <Route path="/map" element={<MapScreen />} />
            <Route path="/combat" element={<CombatScreen />} />
            <Route path="/rest" element={<RestRoom />} />
            <Route path="/merchant" element={<MerchantRoom />} />
            <Route path="/event" element={<EventRoom />} />
            <Route path="/summary" element={<PostRunSummary />} />
            <Route path="/graveyard" element={<GraveyardScreen />} />
            <Route path="/modifier-select" element={<ModifierSelect />} />
            <Route path="/pantheon" element={<PantheonScreen />} />
            <Route path="/leaderboard" element={<LeaderboardScreen />} />
            {/* Fallback */}
            <Route path="*" element={<MainMenu />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
    </div>
  )
}
