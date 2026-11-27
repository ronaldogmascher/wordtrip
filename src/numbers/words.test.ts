import { describe, expect, it } from 'vitest'
import {
  dateToWords, decimalToWords, formatPrice, formatTime, numberToWords, ordinalShort, ordinalWords, priceToWords,
  timeToWords, yearToWords,
} from './words.ts'

describe('numberToWords', () => {
  it.each([
    [0, 'zero'], [7, 'seven'], [13, 'thirteen'], [30, 'thirty'], [42, 'forty-two'], [100, 'one hundred'],
    [105, 'one hundred five'], [999, 'nine hundred ninety-nine'], [1000, 'one thousand'],
    [1250, 'one thousand two hundred fifty'], [20_015, 'twenty thousand fifteen'],
    [1_000_000, 'one million'], [3_400_000, 'three million four hundred thousand'],
  ])('%d → %s', (n, words) => expect(numberToWords(n)).toBe(words))

  it('uses "and" in British English', () => {
    expect(numberToWords(105, true)).toBe('one hundred and five')
    expect(numberToWords(1005, true)).toBe('one thousand and five')
    expect(numberToWords(2350, true)).toBe('two thousand three hundred and fifty')
  })
})

describe('other formats', () => {
  it('reads decimals digit by digit', () => expect(decimalToWords('3.25')).toBe('three point two five'))

  it.each([[1, 'first', '1st'], [2, 'second', '2nd'], [3, 'third', '3rd'], [11, 'eleventh', '11th'],
    [12, 'twelfth', '12th'], [20, 'twentieth', '20th'], [21, 'twenty-first', '21st'], [30, 'thirtieth', '30th']])(
    'ordinal %d', (n, words, short) => {
      expect(ordinalWords(n)).toBe(words)
      expect(ordinalShort(n)).toBe(short)
    })

  it.each([[1999, 'nineteen ninety-nine'], [2008, 'two thousand eight'], [2026, 'twenty twenty-six'],
    [1905, 'nineteen oh-five'], [1900, 'nineteen hundred']])('year %d', (y, w) => expect(yearToWords(y)).toBe(w))

  it.each([
    [7, 0, "seven o'clock", "seven o'clock"],
    [7, 5, 'seven oh-five', 'five past seven'],
    [7, 15, 'seven fifteen', 'a quarter past seven'],
    [7, 30, 'seven thirty', 'half past seven'],
    [7, 45, 'seven forty-five', 'a quarter to eight'],
    [7, 50, 'seven fifty', 'ten to eight'],
    [12, 40, 'twelve forty', 'twenty to one'],
    [15, 23, 'three twenty-three', 'twenty-three minutes past three'],
  ])('time %d:%d', (h, m, digital, traditional) => expect(timeToWords(h, m)).toEqual({ digital, traditional }))

  it('formats times and prices', () => {
    expect(formatTime(15, 5)).toBe('3:05')
    expect(formatTime(0, 30)).toBe('12:30')
    expect(formatPrice(129_999)).toBe('$1,299.99')
  })

  it('reads prices', () => {
    expect(priceToWords(1299)).toBe('twelve dollars and ninety-nine cents')
    expect(priceToWords(100)).toBe('one dollar')
    expect(priceToWords(5)).toBe('five cents')
  })

  it('reads dates the US and UK way', () => {
    expect(dateToWords(2, 3)).toBe('March third')
    expect(dateToWords(2, 3, true)).toBe('the third of March')
  })
})
