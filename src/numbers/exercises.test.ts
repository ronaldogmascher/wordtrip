import { describe, expect, it } from 'vitest'
import { CATEGORIES, makeExercise, makeSession, parsePrice, type Level } from './exercises.ts'

// Small deterministic random generator so the tests are repeatable.
function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

describe('parsePrice', () => {
  it.each([['12.99', 1299], ['$12.99', 1299], ['12,99', 1299], ['1,299.99', 129999], ['1.299,99', 129999], ['5', 500],
    ['abc', null]])('%s → %s', (text, cents) => expect(parsePrice(text)).toBe(cents))
})

describe('exercises', () => {
  const rng = seeded(42)
  const levels: Level[] = [1, 2, 3]

  it('always offers the right answer once among different options', () => {
    for (let i = 0; i < 300; i++) {
      const ex = makeExercise(CATEGORIES[i % CATEGORIES.length].id, levels[i % 3], i % 2 === 0, rng)
      if (ex.mode === 'choice') {
        expect(ex.options).toContain(ex.answer)
        expect(new Set(ex.options).size).toBe(ex.options!.length)
        expect(ex.options!.length).toBeGreaterThanOrEqual(2)
      } else {
        expect(ex.check!(ex.answer), `${ex.category}: ${ex.answer}`).toBe(true)
        expect(ex.check!('')).toBe(false)
        expect(ex.speech).toBeTruthy()
      }
    }
  })

  it('builds a session of the requested size', () => {
    expect(makeSession(['times', 'prices'], 2, false, 10, rng)).toHaveLength(10)
  })
})
