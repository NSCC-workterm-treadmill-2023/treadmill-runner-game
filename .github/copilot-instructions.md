# Copilot Instructions

## Commands

```bash
pnpm dev          # start dev server (Vite HMR)
pnpm build        # tsc -b && vite build
pnpm lint         # eslint .
pnpm preview      # serve the dist/ build
```

There are no tests.

## Architecture

This is a single-file Three.js runner game. All game logic lives in `src/App.tsx` (~750 lines) inside a single `useEffect`. React's role is minimal — it owns only the `telemetry` state displayed in the HUD; everything else (scene, physics, input, audio) is imperative Three.js code inside the effect.

**Key subsystems inside the effect:**

- **Scene setup** — renderer, camera, lights, shared `materials` object (all `MeshStandardMaterial` instances keyed by name).
- **Track** — 18 `THREE.Group` chunks (`CHUNK_COUNT × CHUNK_LENGTH`) recycled in a ring. `decorateChunk()` builds geometry based on `index % N` patterns.
- **Items** — 28 coins + 6 obstacles (`TrackItem[]`). Each item is reset via `resetItem()` when it scrolls past the camera, spawning far ahead at a random lane.
- **Runner** — a `THREE.Group` of primitive meshes. Animation is done by mutating `position`, `rotation`, and `scale` each frame — no skeleton/bones.
- **Game loop** — `requestAnimationFrame` loop in `animate()`. Speed increases with distance (`state.speed + min(distance/180, 5.8)`). HUD syncs every 160 ms via `setTelemetry`.
- **Audio** — Web Audio API nodes created lazily on first interaction (`startAudio()`). Background music uses persistent `OscillatorNode`s; coin/crash effects use short transient nodes.
- **Input** — keyboard (`ArrowKeys`/`WASD`/`Space`) and pointer (tap zones: top third = jump, left/right thirds = lane change, center = slide).

## Key Conventions

- **All shared materials** are defined once in the `materials` object and reused — never create new `MeshStandardMaterial` instances inline for recurring geometry.
- **`makeBox` / `makeCylinder`** are local factory helpers that set `castShadow`/`receiveShadow` automatically. Use them instead of `new THREE.Mesh(...)` directly.
- **Obstacle visual cues** — fire/barrier get a `makeJumpCue()` marker (yellow chevrons); limbo gets `makeSlideCue()` (cyan chevrons). Add cues to any new obstacle type that requires a specific evasion action.
- **`LANES`** is the single source of truth for X positions (`[-3.1, 0, 3.1]`). `state.laneTarget` is an index (0–2), not a world coordinate.
- **Collision constants** (`FIRE_CLEARANCE`, `BARRIER_CLEARANCE`, `COIN_PICKUP_DEPTH`, `OBSTACLE_HIT_DEPTH`) are module-level — adjust them here, not inline.
- **Cleanup in the effect return** must dispose every geometry (`scene.traverse`), every material (`Object.values(materials)`), cancel the animation frame, and stop all audio nodes.
- **No routing, no state manager, no CSS-in-JS.** Styles live in `App.css` with BEM-like class names (`.runner-shell`, `.hud`, `.hud-left`, `.hud-row`, etc.).
