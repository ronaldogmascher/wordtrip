import 'fake-indexeddb/auto'
import { createEmptyCard } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import { getSettings, WordTripDB, DEFAULT_SETTINGS } from './db.ts'

describe('database', () => {
  it('stores a card and finds it by due date', async () => {
    const db = new WordTripDB('test-cards')
    const now = new Date('2026-11-27T10:00:00Z')
    await db.cards.add({
      id: 'en:go:v:1#meaning',
      senseId: 'en:go:v:1',
      kind: 'meaning',
      mode: 'choice',
      choiceStreak: 0,
      typingFailStreak: 0,
      source: 'route',
      fsrs: createEmptyCard(now),
      createdAt: now,
    })
    const due = await db.cards.where('fsrs.due').belowOrEqual(now).toArray()
    expect(due.map((c) => c.senseId)).toEqual(['en:go:v:1'])
    db.close()
  })

  it('falls back to default settings', async () => {
    expect(await getSettings()).toEqual(DEFAULT_SETTINGS)
  })
})
