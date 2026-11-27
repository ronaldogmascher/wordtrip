import { allSenses } from '../content/index.ts'
import { VERB_FORMS } from '../content/en/verbForms.ts'
import type { VerbForms } from '../content/types.ts'
import { checkAnswer } from '../study/answer.ts'

// "Treino de gramática": free practice of verb tenses, generated from the verbs of the route.
// Each question is a short sentence with a time marker ("yesterday", "right now") and a blank
// for the verb in the right form, so the learner practices choosing the tense, not memorizing.

export type GrammarTopic =
  | 'present-simple' | 'present-negative' | 'past-simple' | 'present-continuous'
  | 'future-will' | 'going-to' | 'present-perfect'

export interface TopicInfo {
  id: GrammarTopic
  label: string
  icon: string
  /** Short explanation in Portuguese, shown before and after each question. */
  rule: string
}

export const TOPICS: TopicInfo[] = [
  { id: 'present-simple', label: 'Presente simples', icon: '🔁', rule: 'Hábitos e fatos. Com he/she/it, o verbo ganha -s: she works, he goes.' },
  { id: 'present-negative', label: 'Negativa no presente', icon: '🚫', rule: "Use don't + verbo; com he/she/it, doesn't + verbo (sem -s): she doesn't work." },
  { id: 'past-simple', label: 'Passado simples', icon: '⏪', rule: 'Ações terminadas. Regulares ganham -ed; irregulares têm forma própria (go → went).' },
  { id: 'present-continuous', label: 'Presente contínuo', icon: '▶️', rule: 'O que está acontecendo agora: am/is/are + verbo com -ing (they are eating).' },
  { id: 'future-will', label: 'Futuro com will', icon: '🔮', rule: 'Previsões e decisões na hora: will + verbo (I will call you).' },
  { id: 'going-to', label: 'Futuro com going to', icon: '🗓️', rule: 'Planos já decididos: am/is/are going to + verbo (we are going to travel).' },
  { id: 'present-perfect', label: 'Present perfect', icon: '✅', rule: 'Experiências e ações recentes, sem data: have/has + particípio (she has seen).' },
]

export type GrammarMode = 'choice' | 'type'

export interface GrammarQuestion {
  topic: GrammarTopic
  /** Sentence with one blank (____). */
  text: string
  /** Base verb and its Portuguese meaning, shown as the hint: "(work = trabalhar)". */
  verb: string
  verbPt: string
  answer: string
  /** Other accepted answers (contractions, US/UK spellings). */
  accepted: string[]
  options: string[]
  /** The full sentence, read aloud after answering. */
  full: string
}

type Rng = () => number

interface Subject {
  en: string
  third: boolean
  be: 'am' | 'is' | 'are'
  have: 'have' | 'has'
}

const SUBJECTS: Subject[] = [
  { en: 'I', third: false, be: 'am', have: 'have' },
  { en: 'You', third: false, be: 'are', have: 'have' },
  { en: 'He', third: true, be: 'is', have: 'has' },
  { en: 'She', third: true, be: 'is', have: 'has' },
  { en: 'We', third: false, be: 'are', have: 'have' },
  { en: 'They', third: false, be: 'are', have: 'have' },
  { en: 'My friend', third: true, be: 'is', have: 'has' },
  { en: 'The guide', third: true, be: 'is', have: 'has' },
]

const MARKERS: Record<GrammarTopic, string[]> = {
  'present-simple': ['every day', 'on Sundays', 'usually', 'every morning'],
  'present-negative': ['on weekends', 'very often', 'in the morning'],
  'past-simple': ['yesterday', 'last week', 'two days ago', 'last night'],
  'present-continuous': ['right now', 'at the moment', 'now'],
  'future-will': ['tomorrow', 'later', 'next year'],
  'going-to': ['next week', 'this weekend', 'tonight'],
  'present-perfect': ['before', 'many times', 'recently'],
}

/** Verbs that don't follow the normal patterns (be, modals) are left out. */
const SKIP = new Set(['be', 'can', 'could', 'will', 'would', 'should', 'must', 'may', 'might', 'shall'])

/** "learned (US) / learnt (UK)" → ["learned", "learnt"]. */
export const variants = (form: string) => form.split(' / ').map((f) => f.replace(/\s*\((US|UK)\)/, '').trim())

