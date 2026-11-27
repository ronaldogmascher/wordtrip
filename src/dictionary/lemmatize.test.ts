import { describe, expect, it } from 'vitest'
import { lemmaCandidates, normalizeWord } from './lemmatize.ts'

describe('lemmaCandidates', () => {
  it.each([
    ['went', 'go'],
    ['children', 'child'],
    ['makes', 'make'],
    ['stopped', 'stop'],
    ['running', 'run'],
    ['tries', 'try'],
    ['studied', 'study'],
    ['making', 'make'],
    ['bigger', 'big'],
    ['happiest', 'happy'],
    ['quickly', 'quick'],
    ['boxes', 'box'],
    ['written', 'write'],
    ["Brazil's", 'brazil'],
  ])('%s → %s', (word, base) => {
    expect(lemmaCandidates(word)).toContain(base)
  })

  it('keeps the word itself first', () => {
    expect(lemmaCandidates('Charge')[0]).toBe('charge')
  })
})

describe('normalizeWord', () => {
  it('removes punctuation and lowercases', () => {
    expect(normalizeWord('“Hello,')).toBe('hello')
    expect(normalizeWord('don’t')).toBe("don't")
  })
})
