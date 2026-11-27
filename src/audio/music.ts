import { audioContext, tone } from './context.ts'

// A calm "road trip" loop for the home screen, synthesized in the browser (no audio file, no
// copyright). Chords: C – G – Am – F, one bar each, with a soft arpeggio on top.

const BPM = 84
const BEAT = 60 / BPM
const CHORDS = [
  [130.81, 164.81, 196.0], // C
  [98.0, 123.47, 146.83], // G
  [110.0, 130.81, 164.81], // Am
  [87.31, 110.0, 130.81], // F
]
// Arpeggio pattern per bar (eighth notes), as indexes into the chord, one octave up.
const PATTERN = [0, 1, 2, 1, 0, 2, 1, 2]

let master: GainNode | null = null
let timer: number | null = null
let nextBar = 0
let bar = 0

function scheduleBar(ac: AudioContext, out: AudioNode, start: number) {
  const chord = CHORDS[bar % CHORDS.length]
  // Pad: the chord held for the whole bar.
  for (const f of chord) tone(ac, out, { freq: f, start, duration: BEAT * 4, type: 'triangle', volume: 0.05 })
  // Arpeggio.
  PATTERN.forEach((i, step) => {
    tone(ac, out, { freq: chord[i] * 2, start: start + step * (BEAT / 2), duration: BEAT * 0.9, volume: 0.04 })
  })
  bar++
}

export function startMusic(): void {
  const ac = audioContext()
  if (!ac || timer !== null) return
  master = ac.createGain()
  master.gain.setValueAtTime(0, ac.currentTime)
  master.gain.linearRampToValueAtTime(1, ac.currentTime + 2)
  master.connect(ac.destination)
  nextBar = ac.currentTime + 0.1
  const out = master
  // Look-ahead scheduler: keep about one bar queued.
  const tick = () => {
    while (nextBar < ac.currentTime + BEAT * 4) {
      scheduleBar(ac, out, nextBar)
      nextBar += BEAT * 4
    }
  }
  tick()
  timer = window.setInterval(tick, 500)
}

export function stopMusic(): void {
  const ac = audioContext()
  if (timer !== null) window.clearInterval(timer)
  timer = null
  if (ac && master) {
    const m = master
    m.gain.cancelScheduledValues(ac.currentTime)
    m.gain.setValueAtTime(m.gain.value, ac.currentTime)
    m.gain.linearRampToValueAtTime(0, ac.currentTime + 0.5)
    window.setTimeout(() => m.disconnect(), 800)
  }
  master = null
}
