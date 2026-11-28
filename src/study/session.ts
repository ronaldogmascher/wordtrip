import { State } from 'ts-fsrs'
import { allSenses, cities, phases } from '../content/index.ts'
import type { Sense } from '../content/types.ts'
import { db, getSettings, type ReviewEntry, type StudyCard } from '../db/db.ts'
import { DETOUR_NEW_PER_SESSION } from '../detour/detour.ts'
import { explorerSenses } from '../explorer/explorer.ts'
import { unlockedPhaseIds } from '../game/progress.ts'
import { newStudyCard, retrievability } from './scheduler.ts'

// Backlog protection: above RECOVERY_ON overdue reviews new cards pause,
// and they only come back once the backlog drops below RECOVERY_OFF.
export const RECOVERY_ON = 100
export const RECOVERY_OFF = 50
/** In a mixed session, one new card after every N reviews. */
export const REVIEWS_PER_NEW = 4

export function localDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export interface QueueItem {
  card: StudyCard
  sense: Sense
  isNew: boolean
}

export interface DayPlan {
  reviewsDue: number
  newToday: number
  newRemaining: number
  recovery: boolean
  estimatedMinutes: number
}

/** Reviews whose due date has passed, most at risk of being forgotten first. */
export async function dueReviews(now: Date): Promise<StudyCard[]> {
  const due = await db.cards.where('fsrs.due').belowOrEqual(now).toArray()
  return due
    .filter((c) => c.fsrs.state !== State.New)
    .sort((a, b) => retrievability(a.fsrs, now) - retrievability(b.fsrs, now))
}

export interface NewSense {
  sense: Sense
  source: 'route' | 'explorer'
}

/**
 * Senses not studied yet: the learner's own words from the Diário de bordo first (they have
 * priority within the daily limit), then the route in the order of the journey.
 */
export async function unseenSenses(): Promise<NewSense[]> {
  const seen = new Set(await db.cards.toCollection().primaryKeys())
  const isUnseen = (s: Sense) => !seen.has(`${s.id}#meaning`)
  // Words imported from a text ("Desvio") are trained in that detour's own sessions.
  const explorer: NewSense[] = (await explorerSenses())
    .filter(({ entry, sense }) => entry.detourId === undefined && isUnseen(sense))
    .map(({ sense }) => ({ sense, source: 'explorer' }))
  const early = new Set(explorer.map((e) => e.sense.id))
  // New route words come only from unlocked cities: the next one opens when a boss is beaten.
  const open = unlockedPhaseIds(cities, await db.bossAttempts.toArray())
  const route: NewSense[] = phases
    .filter((p) => open.has(p.id))
    .flatMap((p) => p.senses)
    .filter((s) => isUnseen(s) && !early.has(s.id))
    .map((sense) => ({ sense, source: 'route' }))
  return [...explorer, ...route]
}

/** Content senses plus the learner's own words, by id. */
export async function senseMap(): Promise<Map<string, Sense>> {
  const map = new Map(allSenses().map((s) => [s.id, s]))
  for (const { sense } of await explorerSenses()) map.set(sense.id, sense)
  return map
}

async function updateRecovery(reviewsDue: number): Promise<boolean> {
  const settings = await getSettings()
  let recovery = settings.recoveryActive
  if (!recovery && reviewsDue > RECOVERY_ON) recovery = true
  if (recovery && reviewsDue < RECOVERY_OFF) recovery = false
  if (recovery !== settings.recoveryActive) await db.settings.put({ ...settings, recoveryActive: recovery })
  return recovery
}

export async function dayPlan(now: Date): Promise<DayPlan> {
  const settings = await getSettings()
  const reviews = await dueReviews(now)
  const recovery = await updateRecovery(reviews.length)
  const today = await db.days.get(localDate(now))
  const newToday = today?.newCards ?? 0
  const unseen = (await unseenSenses()).length
  const newRemaining = recovery ? 0 : Math.max(0, Math.min(settings.newPerDay - newToday, unseen))
  // Rough estimate: ~12 s per review, ~30 s per new card.
  const estimatedMinutes = Math.ceil((reviews.length * 12 + newRemaining * 30) / 60)
  return { reviewsDue: reviews.length, newToday, newRemaining, recovery, estimatedMinutes }
}

