// One shared Web Audio context for sound effects. Browsers only let audio start after the
// user has touched the page, so the context is created lazily and resumed on demand.
let ctx: AudioContext | null = null

export function audioContext(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  ctx ??= new AudioContext()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Plays one note with a soft attack and release. */
export function tone(
  ac: AudioContext,
  destination: AudioNode,
  { freq, start, duration, type = 'sine', volume = 0.2 }: {
    freq: number
    start: number
    duration: number
    type?: OscillatorType
    volume?: number
  },
): void {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(volume, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(gain).connect(destination)
  osc.start(start)
  osc.stop(start + duration + 0.05)
}

