export type AudioManager = {
  startAudio: () => void
  playCoinSound: () => void
  playCrashSound: () => void
  cleanup: () => void
}

export function createAudioManager(): AudioManager {
  const audioState: {
    context?: AudioContext
    master?: GainNode
    musicNodes: OscillatorNode[]
    melodyTimer?: number
  } = { musicNodes: [] }

  const playTone = (
    frequency: number,
    startTime: number,
    duration: number,
    volume: number,
    type: OscillatorType,
  ) => {
    if (!audioState.context || !audioState.master) return
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
      if (audioState.context.state === 'suspended') void audioState.context.resume()
      return
    }

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return

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
      if (!audioState.context) return
      const now = audioState.context.currentTime
      playTone(melody[step % melody.length], now, 0.16, 0.018, 'square')
      step += 1
    }, 420)
  }

  const playCoinSound = () => {
    startAudio()
    if (!audioState.context) return
    const now = audioState.context.currentTime
    playTone(880, now, 0.11, 0.06, 'triangle')
    playTone(1320, now + 0.07, 0.13, 0.05, 'triangle')
  }

  const playCrashSound = () => {
    startAudio()
    if (!audioState.context) return
    const now = audioState.context.currentTime
    playTone(146.83, now, 0.18, 0.08, 'sawtooth')
    playTone(98, now + 0.08, 0.24, 0.07, 'sawtooth')
  }

  const cleanup = () => {
    if (audioState.melodyTimer) window.clearInterval(audioState.melodyTimer)
    for (const node of audioState.musicNodes) {
      try {
        node.stop()
      } catch {
        // The node may already be stopped if the audio context closed first.
      }
    }
    void audioState.context?.close()
  }

  return { startAudio, playCoinSound, playCrashSound, cleanup }
}
