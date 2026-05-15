import type * as THREE from 'three'

export type Telemetry = {
  distance: number
  incline: number
  pace: number
  score: number
}

export type TrackItem = {
  group: THREE.Group
  lane: number
  kind: 'coin' | 'barrier' | 'fire' | 'limbo'
  taken?: boolean
}
