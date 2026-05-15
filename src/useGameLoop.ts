import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { createAudioManager } from './audio'
import {
  BARRIER_CLEARANCE,
  CHUNK_COUNT,
  CHUNK_LENGTH,
  COIN_PICKUP_DEPTH,
  CRASH_RESET_MS,
  FIRE_CLEARANCE,
  JUMP_DURATION_MS,
  JUMP_HEIGHT,
  LANES,
  OBSTACLE_HIT_DEPTH,
} from './constants'
import { createItems, resetItem } from './items'
import { createMaterials } from './materials'
import { createRunner } from './runner'
import { createScene } from './scene'
import { createTrack } from './track'
import { type Telemetry } from './types'

export function useGameLoop() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [telemetry, setTelemetry] = useState<Telemetry>({
    distance: 0,
    incline: 4,
    pace: 7.2,
    score: 0,
  })

  useEffect(() => {
    const host = mountRef.current
    if (!host) return

    const audio = createAudioManager()
    const materials = createMaterials()
    const { renderer, scene, camera, world } = createScene(host)
    const chunks = createTrack(world, materials)
    const { runner, body, head, armLeft, armRight, legLeft, legRight } = createRunner(
      scene,
      materials,
    )
    const items = createItems(world, materials)

    const state = {
      animationFrame: 0,
      distance: 0,
      laneTarget: 1,
      score: 0,
      speed: 10.5,
      jumpUntil: 0,
      slideUntil: 0,
      crashUntil: 0,
      lastHud: 0,
      lastFrameTime: performance.now(),
    }

    const resetRun = (now: number) => {
      state.distance = 0
      state.laneTarget = 1
      state.score = 0
      state.jumpUntil = 0
      state.slideUntil = 0
      state.crashUntil = now + CRASH_RESET_MS
      state.lastHud = 0
      runner.position.set(0, 0, 4.1)
      runner.rotation.set(0, 0, 0)
      body.scale.y = 1
      body.position.y = 1.45
      head.position.y = 2.28
      chunks.forEach((chunk, index) => {
        chunk.position.z = -index * CHUNK_LENGTH
      })
      items.forEach((item, index) => {
        resetItem(item, item.kind === 'coin' ? index * 2 : 32 + index * 6)
      })
      setTelemetry({ distance: 0, incline: 4, pace: 7.2, score: 0 })
    }

    const moveLane = (direction: -1 | 1) => {
      state.laneTarget = THREE.MathUtils.clamp(state.laneTarget + direction, 0, 2)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      audio.startAudio()
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') moveLane(-1)
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') moveLane(1)
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w')
        state.jumpUntil = performance.now() + JUMP_DURATION_MS
      if (event.key === ' ') state.jumpUntil = performance.now() + JUMP_DURATION_MS
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's')
        state.slideUntil = performance.now() + 650
    }

    const onPointerDown = (event: PointerEvent) => {
      audio.startAudio()
      const third = host.clientWidth / 3
      if (event.clientY < host.clientHeight * 0.35) {
        state.jumpUntil = performance.now() + JUMP_DURATION_MS
        return
      }
      if (event.clientX < third) moveLane(-1)
      else if (event.clientX > third * 2) moveLane(1)
      else state.slideUntil = performance.now() + 650
    }

    const onResize = () => {
      camera.aspect = host.clientWidth / host.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(host.clientWidth, host.clientHeight)
    }

    window.addEventListener('keydown', onKeyDown)
    host.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', onResize)

    const animate = () => {
      const now = performance.now()
      const delta = Math.min((now - state.lastFrameTime) / 1000, 0.033)
      state.lastFrameTime = now
      const runPhase = now * 0.012
      const speed = state.speed + Math.min(state.distance / 180, 5.8)
      const movement = speed * delta

      state.distance += movement
      for (const chunk of chunks) {
        chunk.position.z += movement
        if (chunk.position.z > CHUNK_LENGTH) chunk.position.z -= CHUNK_LENGTH * CHUNK_COUNT
      }

      const jumping = now < state.jumpUntil
      const sliding = now < state.slideUntil
      const jumpT = jumping ? 1 - (state.jumpUntil - now) / JUMP_DURATION_MS : 0
      const jumpArc = jumping ? Math.sin(jumpT * Math.PI) * JUMP_HEIGHT : 0

      runner.position.x = THREE.MathUtils.lerp(
        runner.position.x,
        LANES[state.laneTarget],
        9 * delta,
      )
      runner.position.y = jumpArc + Math.sin(runPhase) * 0.045
      runner.rotation.z = (LANES[state.laneTarget] - runner.position.x) * 0.06
      body.scale.y = sliding ? 0.62 : 1
      body.position.y = sliding ? 1.05 : 1.45
      head.position.y = sliding ? 1.65 : 2.28
      armLeft.rotation.x = Math.sin(runPhase) * 0.9
      armRight.rotation.x = -Math.sin(runPhase) * 0.9
      legLeft.rotation.x = -Math.sin(runPhase) * 0.75
      legRight.rotation.x = Math.sin(runPhase) * 0.75

      for (const item of items) {
        item.group.position.z += movement
        if (item.kind === 'coin') item.group.rotation.y += delta * 5

        const laneMatch = Math.abs(item.group.position.x - runner.position.x) < 0.82
        const itemDepth = Math.abs(item.group.position.z - runner.position.z)

        if (item.kind === 'coin' && !item.taken && laneMatch && itemDepth < COIN_PICKUP_DEPTH) {
          item.taken = true
          item.group.visible = false
          state.score += 10
          audio.playCoinSound()
        }

        if (
          item.kind !== 'coin' &&
          laneMatch &&
          itemDepth < OBSTACLE_HIT_DEPTH &&
          now > state.crashUntil
        ) {
          const clearsFire = item.kind === 'fire' && jumpArc > FIRE_CLEARANCE
          const clearsBarrier = item.kind === 'barrier' && jumpArc > BARRIER_CLEARANCE
          const clearedByJump = clearsFire || clearsBarrier
          const clearedBySlide = item.kind === 'limbo' && sliding
          if (!clearedByJump && !clearedBySlide) {
            audio.playCrashSound()
            resetRun(now)
            break
          }
        }

        if (item.group.position.z > 13) resetItem(item, item.kind === 'coin' ? 0 : 28)
      }

      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x,
        runner.position.x * 0.28,
        2.8 * delta,
      )
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        5.9 + jumpArc * 0.18,
        2.6 * delta,
      )
      camera.lookAt(runner.position.x * 0.34, 1.45, -18)

      if (now - state.lastHud > 160) {
        state.lastHud = now
        setTelemetry({
          distance: Math.floor(state.distance),
          incline: 4 + Math.round(Math.sin(state.distance * 0.012) * 2),
          pace: Number((7.2 + speed * 0.09).toFixed(1)),
          score: state.score,
        })
      }

      renderer.render(scene, camera)
      state.animationFrame = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      cancelAnimationFrame(state.animationFrame)
      window.removeEventListener('keydown', onKeyDown)
      host.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', onResize)
      host.removeChild(renderer.domElement)
      renderer.dispose()
      audio.cleanup()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose()
      })
      Object.values(materials).forEach((material) => material.dispose())
    }
  }, [])

  return { mountRef, telemetry }
}
