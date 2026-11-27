import { getSense } from '../content/index.ts'
import type { GapSentence, PartOfSpeech, Sense } from '../content/types.ts'
import { db, type ExplorerEntry } from '../db/db.ts'
import type { DictPos } from '../dictionary/dictionary.ts'
import { lemmaCandidates } from '../dictionary/lemmatize.ts'

// Explorer mode: words the learner found in podcasts, series or texts. They live in the
// "Diário de bordo", get priority within the daily new-word limit, earn XP and stats, but do not
// count towards unlocking bosses.

export const EXPLORER_PREFIX = 'ex:'

export const POS_FROM_DICT: Record<DictPos, PartOfSpeech> = { n: 'noun', v: 'verb', a: 'adjective', r: 'adverb' }

/** Sense id of an explorer entry's own word. */
export function explorerSenseId(entryId: number): string {
  return `${EXPLORER_PREFIX}${entryId}`
}

/**
 * Turns a sentence into a gap sentence by blanking the first occurrence of the word or one of
 * its forms ("She went home" + "go" → "She ____ home", answer "went"). Null if it's not there.
 */
export function makeGap(sentence: string, lemma: string): GapSentence | null {
  const target = lemma.toLowerCase()
  // Multi-word expressions ("pick up"): plain case-insensitive search.
  if (target.includes(' ')) {
    const at = sentence.toLowerCase().indexOf(target)
    if (at < 0) return null
    const answer = sentence.slice(at, at + target.length)
    return { text: sentence.slice(0, at) + '____' + sentence.slice(at + target.length), answer }
  }
  const re = /[A-Za-z][A-Za-z'’-]*/g
  for (let m = re.exec(sentence); m; m = re.exec(sentence)) {
    const word = m[0]
    if (word.toLowerCase() === target || lemmaCandidates(word).includes(target)) {
      return { text: sentence.slice(0, m.index) + '____' + sentence.slice(m.index + word.length), answer: word }
    }
  }
  return null
}

/** The sense studied for an entry: the route sense, or one built from the learner's word. */
export function senseOfEntry(entry: ExplorerEntry): Sense | undefined {
  if (entry.status !== 'ready') return undefined
  if (entry.senseId) return getSense(entry.senseId)
  if (!entry.custom || entry.id === undefined) return undefined
  const w = entry.custom
  return {
    id: explorerSenseId(entry.id),
    familyId: `${EXPLORER_PREFIX}fam:${w.lemma.toLowerCase()}`,
    lemma: w.lemma,
    pos: w.pos,
    ipaUS: '',
    ipaUK: '',
    cefr: 'A1', // not used for explorer words
    definition: w.definition,
    definitionPt: w.translationPt ?? '',
    translationPt: w.translationPt ?? '',
    examples: [w.gap],
    synonyms: w.synonyms,
    topics: [],
    area: 'general',
  }
}

/** Ready explorer entries with their senses, oldest first. */
export async function explorerSenses(): Promise<{ entry: ExplorerEntry; sense: Sense }[]> {
  const entries = await db.explorer.where('status').equals('ready').sortBy('createdAt')
  return entries.flatMap((entry) => {
    const sense = senseOfEntry(entry)
    return sense ? [{ entry, sense }] : []
  })
}

/** Quick capture: saves a word to the inbox ("Caixa de entrada") and returns its id. */
export async function captureWord(word: string, sentence?: string, source?: string): Promise<number> {
  return (await db.explorer.add({
    word: word.trim(),
    sentence: sentence?.trim() || undefined,
    source: source?.trim() || undefined,
    status: 'inbox',
    createdAt: new Date(),
  })) as number
}

/** Removes an entry. A word of the learner's own also loses its card; a route word stays on the route. */
export async function deleteEntry(entry: ExplorerEntry): Promise<void> {
  if (entry.id === undefined) return
  const id = entry.id
  await db.transaction('rw', db.explorer, db.cards, async () => {
    if (entry.custom) await db.cards.where('senseId').equals(explorerSenseId(id)).delete()
    await db.explorer.delete(id)
  })
}
