import { createEmptyCard, State } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import type { IpaCard, SchoolLesson } from '../db/db.ts'
import { bossReady, lessonId, openSoundIds, openStages, rangerOpen, STAGES, stageProgress } from './camping.ts'

const now = new Date('2026-12-01T12:00:00Z')
const learning = (id: string): IpaCard => ({
  id, createdAt: now, fsrs: { ...createEmptyCard(now), state: State.Review, scheduled_days: 3 },
})
const beaten = (id: string): SchoolLesson => ({ id: lessonId(id), best: 10, total: 10, passedAt: now })

describe('camping stages', () => {
  it('opens only the first stage at the start', () => {
    expect(openStages([]).map((s) => s.id)).toEqual(['pescaria'])
    expect(openSoundIds([])).toEqual(STAGES[0].soundIds)
  })

  it('opens the next stage after a boss is beaten', () => {
    expect(openStages([beaten('pescaria')]).map((s) => s.id)).toEqual(['pescaria', 'escalada'])
  })

  it('opens the boss at 80% of the sounds in yellow or green', () => {
    const [first] = STAGES
    const three = first.soundIds.slice(0, 3).map(learning)
    const four = first.soundIds.slice(0, 4).map(learning)
    expect(bossReady(first, three)).toBe(false)
    expect(bossReady(first, four)).toBe(true)
    expect(stageProgress(first, four)).toEqual({ ready: 4, total: 5 })
  })

  it('does not count new cards as ready', () => {
    const fresh = STAGES[0].soundIds.map((id) => ({ id, createdAt: now, fsrs: createEmptyCard(now) }))
    expect(stageProgress(STAGES[0], fresh).ready).toBe(0)
  })

  it('opens the ranger after all five bosses', () => {
    expect(rangerOpen(STAGES.slice(0, 4).map((s) => beaten(s.id)))).toBe(false)
    expect(rangerOpen(STAGES.map((s) => beaten(s.id)))).toBe(true)
  })
})
