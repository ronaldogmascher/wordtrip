import { describe, expect, it } from 'vitest'
import { grammarVerbs, isRight, makeQuestion, makeSession, TOPICS, variants } from './exercises.ts'

describe('grammar exercises', () => {
  it('has verbs from the route with a Portuguese meaning', () => {
    expect(grammarVerbs().length).toBeGreaterThan(50)
    expect(grammarVerbs().some((v) => v.base === 'be')).toBe(false)
  })

  it('splits US/UK variants', () => {
    expect(variants('learned (US) / learnt (UK)')).toEqual(['learned', 'learnt'])
  })

  it('builds valid questions for every topic', () => {
    for (const t of TOPICS) {
      for (let i = 0; i < 50; i++) {
        const q = makeQuestion(t.id)
        expect(q.text).toContain('____')
        expect(q.options).toContain(q.answer)
        expect(new Set(q.options).size).toBe(q.options.length)
        expect(q.options.length).toBeGreaterThanOrEqual(2)
        expect(isRight(q, q.answer, 'choice')).toBe(true)
        expect(isRight(q, q.answer.toUpperCase(), 'type')).toBe(true)
        expect(q.full).not.toContain('____')
      }
    }
  })

  it('gets the forms right', () => {
    let seed = 0
    const rng = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
    const q = makeQuestion('present-negative', rng)
    expect(q.answer).toMatch(/^(don't|doesn't) /)
    expect(q.accepted.some((a) => a.startsWith('do not') || a.startsWith('does not'))).toBe(true)
    const wrong = q.options.find((o) => o !== q.answer)!
    expect(isRight(q, wrong, 'choice')).toBe(false)
  })

  it('mixes the chosen topics in a session', () => {
    const s = makeSession(['past-simple', 'future-will'], 10)
    expect(s).toHaveLength(10)
    expect(new Set(s.map((q) => q.topic))).toEqual(new Set(['past-simple', 'future-will']))
  })
})
