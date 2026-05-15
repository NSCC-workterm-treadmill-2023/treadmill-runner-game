import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import './App.css'

type Telemetry = {
  distance: number
  incline: number
  pace: number
  score: number
}

type TrackItem = {
  group: THREE.Group
  lane: number
  kind: 'coin' | 'barrier' | 'fire' | 'limbo'
  taken?: boolean
}

const LANES = [-3.1, 0, 3.1]
const CHUNK_LENGTH = 18
const CHUNK_COUNT = 18
const JUMP_DURATION_MS = 760
const JUMP_HEIGHT = 1.85
const FIRE_CLEARANCE = 0.5
const BARRIER_CLEARANCE = 0.9
const COIN_PICKUP_DEPTH = 1.1
const OBSTACLE_HIT_DEPTH = 0.58
const CRASH_RESET_MS = 650

function App() {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const [telemetry, setTelemetry] = useState<Telemetry>({
    distance: 0,
    incline: 4,
    pace: 7.2,
    score: 0,
  })

  useEffect(() => {
    const host = mountRef.current
    if (!host) {
      return
    }

    const audioState: {
      context?: AudioContext
      master?: GainNode
      musicNodes: OscillatorNode[]
      melodyTimer?: number
    } = {
      musicNodes: [],
    }

    const playTone = (
      frequency: number,
      startTime: number,
      duration: number,
      volume: number,
      type: OscillatorType,
    ) => {
      if (!audioState.context || !audioState.master) {
        return
      }

      const oscillator = audioState.context.createOscillator()
      const gain = audioState.context.createGain()
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, startTime)
      gain.gain.setValueAtTime(0.0001, startTime)
      gain.gain.exponentialRampToValueAtTime(volume, startTime + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration)
      oscillator.connect(gain)
      gain.connect(audioState.master)
      oscillator.start(startTime)
      oscillator.stop(startTime + duration + 0.02)
    }

    const startAudio = () => {
      if (audioState.context) {
        if (audioState.context.state === 'suspended') {
          void audioState.context.resume()
        }
        return
      }

      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) {
        return
      }

      const context = new AudioContextClass()
      const master = context.createGain()
      master.gain.value = 0.12
      master.connect(context.destination)
      audioState.context = context
      audioState.master = master

      const bassGain = context.createGain()
      const bass = context.createOscillator()
      bass.type = 'sine'
      bass.frequency.value = 82.41
      bassGain.gain.value = 0.028
      bass.connect(bassGain)
      bassGain.connect(master)
      bass.start()
      audioState.musicNodes.push(bass)

      const pulseGain = context.createGain()
      const pulse = context.createOscillator()
      pulse.type = 'triangle'
      pulse.frequency.value = 164.82
      pulseGain.gain.value = 0.012
      pulse.connect(pulseGain)
      pulseGain.connect(master)
      pulse.start()
      audioState.musicNodes.push(pulse)

      const melody = [329.63, 392, 493.88, 392, 293.66, 369.99, 440, 369.99]
      let step = 0
      audioState.melodyTimer = window.setInterval(() => {
        if (!audioState.context) {
          return
        }

        const now = audioState.context.currentTime
        playTone(melody[step % melody.length], now, 0.16, 0.018, 'square')
        step += 1
      }, 420)
    }

    const playCoinSound = () => {
      startAudio()
      if (!audioState.context) {
        return
      }

      const now = audioState.context.currentTime
      playTone(880, now, 0.11, 0.06, 'triangle')
      playTone(1320, now + 0.07, 0.13, 0.05, 'triangle')
    }

    const playCrashSound = () => {
      startAudio()
      if (!audioState.context) {
        return
      }

      const now = audioState.context.currentTime
      playTone(146.83, now, 0.18, 0.08, 'sawtooth')
      playTone(98, now + 0.08, 0.24, 0.07, 'sawtooth')
    }

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
    renderer.setSize(host.clientWidth, host.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.12
    host.appendChild(renderer.domElement)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x102c27)
    scene.fog = new THREE.FogExp2(0x14332c, 0.024)

    const camera = new THREE.PerspectiveCamera(
      62,
      host.clientWidth / host.clientHeight,
      0.1,
      190,
    )
    camera.position.set(0, 5.8, 13)

    const world = new THREE.Group()
    scene.add(world)

    const sun = new THREE.DirectionalLight(0xffd49a, 4.2)
    sun.position.set(-8, 15, 8)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    sun.shadow.camera.near = 1
    sun.shadow.camera.far = 70
    sun.shadow.camera.left = -28
    sun.shadow.camera.right = 28
    sun.shadow.camera.top = 30
    sun.shadow.camera.bottom = -18
    scene.add(sun)
    scene.add(new THREE.HemisphereLight(0xb6ead8, 0x6f3c18, 1.65))

    const materials = {
      path: new THREE.MeshStandardMaterial({
        color: 0xb07b3d,
        roughness: 0.86,
        metalness: 0.02,
      }),
      stone: new THREE.MeshStandardMaterial({
        color: 0x909575,
        roughness: 0.9,
      }),
      darkStone: new THREE.MeshStandardMaterial({
        color: 0x596348,
        roughness: 0.95,
      }),
      moss: new THREE.MeshStandardMaterial({
        color: 0x234d30,
        roughness: 1,
      }),
      leaf: new THREE.MeshStandardMaterial({
        color: 0x1d6e39,
        roughness: 0.82,
      }),
      trunk: new THREE.MeshStandardMaterial({
        color: 0x4b2e1b,
        roughness: 0.88,
      }),
      wood: new THREE.MeshStandardMaterial({
        color: 0x6a3f20,
        roughness: 0.82,
      }),
      gold: new THREE.MeshStandardMaterial({
        color: 0xffc93a,
        emissive: 0x8a4c00,
        emissiveIntensity: 0.42,
        metalness: 0.65,
        roughness: 0.23,
      }),
      ember: new THREE.MeshStandardMaterial({
        color: 0xff662d,
        emissive: 0xff3b12,
        emissiveIntensity: 1.7,
      }),
      jumpCue: new THREE.MeshStandardMaterial({
        color: 0xffd35b,
        emissive: 0xff8a00,
        emissiveIntensity: 1.1,
        roughness: 0.35,
      }),
      slideCue: new THREE.MeshStandardMaterial({
        color: 0x71e4ff,
        emissive: 0x1aa7ff,
        emissiveIntensity: 1.05,
        roughness: 0.32,
      }),
      runner: new THREE.MeshStandardMaterial({
        color: 0xd8a067,
        roughness: 0.62,
      }),
      runnerCloth: new THREE.MeshStandardMaterial({
        color: 0x1c7469,
        roughness: 0.75,
      }),
    }

    const makeBox = (
      width: number,
      height: number,
      depth: number,
      material: THREE.Material,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, height, depth),
        material,
      )
      mesh.castShadow = true
      mesh.receiveShadow = true
      return mesh
    }

    const makeCylinder = (
      radiusTop: number,
      radiusBottom: number,
      height: number,
      radialSegments: number,
      material: THREE.Material,
    ) => {
      const mesh = new THREE.Mesh(
        new THREE.CylinderGeometry(
          radiusTop,
          radiusBottom,
          height,
          radialSegments,
        ),
        material,
      )
      mesh.castShadow = true
      mesh.receiveShadow = true
      return mesh
    }

    const makeJumpCue = () => {
      const cue = new THREE.Group()
      for (let level = 0; level < 2; level += 1) {
        const z = 0.84 + level * 0.26
        const left = makeBox(0.56, 0.035, 0.1, materials.jumpCue)
        const right = makeBox(0.56, 0.035, 0.1, materials.jumpCue)
        left.position.set(-0.2, 0, z)
        right.position.set(0.2, 0, z)
        left.rotation.y = -0.66
        right.rotation.y = 0.66
        cue.add(left, right)
      }
      cue.position.y = 0.045
      return cue
    }

    const makeSlideCue = () => {
      const cue = new THREE.Group()
      for (let level = 0; level < 2; level += 1) {
        const left = makeBox(0.48, 0.08, 0.08, materials.slideCue)
        const right = makeBox(0.48, 0.08, 0.08, materials.slideCue)
        left.position.set(-0.18, -level * 0.22, 0)
        right.position.set(0.18, -level * 0.22, 0)
        left.rotation.z = -0.68
        right.rotation.z = 0.68
        cue.add(left, right)
      }

      cue.position.set(0, 1.42, 0.28)
      return cue
    }

    const chunks: THREE.Group[] = []
    const decorateChunk = (chunk: THREE.Group, index: number) => {
      const floor = makeBox(10.4, 0.45, CHUNK_LENGTH, materials.path)
      floor.position.y = -0.28
      chunk.add(floor)

      for (let segment = 0; segment < 4; segment += 1) {
        const joint = makeBox(8.2, 0.018, 0.08, materials.darkStone)
        joint.position.set(0, 0.01, -7 + segment * 4.5)
        chunk.add(joint)

        const crack = makeBox(0.08, 0.02, 1.1, materials.darkStone)
        crack.position.set(segment % 2 === 0 ? -2.5 : 2.35, 0.012, -5.2 + segment * 4.5)
        crack.rotation.y = segment % 2 === 0 ? 0.32 : -0.28
        chunk.add(crack)
      }

      for (const side of [-1, 1]) {
        const wall = makeBox(0.7, 1, CHUNK_LENGTH * 0.82, materials.stone)
        wall.position.set(side * 5.6, 0.15, 0)
        chunk.add(wall)

        const cap = makeBox(0.36, 0.22, CHUNK_LENGTH * 0.72, materials.darkStone)
        cap.position.set(side * 5.15, 0.88, 0)
        chunk.add(cap)

        for (let strand = 0; strand < 3; strand += 1) {
          const vine = makeCylinder(0.035, 0.055, 1.8, 7, materials.moss)
          vine.position.set(side * 5.02, 0.28, -5.8 + strand * 5.4)
          vine.rotation.z = side * 0.08
          chunk.add(vine)
        }

        if (index % 2 === 0) {
          const column = makeCylinder(0.58, 0.72, 4.8, 8, materials.stone)
          column.position.set(side * 6.7, 2, -5.4)
          chunk.add(column)
          const capital = makeBox(1.55, 0.55, 1.3, materials.darkStone)
          capital.position.set(side * 6.7, 4.65, -5.4)
          chunk.add(capital)
        }

        if (index % 3 === 0) {
          const trunk = makeCylinder(0.3, 0.48, 5.4, 7, materials.trunk)
          trunk.position.set(side * 8.7, 1.9, 3.8)
          trunk.rotation.z = side * 0.18
          chunk.add(trunk)

          const canopy = makeCylinder(0.2, 2.2, 4.4, 8, materials.leaf)
          canopy.position.set(side * 9, 5.4, 3.2)
          canopy.rotation.z = side * 0.12
          chunk.add(canopy)
        }
      }

      if (index % 4 === 1) {
        const arch = new THREE.Group()
        const left = makeBox(1.1, 5.1, 1.1, materials.darkStone)
        const right = makeBox(1.1, 5.1, 1.1, materials.darkStone)
        const top = makeBox(9.2, 1.1, 1.1, materials.darkStone)
        left.position.set(-4.4, 2.15, -3)
        right.position.set(4.4, 2.15, -3)
        top.position.set(0, 4.95, -3)
        arch.add(left, right, top)
        chunk.add(arch)
      }
    }

    for (let index = 0; index < CHUNK_COUNT; index += 1) {
      const chunk = new THREE.Group()
      chunk.position.z = -index * CHUNK_LENGTH
      decorateChunk(chunk, index)
      chunks.push(chunk)
      world.add(chunk)
    }

    const runner = new THREE.Group()
    const body = makeBox(0.85, 1.15, 0.46, materials.runnerCloth)
    body.position.y = 1.45
    const head = makeCylinder(0.33, 0.36, 0.42, 12, materials.runner)
    head.position.y = 2.28
    const armLeft = makeBox(0.2, 0.85, 0.2, materials.runner)
    const armRight = makeBox(0.2, 0.85, 0.2, materials.runner)
    armLeft.position.set(-0.62, 1.28, 0)
    armRight.position.set(0.62, 1.28, 0)
    const legLeft = makeBox(0.24, 0.85, 0.22, materials.runner)
    const legRight = makeBox(0.24, 0.85, 0.22, materials.runner)
    legLeft.position.set(-0.26, 0.48, 0)
    legRight.position.set(0.26, 0.48, 0)
    runner.add(body, head, armLeft, armRight, legLeft, legRight)
    runner.position.set(0, 0, 4.1)
    scene.add(runner)

    const items: TrackItem[] = []
    const resetItem = (item: TrackItem, offset = 0) => {
      item.lane = Math.floor(Math.random() * 3)
      item.group.position.set(
        LANES[item.lane],
        item.kind === 'coin' ? 1.55 : 0.15,
        -24 - Math.random() * 120 - offset,
      )
      item.group.visible = true
      item.taken = false
    }

    const makeCoin = () => {
      const group = new THREE.Group()
      const coin = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.1, 32),
        materials.gold,
      )
      const frontRim = new THREE.Mesh(
        new THREE.TorusGeometry(0.34, 0.025, 8, 28),
        materials.gold,
      )
      const backRim = frontRim.clone()
      const mark = makeBox(0.08, 0.34, 0.024, materials.gold)

      coin.rotation.x = Math.PI / 2
      frontRim.position.z = 0.056
      backRim.position.z = -0.056
      mark.position.z = 0.07
      mark.rotation.z = 0.45

      coin.castShadow = true
      frontRim.castShadow = true
      backRim.castShadow = true
      group.add(coin, frontRim, backRim, mark)
      world.add(group)
      const item: TrackItem = { group, lane: 1, kind: 'coin' }
      resetItem(item)
      items.push(item)
    }

    const makeObstacle = (kind: TrackItem['kind']) => {
      const group = new THREE.Group()
      if (kind === 'fire') {
        const base = makeBox(1.65, 0.14, 1.25, materials.darkStone)
        const emberBed = makeBox(1.2, 0.06, 0.72, materials.ember)
        emberBed.position.y = 0.13
        const flameLeft = makeCylinder(0.03, 0.22, 0.48, 7, materials.ember)
        const flameCenter = makeCylinder(0.04, 0.3, 0.62, 7, materials.ember)
        const flameRight = makeCylinder(0.03, 0.2, 0.42, 7, materials.ember)
        flameLeft.position.set(-0.32, 0.4, -0.06)
        flameCenter.position.set(0, 0.48, 0.04)
        flameRight.position.set(0.34, 0.36, -0.08)
        group.add(base, emberBed, flameLeft, flameCenter, flameRight, makeJumpCue())
        const light = new THREE.PointLight(0xff6b2a, 1.9, 8)
        light.position.y = 1.1
        group.add(light)
      } else if (kind === 'limbo') {
        const lintel = makeBox(2.34, 0.32, 0.42, materials.wood)
        const stoneBandLeft = makeBox(0.2, 0.4, 0.48, materials.darkStone)
        const stoneBandRight = makeBox(0.2, 0.4, 0.48, materials.darkStone)
        lintel.position.y = 1.58
        stoneBandLeft.position.set(-0.88, 1.58, 0)
        stoneBandRight.position.set(0.88, 1.58, 0)
        const hangingVineLeft = makeCylinder(0.025, 0.035, 0.7, 6, materials.moss)
        const hangingVineRight = makeCylinder(0.025, 0.035, 0.58, 6, materials.moss)
        hangingVineLeft.position.set(-0.64, 1.12, 0.17)
        hangingVineRight.position.set(0.7, 1.18, -0.12)
        group.add(lintel, stoneBandLeft, stoneBandRight, hangingVineLeft, hangingVineRight, makeSlideCue())
      } else {
        const slab = makeBox(1.48, 0.2, 0.92, materials.darkStone)
        slab.position.y = 0.1
        const leftBlock = makeBox(0.62, 0.44, 0.58, materials.stone)
        const rightBlock = makeBox(0.5, 0.38, 0.5, materials.stone)
        const frontShard = makeBox(0.42, 0.28, 0.34, materials.stone)
        leftBlock.position.set(-0.36, 0.32, -0.05)
        rightBlock.position.set(0.36, 0.29, 0.1)
        frontShard.position.set(0.08, 0.24, 0.38)
        leftBlock.rotation.z = -0.08
        rightBlock.rotation.z = 0.07
        frontShard.rotation.y = 0.2
        const groundStripe = makeBox(1.35, 0.035, 0.1, materials.jumpCue)
        groundStripe.position.set(0, 0.05, 0.72)
        group.add(slab, leftBlock, rightBlock, frontShard, groundStripe, makeJumpCue())
      }
      world.add(group)
      const item: TrackItem = { group, lane: 1, kind }
      resetItem(item)
      items.push(item)
    }

    for (let index = 0; index < 28; index += 1) {
      makeCoin()
    }
    for (let index = 0; index < 6; index += 1) {
      makeObstacle(index % 3 === 0 ? 'fire' : index % 3 === 1 ? 'limbo' : 'barrier')
    }

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

      setTelemetry({
        distance: 0,
        incline: 4,
        pace: 7.2,
        score: 0,
      })
    }

    const moveLane = (direction: -1 | 1) => {
      state.laneTarget = THREE.MathUtils.clamp(state.laneTarget + direction, 0, 2)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      startAudio()
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        moveLane(-1)
      }
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        moveLane(1)
      }
      if (event.key === 'ArrowUp' || event.key.toLowerCase() === 'w') {
        state.jumpUntil = performance.now() + JUMP_DURATION_MS
      }
      if (event.key === ' ') {
        state.jumpUntil = performance.now() + JUMP_DURATION_MS
      }
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        state.slideUntil = performance.now() + 650
      }
    }

    const onPointerDown = (event: PointerEvent) => {
      startAudio()
      const third = host.clientWidth / 3
      if (event.clientY < host.clientHeight * 0.35) {
        state.jumpUntil = performance.now() + JUMP_DURATION_MS
        return
      }
      if (event.clientX < third) {
        moveLane(-1)
      } else if (event.clientX > third * 2) {
        moveLane(1)
      } else {
        state.slideUntil = performance.now() + 650
      }
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
        if (chunk.position.z > CHUNK_LENGTH) {
          chunk.position.z -= CHUNK_LENGTH * CHUNK_COUNT
        }
      }

      const jumping = now < state.jumpUntil
      const sliding = now < state.slideUntil
      const jumpT = jumping ? 1 - (state.jumpUntil - now) / JUMP_DURATION_MS : 0
      const jumpArc = jumping ? Math.sin(jumpT * Math.PI) * JUMP_HEIGHT : 0
      runner.position.x = THREE.MathUtils.lerp(runner.position.x, LANES[state.laneTarget], 9 * delta)
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
        if (item.kind === 'coin') {
          item.group.rotation.y += delta * 5
        }

        const laneMatch = Math.abs(item.group.position.x - runner.position.x) < 0.82
        const itemDepth = Math.abs(item.group.position.z - runner.position.z)

        if (item.kind === 'coin' && !item.taken && laneMatch && itemDepth < COIN_PICKUP_DEPTH) {
          item.taken = true
          item.group.visible = false
          state.score += 10
          playCoinSound()
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
            playCrashSound()
            resetRun(now)
            break
          }
        }

        if (item.group.position.z > 13) {
          resetItem(item, item.kind === 'coin' ? 0 : 28)
        }
      }

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, runner.position.x * 0.28, 2.8 * delta)
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 5.9 + jumpArc * 0.18, 2.6 * delta)
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
      if (audioState.melodyTimer) {
        window.clearInterval(audioState.melodyTimer)
      }
      for (const node of audioState.musicNodes) {
        try {
          node.stop()
        } catch {
          // The node may already be stopped if the audio context closed first.
        }
      }
      void audioState.context?.close()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
        }
      })
      Object.values(materials).forEach((material) => material.dispose())
    }
  }, [])

  return (
    <main className="runner-shell">
      <div ref={mountRef} className="runner-canvas" aria-label="Temple runner game viewport" />
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
    </main>
  )
}

export default App
