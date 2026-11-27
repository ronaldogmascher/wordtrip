import { describe, expect, it } from 'vitest'
import { timeUntil } from './when.ts'

const now = new Date('2026-01-01T12:00:00')
const later = (ms: number) => new Date(now.getTime() + ms)
const MIN = 60_000
const DAY = 24 * 60 * MIN

describe('timeUntil', () => {
  it('uses minutes, hours, days and months', () => {
    expect(timeUntil(later(10 * MIN), now)).toBe('em 10 min')
    expect(timeUntil(later(5 * 60 * MIN), now)).toBe('em 5 h')
    expect(timeUntil(later(DAY), now)).toBe('amanhã')
    expect(timeUntil(later(3 * DAY), now)).toBe('em 3 dias')
    expect(timeUntil(later(90 * DAY), now)).toBe('em 3 meses')
  })
  it('never says zero minutes', () => {
    expect(timeUntil(now, now)).toBe('em 1 min')
  })
})
