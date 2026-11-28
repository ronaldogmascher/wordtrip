import { describe, expect, it } from 'vitest'
import { phases } from '../content/index.ts'
import { citiesA1 as cities } from '../content/en/journey.ts'
import { PLACEMENT_ID, placementState, skippedCards } from './placement.ts'

const now = new Date('2026-11-28T12:00:00Z')
const attempt = (passed: boolean) => ({ phaseId: PLACEMENT_ID, at: now, correct: passed ? 45 : 20, total: 50, passed })

describe('placement test', () => {
  it('gives two tries in total', () => {
    expect(placementState([])).toBe('open')
    expect(placementState([attempt(false)])).toBe('open')
    expect(placementState([attempt(false), attempt(false)])).toBe('used-up')
    expect(placementState([attempt(false), attempt(true)])).toBe('passed')
  })
  it('adds the unseen A1 words as known cards with spread-out reviews', () => {
    const cards = skippedCards(cities, phases, [], now, () => 0.5)
    expect(cards).toHaveLength(600)
    for (const c of cards.slice(0, 5)) {
      expect(c.source).toBe('side-trip')
      expect(c.fsrs.due.getTime()).toBeGreaterThan(now.getTime() + 13 * 86_400_000)
    }
  })
})
