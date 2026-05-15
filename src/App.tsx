import { useGameLoop } from './useGameLoop'
import { Hud } from './Hud'
import './App.css'

function App() {
  const { mountRef, telemetry } = useGameLoop()

  return (
    <main className="runner-shell">
      <div ref={mountRef} className="runner-canvas" aria-label="Temple runner game viewport" />
      <Hud telemetry={telemetry} />
    </main>
  )
}

export default App
