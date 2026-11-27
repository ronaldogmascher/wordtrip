import { createEmptyCard, Rating } from 'ts-fsrs'
import type { Accent, IpaCard } from '../db/db.ts'
import { scheduleFsrs } from '../study/scheduler.ts'
import { MINIMAL_PAIRS, soundById, SOUNDS, type Example, type Sound } from './sounds.ts'

// Ear training with spaced repetition: every IPA sound is a card scheduled by FSRS.
// Questions always show IPA symbols in large type, so the learner links symbol ↔ sound.

/** Sounds that are easy to mix up, used to build wrong options. */
export const CONFUSABLE: Record<string, string[]> = {
  'i-long': ['i-short', 'e'], 'i-short': ['i-long', 'e'], e: ['ae', 'i-short'], ae: ['e', 'uh', 'a-long'],
  'a-long': ['uh', 'ae', 'o-long'], 'o-short': ['o-long', 'uh', 'a-long'], 'o-long': ['ou', 'er', 'a-long'],
  'u-short': ['u-long', 'uh'], 'u-long': ['u-short', 'ou'], uh: ['ae', 'a-long', 'o-long'], er: ['o-long', 'uh', 'e'],
  schwa: ['uh', 'e', 'i-short'], 'schwa-r': ['er', 'schwa'], ei: ['e', 'ai'], ai: ['ei', 'oi'], oi: ['ai', 'o-long'],
  au: ['ou', 'ai'], ou: ['o-long', 'au', 'u-long'], ear: ['air', 'i-long'], air: ['ear', 'ei'],
  'th-voiceless': ['s', 't-d', 'th-voiced'], 'th-voiced': ['t-d', 'z', 'th-voiceless'], h: ['r'], r: ['h', 'l'],
  'flap-t': ['t-d', 'r'], l: ['r', 'w'], ng: ['m-final'], 'm-final': ['ng'], 't-d': ['ch', 'j', 'th-voiceless'],
  ch: ['sh', 'j'], j: ['ch', 'zh'], sh: ['ch', 'zh', 's'], zh: ['j', 'sh'], w: ['v', 'l'], y: ['j', 'zh'], v: ['w'],
  'p-k': ['t-d'], s: ['z', 'sh', 'th-voiceless'], z: ['s', 'zh'],
}

export const NEW_SOUNDS_PER_SESSION = 4
export const SESSION_SIZE = 10

export interface IpaQuestion {
  sound: Sound
  kind: 'hear' | 'symbol'
  /** 'hear': the word read aloud. 'symbol': the right word among the options. */
  word: string
  /** 'hear': the big symbol hint is hidden until answered; options are transcriptions. */
  prompt: string
  options: string[]
  answer: string
}

type Rng = () => number

const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)]