const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)]

function shuffle<T>(rng: Rng, items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

interface Verb {
  base: string
  pt: string
  forms: VerbForms
}

let verbCache: Verb[] | null = null

/** Verbs of the route that have forms and a Portuguese meaning. */
export function grammarVerbs(): Verb[] {
  if (verbCache) return verbCache
  const pt = new Map<string, string>()
  for (const s of allSenses()) if (s.pos === 'verb' && !pt.has(s.lemma)) pt.set(s.lemma, s.translationPt)
  verbCache = Object.entries(VERB_FORMS)
    .filter(([base]) => !SKIP.has(base) && pt.has(base))
    .map(([base, forms]) => ({ base, pt: pt.get(base)!, forms }))
  return verbCache
}

/**
 * Answers for one topic: [main answer, ...alternatives], plus wrong forms for the options.
 * Phrasal verbs work as-is, because their forms already carry the particle ("checks in").
 */
function formsFor(topic: GrammarTopic, verb: Verb, subject: Subject): { right: string[]; wrong: string[] } {
  const f = verb.forms
  const third = variants(f.thirdPerson)[0]
  const pasts = variants(f.past)
  const participles = variants(f.pastParticiple)
  const ings = variants(f.ing)
  const present = subject.third ? third : verb.base
  const doAux = subject.third ? "doesn't" : "don't"
  const doFull = subject.third ? 'does not' : 'do not'
  switch (topic) {
    case 'present-simple':
      return { right: [present], wrong: [subject.third ? verb.base : third, pasts[0], `${subject.be} ${ings[0]}`] }
    case 'present-negative':
      return {
        right: [`${doAux} ${verb.base}`, `${doFull} ${verb.base}`],
        wrong: [`${subject.third ? "don't" : "doesn't"} ${verb.base}`, `${doAux} ${third}`, `not ${verb.base}`],
      }
    case 'past-simple':
      return { right: pasts, wrong: [verb.base, third, `${subject.have} ${participles[0]}`] }
    case 'present-continuous':
      return {
        right: ings.map((g) => `${subject.be} ${g}`),
        wrong: [present, `${subject.be} ${verb.base}`, ings[0]],
      }
    case 'future-will':
      return { right: [`will ${verb.base}`], wrong: [`will ${third}`, `will ${pasts[0]}`, present] }
    case 'going-to':
      return {
        right: [`${subject.be} going to ${verb.base}`],
        wrong: [`going to ${verb.base}`, `${subject.be} going ${verb.base}`, `will going to ${verb.base}`],
      }
    case 'present-perfect': {
      const other = subject.have === 'have' ? 'has' : 'have'
      return {
        right: participles.map((p) => `${subject.have} ${p}`),
        wrong: [`${other} ${participles[0]}`, `${subject.have} ${verb.base}`, pasts[0]],
      }
    }
  }
}

export function makeQuestion(topic: GrammarTopic, rng: Rng = Math.random): GrammarQuestion {
  const verb = pick(rng, grammarVerbs())
  const subject = pick(rng, SUBJECTS)
  const marker = pick(rng, MARKERS[topic])
  const { right, wrong } = formsFor(topic, verb, subject)
  const answers = right
  const answer = answers[0]
  const text = marker === 'usually' ? `${subject.en} usually ____.` : `${subject.en} ____ ${marker}.`
  const full = text.replace('____', answer)
  const wrongOptions = [...new Set(wrong)].filter((w) => !answers.includes(w))
  const options = shuffle(rng, [answer, ...shuffle(rng, wrongOptions).slice(0, 2)])
  return { topic, text, verb: verb.base, verbPt: verb.pt, answer, accepted: answers, options, full }
}

/** Typed answers are compared without case or extra spaces; contractions count as right. */
export function isRight(question: GrammarQuestion, typed: string, mode: GrammarMode): boolean {
  if (mode === 'choice') return question.accepted.includes(typed)
  return question.accepted.some((a) => checkAnswer(typed, a) === 'correct')
}

export function makeSession(topics: GrammarTopic[], count = 10, rng: Rng = Math.random): GrammarQuestion[] {
  return Array.from({ length: count }, (_, i) => makeQuestion(topics[i % topics.length], rng)).sort(() => rng() - 0.5)
}
