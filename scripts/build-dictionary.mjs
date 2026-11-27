// Builds the offline English dictionary from WordNet 3.1 (npm package `wordnet-db`).
// Output: public/data/en/dictionary.json, downloaded by the app on demand (not bundled),
// generated at build time (see the `prebuild` script) and not committed.
//
// Format (compact, synsets stored once):
// {
//   v: 1,
//   synsets: [[pos, definition, example, words], ...],   // pos: n | v | a | r
//   lemmas: { "<lemma>": [synsetIndex, ...] }             // most frequent sense first
// }
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const dictDir = join(dirname(require.resolve('wordnet-db/package.json')), 'dict')
const outFile = new URL('../public/data/en/dictionary.json', import.meta.url)

const FILES = { n: 'noun', v: 'verb', a: 'adj', r: 'adv' }

const clean = (w) => w.replace(/_/g, ' ').replace(/\(.*\)$/, '')

const synsets = []
const lemmas = new Map()

for (const pos of Object.keys(FILES)) {
  // offset → index in `synsets`
  const byOffset = new Map()
  for (const line of readFileSync(join(dictDir, `data.${FILES[pos]}`), 'utf8').split('\n')) {
    if (!line || line.startsWith(' ')) continue // license header
    const [head, gloss = ''] = line.split(' | ')
    const parts = head.split(' ')
    const count = parseInt(parts[3], 16)
    const words = []
    for (let i = 0; i < count; i++) words.push(clean(parts[4 + i * 2]))
    // The gloss is "definition; "example"; "example"". Keep the definition and the first example.
    const pieces = gloss.trim().split(/;\s*(?=")|;\s+/)
    const definition = pieces.filter((p) => !p.startsWith('"')).join('; ').trim()
    const example = (pieces.find((p) => p.startsWith('"')) ?? '').replace(/^"/, '').replace(/"\s*$/, '')
    byOffset.set(parts[0], synsets.length)
    synsets.push([pos, definition, example, words])
  }

  for (const line of readFileSync(join(dictDir, `index.${FILES[pos]}`), 'utf8').split('\n')) {
    if (!line || line.startsWith(' ')) continue
    const parts = line.trim().split(' ')
    const lemma = clean(parts[0])
    const synsetCount = Number(parts[2])
    if (!lemmas.has(lemma)) lemmas.set(lemma, [])
    for (const offset of parts.slice(parts.length - synsetCount)) {
      const index = byOffset.get(offset)
      if (index !== undefined) lemmas.get(lemma).push(index)
    }
  }
}

mkdirSync(new URL('.', outFile), { recursive: true })
writeFileSync(
  outFile,
  JSON.stringify({ v: 1, source: 'WordNet 3.1, Princeton University', synsets, lemmas: Object.fromEntries(lemmas) }),
)
console.log(`dictionary: ${lemmas.size} lemmas, ${synsets.length} senses`)
