import { createEmptyCard, State } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import { cities, phases } from '../content/index.ts'
import type { StudyCard } from '../db/db.ts'
import { fuel, levelOf, routeProgress, totalKm } from './progress.ts'

const now = new Date('2026-11-28T12:00:00Z')

function card(senseId: string, scheduledDays: number, state = State.Review): StudyCard {
  return {
    id: `${senseId}#meaning`, senseId, kind: 'meaning', mode: 'choice', choiceStreak: 0, typingFailStreak: 0,
    source: 'route', fsrs: { ...createEmptyCard(now), state, scheduled_days: scheduledDays }, createdAt: now,
  }
}

describe('Km and fuel', () => {
  it('adds up the days and never goes negative', () => {
    const days = [{ date: '2026-11-27', activeSeconds: 0, cardsReviewed: 0, newCards: 0, xp: 120 }, { date: '2026-11-28', activeSeconds: 0, cardsReviewed: 0, newCards: 0, xp: 30 }]
    expect(totalKm(days)).toBe(150)
    expect(fuel(150, 200)).toBe(0)
  })
  it('levels need 100 km more each time', () => {
    expect(levelOf(0)).toEqual({ level: 1, kmIntoLevel: 0, kmForNext: 100 })
    expect(levelOf(150)).toEqual({ level: 2, kmIntoLevel: 50, kmForNext: 200 })
    expect(levelOf(300).level).toBe(3)
  })
})

describe('routeProgress', () => {
  it('counts colors per city and marks the boss ready at 80% yellow or green', () => {
    const senses = phases[0].senses
    const cards = senses.slice(0, 40).map((s, i) => card(s.id, i < 10 ? 30 : 5))
    cards.push(card(senses[45].id, 0, State.Learning))
    const [first, second] = routeProgress(cities, phases, cards, [])
    expect(first.learned).toBe(10)
    expect(first.learning).toBe(30)
    expect(first.discovering).toBe(1)
    expect(first.share).toBeCloseTo(0.8)
    expect(first.bossReady).toBe(true)
    expect(first.status).toBe('current')
    expect(second.status).toBe('ahead')
  })
  it('a beaten boss completes the city and moves the motorhome on', () => {
    const [first, second] = routeProgress(cities, phases, [], [{ phaseId: cities[0].phaseId, at: now, correct: 18, total: 20, passed: true }])
    expect(first.status).toBe('done')
    expect(second.status).toBe('current')
  })
})
