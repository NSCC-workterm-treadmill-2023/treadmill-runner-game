import * as THREE from 'three'
import { type Materials } from './materials'
import { makeBox, makeCylinder } from './meshHelpers'

export type RunnerParts = {
  runner: THREE.Group
  body: THREE.Mesh
  head: THREE.Mesh
  armLeft: THREE.Mesh
  armRight: THREE.Mesh
  legLeft: THREE.Mesh
  legRight: THREE.Mesh
}

export function createRunner(scene: THREE.Scene, materials: Materials): RunnerParts {
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

  return { runner, body, head, armLeft, armRight, legLeft, legRight }
}
