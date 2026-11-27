import { allSenses } from '../content/index.ts'
import { VERB_FORMS } from '../content/en/verbForms.ts'
import type { VerbForms } from '../content/types.ts'
import { checkAnswer } from '../study/answer.ts'
import { NOTHING, RULE_SENTENCES, RULE_TOPICS, type RuleTopic } from './rules.ts'
import { estar, future, gerund, mainVerb, past, present, type Person } from './portuguese.ts'

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
  topic: GrammarTopic | RuleTopic
  /** Rule questions are always answered by choosing, even in typing mode. */
  choiceOnly: boolean
  /** Sentence with one blank (____). */
  text: string
  /** Shown under the sentence, e.g. "(work = trabalhar)". Empty for rule questions. */
  hint: string
  answer: string
  /** Other accepted answers (contractions, US/UK spellings). */
  accepted: string[]
  options: string[]
  /** The full sentence, read aloud after answering. */
  full: string
  /** Portuguese translation of the full sentence. */
  translation: string
}

type Rng = () => number

interface Subject {
  en: string
  pt: string
  person: Person
  third: boolean
  be: 'am' | 'is' | 'are'
  have: 'have' | 'has'
}

const SUBJECTS: Subject[] = [
  { en: 'I', pt: 'Eu', person: 'eu', third: false, be: 'am', have: 'have' },
  { en: 'You', pt: 'Você', person: 'ele', third: false, be: 'are', have: 'have' },
  { en: 'He', pt: 'Ele', person: 'ele', third: true, be: 'is', have: 'has' },
  { en: 'She', pt: 'Ela', person: 'ele', third: true, be: 'is', have: 'has' },
  { en: 'We', pt: 'Nós', person: 'nos', third: false, be: 'are', have: 'have' },
  { en: 'They', pt: 'Eles', person: 'eles', third: false, be: 'are', have: 'have' },
  { en: 'My friend', pt: 'Meu amigo', person: 'ele', third: true, be: 'is', have: 'has' },
  { en: 'The guide', pt: 'O guia', person: 'ele', third: true, be: 'is', have: 'has' },
]

/** Time markers: English, Portuguese. */
const MARKERS: Record<GrammarTopic, [string, string][]> = {
  'present-simple': [['every day', 'todo dia'], ['on Sundays', 'aos domingos'], ['usually', 'normalmente'], ['every morning', 'toda manhã']],
  'present-negative': [['on weekends', 'nos fins de semana'], ['very often', 'com frequência'], ['in the morning', 'de manhã']],
  'past-simple': [['yesterday', 'ontem'], ['last week', 'semana passada'], ['two days ago', 'há dois dias'], ['last night', 'ontem à noite']],
  'present-continuous': [['right now', 'agora mesmo'], ['at the moment', 'neste momento'], ['now', 'agora']],
  'future-will': [['tomorrow', 'amanhã'], ['later', 'mais tarde'], ['next year', 'no ano que vem']],
  'going-to': [['next week', 'na semana que vem'], ['this weekend', 'neste fim de semana'], ['tonight', 'hoje à noite']],
  'present-perfect': [['before', 'antes'], ['many times', 'muitas vezes'], ['recently', 'recentemente']],
}

/**
 * The sentences have no object ("She works every day."), so only verbs that sound natural
 * without one are used. Add a verb here once it is on the route and works alone.
 */
const WORKS_ALONE = new Set([
  'work', 'eat', 'drink', 'cook', 'sleep', 'run', 'walk', 'swim', 'dance', 'sing', 'travel', 'study',
  'read', 'write', 'play', 'rest', 'relax', 'wait', 'arrive', 'leave', 'laugh', 'smile', 'cry', 'cough',
  'fall', 'jump', 'fly', 'dive', 'fish', 'hunt', 'win', 'pay', 'call', 'help', 'listen', 'talk', 'speak',
  'learn', 'stop', 'start', 'begin', 'finish', 'return', 'come', 'go', 'drive', 'park', 'shout',
  'climb', 'explore', 'float', 'breathe', 'move', 'agree', 'try', 'answer', 'check in', 'take off',
  'land', 'pack', 'save', 'invest', 'plan', 'lose', 'continue', 'think',
])

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
  /** The Portuguese verb to conjugate, plus any words after it ("ficar" + " de pé"). */
  ptVerb: { verb: string; rest: string }
  forms: VerbForms
}

