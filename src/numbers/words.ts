// Turns numbers, times, prices, dates and measures into spoken English.
// `uk` switches to British habits ("one hundred and five", "the third of March").

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen']
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
const SCALES: [number, string][] = [[1_000_000_000, 'billion'], [1_000_000, 'million'], [1_000, 'thousand']]

function belowHundred(n: number): string {
  if (n < 20) return ONES[n]
  const unit = n % 10
  return TENS[Math.floor(n / 10)] + (unit ? '-' + ONES[unit] : '')
}

function belowThousand(n: number, uk: boolean): string {
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  if (!hundreds) return belowHundred(rest)
  const head = `${ONES[hundreds]} hundred`
  if (!rest) return head
  return `${head} ${uk ? 'and ' : ''}${belowHundred(rest)}`
}

/** 1250 → "one thousand two hundred fifty" (US) / "one thousand two hundred and fifty" (UK). */
export function numberToWords(n: number, uk = false): string {
  if (!Number.isInteger(n) || n < 0) throw new Error(`Unsupported number: ${n}`)
  if (n < 1000) return belowThousand(n, uk)
  const parts: string[] = []
  let rest = n
  for (const [size, name] of SCALES) {
    if (rest >= size) {
      parts.push(`${belowThousand(Math.floor(rest / size), uk)} ${name}`)
      rest %= size
    }
  }
  if (rest) parts.push((uk && rest < 100 ? 'and ' : '') + belowThousand(rest, uk))
  return parts.join(' ')
}

/** 3.25 → "three point two five". */
export function decimalToWords(text: string, uk = false): string {
  const [whole, fraction] = text.split('.')
  const head = numberToWords(Number(whole), uk)
  if (!fraction) return head
  return `${head} point ${[...fraction].map((d) => ONES[Number(d)]).join(' ')}`
}

const ORDINAL_WORDS: Record<string, string> = {
  one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth',
}

/** 23 → "twenty-third". */
export function ordinalWords(n: number, uk = false): string {
  const words = numberToWords(n, uk)
  const match = words.match(/([a-z]+)$/)!
  const last = match[1]
  let ord: string
  if (ORDINAL_WORDS[last]) ord = ORDINAL_WORDS[last]
  else if (last.endsWith('y')) ord = last.slice(0, -1) + 'ieth'
  else ord = last + 'th'
  return words.slice(0, match.index) + ord
}

/** 23 → "23rd". */
export function ordinalShort(n: number): string {
  const lastTwo = n % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`
  return n + (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')
}

/** 1999 → "nineteen ninety-nine", 2008 → "two thousand eight", 2026 → "twenty twenty-six". */
export function yearToWords(year: number, uk = false): string {
  if (year >= 2000 && year < 2010) return numberToWords(year, uk)
  const first = Math.floor(year / 100)
  const last = year % 100
  if (last === 0) return `${belowHundred(first)} hundred`
  return `${belowHundred(first)} ${last < 10 ? 'oh-' + ONES[last] : belowHundred(last)}`
}

function hourWord(h: number): string {
  const twelve = h % 12 === 0 ? 12 : h % 12
  return ONES[twelve]
}

/** The two common ways to say a time: "seven forty-five" and "a quarter to eight". */
export function timeToWords(hours: number, minutes: number): { digital: string; traditional: string } {
  const hour = hourWord(hours)
  const nextHour = hourWord(hours + 1)
  if (minutes === 0) {
    const oclock = `${hour} o'clock`
    return { digital: oclock, traditional: oclock }
  }
  const digital = `${hour} ${minutes < 10 ? 'oh-' + ONES[minutes] : belowHundred(minutes)}`
  let traditional: string
  if (minutes === 15) traditional = `a quarter past ${hour}`
  else if (minutes === 30) traditional = `half past ${hour}`
  else if (minutes === 45) traditional = `a quarter to ${nextHour}`
  else if (minutes < 30) traditional = `${belowHundred(minutes)}${minutes % 5 ? ' minutes' : ''} past ${hour}`
  else traditional = `${belowHundred(60 - minutes)}${minutes % 5 ? ' minutes' : ''} to ${nextHour}`
  return { digital, traditional }
}

/** Formats a time as "7:45". */
export function formatTime(hours: number, minutes: number): string {
  const twelve = hours % 12 === 0 ? 12 : hours % 12
  return `${twelve}:${String(minutes).padStart(2, '0')}`
}

/** 12.99 → "twelve dollars and ninety-nine cents". */
export function priceToWords(cents: number, uk = false): string {
  const dollars = Math.floor(cents / 100)
  const rest = cents % 100
  const parts: string[] = []
  if (dollars) parts.push(`${numberToWords(dollars, uk)} ${dollars === 1 ? 'dollar' : 'dollars'}`)
  if (rest) parts.push(`${numberToWords(rest, uk)} ${rest === 1 ? 'cent' : 'cents'}`)
  return parts.join(' and ') || 'zero dollars'
}

/** Formats cents as "$12.99". */
export function formatPrice(cents: number): string {
  return `$${Math.floor(cents / 100).toLocaleString('en-US')}.${String(cents % 100).padStart(2, '0')}`
}

export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
  'October', 'November', 'December']
export const MONTHS_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro',
  'outubro', 'novembro', 'dezembro']

/** month is 0–11. US: "March third"; UK: "the third of March". */
export function dateToWords(month: number, day: number, uk = false): string {
  return uk ? `the ${ordinalWords(day, uk)} of ${MONTHS[month]}` : `${MONTHS[month]} ${ordinalWords(day)}`
}

export interface Unit {
  symbol: string
  singular: string
  plural: string
  pt: string
}

export const UNITS: Unit[] = [
  { symbol: 'km', singular: 'kilometer', plural: 'kilometers', pt: 'quilômetro' },
  { symbol: 'm', singular: 'meter', plural: 'meters', pt: 'metro' },
  { symbol: 'cm', singular: 'centimeter', plural: 'centimeters', pt: 'centímetro' },
  { symbol: 'kg', singular: 'kilogram', plural: 'kilograms', pt: 'quilo' },
  { symbol: 'g', singular: 'gram', plural: 'grams', pt: 'grama' },
  { symbol: 'L', singular: 'liter', plural: 'liters', pt: 'litro' },
  { symbol: '°C', singular: 'degree Celsius', plural: 'degrees Celsius', pt: 'grau Celsius' },
  { symbol: '°F', singular: 'degree Fahrenheit', plural: 'degrees Fahrenheit', pt: 'grau Fahrenheit (EUA)' },
  { symbol: 'mi', singular: 'mile', plural: 'miles', pt: 'milha (1,6 km)' },
  { symbol: 'lb', singular: 'pound', plural: 'pounds', pt: 'libra (0,45 kg)' },
  { symbol: 'ft', singular: 'foot', plural: 'feet', pt: 'pé (30 cm)' },
  { symbol: 'in', singular: 'inch', plural: 'inches', pt: 'polegada (2,5 cm)' },
  { symbol: 'gal', singular: 'gallon', plural: 'gallons', pt: 'galão (3,8 L)' },
]

/** (5, km) → "five kilometers". */
export function measureToWords(amount: number, unit: Unit, uk = false): string {
  return `${numberToWords(amount, uk)} ${amount === 1 ? unit.singular : unit.plural}`
}

export const OPERATIONS = [
  { symbol: '+', words: 'plus' },
  { symbol: '−', words: 'minus' },
  { symbol: '×', words: 'times' },
  { symbol: '÷', words: 'divided by' },
] as const
