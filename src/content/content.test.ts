import { describe, expect, it } from 'vitest'
import { allSenses, cities, phases } from './index.ts'
import { TOPICS } from './types.ts'

describe('content', () => {
  const senses = allSenses()

  it('has unique sense ids across all phases', () => {
    const ids = phases.flatMap((p) => p.senses.map((s) => s.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has 50 senses in every shipped phase', () => {
    for (const p of phases) expect(p.senses, p.id).toHaveLength(50)
  })

  it('plans 80 cities in four legs, numbered in order', () => {
    expect(cities).toHaveLength(80)
    expect(['A1', 'A2', 'B1', 'B2'].map((cefr) => cities.filter((c) => c.cefr === cefr).length)).toEqual([12, 12, 26, 30])
    cities.forEach((c, i) => expect(c.number).toBe(i + 1))
    expect(new Set(cities.map((c) => c.phaseId)).size).toBe(80)
  })

  it('has content for every available city', () => {
    for (const c of cities.filter((c) => c.available)) expect(phases.some((p) => p.id === c.phaseId), c.phaseId).toBe(true)
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

describe('verb forms', () => {
  it('gives every verb its forms', () => {
    for (const s of allSenses().filter((s) => s.pos === 'verb')) expect(s.forms, s.id).toBeDefined()
  })
})
