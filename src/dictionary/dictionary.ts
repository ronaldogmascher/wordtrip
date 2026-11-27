import { lemmaCandidates, normalizeWord } from './lemmatize.ts'

// Offline English dictionary (WordNet 3.1). The data file (~5 MB compressed) is NOT part of the
// app bundle: it is downloaded on demand and kept in the browser's Cache Storage, so after the
// first download it works offline. See scripts/build-dictionary.mjs for the file format.

export type DictPos = 'n' | 'v' | 'a' | 'r'

export interface DictSense {
  pos: DictPos
  definition: string
  example: string
  /** Other words with this same meaning. */
  synonyms: string[]
}

export interface DictionaryData {
  v: number
  synsets: [DictPos, string, string, string[]][]
  lemmas: Record<string, number[]>
}

export const POS_LABEL: Record<DictPos, string> = { n: 'substantivo', v: 'verbo', a: 'adjetivo', r: 'advérbio' }

export class Dictionary {
  private readonly data: DictionaryData
  private sortedLemmas: string[] | null = null

  constructor(data: DictionaryData) {
    this.data = data
  }

  has(lemma: string): boolean {
    return Object.hasOwn(this.data.lemmas, lemma)
  }

  /** Senses of an exact lemma, most frequent first. */
  lookup(lemma: string): DictSense[] {
    if (!this.has(lemma)) return []
    return this.data.lemmas[lemma].map((i) => {
      const [pos, definition, example, words] = this.data.synsets[i]
      return { pos, definition, example, synonyms: words.filter((w) => w.toLowerCase() !== lemma).slice(0, 4) }
    })
  }

  /** Dictionary lemmas for a word as it appears in a text ("went" → ["go"], "charges" → ["charge"]). */
  resolve(word: string): string[] {
    return lemmaCandidates(word).filter((c) => this.has(c))
  }

  /** Lemmas starting with the typed text, alphabetically (for the search box). */
  search(text: string, limit = 20): string[] {
    const prefix = text.trim().toLowerCase()
    if (!prefix) return []
    this.sortedLemmas ??= Object.keys(this.data.lemmas).sort()
    const list = this.sortedLemmas
    // Binary search for the first lemma >= prefix.
    let lo = 0
    let hi = list.length
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (list[mid] < prefix) lo = mid + 1
      else hi = mid
    }
    const out: string[] = []
    for (let i = lo; i < list.length && out.length < limit && list[i].startsWith(prefix); i++) out.push(list[i])
    return out
  }
}

// ---- Download and cache ------------------------------------------------------------------------

const DATA_URL = `${import.meta.env.BASE_URL}data/en/dictionary.json`
const CACHE_NAME = 'wordtrip-dictionary-v1'
/** Approximate size shown to the learner before downloading. */
export const DOWNLOAD_SIZE_MB = 5

let instance: Dictionary | null = null
let loading: Promise<Dictionary | null> | null = null

function cacheAvailable(): boolean {
  return typeof caches !== 'undefined'
}

/** Returns the dictionary if it was already downloaded, or null. Parsed once per app session. */
export function loadDictionary(): Promise<Dictionary | null> {
  if (instance) return Promise.resolve(instance)
  loading ??= (async () => {
    if (!cacheAvailable()) return null
    const cached = await (await caches.open(CACHE_NAME)).match(DATA_URL)
    if (!cached) return null
    instance = new Dictionary((await cached.json()) as DictionaryData)
    return instance
  })().finally(() => {
    loading = null
  })
  return loading
}

/** Downloads the dictionary (needs internet once) and keeps it for offline use. */
export async function downloadDictionary(): Promise<Dictionary> {
  const response = await fetch(DATA_URL)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const text = await response.text()
  const data = JSON.parse(text) as DictionaryData
  if (cacheAvailable()) {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(DATA_URL, new Response(text, { headers: { 'Content-Type': 'application/json' } }))
  }
  instance = new Dictionary(data)
  return instance
}

export function wiktionaryUrl(lemma: string): string {
  return `https://en.wiktionary.org/wiki/${encodeURIComponent(normalizeWord(lemma).replace(/ /g, '_') || lemma)}`
}
