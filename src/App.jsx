// App.jsx — React Router routing shell
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { MainMenu } from './components/menus/MainMenu.jsx'
import { CharacterSelect } from './components/menus/CharacterSelect.jsx'
import { MapScreen } from './components/map/MapScreen.jsx'
import { CombatScreen } from './components/combat/CombatScreen.jsx'
import { RestRoom } from './components/rooms/RestRoom.jsx'
import { MerchantRoom } from './components/rooms/MerchantRoom.jsx'
import { EventRoom } from './components/rooms/EventRoom.jsx'
import { PostRunSummary } from './components/menus/PostRunSummary.jsx'

export default function App() {
  const location = useLocation()

  return (
    <div className="w-full h-screen overflow-hidden bg-[#0d0d0d]">
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
          {/* Fallback */}
          <Route path="*" element={<MainMenu />} />
        </Routes>
      </AnimatePresence>
    </div>
  )
}
