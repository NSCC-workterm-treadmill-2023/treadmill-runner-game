import * as THREE from 'three'
import { LANES } from './constants'
import { type Materials } from './materials'
import { makeBox, makeCylinder, makeJumpCue, makeSlideCue } from './meshHelpers'
import { type TrackItem } from './types'

export function resetItem(item: TrackItem, offset = 0) {
  item.lane = Math.floor(Math.random() * 3)
  item.group.position.set(
    LANES[item.lane],
    item.kind === 'coin' ? 1.55 : 0.15,
    -24 - Math.random() * 120 - offset,
  )
  item.group.visible = true
  item.taken = false
}

function makeCoin(world: THREE.Group, materials: Materials, items: TrackItem[]) {
  const group = new THREE.Group()
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 32), materials.gold)
  const frontRim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.025, 8, 28), materials.gold)
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

function makeObstacle(
  kind: TrackItem['kind'],
  world: THREE.Group,
  materials: Materials,
  items: TrackItem[],
) {
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
    group.add(base, emberBed, flameLeft, flameCenter, flameRight, makeJumpCue(materials.jumpCue))
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
    group.add(
      lintel,
      stoneBandLeft,
      stoneBandRight,
      hangingVineLeft,
      hangingVineRight,
      makeSlideCue(materials.slideCue),
    )
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
    group.add(slab, leftBlock, rightBlock, frontShard, groundStripe, makeJumpCue(materials.jumpCue))
  }

  world.add(group)
  const item: TrackItem = { group, lane: 1, kind }
  resetItem(item)
  items.push(item)
}

export function createItems(world: THREE.Group, materials: Materials): TrackItem[] {
  const items: TrackItem[] = []
  for (let index = 0; index < 28; index += 1) {
    makeCoin(world, materials, items)
  }
  for (let index = 0; index < 6; index += 1) {
    makeObstacle(
      index % 3 === 0 ? 'fire' : index % 3 === 1 ? 'limbo' : 'barrier',
      world,
      materials,
      items,
    )
  }
  return items
}
