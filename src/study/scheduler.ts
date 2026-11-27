import { createEmptyCard, fsrs, Rating, State, type Card as FsrsCard, type Grade } from 'ts-fsrs'
import type { AnswerMode, CardSource, StudyCard } from '../db/db.ts'

const scheduler = fsrs({ enable_fuzz: true })

/** Interval (days) from which a sense counts as learned (green). */
export const MATURE_DAYS = 21

export type Light = 'learning' | 'young' | 'mature'

export function newStudyCard(senseId: string, source: CardSource, now: Date, mode: AnswerMode = 'choice'): StudyCard {
  return {
    id: `${senseId}#meaning`,
    senseId,
    kind: 'meaning',
    mode,
    choiceStreak: 0,
    typingFailStreak: 0,
    source,
    fsrs: createEmptyCard(now),
    createdAt: now,
  }
}

/** Traffic-light state of a card. */
export function lightOf(card: FsrsCard): Light {
  if (card.state === State.New || card.state === State.Learning || card.state === State.Relearning) return 'learning'
  return card.scheduled_days >= MATURE_DAYS ? 'mature' : 'young'
}

/** Probability (0–1) that the learner still remembers the card now. */
export function retrievability(card: FsrsCard, now: Date): number {
  if (card.state === State.New) return 0
  return scheduler.get_retrievability(card, now, false)
}

export interface ReviewResult {
  card: StudyCard
}

/**
 * Applies an answer to a card: FSRS scheduling plus the multiple-choice → typing rule
 * (2 correct choices in a row with score ≥ 7 → typing; 2 typing failures in a row → back to choice).
 */
export function applyReview(
  card: StudyCard,
  rating: Grade,
  score: number,
  correct: boolean,
  now: Date,
): StudyCard {
  const next = scheduler.next(card.fsrs, now, rating).card
  let { mode, choiceStreak, typingFailStreak } = card

  if (mode === 'choice') {
    choiceStreak = correct && score >= 7 ? choiceStreak + 1 : 0
    if (choiceStreak >= 2) {
      mode = 'typing'
      choiceStreak = 0
      typingFailStreak = 0
    }
  } else {
    typingFailStreak = correct ? 0 : typingFailStreak + 1
    if (typingFailStreak >= 2) {
      mode = 'choice'
      typingFailStreak = 0
      choiceStreak = 0
    }
  }

  return { ...card, fsrs: next, mode, choiceStreak, typingFailStreak }
}

/** "Já sei": the learner answered a new card right on the first try, without help. */
export function applyKnownShortcut(card: StudyCard, now: Date): StudyCard {
  const once = scheduler.next(card.fsrs, now, Rating.Easy).card
  return { ...card, fsrs: once, mode: 'typing', choiceStreak: 0, typingFailStreak: 0 }
}
