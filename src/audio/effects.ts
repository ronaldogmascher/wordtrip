import { audioContext, tone } from './context.ts'

// Short sound effects, synthesized on the fly: no audio files, works offline.

/** A bright, rising chime for a right answer. */
export function playCorrect(): void {
  const ac = audioContext()
  if (!ac) return
  const t = ac.currentTime
  tone(ac, ac.destination, { freq: 659.25, start: t, duration: 0.18, volume: 0.18 }) // E5
  tone(ac, ac.destination, { freq: 987.77, start: t + 0.09, duration: 0.3, volume: 0.18 }) // B5
}

/** A low, soft "bump" for a wrong answer. */
export function playWrong(): void {
  const ac = audioContext()
  if (!ac) return
  const t = ac.currentTime
  tone(ac, ac.destination, { freq: 196, start: t, duration: 0.18, type: 'triangle', volume: 0.25 }) // G3
  tone(ac, ac.destination, { freq: 155.56, start: t + 0.14, duration: 0.3, type: 'triangle', volume: 0.25 }) // D#3
}
