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

export type IpaQuestionKind = 'hear' | 'symbol' | 'pair'

export interface IpaQuestion {
  sound: Sound
  /**
   * 'hear': a word is read aloud, pick the symbol of its sound.
   * 'symbol': a big symbol is shown, pick the word that has it.
   * 'pair': one word of a minimal pair is read aloud, pick which one.
   */
  kind: IpaQuestionKind
  /** The word read aloud ('hear', 'pair') or the right word ('symbol'). */
  word: string
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

/** Hear a word, pick the symbol of its sound among confusable ones. */
function hearQuestion(sound: Sound, accent: Accent, rng: Rng): IpaQuestion {
  const example = pick(rng, sound.examples)
  const own = symbolOf(sound, accent)
  const real = transcriptionOf(example, accent)
  // A wrong symbol that is also in the word would make two right answers.
  const fits = (symbol: string) => symbol !== own && !(swappable(symbol) && real.includes(symbol))
  const wrong = [...new Set((CONFUSABLE[sound.id] ?? []).map((id) => soundById(id)).filter((s): s is Sound => !!s).map((s) => symbolOf(s, accent)))]
    .filter(fits)
    .slice(0, 2)
  for (const other of shuffle(rng, SOUNDS)) {
    if (wrong.length >= 2) break
    const symbol = symbolOf(other, accent)
    if (other.kind === sound.kind && fits(symbol) && !wrong.includes(symbol)) wrong.push(symbol)
  }
  const answer = `/${own}/`
  return {
    sound, kind: 'hear', word: example.word, prompt: 'Ouça a palavra e escolha o som que ela tem.',
    options: shuffle(rng, [answer, ...wrong.map((w) => `/${w}/`)]), answer,
  }
}

/** Hear one word of a minimal pair (sheep × ship), pick which one it was. */
function pairQuestion(sound: Sound, rng: Rng): IpaQuestion | null {
  const pairs = MINIMAL_PAIRS.filter((p) => p.sounds.includes(sound.id))
  if (!pairs.length) return null
  const pair = pick(rng, pairs)
  const word = rng() < 0.5 ? pair.a : pair.b
  return { sound, kind: 'pair', word, prompt: 'Ouça com atenção: qual das duas palavras foi dita?', options: [pair.a, pair.b], answer: word }
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

export const QUESTION_KINDS: IpaQuestionKind[] = ['hear', 'symbol', 'pair']

export function makeQuestion(sound: Sound, accent: Accent, kind: IpaQuestionKind, rng: Rng = Math.random): IpaQuestion {
  if (kind === 'pair') return pairQuestion(sound, rng) ?? hearQuestion(sound, accent, rng)
  return kind === 'hear' ? hearQuestion(sound, accent, rng) : symbolQuestion(sound, accent, rng)
}

/**
 * Picks the sounds for a session: due ones first (most overdue first), then up to
 * NEW_SOUNDS_PER_SESSION new ones in teaching order, then the weakest of the rest.
 */
export function pickSessionSounds(cards: IpaCard[], now: Date, open: string[] = SOUNDS.map((s) => s.id), size = SESSION_SIZE): Sound[] {
  const byId = new Map(cards.map((c) => [c.id, c]))
  const due = cards.filter((c) => c.fsrs.due <= now).sort((a, b) => +a.fsrs.due - +b.fsrs.due).map((c) => c.id)
  const fresh = open.filter((id) => !byId.has(id)).slice(0, NEW_SOUNDS_PER_SESSION)
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
 * A full session over the open sounds, rotating the three kinds of question.
 * A sound seen for the first time gets a second question of another kind.
 */
export function makeSession(cards: IpaCard[], accent: Accent, open?: string[], now = new Date(), rng: Rng = Math.random): IpaQuestion[] {
  const known = new Set(cards.map((c) => c.id))
  const kindAt = (i: number) => QUESTION_KINDS[i % QUESTION_KINDS.length]
  const sounds = pickSessionSounds(cards, now, open)
  const questions = sounds.map((sound, i) => makeQuestion(sound, accent, kindAt(i), rng))
  const extra = sounds.flatMap((sound, i) => (known.has(sound.id) ? [] : [makeQuestion(sound, accent, kindAt(i + 1), rng)]))
  return [...questions, ...extra]
}

/** A boss test: `count` questions over the given sounds, every sound at least once when it fits. */
export function makeBossTest(soundIds: string[], count: number, accent: Accent, rng: Rng = Math.random): IpaQuestion[] {
  const sounds = soundIds.map((id) => soundById(id)).filter((s): s is Sound => !!s)
  const order: Sound[] = []
  while (order.length < count) order.push(...shuffle(rng, sounds))
  return order.slice(0, count).map((sound, i) => makeQuestion(sound, accent, QUESTION_KINDS[i % QUESTION_KINDS.length], rng))
}