function shuffle<T>(rng: Rng, items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const symbolOf = (sound: Sound, accent: Accent) => (accent === 'US' ? sound.us : sound.uk)
export const transcriptionOf = (e: Example, accent: Accent) => (accent === 'US' ? e.us : e.uk)

/** Single-symbol sounds can be swapped inside a transcription; groups like "p t k" cannot. */
const swappable = (symbol: string) => !symbol.includes(' ')

/** Wrong transcriptions made by swapping the target symbol for a confusable one: /ʃiːp/ → /ʃɪp/. */
function fakeTranscriptions(sound: Sound, example: Example, accent: Accent): string[] {
  const own = symbolOf(sound, accent)
  const real = transcriptionOf(example, accent)
  if (!swappable(own) || !real.includes(own)) return []
  return (CONFUSABLE[sound.id] ?? [])
    .map((id) => soundById(id))
    .filter((s): s is Sound => !!s && swappable(symbolOf(s, accent)) && symbolOf(s, accent) !== own)
    .map((s) => real.replace(own, symbolOf(s, accent)))
}

/** Hear a word, pick its transcription among near-identical ones. */
function hearQuestion(sound: Sound, accent: Accent, rng: Rng): IpaQuestion | null {
  for (const example of shuffle(rng, sound.examples)) {
    const answer = `/${transcriptionOf(example, accent)}/`
    const wrong = [...new Set(fakeTranscriptions(sound, example, accent).map((t) => `/${t}/`))].filter((t) => t !== answer)
    // A real minimal-pair partner beats a made-up transcription.
    const pair = MINIMAL_PAIRS.find((p) => p.a === example.word || p.b === example.word)
    if (wrong.length) {
      return {
        sound, kind: 'hear', word: example.word, prompt: 'Ouça e escolha a transcrição certa.',
        options: shuffle(rng, [answer, ...wrong.slice(0, 2)]), answer,
      }
    }
    if (pair) continue
  }
  return null
}

/** See a big symbol, pick the word that has this sound. */
function symbolQuestion(sound: Sound, accent: Accent, rng: Rng): IpaQuestion {
  const right = pick(rng, sound.examples)
  const own = symbolOf(sound, accent)
  const others = (CONFUSABLE[sound.id] ?? [])
    .map((id) => soundById(id))
    .filter((s): s is Sound => !!s)
    .map((s) => s.examples.find((e) => swappable(own) ? !transcriptionOf(e, accent).includes(own) : true))
    .filter((e): e is Example => !!e && e.word !== right.word)
    .map((e) => e.word)
  // Fall back to any other sound's example if the confusable list is short.
  while (others.length < 2) {
    const e = pick(rng, pick(rng, SOUNDS.filter((s) => s.id !== sound.id)).examples)
    if (!others.includes(e.word) && e.word !== right.word && !(swappable(own) && transcriptionOf(e, accent).includes(own))) others.push(e.word)
  }
  return {
    sound, kind: 'symbol', word: right.word, prompt: 'Qual palavra tem este som?',
    options: shuffle(rng, [right.word, ...shuffle(rng, [...new Set(others)]).slice(0, 2)]), answer: right.word,
  }
}

export function makeQuestion(sound: Sound, accent: Accent, preferHear: boolean, rng: Rng = Math.random): IpaQuestion {
  if (preferHear) {
    const q = hearQuestion(sound, accent, rng)
    if (q) return q
  }
  return symbolQuestion(sound, accent, rng)
}

/**
 * Picks the sounds for a session: due ones first (most overdue first), then up to
 * NEW_SOUNDS_PER_SESSION new ones in teaching order, then the weakest of the rest.
 */
export function pickSessionSounds(cards: IpaCard[], now: Date, size = SESSION_SIZE): Sound[] {
  const byId = new Map(cards.map((c) => [c.id, c]))
  const due = cards.filter((c) => c.fsrs.due <= now).sort((a, b) => +a.fsrs.due - +b.fsrs.due).map((c) => c.id)
  const fresh = SOUNDS.filter((s) => !byId.has(s.id)).slice(0, NEW_SOUNDS_PER_SESSION).map((s) => s.id)
  const rest = cards
    .filter((c) => c.fsrs.due > now)
    .sort((a, b) => a.fsrs.stability - b.fsrs.stability)
    .map((c) => c.id)
  const ids = [...new Set([...due, ...fresh, ...rest])].slice(0, size)
  return ids.map((id) => soundById(id)).filter((s): s is Sound => !!s)
}

/** The card after one answer: right = Good, wrong = Again. */
export function answerIpaCard(card: IpaCard | undefined, soundId: string, correct: boolean, now: Date): IpaCard {
  const base = card ?? { id: soundId, fsrs: createEmptyCard(now), createdAt: now }
  return { ...base, fsrs: scheduleFsrs(base.fsrs, now, correct ? Rating.Good : Rating.Again) }
}

/**
 * A full session: alternates "hear" and "symbol" questions over the picked sounds.
 * A sound seen for the first time gets both kinds, so it is learned from both sides.
 */
export function makeSession(cards: IpaCard[], accent: Accent, now = new Date(), rng: Rng = Math.random): IpaQuestion[] {
  const known = new Set(cards.map((c) => c.id))
  const questions = pickSessionSounds(cards, now).map((sound, i) => makeQuestion(sound, accent, i % 2 === 0, rng))
  const extra = questions
    .filter((q) => !known.has(q.sound.id))
    .map((q) => makeQuestion(q.sound, accent, q.kind === 'symbol', rng))
  return [...questions, ...extra]
}
