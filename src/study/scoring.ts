import { Rating, type Grade } from 'ts-fsrs'

// Weighted score: the learner's own 0–10 rating, adjusted by what actually happened.
// Values agreed in the plan; easy to tune here.
export const PENALTY = {
  typo: 2,
  translation: 3,
  hint: 2,
} as const

/** A wrong answer caps the final score at this value. */
export const WRONG_ANSWER_CAP = 3

export interface AnswerOutcome {
  /** 0–10 from the slider (10 = very easy, 0 = didn't remember). */
  selfScore: number
  correct: boolean
  typo: boolean
  usedTranslation: boolean
  usedHint: boolean
}

export function finalScore(o: AnswerOutcome): number {
  let score = clamp(Math.round(o.selfScore), 0, 10)
  if (o.typo) score -= PENALTY.typo
  if (o.usedTranslation) score -= PENALTY.translation
  if (o.usedHint) score -= PENALTY.hint
  if (!o.correct) score = Math.min(score, WRONG_ANSWER_CAP)
  return clamp(score, 0, 10)
}

/** Slider bands, also used for the colors on the slider. */
export const BANDS = [
  { min: 0, max: 3, label: 'Errei', rating: Rating.Again },
  { min: 4, max: 6, label: 'Difícil', rating: Rating.Hard },
  { min: 7, max: 8, label: 'Bom', rating: Rating.Good },
  { min: 9, max: 10, label: 'Fácil', rating: Rating.Easy },
] as const

export function toRating(score: number): Grade {
  return BANDS.find((b) => score >= b.min && score <= b.max)!.rating as Grade
}

/** XP earned for a card: proportional to the weighted score. */
export function xpFor(score: number): number {
  return 2 + score
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}
