// Checks a typed answer. Small spelling mistakes are accepted but flagged as a typo.

export type AnswerCheck = 'correct' | 'typo' | 'wrong'

export function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/[.!?,;:]+$/g, '')
}

export function checkAnswer(typed: string, expected: string): AnswerCheck {
  const a = normalize(typed)
  const b = normalize(expected)
  if (!a) return 'wrong'
  if (a === b) return 'correct'
  // 1 letter allowed for short words, 2 for words of 6+ letters.
  const allowed = b.length >= 6 ? 2 : b.length >= 3 ? 1 : 0
  return levenshtein(a, b) <= allowed ? 'typo' : 'wrong'
}

export function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const temp = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = temp
    }
  }
  return prev[b.length]
}

/** First-letter hint: "w____" for "water". */
export function hintFor(expected: string): string {
  return expected
    .split(' ')
    .map((w) => w[0] + '_'.repeat(Math.max(w.length - 1, 0)))
    .join(' ')
}
