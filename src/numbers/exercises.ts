import {
  dateToWords, formatPrice, formatTime, MONTHS_PT, measureToWords, numberToWords, OPERATIONS, priceToWords,
  timeToWords, UNITS,
} from './words.ts'

// Random practice questions for numbers, times, prices, dates, measures and spoken math.

export type Category = 'numbers' | 'times' | 'prices' | 'dates' | 'measures' | 'math'
export type Level = 1 | 2 | 3

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'numbers', label: 'Números', icon: '🔢' },
  { id: 'times', label: 'Horas', icon: '🕒' },
  { id: 'prices', label: 'Preços', icon: '💵' },
  { id: 'dates', label: 'Datas', icon: '📅' },
  { id: 'measures', label: 'Medidas', icon: '📏' },
  { id: 'math', label: 'Contas', icon: '➗' },
]

export const LEVELS: { id: Level; label: string }[] = [
  { id: 1, label: 'Fácil' },
  { id: 2, label: 'Médio' },
  { id: 3, label: 'Difícil' },
]

export interface Exercise {
  category: Category
  /** What the question asks, in Portuguese. */
  instruction: string
  /** Text shown on the card (empty for listening questions). */
  shown: string
  /** Text read aloud by the browser voice, if any. */
  speech?: string
  mode: 'type' | 'choice'
  /** The right answer as shown after answering. */
  answer: string
  /** Choice questions: the options, one of them equal to `answer`. */
  options?: string[]
  /** Type questions: how to compare what was typed with the answer. */
  check?: (typed: string) => boolean
  /** The answer in words, shown and read after answering. */
  words: string
  tip?: string
}

type Rng = () => number

const int = (rng: Rng, min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min
const pick = <T,>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)]

function shuffle<T>(rng: Rng, items: T[]): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** The right answer plus up to three different wrong ones, shuffled. */
function choices(rng: Rng, answer: string, candidates: string[]): string[] {
  const wrong = [...new Set(candidates.filter((c) => c !== answer))]
  return shuffle(rng, [answer, ...shuffle(rng, wrong).slice(0, 3)])
}

const digitsOnly = (text: string) => text.replace(/\D/g, '')

/** Reads "$1,299.99", "1299.99" or "1299,99" as cents. */
export function parsePrice(text: string): number | null {
  const t = text.replace(/[$\s]/g, '')
  let normalized: string
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(t)) normalized = t.replace(/,/g, '')
  else if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(t)) normalized = t.replace(/\./g, '').replace(',', '.')
  else normalized = t.replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null
  const [whole, frac = ''] = normalized.split('.')
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'))
}

function numberMax(level: Level): number {
  return level === 1 ? 100 : level === 2 ? 1000 : 1_000_000
}

function numberQuestion(rng: Rng, level: Level, uk: boolean): Exercise {
  const max = numberMax(level)
  let n = int(rng, 0, max)
  // Hard level: mostly round-ish big numbers, like prices of cars or populations.
  if (level === 3 && rng() < 0.6) n = int(rng, 1, 999) * pick(rng, [100, 1000])
  const words = numberToWords(n, uk)
  if (rng() < 0.5) {
    return {
      category: 'numbers', instruction: 'Ouça e digite o número em algarismos.', shown: '', speech: words,
      mode: 'type', answer: n.toLocaleString('en-US'), check: (t) => digitsOnly(t) === String(n), words,
    }
  }
  // Classic confusions: 13/30, 15/50, one digit off, a zero more or less.
  const confusions = [n + 1, Math.max(0, n - 1), n * 10, Math.floor(n / 10), n + 10, n + 100]
  if (n >= 13 && n <= 19) confusions.push((n - 10) * 10)
  if (n % 10 === 0 && n >= 30 && n <= 90) confusions.push(n / 10 + 10)
  return {
    category: 'numbers', instruction: 'Como se diz este número?', shown: n.toLocaleString('en-US'), mode: 'choice',
    answer: words, options: choices(rng, words, confusions.filter((c) => c <= 999_999_999).map((c) => numberToWords(c, uk))),
    words,
  }
}

function timeQuestion(rng: Rng, level: Level): Exercise {
  const h = int(rng, 1, 12)
  const m = level === 1 ? pick(rng, [0, 15, 30, 45]) : level === 2 ? int(rng, 0, 11) * 5 : int(rng, 0, 59)
  const { digital, traditional } = timeToWords(h, m)
  const shown = formatTime(h, m)
  const both = digital === traditional ? digital : `${digital} / ${traditional}`
  if (rng() < 0.5) {
    const said = rng() < 0.5 ? digital : traditional
    return {
      category: 'times', instruction: 'Ouça e digite a hora (ex.: 7:45).', shown: '', speech: `It's ${said}.`,
      mode: 'type', answer: shown, check: (t) => digitsOnly(t).replace(/^0/, '') === digitsOnly(shown), words: both,
      tip: 'Em inglês, "half past seven" = 7:30 e "a quarter to eight" = 7:45.',
    }
  }
  const useTraditional = m !== 0 && rng() < 0.6
  const answer = useTraditional ? traditional : digital
  const others = [[h, (m + 15) % 60], [h % 12 + 1, m], [h, (m + 30) % 60], [h === 1 ? 12 : h - 1, m]].map(([hh, mm]) => {
    const w = timeToWords(hh, mm)
    return useTraditional ? w.traditional : w.digital
  })
  return {
    category: 'times', instruction: 'Como se diz esta hora?', shown, mode: 'choice', answer,
    options: choices(rng, answer, others), words: both,
  }
}

