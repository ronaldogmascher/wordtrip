import type { City, Phase } from '../content/types.ts'
import type { BossAttempt, StudyCard, StudyDay } from '../db/db.ts'
import { lightOf } from '../study/scheduler.ts'

// The road trip: how far the learner has driven (Km), the fuel they have (⛽) and where each
// city of the route stands. Kept free of the database so it is easy to test.

/** Share of a city's words that must be at least yellow for its boss to show up. */
export const BOSS_READY_SHARE = 0.8

/**
 * Km driven: every answer moves the motorhome (the same points the study screen gives, stored
 * as `xp` on each day). Km never goes down and sets the traveler's level.
 */
export const totalKm = (days: StudyDay[]) => days.reduce((sum, d) => sum + d.xp, 0)

/** Fuel: each km fills 1 ⛽; spending it (bonus trips, looks, streak insurance) comes later. */
export const fuel = (km: number, spent = 0) => Math.max(0, km - spent)

/** Traveler level from Km: each level needs 100 km more than the one before (100, 300, 600…). */
export function levelOf(km: number): { level: number; kmIntoLevel: number; kmForNext: number } {
  let level = 1
  let need = 100
  let left = km
  while (left >= need) {
    left -= need
    level++
    need += 100
  }
  return { level, kmIntoLevel: left, kmForNext: need }
}

export type CityStatus = 'done' | 'current' | 'ahead'

export interface CityProgress {
  city: City
  total: number
  discovering: number
  learning: number
  learned: number
  /** Words at least yellow (learning or learned), from 0 to 1. */
  share: number
  bossReady: boolean
  status: CityStatus
}

/** Where every city stands: words by traffic-light color, boss readiness and route status. */
export function routeProgress(cities: City[], phases: Phase[], cards: StudyCard[], bosses: BossAttempt[]): CityProgress[] {
  const bySense = new Map(cards.map((c) => [c.senseId, c]))
  const beaten = new Set(bosses.filter((b) => b.passed).map((b) => b.phaseId))
  let currentFound = false
  return cities.map((city) => {
    const senses = phases.find((p) => p.id === city.phaseId)?.senses ?? []
    const counts = { discovering: 0, learning: 0, learned: 0 }
    for (const s of senses) {
      const card = bySense.get(s.id)
      if (card) counts[lightOf(card.fsrs)]++
    }
    const total = senses.length
    const share = total ? (counts.learning + counts.learned) / total : 0
    let status: CityStatus = 'ahead'
    if (beaten.has(city.phaseId)) status = 'done'
    else if (!currentFound) {
      status = 'current'
      currentFound = true
    }
    return { city, total, ...counts, share, bossReady: share >= BOSS_READY_SHARE, status }
  })
}

/**
 * Phases whose new words can be studied: every city up to the current one. The next city opens
 * when its previous city's boss is beaten.
 */
export function unlockedPhaseIds(cities: City[], bosses: BossAttempt[]): Set<string> {
  const beaten = new Set(bosses.filter((b) => b.passed).map((b) => b.phaseId))
  const open = new Set<string>()
  for (const city of cities) {
    open.add(city.phaseId)
    if (!beaten.has(city.phaseId)) break
  }
  return open
}
