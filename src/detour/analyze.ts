import type { Light } from '../study/scheduler.ts'

// "Desvio": the learner pastes a text (article, news, lyrics…) and the app filters out the words
// they already know, leaving a list of words to learn from that text. Pure functions, no DB.

/** Very common function words that would only add noise to the list. */
const STOPWORDS = new Set(
  `a an the and or but if then so than that this these those there here of in on at to for from by with
  about as into over under up down out off i me my mine you your yours he him his she her hers it its we
  us our ours they them their theirs who whom whose which what when where why how is am are was were be
  been being have has had do does did not no yes will would can could shall should may might must just
  also very too all any some each every both either neither one two three s t don isn aren wasn weren
  doesn didn won wouldn couldn shouldn ll ve re d m o after before again more most such now however
  although within while because until only even still many much several other another own same like
  through during without between against among around since though whether yet ever never always often
  already`.split(/\s+/),
)

export interface Candidate {
  lemma: string
  /** How many times the word (in any form) appears in the text. */
  count: number
  /** A sentence of the text where it appears, used for the card. */
  sentence: string
  /** Set when the word is already on the route (studied early, "encontrada na estrada"). */
  routeSenseId?: string
  /** "v" when the text used a verb form (moving, decided), to pick a verb sense. */
  posHint?: 'v'
}

export interface Analysis {
  totalWords: number
  distinct: number
  /** Lemmas already learned (green): filtered out. */
  known: string[]
  /** Lemmas being studied (red/yellow): filtered out, they already have cards. */
  studying: string[]
  /** Words to learn, most frequent in the text first. */
  candidates: Candidate[]
  /** Words not found in the dictionary (names, typos, slang). */
  unknown: string[]
}

export interface AnalyzeHelpers {
  /** Dictionary base forms of a word ("went" → ["go"]). */
  resolve: (word: string) => string[]
  /** Best traffic light of a lemma among the learner's cards, if any. */
  lightOf: (lemma: string) => Light | undefined
  /** First route sense of a lemma not studied yet, if any. */
  routeSenseOf: (lemma: string) => string | undefined
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=["“A-Z0-9])/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** Picks the base form to study: "soaring" → soar, but "news" stays "news". */
export function pickLemma(word: string, bases: string[]): string | undefined {
  if (bases.length === 0) return undefined
  const w = word.toLowerCase()
  const inflected = /(ing|ed)$/.test(w)
  if (bases.includes(w) && !inflected) return w
  const others = bases.filter((b) => b !== w)
  return others.length ? others.sort((a, b) => a.length - b.length)[0] : bases[0]
}

export function analyzeText(text: string, helpers: AnalyzeHelpers): Analysis {
  const sentences = splitSentences(text)
  const lowercaseSeen = new Set((text.match(/\b[a-z][a-z'’-]*/g) ?? []).map((w) => w.toLowerCase()))
  const counts = new Map<string, { count: number; sentence: string; posHint?: 'v' }>()
  const unknown = new Set<string>()
  let totalWords = 0

  for (const sentence of sentences) {
    const re = /[A-Za-z][A-Za-z'’-]*/g
    let first = true
    for (let m = re.exec(sentence); m; m = re.exec(sentence)) {
      const token = m[0].replace(/[’]/g, "'").replace(/'s$/, '')
      const lower = token.toLowerCase()
      totalWords++
      const capitalized = token[0] !== lower[0]
      const isFirst = first
      first = false
      if (STOPWORDS.has(lower) || lower.length < 2) continue
      // A capitalized word that never appears in lowercase is probably a name (London, Maria).
      if (capitalized && !isFirst && !lowercaseSeen.has(lower)) continue
      const lemma = pickLemma(lower, helpers.resolve(lower))
      if (!lemma) {
        if (!capitalized) unknown.add(lower)
        continue
      }
      const verbForm = lemma !== lower && /(ing|ed)$/.test(lower) ? ('v' as const) : undefined
      const entry = counts.get(lemma)
      if (entry) {
        entry.posHint ??= verbForm
        entry.count++
        // Prefer a short sentence for the card.
        if (sentence.length < entry.sentence.length && sentence.length >= 20) entry.sentence = sentence
      } else {
        counts.set(lemma, { count: 1, sentence, posHint: verbForm })
      }
    }
  }

  const known: string[] = []
  const studying: string[] = []
  const candidates: Candidate[] = []
  for (const [lemma, { count, sentence, posHint }] of counts) {
    const light = helpers.lightOf(lemma)
    if (light === 'learned') known.push(lemma)
    else if (light) studying.push(lemma)
    else candidates.push({ lemma, count, sentence, posHint, routeSenseId: helpers.routeSenseOf(lemma) })
  }
  candidates.sort((a, b) => b.count - a.count || a.lemma.localeCompare(b.lemma))

  return { totalWords, distinct: counts.size, known, studying, candidates, unknown: [...unknown] }
}
