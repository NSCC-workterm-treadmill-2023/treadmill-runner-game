import * as THREE from 'three'

export function makeBox(
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function makeCylinder(
  radiusTop: number,
  radiusBottom: number,
  height: number,
  radialSegments: number,
  material: THREE.Material,
): THREE.Mesh {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments),
    material,
  )
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function makeJumpCue(material: THREE.Material): THREE.Group {
  const cue = new THREE.Group()
  for (let level = 0; level < 2; level += 1) {
    const z = 0.84 + level * 0.26
    const left = makeBox(0.56, 0.035, 0.1, material)
    const right = makeBox(0.56, 0.035, 0.1, material)
    left.position.set(-0.2, 0, z)
    right.position.set(0.2, 0, z)
    left.rotation.y = -0.66
    right.rotation.y = 0.66
    cue.add(left, right)
  }
  cue.position.y = 0.045
  return cue
}

export function makeSlideCue(material: THREE.Material): THREE.Group {
  const cue = new THREE.Group()
  for (let level = 0; level < 2; level += 1) {
    const left = makeBox(0.48, 0.08, 0.08, material)
    const right = makeBox(0.48, 0.08, 0.08, material)
    left.position.set(-0.18, -level * 0.22, 0)
    right.position.set(0.18, -level * 0.22, 0)
    left.rotation.z = -0.68
    right.rotation.z = 0.68
    cue.add(left, right)
  }
  cue.position.set(0, 1.42, 0.28)
  return cue
}
