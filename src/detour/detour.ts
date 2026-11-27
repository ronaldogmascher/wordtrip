import { db, type ExplorerEntry } from '../db/db.ts'
import type { Dictionary } from '../dictionary/dictionary.ts'
import { makeGap, POS_FROM_DICT } from '../explorer/explorer.ts'
import type { Candidate } from './analyze.ts'

/** Words studied per detour training session (new ones; due reviews come on top). */
export const DETOUR_NEW_PER_SESSION = 10

/**
 * Saves a detour and its chosen words. Each word uses the dictionary's most frequent sense and
 * the sentence from the text; route words become early route senses. The learner can edit any of
 * them later in the Diário de bordo.
 */
export async function createDetour(name: string, textWords: number, words: Candidate[], dict: Dictionary): Promise<number> {
  const now = new Date()
  return db.transaction('rw', db.detours, db.explorer, async () => {
    const detourId = (await db.detours.add({ name: name.trim() || 'Desvio', textWords, createdAt: now })) as number
    const entries: ExplorerEntry[] = []
    for (const c of words) {
      const base = { word: c.lemma, sentence: c.sentence, source: `Desvio: ${name.trim()}`, status: 'ready' as const, detourId, createdAt: now }
      if (c.routeSenseId) {
        entries.push({ ...base, senseId: c.routeSenseId })
        continue
      }
      const senses = dict.lookup(c.lemma)
      const sense = (c.posHint && senses.find((s) => s.pos === c.posHint)) || senses[0]
      const gap = makeGap(c.sentence, c.lemma)
      if (!sense || !gap) continue
      entries.push({
        ...base,
        custom: { lemma: c.lemma, pos: POS_FROM_DICT[sense.pos], definition: sense.definition, gap, synonyms: sense.synonyms },
      })
    }
    await db.explorer.bulkAdd(entries)
    return detourId
  })
}

/** Deletes a detour, its words and their cards (route words stay on the route). */
export async function deleteDetour(detourId: number): Promise<void> {
  await db.transaction('rw', db.detours, db.explorer, db.cards, async () => {
    const entries = await db.explorer.where('detourId').equals(detourId).toArray()
    const ownIds = entries.filter((e) => e.custom && e.id !== undefined).map((e) => `ex:${e.id}`)
    await db.cards.where('senseId').anyOf(ownIds).delete()
    await db.explorer.where('detourId').equals(detourId).delete()
    await db.detours.delete(detourId)
  })
}
