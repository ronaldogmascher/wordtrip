import { describe, expect, it } from 'vitest'
import { Dictionary, type DictionaryData } from './dictionary.ts'

const data: DictionaryData = {
  v: 1,
  synsets: [
    ['v', 'move from one place to another', 'go home', ['go', 'travel', 'move']],
    ['n', 'a request for payment', 'a small charge', ['charge', 'fee']],
    ['v', 'demand payment', 'they charge too much', ['charge', 'bill']],
  ],
  lemmas: { go: [0], travel: [0], charge: [1, 2], constructor: [0] },
}
const dict = new Dictionary(data)

describe('Dictionary', () => {
  it('looks up senses in order, without the word itself in synonyms', () => {
    const senses = dict.lookup('charge')
    expect(senses.map((s) => s.pos)).toEqual(['n', 'v'])
    expect(senses[0].synonyms).toEqual(['fee'])
  })

  it('resolves inflected forms', () => {
    expect(dict.resolve('went')).toEqual(['go'])
    expect(dict.resolve('Charges')).toEqual(['charge'])
    expect(dict.resolve('xyz')).toEqual([])
  })

  it('does not confuse lemmas with object properties', () => {
    expect(dict.has('toString')).toBe(false)
    expect(dict.has('constructor')).toBe(true)
  })

  it('searches by prefix', () => {
    expect(dict.search('ch')).toEqual(['charge'])
    expect(dict.search('')).toEqual([])
    expect(dict.search('t')).toEqual(['travel'])
  })
})
