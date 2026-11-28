import { createEmptyCard, State } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import { cities, phases } from '../content/index.ts'
import type { BossAttempt, StudyCard } from '../db/db.ts'
import { bossPool, hasPassed, isBorder, makeBossQuestions, nextTryAt, passMark, questionCount, upgradesEarned } from './boss.ts'
import { unlockedPhaseIds } from './progress.ts'

const now = new Date('2026-11-28T12:00:00Z')
const card = (senseId: string): StudyCard => ({
  id: `${senseId}#meaning`, senseId, kind: 'meaning', mode: 'choice', choiceStreak: 0, typingFailStreak: 0,
  source: 'route', fsrs: { ...createEmptyCard(now), state: State.Review, scheduled_days: 3 }, createdAt: now,
})
const attempt = (phaseId: string, passed: boolean, at = now): BossAttempt => ({ phaseId, at, correct: passed ? 18 : 10, total: 20, passed })

describe('boss rules', () => {
  it('the border is the last city of the leg and asks 50 questions', () => {
    expect(isBorder(cities[11], cities)).toBe(true)
    expect(questionCount(cities[11], cities)).toBe(50)
    expect(questionCount(cities[0], cities)).toBe(20)
  })
  it('needs 80% to win', () => {
    expect(passMark(20)).toBe(16)
    expect(hasPassed(16, 20)).toBe(true)
    expect(hasPassed(15, 20)).toBe(false)
    expect(passMark(50)).toBe(40)
  })
  it('asks only words already studied; the border asks the whole leg', () => {
    const cards = [phases[0].senses[0], phases[0].senses[1], phases[3].senses[0]].map((s) => card(s.id))
    expect(bossPool(cities[0], cities, phases, cards).map((s) => s.id)).toEqual([phases[0].senses[0].id, phases[0].senses[1].id])
    expect(bossPool(cities[11], cities, phases, cards)).toHaveLength(3)
  })
  it('makes different words, each with a sentence that has a blank', () => {
    const qs = makeBossQuestions(phases[0].senses, 20, () => 0.42)
    expect(qs).toHaveLength(20)
    expect(new Set(qs.map((q) => q.sense.id)).size).toBe(20)
    for (const q of qs) expect(q.sentence).toContain('____')
  })
  it('waits 24 h after a loss and closes once beaten', () => {
    expect(nextTryAt('en:a1:01', [], now)).toEqual(now)
    const lost = new Date(now.getTime() - 3600_000)
    expect(nextTryAt('en:a1:01', [attempt('en:a1:01', false, lost)], now)).toEqual(new Date(lost.getTime() + 24 * 3600_000))
    expect(nextTryAt('en:a1:01', [attempt('en:a1:01', false, new Date('2026-11-20'))], now)).toEqual(now)
    expect(nextTryAt('en:a1:01', [attempt('en:a1:01', true)], now)).toBeNull()
  })
  it('gives a motorhome upgrade per border crossed', () => {
    expect(upgradesEarned([cities], [attempt('en:a1:01', true)])).toHaveLength(0)
    expect(upgradesEarned([cities], [attempt('en:a1:12', true)])).toHaveLength(1)
  })
})

describe('unlockedPhaseIds', () => {
  it('opens cities up to the first boss not beaten', () => {
    expect([...unlockedPhaseIds(cities, [])]).toEqual(['en:a1:01'])
    expect([...unlockedPhaseIds(cities, [attempt('en:a1:01', true), attempt('en:a1:02', false)])]).toEqual(['en:a1:01', 'en:a1:02'])
  })
})
