import Dexie, { type EntityTable } from 'dexie'
import type { Card as FsrsCard } from 'ts-fsrs'

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
}

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  newPerDay: 15,
  dailyGoalMinutes: 15,
  accent: 'US',
  pomodoro: { studyMinutes: 15, breakMinutes: 4, longBreakMinutes: 10, cyclesBeforeLongBreak: 4 },
  uiLanguage: 'pt',
  recoveryActive: false,
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

export interface ExplorerEntry {
  id?: number
  word: string
  sentence?: string
  source?: string
  /** `inbox` = captured quickly, still needs a sense chosen. */
  status: 'inbox' | 'ready'
  /** Sense id from the built-in content when the word already exists on the route. */
  senseId?: string
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

export class WordTripDB extends Dexie {
  profile!: EntityTable<Profile, 'id'>
  settings!: EntityTable<Settings, 'id'>
  cards!: EntityTable<StudyCard, 'id'>
  reviews!: EntityTable<ReviewEntry, 'id'>
  explorer!: EntityTable<ExplorerEntry, 'id'>
  days!: EntityTable<StudyDay, 'date'>
  rewards!: EntityTable<Reward, 'phaseId'>
  bossAttempts!: EntityTable<BossAttempt, 'id'>

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
  }
}

export const db = new WordTripDB()

export async function getSettings(): Promise<Settings> {
  return (await db.settings.get('app')) ?? DEFAULT_SETTINGS
}
