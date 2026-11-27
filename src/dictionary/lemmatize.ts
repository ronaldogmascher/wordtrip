import { IRREGULAR } from './irregular.ts'

// Suffix rules (inspired by WordNet's "morphy"): [ending, replacement].
const RULES: [string, string][] = [
  // nouns and 3rd person verbs
  ['ies', 'y'],
  ['ses', 's'],
  ['xes', 'x'],
  ['zes', 'z'],
  ['ches', 'ch'],
  ['shes', 'sh'],
  ['oes', 'o'],
  ['es', 'e'],
  ['es', ''],
  ['s', ''],
  // past and -ing
  ['ied', 'y'],
  ['ed', 'e'],
  ['ed', ''],
  ['ying', 'ie'],
  ['ing', 'e'],
  ['ing', ''],
  // comparatives and superlatives
  ['ier', 'y'],
  ['iest', 'y'],
  ['er', 'e'],
  ['er', ''],
  ['est', 'e'],
  ['est', ''],
  // adverbs: quickly → quick
  ['ily', 'y'],
  ['ly', ''],
]

/** Cleans a word as typed or tapped: lowercase, no surrounding punctuation, curly quotes normalized. */
export function normalizeWord(word: string): string {
  return word
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/^[^a-z]+|[^a-z]+$/g, '')
}

/**
 * Possible base forms of a word, most likely first. The caller keeps the ones that exist in the
 * dictionary. Example: "stopped" → ["stopped", "stoppe", "stopp", "stop"].
 */
export function lemmaCandidates(word: string): string[] {
  const w = normalizeWord(word).replace(/'s$/, '')
  if (!w) return []
  const out = [w, ...(IRREGULAR.get(w) ?? [])]
  for (const [ending, replacement] of RULES) {
    if (w.length > ending.length + 1 && w.endsWith(ending)) {
      const stem = w.slice(0, -ending.length) + replacement
      out.push(stem)
      // Doubled final consonant: stopped → stop, running → run, bigger → big.
      if (replacement === '' && /([b-df-hj-np-tv-z])\1$/.test(stem)) out.push(stem.slice(0, -1))
    }
  }
  return [...new Set(out)]
}
