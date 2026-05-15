import * as THREE from 'three'

export type Materials = {
  path: THREE.MeshStandardMaterial
  stone: THREE.MeshStandardMaterial
  darkStone: THREE.MeshStandardMaterial
  moss: THREE.MeshStandardMaterial
  leaf: THREE.MeshStandardMaterial
  trunk: THREE.MeshStandardMaterial
  wood: THREE.MeshStandardMaterial
  gold: THREE.MeshStandardMaterial
  ember: THREE.MeshStandardMaterial
  jumpCue: THREE.MeshStandardMaterial
  slideCue: THREE.MeshStandardMaterial
  runner: THREE.MeshStandardMaterial
  runnerCloth: THREE.MeshStandardMaterial
}

export function createMaterials(): Materials {
  return {
    path: new THREE.MeshStandardMaterial({ color: 0xb07b3d, roughness: 0.86, metalness: 0.02 }),
    stone: new THREE.MeshStandardMaterial({ color: 0x909575, roughness: 0.9 }),
    darkStone: new THREE.MeshStandardMaterial({ color: 0x596348, roughness: 0.95 }),
    moss: new THREE.MeshStandardMaterial({ color: 0x234d30, roughness: 1 }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x1d6e39, roughness: 0.82 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x4b2e1b, roughness: 0.88 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x6a3f20, roughness: 0.82 }),
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
    runner: new THREE.MeshStandardMaterial({ color: 0xd8a067, roughness: 0.62 }),
    runnerCloth: new THREE.MeshStandardMaterial({ color: 0x1c7469, roughness: 0.75 }),
  }
}
