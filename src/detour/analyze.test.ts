import { describe, expect, it } from 'vitest'
import { lemmaCandidates } from '../dictionary/lemmatize.ts'
import { analyzeText, pickLemma, splitSentences } from './analyze.ts'

const lemmas = new Set(['price', 'soar', 'soaring', 'market', 'investor', 'worry', 'news', 'new', 'inflation', 'rise', 'bank'])
const helpers = {
  resolve: (w: string) => lemmaCandidates(w).filter((c) => lemmas.has(c)),
  lightOf: (l: string) => (l === 'price' ? ('learned' as const) : l === 'bank' ? ('learning' as const) : undefined),
  routeSenseOf: (l: string) => (l === 'news' ? 'en:news:n:1' : undefined),
}

describe('pickLemma', () => {
  it('prefers the base form of -ing/-ed words, keeps other words', () => {
    expect(pickLemma('soaring', ['soaring', 'soar'])).toBe('soar')
    expect(pickLemma('news', ['news', 'new'])).toBe('news')
    expect(pickLemma('prices', ['price'])).toBe('price')
  })
})

describe('splitSentences', () => {
  it('splits on sentence punctuation', () => {
    expect(splitSentences('Prices rise. Investors worry! Is it bad?')).toEqual(['Prices rise.', 'Investors worry!', 'Is it bad?'])
  })
})

describe('analyzeText', () => {
  const text =
    'Prices are soaring in the market. Investors worry about inflation. The news from London is bad, and investors worry more. The bank raised rates.'
  const a = analyzeText(text, helpers)

  it('filters known and studying words', () => {
    expect(a.known).toEqual(['price'])
    expect(a.studying).toEqual(['bank'])
  })

  it('ranks candidates by frequency and keeps a sentence', () => {
    expect(a.candidates[0]).toMatchObject({ lemma: 'investor', count: 2 })
    expect(a.candidates.map((c) => c.lemma)).toEqual(expect.arrayContaining(['soar', 'market', 'inflation', 'news', 'worry']))
    expect(a.candidates.find((c) => c.lemma === 'soar')).toMatchObject({ sentence: 'Prices are soaring in the market.', posHint: 'v' })
  })

  it('marks route words and skips names', () => {
    expect(a.candidates.find((c) => c.lemma === 'news')?.routeSenseId).toBe('en:news:n:1')
    expect(a.candidates.some((c) => c.lemma === 'london')).toBe(false)
  })
})
