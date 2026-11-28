import { createEmptyCard } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import type { IpaCard } from '../db/db.ts'
import { SOUNDS } from './sounds.ts'
import { allStageSoundIds, STAGES } from './camping.ts'
import { answerIpaCard, makeBossTest, makeQuestion, makeSession, NEW_SOUNDS_PER_SESSION, pickSessionSounds, QUESTION_KINDS, SESSION_SIZE } from './training.ts'

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

describe('IPA questions', () => {
  it.each(['US', 'UK'] as const)('builds valid questions for every sound (%s)', (accent) => {
    const rng = seeded(7)
    for (const sound of SOUNDS) {
      for (const kind of QUESTION_KINDS) {
        const q = makeQuestion(sound, accent, kind, rng)
        expect(q.options, sound.id).toContain(q.answer)
        expect(new Set(q.options).size).toBe(q.options.length)
        expect(q.options.length, sound.id).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('offers confusable symbols when hearing a word', () => {
    const sheepSound = SOUNDS.find((s) => s.id === 'i-long')!
    const q = makeQuestion(sheepSound, 'US', 'hear', seeded(1))
    expect(q.answer).toBe('/iː/')
    expect(q.options).toContain('/ɪ/')
  })

  it('asks minimal pairs with both words as options', () => {
    const q = makeQuestion(SOUNDS.find((s) => s.id === 'i-short')!, 'US', 'pair', seeded(3))
    expect(q.kind).toBe('pair')
    expect(q.options).toHaveLength(2)
    expect(q.options).toContain(q.word)
  })

  it('falls back to a hearing question when a sound has no minimal pair', () => {
    const q = makeQuestion(SOUNDS.find((s) => s.id === 'oi')!, 'US', 'pair', seeded(3))
    expect(q.kind).toBe('hear')
  })
})

describe('IPA session', () => {
  const now = new Date('2026-12-01T12:00:00Z')

  it('starts with a few new sounds', () => {
    expect(pickSessionSounds([], now)).toHaveLength(NEW_SOUNDS_PER_SESSION)
  })

  it('puts due sounds first and caps the size', () => {
    const cards: IpaCard[] = SOUNDS.map((s, i) => ({
      id: s.id,
      createdAt: now,
      fsrs: { ...createEmptyCard(now), due: new Date(+now + (i - 5) * 86_400_000), stability: i + 1 },
    }))
    const picked = pickSessionSounds(cards, now)
    expect(picked).toHaveLength(SESSION_SIZE)
    expect(picked[0].id).toBe(SOUNDS[0].id)
  })

  it('schedules a right answer later than a wrong one', () => {
    const right = answerIpaCard(undefined, 'ae', true, now)
    const wrong = answerIpaCard(undefined, 'ae', false, now)
    expect(+right.fsrs.due).toBeGreaterThan(+wrong.fsrs.due)
  })
})

describe('makeSession', () => {
  it('asks new sounds twice, from both sides', () => {
    const session = makeSession([], 'US', undefined, new Date())
    expect(session).toHaveLength(NEW_SOUNDS_PER_SESSION * 2)
    expect(session.filter((q) => q.sound.id === SOUNDS[0].id)).toHaveLength(2)
  })
})

describe('camping trail', () => {
  it('puts every sound in exactly one stage', () => {
    const ids = allStageSoundIds()
    expect(new Set(ids).size).toBe(ids.length)
    expect([...ids].sort()).toEqual(SOUNDS.map((s) => s.id).sort())
  })

  it('starts with the Pescaria sounds', () => {
    const picked = pickSessionSounds([], new Date(), STAGES[0].soundIds)
    expect(picked.every((s) => STAGES[0].soundIds.includes(s.id))).toBe(true)
  })

  it('builds boss tests of the right size covering every sound', () => {
    const test = makeBossTest(STAGES[0].soundIds, 10, 'US', seeded(5))
    expect(test).toHaveLength(10)
    expect(new Set(test.map((q) => q.sound.id)).size).toBe(STAGES[0].soundIds.length)
  })
})
