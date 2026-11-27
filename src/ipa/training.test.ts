import { createEmptyCard } from 'ts-fsrs'
import { describe, expect, it } from 'vitest'
import type { IpaCard } from '../db/db.ts'
import { SOUNDS } from './sounds.ts'
import { answerIpaCard, makeQuestion, makeSession, NEW_SOUNDS_PER_SESSION, pickSessionSounds, SESSION_SIZE } from './training.ts'

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
      for (const preferHear of [true, false]) {
        const q = makeQuestion(sound, accent, preferHear, rng)
        expect(q.options, sound.id).toContain(q.answer)
        expect(new Set(q.options).size).toBe(q.options.length)
        expect(q.options.length, sound.id).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('uses transcriptions that differ only in the target sound', () => {
    const sheepSound = SOUNDS.find((s) => s.id === 'i-long')!
    const q = makeQuestion(sheepSound, 'US', true, seeded(1))
    expect(q.kind).toBe('hear')
    expect(q.options.some((o) => o.includes('ɪ'))).toBe(true)
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
    const session = makeSession([], 'US', new Date())
    expect(session).toHaveLength(NEW_SOUNDS_PER_SESSION * 2)
    expect(session.filter((q) => q.sound.id === SOUNDS[0].id)).toHaveLength(2)
  })
})
