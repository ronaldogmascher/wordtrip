// One shared Web Audio context for effects and music. Browsers only let audio start after the
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

/** A short burst of filtered noise, used for soft drums (kick, snare, hi-hat). */
export function noise(
  ac: AudioContext,
  destination: AudioNode,
  { start, duration, volume = 0.1, highpass = 6000 }: { start: number; duration: number; volume?: number; highpass?: number },
): void {
  const length = Math.max(1, Math.floor(ac.sampleRate * duration))
  const buffer = ac.createBuffer(1, length, ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource()
  src.buffer = buffer
  const filter = ac.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = highpass
  const gain = ac.createGain()
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  src.connect(filter).connect(gain).connect(destination)
  src.start(start)
  src.stop(start + duration + 0.05)
}

/** A soft kick drum: a sine wave that drops quickly in pitch. */
export function kick(ac: AudioContext, destination: AudioNode, start: number, volume = 0.25): void {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.frequency.setValueAtTime(120, start)
  osc.frequency.exponentialRampToValueAtTime(45, start + 0.15)
  gain.gain.setValueAtTime(volume, start)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3)
  osc.connect(gain).connect(destination)
  osc.start(start)
  osc.stop(start + 0.35)
}
