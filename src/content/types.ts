// Content model. Content is static and ships with the app (works offline);
// only the learner's progress lives in IndexedDB (see src/db/db.ts).
//
// Hierarchy: Family → Word (lemma) → Sense → Card.
// A card is one way of practicing a sense; cards are created in the database
// the first time a sense is studied.

export type LanguageCode = 'en'

export type Cefr = 'A1' | 'A2' | 'B1' | 'B2'

export type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'interjection'
  | 'expression'

export const TOPICS = [
  'actions',
  'communication',
  'descriptions',
  'family',
  'feelings',
  'food',
  'greetings',
  'health',
  'home',
  'money',
  'nature',
  'people',
  'places',
  'time',
  'transport',
  'work',
] as const

export type Topic = (typeof TOPICS)[number]

export type Area = 'general' | 'business' | 'technology' | 'academic'

/** Verb tense (or structure) of an example sentence, shown as a tag on the card. */
export type Tense =
  | 'present simple'
  | 'present continuous'
  | 'past simple'
  | 'future (will)'
  | 'imperative'
  | 'modal verb'

/** A sentence with exactly one blank, written as `____`. */
export interface GapSentence {
  text: string
  /** Tense of the sentence; omitted when it has no verb (e.g. "Happy New Year!"). */
  tense?: Tense
  /** The exact word(s) that fill the blank. */
  answer: string
  /** Portuguese translation of the full sentence (optional). */
  pt?: string
}

/** Main forms of a verb, shown after answering. */
export interface VerbForms {
  /** Third person singular: she ____. */
  thirdPerson: string
  past: string
  pastParticiple: string
  ing: string
  irregular: boolean
}

export interface Sense {
  /** Stable id, e.g. `en:charge:v:1`. Never reuse or change an id once shipped. */
  id: string
  /** Word family id, e.g. `en:fam:charge`. */
  familyId: string
  lemma: string
  pos: PartOfSpeech
  /** IPA without slashes, General American. */
  ipaUS: string
  /** IPA without slashes, British (RP). */
  ipaUK: string
  cefr: Cefr
  /** Learner-dictionary definition in the target language. */
  definition: string
  /** The same definition translated into Portuguese. */
  definitionPt: string
  /** Short Portuguese gloss shown after answering. */
  translationPt: string
  examples: GapSentence[]
  /** Only for verbs. */
  forms?: VerbForms
  synonyms: string[]
  antonym?: string
  topics: Topic[]
  area: Area
}

export interface Phase {
  /** e.g. `en:a1:01`. */
  id: string
  number: number
  cefr: Cefr
  city: string
  region: string
  /** Short arrival text shown when the learner reaches the city. */
  arrival: string
  senses: Sense[]
}

export interface City {
  phaseId: string
  number: number
  name: string
  region: string
  landmark: string
  /** Emoji that stands for the city on the map until there are illustrations. */
  icon: string
  /** True when this city's content ships in the current version. */
  available: boolean
  /** The leg of the trip (one leg per level). */
  cefr: Cefr
}
