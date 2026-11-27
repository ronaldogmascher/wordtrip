import type { VerbForms } from '../types.ts'

// Verb forms by lemma. `irregular` marks verbs whose past/participle don't end in -ed.
// Where US and UK differ, the US form comes first (e.g. gotten / got).
const v = (thirdPerson: string, past: string, pastParticiple: string, ing: string, irregular: boolean): VerbForms => ({
  thirdPerson,
  past,
  pastParticiple,
  ing,
  irregular,
})

export const VERB_FORMS: Record<string, VerbForms> = {
  be: v('is', 'was / were', 'been', 'being', true),
  have: v('has', 'had', 'had', 'having', true),
  do: v('does', 'did', 'done', 'doing', true),
  say: v('says', 'said', 'said', 'saying', true),
  go: v('goes', 'went', 'gone', 'going', true),
  get: v('gets', 'got', 'gotten (US) / got (UK)', 'getting', true),
  make: v('makes', 'made', 'made', 'making', true),
  know: v('knows', 'knew', 'known', 'knowing', true),
  think: v('thinks', 'thought', 'thought', 'thinking', true),
  take: v('takes', 'took', 'taken', 'taking', true),
  see: v('sees', 'saw', 'seen', 'seeing', true),
  come: v('comes', 'came', 'come', 'coming', true),
  want: v('wants', 'wanted', 'wanted', 'wanting', false),
  look: v('looks', 'looked', 'looked', 'looking', false),
  use: v('uses', 'used', 'used', 'using', false),
  find: v('finds', 'found', 'found', 'finding', true),
  give: v('gives', 'gave', 'given', 'giving', true),
  tell: v('tells', 'told', 'told', 'telling', true),
  work: v('works', 'worked', 'worked', 'working', false),
  call: v('calls', 'called', 'called', 'calling', false),
  eat: v('eats', 'ate', 'eaten', 'eating', true),
  drink: v('drinks', 'drank', 'drunk', 'drinking', true),
  like: v('likes', 'liked', 'liked', 'liking', false),
}
