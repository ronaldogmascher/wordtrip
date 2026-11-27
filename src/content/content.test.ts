import { describe, expect, it } from 'vitest'
import { allSenses, cities, phases } from './index.ts'
import { TOPICS } from './types.ts'

describe('content', () => {
  const senses = allSenses()

  it('has unique sense ids across all phases', () => {
    const ids = phases.flatMap((p) => p.senses.map((s) => s.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has 50 senses in each A1 phase', () => {
    for (const p of phases.filter((p) => p.cefr === 'A1')) expect(p.senses).toHaveLength(50)
  })

  it('links every shipped phase to a city on the map', () => {
    for (const p of phases) {
      const city = cities.find((c) => c.phaseId === p.id)
      expect(city?.available, p.id).toBe(true)
    }
  })

  it.each(senses.map((s) => [s.id, s] as const))('%s is well formed', (_id, s) => {
    expect(s.definition.length).toBeGreaterThan(5)
    expect(s.definitionPt.length).toBeGreaterThan(5)
    expect(s.translationPt.length).toBeGreaterThan(1)
    expect(s.ipaUS).not.toMatch(/\//)
    expect(s.ipaUK).not.toMatch(/\//)
    expect(s.topics.length).toBeGreaterThan(0)
    for (const t of s.topics) expect(TOPICS).toContain(t)
    expect(s.examples.length).toBeGreaterThan(0)
    for (const ex of s.examples) {
      expect(ex.text.split('____')).toHaveLength(2)
      expect(ex.answer.toLowerCase()).toContain(s.lemma.toLowerCase())
    }
    // The answer must not be given away by the definition.
    expect(s.definition.toLowerCase().split(/\W+/)).not.toContain(s.lemma.toLowerCase())
  })
})
