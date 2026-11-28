import Dexie, { type EntityTable } from 'dexie'
import type { Card as FsrsCard } from 'ts-fsrs'
import type { GapSentence, PartOfSpeech } from '../content/types.ts'

// Everything the learner produces lives here, in the browser's IndexedDB.
// Content (words, senses, phases) is static and lives in src/content.

export type CharacterChoice = 'male' | 'female'
export type PetChoice = 'dog' | 'cat' | 'none'
export type Accent = 'US' | 'UK'

export interface Profile {
  id: 'me'
  name: string
  character: CharacterChoice
  pet: PetChoice
  petName?: string
  motorhomeName: string
  /** Where the trip starts (phase 1), chosen on first launch. */
  homeCity?: string
  language: 'en'
  createdAt: Date
}

export interface Settings {
  id: 'app'
  newPerDay: number
  dailyGoalMinutes: number
  accent: Accent
  pomodoro: { studyMinutes: number; breakMinutes: number; longBreakMinutes: number; cyclesBeforeLongBreak: number }
  /** Interface language; the app suggests English when the learner reaches B1. */
  uiLanguage: 'pt' | 'en'
  /** Recovery mode: new cards pause while the review backlog is too large. */
  recoveryActive: boolean
  /** Short sounds for right and wrong answers. */
  soundEffects: boolean
  /** "Seguro do motorhome": remind to save a backup every N days (0 = never). */
  backupReminderDays: number
  /** When the last backup file was saved (or restored). */
  lastBackupAt?: Date
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  newPerDay: 15,
  dailyGoalMinutes: 15,
  accent: 'US',
  pomodoro: { studyMinutes: 15, breakMinutes: 4, longBreakMinutes: 10, cyclesBeforeLongBreak: 4 },
  uiLanguage: 'pt',
  recoveryActive: false,
  soundEffects: true,
  backupReminderDays: 7,
}

/** How a sense is answered: multiple choice first, typing once it is mastered. */
export type AnswerMode = 'choice' | 'typing'

/** Where a card came from. Explorer and side-trip words count as "already known" on the route. */
export type CardSource = 'route' | 'side-trip' | 'explorer'

export interface StudyCard {
  /** `${senseId}#meaning` (later: `#dictation`, `#speaking`). */
  id: string
  senseId: string
  kind: 'meaning'
  mode: AnswerMode
  /** Consecutive correct multiple-choice answers with final score ≥ 7. */
  choiceStreak: number
  /** Consecutive typing failures (2 sends the card back to multiple choice). */
  typingFailStreak: number
  source: CardSource
  fsrs: FsrsCard
  createdAt: Date
}

export interface ReviewEntry {
  id?: number
  cardId: string
  senseId: string
  at: Date
  mode: AnswerMode
  /** Score the learner gave on the 0–10 slider. */
  selfScore: number
  /** Weighted score after penalties. */
  finalScore: number
  correct: boolean
  typo: boolean
  usedTranslation: boolean
  usedHint: boolean
  /** "Já sei" shortcut used on a new card. */
  knownShortcut: boolean
  durationMs: number
}

/** A word the learner wrote themselves (Explorer mode, kept in the "Diário de bordo"). */
export interface ExplorerWord {
  lemma: string
  pos: PartOfSpeech
  /** English definition (chosen from the dictionary or written by the learner). */
  definition: string
  /** The learner's sentence with the word replaced by `____`, and the word as written there. */
  gap: GapSentence
  /** Portuguese translation, optional (can be added later). */
  translationPt?: string
  synonyms: string[]
}

export interface ExplorerEntry {
  id?: number
  /** The word as captured. */
  word: string
  /** Where the learner found it, with the original sentence (optional). */
  sentence?: string
  source?: string
  /** `inbox` = captured quickly, still needs a sense chosen. */
  status: 'inbox' | 'ready'
  /** Set when the word already exists on the route ("encontrada na estrada"): that sense is studied early. */
  senseId?: string
  /** Set for words that are not in the app's content. */
  custom?: ExplorerWord
  /** Set for words imported from a text ("Desvio"); they are trained in that detour's sessions. */
  detourId?: number
  createdAt: Date
}

/** "Desvio": a text the learner imported, named like a place they visited off the route. */
export interface Detour {
  id?: number
  name: string
  /** Number of words in the imported text. */
  textWords: number
  createdAt: Date
}

export interface StudyDay {
  /** Local date, `YYYY-MM-DD`. */
  date: string
  activeSeconds: number
  cardsReviewed: number
  newCards: number
  xp: number
}

export interface Reward {
  phaseId: string
  text: string
  claimedAt?: Date
}

export interface BossAttempt {
  id?: number
  phaseId: string
  at: Date
  correct: number
  total: number
  passed: boolean
}

/** Spaced-repetition card for one IPA sound (Trilha de IPA). */
export interface IpaCard {
  /** Sound id from `src/ipa/sounds.ts`. */
  id: string
  fsrs: FsrsCard
  createdAt: Date
}

/** One answer in the IPA ear training, kept for statistics. */
export interface IpaReview {
  id?: number
  soundId: string
  at: Date
  /** 'hear' = heard a word and picked its transcription; 'symbol' = saw the symbol and picked a word. */
  kind: 'hear' | 'symbol'
  correct: boolean
}

/** A memory hook the learner wrote for a word in the Oficina ("parece com…"). */
export interface Mnemonic {
  senseId: string
  text: string
  updatedAt: Date
}

/** One Oficina (reinforcement workshop) session, kept to know when to suggest the next one. */
export interface WorkshopSession {
  id?: number
  at: Date
  senseIds: string[]
  /** Sense ids the learner got right in the "produce the word" step. */
  produced: string[]
}

export class WordTripDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  settings!: EntityTable<Settings, 'id'>
  cards!: EntityTable<StudyCard, 'id'>
  reviews!: EntityTable<ReviewEntry, 'id'>
  explorer!: EntityTable<ExplorerEntry, 'id'>
  days!: EntityTable<StudyDay, 'date'>
  rewards!: EntityTable<Reward, 'phaseId'>
  bossAttempts!: EntityTable<BossAttempt, 'id'>
  detours!: EntityTable<Detour, 'id'>
  ipaCards!: EntityTable<IpaCard, 'id'>
  ipaReviews!: EntityTable<IpaReview, 'id'>
  mnemonics!: EntityTable<Mnemonic, 'senseId'>
  workshops!: EntityTable<WorkshopSession, 'id'>

  constructor(name = 'wordtrip') {
    super(name)
    this.version(1).stores({
      profile: 'id',
      settings: 'id',
      cards: 'id, senseId, source, fsrs.due, fsrs.state',
      reviews: '++id, cardId, senseId, at',
      explorer: '++id, status, word, createdAt',
      days: 'date',
      rewards: 'phaseId',
      bossAttempts: '++id, phaseId, at',
    })
    this.version(2).stores({
      explorer: '++id, status, word, createdAt, detourId',
      detours: '++id, createdAt',
    })
    this.version(3).stores({
      ipaCards: 'id, fsrs.due',
      ipaReviews: '++id, soundId, at',
    })
    this.version(4).stores({
      mnemonics: 'senseId',
      workshops: '++id, at',
    })
  }
}

export const db = new WordTripDB()

export async function getSettings(): Promise<Settings> {
  // Spread over the defaults so settings saved by older versions get the newer fields.
  return { ...DEFAULT_SETTINGS, ...(await db.settings.get('app')) }
}
