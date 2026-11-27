import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { phases } from '../content/index.ts'
import { db } from '../db/db.ts'
import { Dictionary } from '../dictionary/dictionary.ts'
import { buildQueue } from '../study/session.ts'
import { createDetour, deleteDetour } from './detour.ts'

const dict = new Dictionary({
  v: 1,
  synsets: [
    ['v', 'rise rapidly', 'prices soared', ['soar', 'surge']],
    ['n', 'a person who invests', '', ['investor']],
  ],
  lemmas: { soar: [0], investor: [1] },
})
const now = new Date('2026-11-27T10:00:00')

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('detours', () => {
  it('creates words that train only in the detour session', async () => {
    const route = phases[0].senses[0]
    const id = await createDetour('Wall Street', 30, [
      { lemma: 'soar', count: 2, sentence: 'Prices are soaring today.' },
      { lemma: 'investor', count: 1, sentence: 'No sentence with the word.' },
      { lemma: route.lemma, count: 1, sentence: 'x', routeSenseId: route.id },
    ], dict)

    const entries = await db.explorer.where('detourId').equals(id).toArray()
    // "investor" is skipped: its sentence doesn't contain the word.
    expect(entries.map((e) => e.word)).toEqual(['soar', route.lemma])
    expect(entries[0].custom?.gap).toEqual({ text: 'Prices are ____ today.', answer: 'soaring' })

    const daily = await buildQueue('new', now)
    expect(daily.some((q) => q.sense.id.startsWith('ex:'))).toBe(false)

    const detourQueue = await buildQueue('detour', now, id)
    expect(detourQueue.map((q) => q.sense.lemma)).toEqual(['soar', route.lemma])

    await deleteDetour(id)
    expect(await db.explorer.count()).toBe(0)
    expect(await db.detours.count()).toBe(0)
  })
})
