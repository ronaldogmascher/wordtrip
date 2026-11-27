import type { BossAttempt, ReviewEntry, StudyCard, WorkshopSession } from '../db/db.ts'

// "Oficina" 🔧: a reinforcement session for the words the learner forgets the most, using other
// memory techniques (a memory hook, producing the word from Portuguese, dictation and writing
// an own sentence). It is suggested every month and after each city is completed.

export const WORKSHOP_SIZE = 10
/** Fewer weak words than this and there is nothing worth fixing yet. */
export const MIN_WEAK_WORDS = 3
export const DAYS_BETWEEN_WORKSHOPS = 30
const RECENT_DAYS = 60
const DAY = 24 * 60 * 60 * 1000

/**
 * How badly a word is going: each lapse (forgot after learning) weighs 3, each wrong answer in
 * the last 60 days weighs 1. Words never answered wrong score 0 and are left out.
 */
export function weakness(card: StudyCard, reviews: ReviewEntry[], now: Date): number {
  const since = now.getTime() - RECENT_DAYS * DAY
  const wrong = reviews.filter((r) => r.cardId === card.id && !r.correct && r.at.getTime() >= since).length
  return card.fsrs.lapses * 3 + wrong
}

/** The weakest words, worst first; ties go to the card least likely to be remembered (lowest stability). */
export function pickWeakWords(cards: StudyCard[], reviews: ReviewEntry[], now: Date, size = WORKSHOP_SIZE): string[] {
  return cards
    .map((card) => ({ card, score: weakness(card, reviews, now) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.card.fsrs.stability - b.card.fsrs.stability)
    .slice(0, size)
    .map((x) => x.card.senseId)
}

export type WorkshopReason = 'first' | 'monthly' | 'city'

/**
 * Whether the Home screen should invite the learner to the Oficina, and why: there must be
 * enough weak words, and either it was never done, a month has passed, or a city was completed
 * (a boss beaten) since the last one.
 */
export function workshopReason(
  weakCount: number,
  last: WorkshopSession | undefined,
  bosses: BossAttempt[],
  now: Date,
): WorkshopReason | null {
  if (weakCount < MIN_WEAK_WORDS) return null
  if (!last) return 'first'
  if (bosses.some((b) => b.passed && b.at > last.at)) return 'city'
  if (now.getTime() - last.at.getTime() >= DAYS_BETWEEN_WORKSHOPS * DAY) return 'monthly'
  return null
}

/** Does the learner's own sentence use the word (any of its forms)? */
export function usesWord(sentence: string, forms: string[]): boolean {
  const text = ` ${sentence.toLowerCase().replace(/[^a-z' -]/g, ' ')} `
  return forms.some((f) => f && text.includes(` ${f.toLowerCase()} `))
}