let verbCache: Verb[] | null = null

/** Verbs of the route that have forms and a Portuguese meaning simple enough to conjugate. */
export function grammarVerbs(): Verb[] {
  if (verbCache) return verbCache
  const pt = new Map<string, string>()
  for (const s of allSenses()) if (s.pos === 'verb' && !pt.has(s.lemma)) pt.set(s.lemma, s.translationPt)
  verbCache = Object.entries(VERB_FORMS)
    .filter(([base]) => WORKS_ALONE.has(base) && pt.has(base) && mainVerb(pt.get(base)!))
    .map(([base, forms]) => ({ base, pt: pt.get(base)!, ptVerb: mainVerb(pt.get(base)!)!, forms }))
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
  const [marker, markerPt] = pick(rng, MARKERS[topic])
  const { right, wrong } = formsFor(topic, verb, subject)
  const answers = right
  const answer = answers[0]
  const text = marker === 'usually' ? `${subject.en} usually ____.` : `${subject.en} ____ ${marker}.`
  const full = text.replace('____', answer)
  const wrongOptions = [...new Set(wrong)].filter((w) => !answers.includes(w))
  const options = shuffle(rng, [answer, ...shuffle(rng, wrongOptions).slice(0, 2)])
  const translation = translate(topic, verb, subject, marker, markerPt)
  return { topic, choiceOnly: false, text, hint: `(${verb.base} = ${verb.pt})`, answer, accepted: answers, options, full, translation }
}

/** The Portuguese version of the sentence, built with the tiny conjugator. */
function translate(topic: GrammarTopic, verb: Verb, subject: Subject, marker: string, markerPt: string): string {
  const { verb: v, rest } = verb.ptVerb
  const p = subject.person
  const groups: Record<GrammarTopic, string> = {
    'present-simple': present(v, p),
    'present-negative': `não ${present(v, p)}`,
    'past-simple': past(v, p),
    'present-continuous': `${estar(p)} ${gerund(v)}`,
    'future-will': future(v, p),
    'going-to': future(v, p),
    'present-perfect': marker === 'before' ? `já ${past(v, p)}` : past(v, p),
  }
  const verbGroup = groups[topic] + rest
  return marker === 'usually' ? `${subject.pt} ${markerPt} ${verbGroup}.` : `${subject.pt} ${verbGroup} ${markerPt}.`
}

/** Typed answers are compared without case or extra spaces; contractions count as right. */
export function isRight(question: GrammarQuestion, typed: string, mode: GrammarMode): boolean {
  if (mode === 'choice') return question.accepted.includes(typed)
  return question.accepted.some((a) => checkAnswer(typed, a) === 'correct')
}

export const isRuleTopic = (topic: string): topic is RuleTopic => RULE_TOPICS.some((r) => r.id === topic)

/** A rule question from the hand-written sentences: "The bus leaves ____ 7 o'clock." */
export function makeRuleQuestion(topic: RuleTopic, index: number): GrammarQuestion {
  const info = RULE_TOPICS.find((r) => r.id === topic)!
  const sentence = RULE_SENTENCES[topic][index % RULE_SENTENCES[topic].length]
  const filled = sentence.answer === NOTHING ? sentence.text.replace('____ ', '') : sentence.text.replace('____', sentence.answer)
  return {
    topic, choiceOnly: true, text: sentence.text, hint: '', answer: sentence.answer, accepted: [sentence.answer],
    options: info.options, full: filled.charAt(0).toUpperCase() + filled.slice(1), translation: sentence.pt,
  }
}

/** A session mixing the chosen topics; rule sentences don't repeat within a session. */
export function makeSession(topics: (GrammarTopic | RuleTopic)[], count = 10, rng: Rng = Math.random): GrammarQuestion[] {
  const order = new Map<RuleTopic, number[]>()
  const nextRule = (topic: RuleTopic) => {
    if (!order.get(topic)?.length) order.set(topic, shuffle(rng, RULE_SENTENCES[topic].map((_, i) => i)))
    return order.get(topic)!.pop()!
  }
  return Array.from({ length: count }, (_, i) => {
    const topic = topics[i % topics.length]
    return isRuleTopic(topic) ? makeRuleQuestion(topic, nextRule(topic)) : makeQuestion(topic, rng)
  }).sort(() => rng() - 0.5)
}
