import { describe, expect, it } from 'vitest'
import { MINIMAL_PAIRS, PAIR_IPA, soundById, SOUNDS } from './sounds.ts'

describe('IPA sounds', () => {
  it('has unique ids and three examples per sound', () => {
    expect(new Set(SOUNDS.map((s) => s.id)).size).toBe(SOUNDS.length)
    for (const s of SOUNDS) {
      expect(s.examples.length, s.id).toBe(3)
      expect(s.pt.length).toBeGreaterThan(10)
    }
  })

  it('minimal pairs point to existing sounds and differ', () => {
    for (const p of MINIMAL_PAIRS) {
      expect(p.a).not.toBe(p.b)
      for (const id of p.sounds) expect(soundById(id), id).toBeDefined()
    }
  })
})

describe('minimal pair transcriptions', () => {
  it('every pair word has US and UK IPA', () => {
    for (const p of MINIMAL_PAIRS) for (const w of [p.a, p.b]) expect(PAIR_IPA[w], w).toBeDefined()
  })
})
