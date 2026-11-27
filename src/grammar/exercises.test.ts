import { describe, expect, it } from 'vitest'
import { grammarVerbs, isRight, makeQuestion, makeRuleQuestion, makeSession, TOPICS, variants } from './exercises.ts'
import { mainVerb, past, present } from './portuguese.ts'
import { NOTHING, RULE_SENTENCES, RULE_TOPICS } from './rules.ts'

describe('grammar exercises', () => {
  it('has verbs from the route with a Portuguese meaning', () => {
    expect(grammarVerbs().length).toBeGreaterThan(40)
    expect(grammarVerbs().some((v) => v.base === 'be')).toBe(false)
  })

  it('splits US/UK variants', () => {
    expect(variants('learned (US) / learnt (UK)')).toEqual(['learned', 'learnt'])
  })

  it('builds valid questions for every topic', () => {
    for (const t of TOPICS) {
      for (let i = 0; i < 50; i++) {
        const q = makeQuestion(t.id)
        expect(q.text).toContain('____')
        expect(q.options).toContain(q.answer)
        expect(new Set(q.options).size).toBe(q.options.length)
        expect(q.options.length).toBeGreaterThanOrEqual(2)
        expect(isRight(q, q.answer, 'choice')).toBe(true)
        expect(isRight(q, q.answer.toUpperCase(), 'type')).toBe(true)
        expect(q.full).not.toContain('____')
      }
    }
  })

  it('gets the forms right', () => {
    let seed = 0
    const rng = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280)
    const q = makeQuestion('present-negative', rng)
    expect(q.answer).toMatch(/^(don't|doesn't) /)
    expect(q.accepted.some((a) => a.startsWith('do not') || a.startsWith('does not'))).toBe(true)
    const wrong = q.options.find((o) => o !== q.answer)!
    expect(isRight(q, wrong, 'choice')).toBe(false)
  })

  it('mixes the chosen topics in a session', () => {
    const s = makeSession(['past-simple', 'future-will'], 10)
    expect(s).toHaveLength(10)
    expect(new Set(s.map((q) => q.topic))).toEqual(new Set(['past-simple', 'future-will']))
  })
})

describe('rule questions (in/on/at, a/an…)', () => {
  it('every sentence has one blank and a valid answer', () => {
    for (const info of RULE_TOPICS) {
      RULE_SENTENCES[info.id].forEach((sentence, i) => {
        expect(sentence.text.split('____')).toHaveLength(2)
        expect(info.options).toContain(sentence.answer)
        expect(sentence.pt.length).toBeGreaterThan(0)
        const q = makeRuleQuestion(info.id, i)
        expect(q.full).not.toContain('____')
        expect(q.full).not.toContain(NOTHING)
        expect(isRight(q, sentence.answer, 'choice')).toBe(true)
      })
    }
  })

  it('does not repeat a sentence within a session', () => {
    const s = makeSession(['a-an'], 12)
    expect(new Set(s.map((q) => q.text)).size).toBe(12)
  })
})

describe('Portuguese translation', () => {
  it('conjugates regular and irregular verbs', () => {
    expect(present('trabalhar', 'ele')).toBe('trabalha')
    expect(present('conhecer', 'eu')).toBe('conheço')
    expect(past('chegar', 'eu')).toBe('cheguei')
    expect(past('comer', 'ele')).toBe('comeu')
    expect(past('ir', 'eles')).toBe('foram')
    expect(present('fazer', 'eu')).toBe('faço')
  })

  it('reads the main verb of a dictionary meaning', () => {
    expect(mainVerb('andar (a cavalo, de bicicleta), cavalgar')).toEqual({ verb: 'andar', rest: '' })
    expect(mainVerb('ficar de pé')).toEqual({ verb: 'ficar', rest: ' de pé' })
    expect(mainVerb('preocupar-se')).toBeNull()
  })

  it('every generated sentence has a translation', () => {
    for (const t of TOPICS) {
      const q = makeQuestion(t.id)
      expect(q.translation).toMatch(/^[A-ZÀ-Ú].+\.$/)
    }
  })
})
