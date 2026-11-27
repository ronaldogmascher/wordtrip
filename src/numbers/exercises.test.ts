import { describe, expect, it } from 'vitest'
import { CATEGORIES, makeExercise, makeSession, maskTime, parsePrice, type Level } from './exercises.ts'

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

describe('maskTime', () => {
  it('fills the clock from the right as digits are typed', () => {
    expect(maskTime('')).toBe('')
    expect(maskTime('7')).toBe('00:07')
    expect(maskTime('74')).toBe('00:74')
    expect(maskTime('745')).toBe('07:45')
    expect(maskTime('1230')).toBe('12:30')
  })
  it('handles editing the masked value', () => {
    expect(maskTime('12:305')).toBe('12:30') // a 5th digit is ignored
    expect(maskTime('07:4')).toBe('00:74') // backspace
    expect(maskTime('00:0')).toBe('')
  })
  it('produces answers the times exercise accepts', () => {
    const typed = makeSession(['times'], 1, false, 40).filter((e) => e.mode === 'type')
    expect(typed.length).toBeGreaterThan(0)
    for (const ex of typed) expect(ex.check!(maskTime(ex.answer.replace(/\D/g, '')))).toBe(true)
  })
})
