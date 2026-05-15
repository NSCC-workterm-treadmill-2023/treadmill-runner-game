import * as THREE from 'three'

export type SceneObjects = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  world: THREE.Group
}

export function createScene(host: HTMLElement): SceneObjects {
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

  const camera = new THREE.PerspectiveCamera(62, host.clientWidth / host.clientHeight, 0.1, 190)
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

  return { renderer, scene, camera, world }
}
