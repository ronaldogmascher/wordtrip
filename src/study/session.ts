import { State } from 'ts-fsrs'
import { allSenses, phases } from '../content/index.ts'
import type { Sense } from '../content/types.ts'
import { db, getSettings, type ReviewEntry, type StudyCard } from '../db/db.ts'
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

/** Route senses not studied yet, in the order of the journey. */
export async function unseenRouteSenses(): Promise<Sense[]> {
  const seen = new Set(await db.cards.toCollection().primaryKeys())
  // Phase unlocking (boss battles) comes later; for now every shipped phase is open.
  return phases.flatMap((p) => p.senses).filter((s) => !seen.has(`${s.id}#meaning`))
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
  const unseen = (await unseenRouteSenses()).length
  const newRemaining = recovery ? 0 : Math.max(0, Math.min(settings.newPerDay - newToday, unseen))
  // Rough estimate: ~12 s per review, ~30 s per new card.
  const estimatedMinutes = Math.ceil((reviews.length * 12 + newRemaining * 30) / 60)
  return { reviewsDue: reviews.length, newToday, newRemaining, recovery, estimatedMinutes }
}

export type SessionKind = 'mixed' | 'reviews' | 'new'

/** Builds the queue for a session. Cards for new senses are created only when answered. */
export async function buildQueue(kind: SessionKind, now: Date): Promise<QueueItem[]> {
  const plan = await dayPlan(now)
  const reviews = kind === 'new' ? [] : await dueReviews(now)
  const newSenses = kind === 'reviews' ? [] : (await unseenRouteSenses()).slice(0, plan.newRemaining)

  const reviewItems: QueueItem[] = []
  for (const card of reviews) {
    const sense = allSenses().find((s) => s.id === card.senseId)
    if (sense) reviewItems.push({ card, sense, isNew: false })
  }
  const newItems: QueueItem[] = newSenses.map((sense) => ({ card: newStudyCard(sense.id, 'route', now), sense, isNew: true }))

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
