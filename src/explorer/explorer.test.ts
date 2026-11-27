import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { phases } from '../content/index.ts'
import { db } from '../db/db.ts'
import { buildQueue } from '../study/session.ts'
import { explorerSenseId, makeGap } from './explorer.ts'

describe('makeGap', () => {
  it('blanks the word or one of its forms', () => {
    expect(makeGap('She went home early.', 'go')).toEqual({ text: 'She ____ home early.', answer: 'went' })
    expect(makeGap('Prices are soaring this year', 'soar')).toEqual({ text: 'Prices are ____ this year', answer: 'soaring' })
    expect(makeGap('Serendipity is nice', 'serendipity')).toEqual({ text: '____ is nice', answer: 'Serendipity' })
  })

  it('handles expressions with spaces', () => {
    expect(makeGap('Can you Pick Up the kids?', 'pick up')).toEqual({ text: 'Can you ____ the kids?', answer: 'Pick Up' })
  })

  it('returns null when the word is missing', () => {
    expect(makeGap('Nothing to see here', 'bank')).toBeNull()
  })
})

describe('explorer words in sessions', () => {
  const now = new Date('2026-11-27T10:00:00')

  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('come before route words, and route words found early are not repeated', async () => {
    const routeSense = phases[1].senses[10]
    const id = await db.explorer.add({
      word: 'soar',
      status: 'ready',
      custom: {
        lemma: 'soar',
        pos: 'verb',
        definition: 'rise rapidly',
        gap: { text: 'Prices are ____', answer: 'soaring' },
        synonyms: [],
      },
      createdAt: new Date('2026-11-27T09:00:00'),
    })
    await db.explorer.add({ word: routeSense.lemma, status: 'ready', senseId: routeSense.id, createdAt: new Date('2026-11-27T09:30:00') })
    await db.explorer.add({ word: 'later', status: 'inbox', createdAt: now })

    const queue = await buildQueue('new', now)
    expect(queue[0].sense.id).toBe(explorerSenseId(id as number))
    expect(queue[0].card.source).toBe('explorer')
    expect(queue[1].sense.id).toBe(routeSense.id)
    expect(queue.filter((q) => q.sense.id === routeSense.id)).toHaveLength(1)
    expect(queue).toHaveLength(15)
  })
})
