import { describe, expect, it } from 'vitest'
import { LESSONS } from './lessons.ts'
import { schoolIpa } from './ipa.ts'

describe('schoolIpa', () => {
  it('has a pronunciation for every Autoescola item', () => {
    const missing = LESSONS.flatMap((l) => l.items).filter((i) => !schoolIpa(i.en, 'US') || !schoolIpa(i.en, 'UK')).map((i) => i.en)
    expect(missing).toEqual([])
  })
  it('follows the chosen accent', () => {
    expect(schoolIpa('Z', 'US')).toBe('/ziː/')
    expect(schoolIpa('Z', 'UK')).toBe('/zɛd/')
    expect(schoolIpa('hi', 'UK')).toBe('/haɪ/')
  })
})