export type SessionKind = 'mixed' | 'reviews' | 'new' | 'detour'

/** A detour's session: its due reviews, then up to DETOUR_NEW_PER_SESSION new words. */
async function buildDetourQueue(detourId: number, now: Date): Promise<QueueItem[]> {
  const items = (await explorerSenses()).filter(({ entry }) => entry.detourId === detourId)
  const ids = new Set(items.map((i) => i.sense.id))
  const reviews: QueueItem[] = []
  for (const card of await dueReviews(now)) {
    const item = items.find((i) => i.sense.id === card.senseId)
    if (item) reviews.push({ card, sense: item.sense, isNew: false })
  }
  const seen = new Set((await db.cards.where('senseId').anyOf([...ids]).toArray()).map((c) => c.senseId))
  const fresh: QueueItem[] = items
    .filter((i) => !seen.has(i.sense.id))
    .slice(0, DETOUR_NEW_PER_SESSION)
    .map(({ sense }) => ({ card: newStudyCard(sense.id, 'explorer', now), sense, isNew: true }))
  return [...reviews, ...fresh]
}

/** Builds the queue for a session. Cards for new senses are created only when answered. */
export async function buildQueue(kind: SessionKind, now: Date, detourId?: number): Promise<QueueItem[]> {
  if (kind === 'detour') return detourId === undefined ? [] : buildDetourQueue(detourId, now)
  const plan = await dayPlan(now)
  const reviews = kind === 'new' ? [] : await dueReviews(now)
  const newSenses = kind === 'reviews' ? [] : (await unseenSenses()).slice(0, plan.newRemaining)
  const senses = await senseMap()

  const reviewItems: QueueItem[] = []
  for (const card of reviews) {
    const sense = senses.get(card.senseId)
    if (sense) reviewItems.push({ card, sense, isNew: false })
  }
  const newItems: QueueItem[] = newSenses.map(({ sense, source }) => ({
    card: newStudyCard(sense.id, source, now),
    sense,
    isNew: true,
  }))

  if (kind !== 'mixed') return [...reviewItems, ...newItems]

  const queue: QueueItem[] = []
  let r = 0
  let n = 0
  while (r < reviewItems.length || n < newItems.length) {
    for (let i = 0; i < REVIEWS_PER_NEW && r < reviewItems.length; i++) queue.push(reviewItems[r++])
    if (n < newItems.length) queue.push(newItems[n++])
  }
  return queue
}

/** Saves an answered card, its review entry and the day's totals in one transaction. */
export async function saveAnswer(card: StudyCard, review: Omit<ReviewEntry, 'id'>, isNew: boolean, xp: number) {
  const date = localDate(review.at)
  await db.transaction('rw', db.cards, db.reviews, db.days, async () => {
    await db.cards.put(card)
    await db.reviews.add(review)
    const day = (await db.days.get(date)) ?? { date, activeSeconds: 0, cardsReviewed: 0, newCards: 0, xp: 0 }
    await db.days.put({
      ...day,
      cardsReviewed: day.cardsReviewed + 1,
      newCards: day.newCards + (isNew ? 1 : 0),
      xp: day.xp + xp,
    })
  })
}

/** Three wrong options for multiple choice, preferring the same part of speech. */
export function distractors(sense: Sense, pool: Sense[] = allSenses(), random = Math.random): string[] {
  const others = pool.filter((s) => s.lemma !== sense.lemma)
  const samePos = others.filter((s) => s.pos === sense.pos)
  const source = samePos.length >= 3 ? samePos : others
  const picked = new Set<string>()
  const shuffled = [...source].sort(() => random() - 0.5)
  for (const s of shuffled) {
    picked.add(s.lemma)
    if (picked.size === 3) break
  }
  return [...picked]
}
