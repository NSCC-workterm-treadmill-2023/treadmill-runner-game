import * as THREE from 'three'
import { CHUNK_COUNT, CHUNK_LENGTH } from './constants'
import { type Materials } from './materials'
import { makeBox, makeCylinder } from './meshHelpers'

function decorateChunk(chunk: THREE.Group, index: number, materials: Materials) {
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

export function createTrack(world: THREE.Group, materials: Materials): THREE.Group[] {
  const chunks: THREE.Group[] = []
  for (let index = 0; index < CHUNK_COUNT; index += 1) {
    const chunk = new THREE.Group()
    chunk.position.z = -index * CHUNK_LENGTH
    decorateChunk(chunk, index, materials)
    chunks.push(chunk)
    world.add(chunk)
  }
  return chunks
}
