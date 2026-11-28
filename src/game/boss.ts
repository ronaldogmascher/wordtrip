import type { City, Phase, Sense } from '../content/types.ts'
import type { BossAttempt, StudyCard } from '../db/db.ts'

// Boss battles. Each city has a boss: written questions with no translation and no hint.
// The last city of a leg (the border) has the final boss, which covers the whole leg.
// Kept free of the database so it is easy to test.

export const CITY_BOSS_QUESTIONS = 20
export const BORDER_BOSS_QUESTIONS = 50
/** Share of right answers needed to win. */
export const BOSS_PASS_SHARE = 0.8
/** After a loss, the boss can be faced again after this many hours. */
export const BOSS_RETRY_HOURS = 24

/** Visual motorhome upgrades, one per border crossed (A1, A2, B1, B2). */
export const MOTORHOME_UPGRADES = [
  { icon: '🧳', name: 'Bagageiro no teto', text: 'Agora cabe mais bagagem para o resto da viagem.' },
  { icon: '🚲', name: 'Suporte de bicicletas', text: 'Para passear pelas cidades da América Latina.' },
  { icon: '☀️', name: 'Placas solares', text: 'Energia limpa para cruzar a costa oeste.' },
  { icon: '✨', name: 'Pintura nova', text: 'Pronto para chegar em grande estilo a Nova York.' },
]

export interface BossQuestion {
  sense: Sense
  /** The example sentence with its blank (`____`). */
  sentence: string
  answer: string
}

export const isBorder = (city: City, leg: City[]) => leg[leg.length - 1]?.phaseId === city.phaseId

export const questionCount = (city: City, leg: City[]) => (isBorder(city, leg) ? BORDER_BOSS_QUESTIONS : CITY_BOSS_QUESTIONS)

export const passMark = (total: number) => Math.ceil(total * BOSS_PASS_SHARE)

export const hasPassed = (correct: number, total: number) => total > 0 && correct >= passMark(total)

/** Words the boss asks about: the city's words already studied (the border asks the whole leg). */
export function bossPool(city: City, leg: City[], phases: Phase[], cards: StudyCard[]): Sense[] {
  const studied = new Set(cards.map((c) => c.senseId))
  const phaseIds = isBorder(city, leg) ? new Set(leg.map((c) => c.phaseId)) : new Set([city.phaseId])
  return phases.filter((p) => phaseIds.has(p.id)).flatMap((p) => p.senses).filter((s) => studied.has(s.id))
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

/** Picks `count` different words and, for each, one of its example sentences at random. */
export function makeBossQuestions(pool: Sense[], count: number, rng: () => number = Math.random): BossQuestion[] {
  return shuffle(pool.filter((s) => s.examples.length > 0), rng)
    .slice(0, count)
    .map((sense) => {
      const example = sense.examples[Math.floor(rng() * sense.examples.length)]
      return { sense, sentence: example.text, answer: example.answer }
    })
}

/** When the boss can be faced again: 24 h after the last loss, or now. Null once it was beaten. */
export function nextTryAt(phaseId: string, attempts: BossAttempt[], now: Date): Date | null {
  const mine = attempts.filter((a) => a.phaseId === phaseId)
  if (mine.some((a) => a.passed)) return null
  const last = mine.reduce<BossAttempt | undefined>((latest, a) => (!latest || a.at > latest.at ? a : latest), undefined)
  if (!last) return now
  const retry = new Date(last.at.getTime() + BOSS_RETRY_HOURS * 3600_000)
  return retry > now ? retry : now
}

/** Borders crossed so far, which is how many motorhome upgrades the traveler has. */
export function upgradesEarned(legs: City[][], attempts: BossAttempt[]) {
  const beaten = new Set(attempts.filter((a) => a.passed).map((a) => a.phaseId))
  const crossed = legs.filter((leg) => leg.length > 0 && beaten.has(leg[leg.length - 1].phaseId)).length
  return MOTORHOME_UPGRADES.slice(0, crossed)
}
