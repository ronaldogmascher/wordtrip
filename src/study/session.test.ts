import 'fake-indexeddb/auto'
import { Rating } from 'ts-fsrs'
import { beforeEach, describe, expect, it } from 'vitest'
import { phases } from '../content/index.ts'
import { db, DEFAULT_SETTINGS } from '../db/db.ts'
import { applyReview, newStudyCard } from './scheduler.ts'
import { buildQueue, dayPlan, distractors } from './session.ts'

const now = new Date('2026-11-27T10:00:00')

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('day plan', () => {
  it('offers 15 new senses on the first day', async () => {
    const plan = await dayPlan(now)
    expect(plan).toMatchObject({ reviewsDue: 0, newRemaining: 15, recovery: false })
  })

  it('keeps new cards paused while recovery is on and the backlog is still 50 or more', async () => {
    const senses = phases[0].senses
    const past = new Date('2026-11-01T10:00:00')
    const cards = senses.map((s) => applyReview(newStudyCard(s.id, 'route', past), Rating.Good, 8, true, past))
    await db.cards.bulkPut(cards)
    await db.settings.put({ ...DEFAULT_SETTINGS, recoveryActive: true })
    const plan = await dayPlan(now)
    expect(plan.reviewsDue).toBe(50)
    expect(plan.recovery).toBe(true)
    expect(plan.newRemaining).toBe(0)
  })
})

describe('session queue', () => {
  it('mixes one new card after every four reviews', async () => {
    const past = new Date('2026-11-01T10:00:00')
    const reviewed = phases[0].senses.slice(0, 8).map((s) => applyReview(newStudyCard(s.id, 'route', past), Rating.Good, 8, true, past))
    await db.cards.bulkPut(reviewed)
    const queue = await buildQueue('mixed', now)
    expect(queue.slice(0, 10).map((q) => q.isNew)).toEqual([false, false, false, false, true, false, false, false, false, true])
  })
})

describe('multiple choice', () => {
  it('returns three different wrong options', () => {
    const s = phases[0].senses[0]
    const opts = distractors(s)
    expect(opts).toHaveLength(3)
    expect(opts).not.toContain(s.lemma)
    expect(new Set(opts).size).toBe(3)
  })
})
