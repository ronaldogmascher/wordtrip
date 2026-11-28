import type { Phase, Topic } from '../content/types.ts'

// "Prévia" of a city on the map: what the learner will study there, so the language (not only
// the tourist spot) is in sight.

export const TOPIC_PT: Record<Topic, string> = {
  actions: 'ações do dia a dia',
  communication: 'comunicação',
  descriptions: 'descrições',
  family: 'família',
  feelings: 'sentimentos',
  food: 'comida',
  greetings: 'cumprimentos',
  health: 'saúde',
  home: 'casa',
  money: 'dinheiro',
  nature: 'natureza',
  people: 'pessoas',
  places: 'lugares',
  time: 'tempo e datas',
  transport: 'transporte',
  work: 'trabalho',
}

export interface CityPreview {
  /** The phase's most common topics, most common first. */
  topics: string[]
  /** A few words from the phase, in the order they are studied. */
  sample: string[]
  verbs: number
}

export function cityPreview(phase: Phase, topicCount = 3, sampleSize = 5): CityPreview {
  const counts = new Map<Topic, number>()
  for (const s of phase.senses) for (const t of s.topics) counts.set(t, (counts.get(t) ?? 0) + 1)
  const topics = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, topicCount).map(([t]) => TOPIC_PT[t])
  const sample = [...new Set(phase.senses.map((s) => s.lemma))].slice(0, sampleSize)
  return { topics, sample, verbs: phase.senses.filter((s) => s.pos === 'verb').length }
}
