import { audioContext, kick, noise, tone } from './context.ts'

// Background music for the home screen, synthesized in the browser (no audio file, no
// copyright). Each theme is a short loop described as data: chords, tempo and a few layers.

export type MusicThemeId = 'sunset' | 'lofi' | 'adventure' | 'bossa' | 'campfire'

interface Theme {
  id: MusicThemeId
  label: string
  description: string
  bpm: number
  /** One chord per bar, as frequencies in Hz (low to high). */
  chords: number[][]
  /** Eighth-note arpeggio: indexes into the chord (one octave up), or null for a rest. */
  arpeggio: (number | null)[]
  arpeggioWave: OscillatorType
  padWave: OscillatorType
  padVolume: number
  arpeggioVolume: number
  /** Bass on the chord root, on these eighth-note steps. */
  bassSteps?: number[]
  /** Kick and hi-hat steps (eighth notes). */
  kickSteps?: number[]
  hatSteps?: number[]
}

// Note frequencies used by the themes.
const N = {
  A1: 55.0, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, Fs3: 185.0, G3: 196.0, A3: 220.0, B3: 246.94,
  C4: 261.63, Cs4: 277.18, D4: 293.66, E4: 329.63,
}

export const MUSIC_THEMES: Theme[] = [
  {
    id: 'sunset', label: 'Estrada ao pôr do sol', description: 'Calma, com arpejo suave (a música atual).',
    bpm: 84, chords: [[N.C3, N.E3, N.G3], [N.G2, N.B2, N.D3], [N.A2, N.C3, N.E3], [N.F2, N.A2, N.C3]],
    arpeggio: [0, 1, 2, 1, 0, 2, 1, 2], arpeggioWave: 'sine', padWave: 'triangle', padVolume: 0.05, arpeggioVolume: 0.04,
  },
  {
    id: 'lofi', label: 'Lo-fi da estrada', description: 'Lenta e relaxante, acordes de jazz e batida leve. Boa para estudar.',
    bpm: 72, chords: [[N.D3, N.F3, N.A3, N.C4], [N.G2, N.B2, N.D3, N.F3], [N.C3, N.E3, N.G3, N.B3], [N.A2, N.C3, N.E3, N.G3]],
    arpeggio: [0, null, 2, null, 3, null, 1, null], arpeggioWave: 'triangle', padWave: 'sine', padVolume: 0.045, arpeggioVolume: 0.035,
    bassSteps: [0, 3, 4], kickSteps: [0, 5], hatSteps: [2, 6],
  },
  {
    id: 'adventure', label: 'Aventura', description: 'Animada, com baixo e bateria. Clima de pé na estrada.',
    bpm: 112, chords: [[N.D3, N.Fs3, N.A3], [N.A2, N.Cs4 / 2, N.E3], [N.B2, N.D3, N.Fs3], [N.G2, N.B2, N.D3]],
    arpeggio: [0, 1, 2, 1, 2, 1, 0, 1], arpeggioWave: 'square', padWave: 'triangle', padVolume: 0.035, arpeggioVolume: 0.018,
    bassSteps: [0, 2, 4, 6], kickSteps: [0, 4], hatSteps: [1, 3, 5, 7],
  },
  {
    id: 'bossa', label: 'Violão na praia', description: 'Balanço de bossa nova, leve e brasileiro.',
    bpm: 96, chords: [[N.C3, N.E3, N.G3, N.B3], [N.A2, N.Cs4 / 2, N.E3, N.G3], [N.D3, N.F3, N.A3, N.C4], [N.G2, N.B2, N.D3, N.F3]],
    arpeggio: [0, null, 2, 3, null, 1, 3, null], arpeggioWave: 'triangle', padWave: 'sine', padVolume: 0.03, arpeggioVolume: 0.045,
    bassSteps: [0, 3, 4, 7], hatSteps: [0, 2, 3, 5, 6],
  },
  {
    id: 'campfire', label: 'Noite no camping', description: 'Ambiente, bem lenta, com notas de sino espaçadas.',
    bpm: 60, chords: [[N.A2, N.E3, N.A3, N.C4], [N.F2, N.C3, N.F3, N.A3], [N.C3, N.G3, N.C4, N.E4], [N.G2, N.D3, N.G3, N.B3]],
    arpeggio: [3, null, null, 2, null, null, 1, null], arpeggioWave: 'sine', padWave: 'sine', padVolume: 0.05, arpeggioVolume: 0.05,
  },
]

export const DEFAULT_MUSIC_THEME: MusicThemeId = 'sunset'

const themeById = (id: MusicThemeId) => MUSIC_THEMES.find((t) => t.id === id) ?? MUSIC_THEMES[0]

let master: GainNode | null = null
let timer: number | null = null
let playing: MusicThemeId | null = null

function scheduleBar(ac: AudioContext, out: AudioNode, theme: Theme, bar: number, start: number) {
  const beat = 60 / theme.bpm
  const eighth = beat / 2
  const chord = theme.chords[bar % theme.chords.length]
  // Pad: the chord held for the whole bar.
  for (const f of chord) tone(ac, out, { freq: f, start, duration: beat * 4, type: theme.padWave, volume: theme.padVolume })
  theme.arpeggio.forEach((i, step) => {
    if (i === null || i >= chord.length) return
    tone(ac, out, { freq: chord[i] * 2, start: start + step * eighth, duration: beat * 0.9, type: theme.arpeggioWave, volume: theme.arpeggioVolume })
  })
  for (const step of theme.bassSteps ?? []) {
    tone(ac, out, { freq: chord[0] / 2, start: start + step * eighth, duration: eighth * 1.6, type: 'triangle', volume: 0.09 })
  }
  for (const step of theme.kickSteps ?? []) kick(ac, out, start + step * eighth, 0.18)
  for (const step of theme.hatSteps ?? []) noise(ac, out, { start: start + step * eighth, duration: 0.05, volume: 0.025 })
}

export function startMusic(themeId: MusicThemeId = DEFAULT_MUSIC_THEME): void {
  const ac = audioContext()
  if (!ac) return
  if (timer !== null) {
    if (playing === themeId) return
    stopMusic()
  }
  const theme = themeById(themeId)
  const barLength = (60 / theme.bpm) * 4
  const out = ac.createGain()
  out.gain.setValueAtTime(0, ac.currentTime)
  out.gain.linearRampToValueAtTime(1, ac.currentTime + 2)
  out.connect(ac.destination)
  master = out
  playing = themeId
  let bar = 0
  let nextBar = ac.currentTime + 0.1
  // Look-ahead scheduler: keep about one bar queued.
  const tick = () => {
    while (nextBar < ac.currentTime + barLength) {
      scheduleBar(ac, out, theme, bar++, nextBar)
      nextBar += barLength
    }
  }
  tick()
  timer = window.setInterval(tick, 500)
}

export function stopMusic(): void {
  const ac = audioContext()
  if (timer !== null) window.clearInterval(timer)
  timer = null
  playing = null
  if (ac && master) {
    const m = master
    m.gain.cancelScheduledValues(ac.currentTime)
    m.gain.setValueAtTime(m.gain.value, ac.currentTime)
    m.gain.linearRampToValueAtTime(0, ac.currentTime + 0.5)
    window.setTimeout(() => m.disconnect(), 800)
  }
  master = null
}

export const musicPlaying = () => playing
