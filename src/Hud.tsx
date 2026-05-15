import { type Telemetry } from './types'

type HudProps = {
  telemetry: Telemetry
}

export function Hud({ telemetry }: HudProps) {
  return (
    <>
      <section className="hud hud-left" aria-label="Run telemetry">
        <p className="hud-label">Ruins Run</p>
        <div className="hud-row">
          <span>{telemetry.distance} m</span>
          <span>{telemetry.score} pts</span>
        </div>
      </section>
      <section className="hud hud-right" aria-label="Treadmill preview">
        <div>
          <p className="hud-label">Treadmill</p>
          <strong>{telemetry.pace.toFixed(1)} km/h</strong>
        </div>
        <div>
          <p className="hud-label">Incline</p>
          <strong>{telemetry.incline}%</strong>
        </div>
      </section>
      <div className="lane-hints" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </>
  )
}