function priceQuestion(rng: Rng, level: Level, uk: boolean): Exercise {
  const dollars = level === 1 ? int(rng, 1, 20) : level === 2 ? int(rng, 10, 500) : int(rng, 500, 25_000)
  const cents = dollars * 100 + (rng() < 0.7 ? pick(rng, [99, 50, 95, 25, 49]) : int(rng, 0, 99))
  const words = priceToWords(cents, uk)
  const shown = formatPrice(cents)
  return {
    category: 'prices', instruction: 'Ouça o preço e digite o valor (ex.: 12.99).', shown: '', speech: `It costs ${words}.`,
    mode: 'type', answer: shown, check: (t) => parsePrice(t) === cents, words,
    tip: 'Na fala do dia a dia também se diz só os números: "twelve ninety-nine" = $12.99.',
  }
}

function dateQuestion(rng: Rng, level: Level, uk: boolean): Exercise {
  const month = int(rng, 0, 11)
  const day = level === 1 ? int(rng, 1, 10) : int(rng, 1, 28)
  const answer = dateToWords(month, day, uk)
  const others = [
    dateToWords(month, day % 28 + 1, uk), dateToWords((month + 1) % 12, day, uk),
    dateToWords(month, day > 3 ? day - 2 : day + 3, uk), dateToWords((month + 11) % 12, day, uk),
  ]
  return {
    category: 'dates', instruction: 'Como se diz esta data em inglês?', shown: `${day} de ${MONTHS_PT[month]}`,
    mode: 'choice', answer, options: choices(rng, answer, others), words: answer,
    tip: uk ? undefined : 'Nos EUA a data escrita vem com o mês primeiro: 3/7 é 7 de março!',
  }
}

function measureQuestion(rng: Rng, level: Level, uk: boolean): Exercise {
  const unit = pick(rng, level === 1 ? UNITS.slice(0, 7) : UNITS)
  const amount = level === 3 ? int(rng, 1, 2000) : int(rng, 1, 100)
  const answer = measureToWords(amount, unit, uk)
  const others = shuffle(rng, UNITS.filter((u) => u !== unit)).slice(0, 3).map((u) => measureToWords(amount, u, uk))
  return {
    category: 'measures', instruction: 'Como se diz esta medida?', shown: `${amount.toLocaleString('en-US')} ${unit.symbol}`,
    mode: 'choice', answer, options: choices(rng, answer, others), words: answer,
    tip: `${unit.symbol} = ${unit.pt}`,
  }
}

function mathQuestion(rng: Rng, level: Level, uk: boolean): Exercise {
  const op = pick(rng, level === 1 ? OPERATIONS.slice(0, 2) : OPERATIONS)
  const top = level === 1 ? 10 : level === 2 ? 20 : 100
  let a = int(rng, 1, top)
  let b = int(rng, 1, top)
  let result: number
  if (op.symbol === '+') result = a + b
  else if (op.symbol === '−') {
    if (b > a) [a, b] = [b, a]
    result = a - b
  } else if (op.symbol === '×') {
    b = int(rng, 2, level === 3 ? 12 : 10)
    result = a * b
  } else {
    b = int(rng, 2, 10)
    result = int(rng, 1, level === 3 ? 20 : 10)
    a = b * result
  }
  const question = `What is ${numberToWords(a, uk)} ${op.words} ${numberToWords(b, uk)}?`
  return {
    category: 'math', instruction: 'Ouça a conta e digite o resultado.', shown: '', speech: question, mode: 'type',
    answer: String(result), check: (t) => digitsOnly(t) === String(result) && t.trim() !== '',
    words: `${numberToWords(a, uk)} ${op.words} ${numberToWords(b, uk)} is ${numberToWords(result, uk)}`,
    tip: 'plus = mais · minus = menos · times = vezes · divided by = dividido por',
  }
}

const GENERATORS: Record<Category, (rng: Rng, level: Level, uk: boolean) => Exercise> = {
  numbers: numberQuestion,
  times: (rng, level) => timeQuestion(rng, level),
  prices: priceQuestion,
  dates: dateQuestion,
  measures: measureQuestion,
  math: mathQuestion,
}

export function makeExercise(category: Category, level: Level, uk: boolean, rng: Rng = Math.random): Exercise {
  return GENERATORS[category](rng, level, uk)
}

/** A practice session: `count` questions from the chosen categories, mixed. */
export function makeSession(categories: Category[], level: Level, uk: boolean, count = 10, rng: Rng = Math.random): Exercise[] {
  return Array.from({ length: count }, (_, i) => makeExercise(categories[i % categories.length], level, uk, rng))
    .sort(() => rng() - 0.5)
}
