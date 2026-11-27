import { createEmptyCard } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import type { BossAttempt, ReviewEntry, StudyCard } from '../db/db.ts'
import { pickWeakWords, usesWord, workshopReason } from './workshop.ts'

const now = new Date('2026-11-27T12:00:00Z')

function card(senseId: string, lapses: number, stability = 1): StudyCard {
  return {
    id: `${senseId}#meaning`, senseId, kind: 'meaning', mode: 'choice', choiceStreak: 0, typingFailStreak: 0,
    source: 'route', fsrs: { ...createEmptyCard(now), lapses, stability }, createdAt: now,
  }
}

function wrong(senseId: string, daysAgo: number): ReviewEntry {
  return {
    cardId: `${senseId}#meaning`, senseId, at: new Date(now.getTime() - daysAgo * 86400000), mode: 'choice',
    selfScore: 0, finalScore: 0, correct: false, typo: false, usedTranslation: false, usedHint: false,
    knownShortcut: false, durationMs: 1000,
  }
}

describe('pickWeakWords', () => {
  it('puts lapses and recent mistakes first, ignores words never missed', () => {
    const cards = [card('a', 0), card('b', 2), card('c', 0), card('d', 0, 5)]
    const reviews = [wrong('c', 3), wrong('c', 10), wrong('a', 90), wrong('d', 1)]
    expect(pickWeakWords(cards, reviews, now)).toEqual(['b', 'c', 'd'])
  })
})

describe('workshopReason', () => {
  const boss = (daysAgo: number): BossAttempt => ({ phaseId: 'p', at: new Date(now.getTime() - daysAgo * 86400000), correct: 18, total: 20, passed: true })
  const last = { at: new Date(now.getTime() - 10 * 86400000), senseIds: [], produced: [] }
  it('needs enough weak words', () => {
    expect(workshopReason(2, undefined, [], now)).toBeNull()
    expect(workshopReason(5, undefined, [], now)).toBe('first')
  })
  it('suggests after a city or a month', () => {
    expect(workshopReason(5, last, [boss(20)], now)).toBeNull()
    expect(workshopReason(5, last, [boss(2)], now)).toBe('city')
    expect(workshopReason(5, { ...last, at: new Date(now.getTime() - 31 * 86400000) }, [], now)).toBe('monthly')
  })
})

describe('usesWord', () => {
  it('finds any form of the word', () => {
    expect(usesWord('Yesterday I went to the beach.', ['go', 'goes', 'went', 'gone'])).toBe(true)
    expect(usesWord('I like the ocean.', ['go', 'goes', 'went', 'gone'])).toBe(false)
    expect(usesWord('We will check in at noon', ['check in'])).toBe(true)
  })
})
