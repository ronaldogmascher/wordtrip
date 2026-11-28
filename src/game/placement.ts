import type { City, Phase } from '../content/types.ts'
import type { BossAttempt, StudyCard } from '../db/db.ts'
import { applyKnownShortcut, newStudyCard } from '../study/scheduler.ts'

// Prova de nivelamento: for intermediate and advanced travelers, the A1 border boss over the
// whole leg, with two tries in total. Passing finishes every A1 city at once.

export const PLACEMENT_ID = 'placement:A1'
export const PLACEMENT_QUESTIONS = 50
export const PLACEMENT_TRIES = 2

export function placementState(attempts: BossAttempt[]): 'open' | 'passed' | 'used-up' {
  const mine = attempts.filter((a) => a.phaseId === PLACEMENT_ID)
  if (mine.some((a) => a.passed)) return 'passed'
  return mine.length >= PLACEMENT_TRIES ? 'used-up' : 'open'
}

/**
 * After passing: the leg's words not studied yet enter as "already known" (yellow) cards, with their first
 * review spread over the next 2–12 weeks so they do not all come back on the same day.
 */
export function skippedCards(leg: City[], phases: Phase[], existing: StudyCard[], now: Date, rng: () => number = Math.random): StudyCard[] {
  const seen = new Set(existing.map((c) => c.senseId))
  const ids = new Set(leg.map((c) => c.phaseId))
  return phases
    .filter((p) => ids.has(p.id))
    .flatMap((p) => p.senses)
    .filter((s) => !seen.has(s.id))
    .map((s) => {
      const card = applyKnownShortcut(newStudyCard(s.id, 'side-trip', now), now)
      const days = 14 + Math.floor(rng() * 70)
      // Kept yellow (under 21 days) so skipped words never count as learned until really reviewed.
      return { ...card, fsrs: { ...card.fsrs, due: new Date(now.getTime() + days * 86_400_000), scheduled_days: Math.min(days, 20) } }
    })
}
