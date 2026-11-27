import type { Area, Cefr, GapSentence, PartOfSpeech, Sense, Topic } from './types.ts'

const POS_CODE: Record<PartOfSpeech, string> = {
  noun: 'n',
  verb: 'v',
  adjective: 'adj',
  adverb: 'adv',
  pronoun: 'pron',
  preposition: 'prep',
  conjunction: 'conj',
  interjection: 'interj',
  expression: 'expr',
}

export function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

interface SenseFields {
  definition: string
  definitionPt: string
  translationPt: string
  examples: GapSentence[]
  synonyms: string[]
  antonym?: string
  topics: Topic[]
  /** Defaults to `general`. */
  area?: Area
  /** Defaults to `A1`. */
  cefr?: Cefr
  /** Sense number for words with several senses. Defaults to 1. */
  n?: number
  /** Word family, when it differs from the lemma (e.g. `charger` → `charge`). */
  family?: string
}

/** Builds an English sense with a stable id like `en:charge:v:1`. */
export function sense(lemma: string, pos: PartOfSpeech, ipaUS: string, ipaUK: string, f: SenseFields): Sense {
  const key = slug(lemma)
  return {
    id: `en:${key}:${POS_CODE[pos]}:${f.n ?? 1}`,
    familyId: `en:fam:${slug(f.family ?? lemma)}`,
    lemma,
    pos,
    ipaUS,
    ipaUK,
    cefr: f.cefr ?? 'A1',
    definition: f.definition,
    definitionPt: f.definitionPt,
    translationPt: f.translationPt,
    examples: f.examples,
    synonyms: f.synonyms,
    antonym: f.antonym,
    topics: f.topics,
    area: f.area ?? 'general',
  }
}
