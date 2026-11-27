import { Rating, State } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import type { StudyCard } from '../db/db.ts'
import { checkAnswer, hintFor } from './answer.ts'
import { applyKnownShortcut, applyReview, lightOf, newStudyCard } from './scheduler.ts'
import { finalScore, toRating } from './scoring.ts'

const base = { selfScore: 10, correct: true, typo: false, usedTranslation: false, usedHint: false }

describe('weighted score', () => {
  it('keeps the self score when nothing went wrong', () => {
    expect(finalScore(base)).toBe(10)
  })
  it('matches the plan example: 10 − typo − translation = 5', () => {
    expect(finalScore({ ...base, typo: true, usedTranslation: true })).toBe(5)
  })
  it('caps a wrong answer at 3', () => {
    expect(finalScore({ ...base, correct: false })).toBe(3)
  })
  it('never goes below 0', () => {
    expect(finalScore({ ...base, selfScore: 2, typo: true, usedTranslation: true, usedHint: true })).toBe(0)
  })
  it('maps bands to FSRS ratings', () => {
    expect([0, 3, 4, 6, 7, 8, 9, 10].map(toRating)).toEqual([
      Rating.Again, Rating.Again, Rating.Hard, Rating.Hard, Rating.Good, Rating.Good, Rating.Easy, Rating.Easy,
    ])
  })
})

describe('typed answers', () => {
  it('accepts exact answers ignoring case and punctuation', () => {
    expect(checkAnswer(' Water. ', 'water')).toBe('correct')
  })
  it('flags small typos', () => {
    expect(checkAnswer('watr', 'water')).toBe('typo')
    expect(checkAnswer('tomorow', 'tomorrow')).toBe('typo')
  })
  it('rejects different words', () => {
    expect(checkAnswer('food', 'water')).toBe('wrong')
    expect(checkAnswer('', 'water')).toBe('wrong')
  })
  it('builds a first-letter hint', () => {
    expect(hintFor('thank you')).toBe('t____ y__')
  })
})

describe('scheduling', () => {
  const now = new Date('2026-11-27T10:00:00Z')

  it('moves to typing after 2 good multiple-choice answers', () => {
    let card = newStudyCard('en:go:v:1', 'route', now)
    card = applyReview(card, Rating.Good, 8, true, now)
    expect(card.mode).toBe('choice')
    card = applyReview(card, Rating.Good, 8, true, card.fsrs.due)
    expect(card.mode).toBe('typing')
  })

  it('goes back to multiple choice after 2 typing failures', () => {
    let card: StudyCard = { ...newStudyCard('en:go:v:1', 'route', now), mode: 'typing' }
    card = applyReview(card, Rating.Again, 2, false, now)
    card = applyReview(card, Rating.Again, 2, false, card.fsrs.due)
    expect(card.mode).toBe('choice')
  })

  it('starts as a red (discovering) card', () => {
    expect(lightOf(newStudyCard('en:go:v:1', 'route', now).fsrs)).toBe('discovering')
  })

  it('sends a "Já sei" card out of the red state', () => {
    const card = applyKnownShortcut(newStudyCard('en:go:v:1', 'route', now), now)
    expect(card.fsrs.state).toBe(State.Review)
    expect(card.fsrs.scheduled_days).toBeGreaterThanOrEqual(5)
  })
})
