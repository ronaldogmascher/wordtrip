import { describe, expect, it } from 'vitest'
import { phases } from '../content/index.ts'
import { TOPICS } from '../content/types.ts'
import { cityPreview, TOPIC_PT } from './preview.ts'

describe('cityPreview', () => {
  it('names every topic in Portuguese', () => {
    for (const t of TOPICS) expect(TOPIC_PT[t]).toBeTruthy()
  })
  it('gives up to 3 topics and 5 different words for every city', () => {
    for (const phase of phases) {
      const p = cityPreview(phase)
      expect(p.topics.length).toBeGreaterThan(0)
      expect(p.topics.length).toBeLessThanOrEqual(3)
      expect(p.sample).toHaveLength(5)
      expect(new Set(p.sample).size).toBe(5)
    }
  })
})
