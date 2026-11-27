import type { Accent } from '../db/db.ts'

// Pronunciation with the browser's built-in voices (free and usually offline).

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

/** Speaking rates: normal (slightly slower than native) and slow. */
export const RATE = { normal: 0.9, slow: 0.6 } as const

export function speak(text: string, accent: Accent = 'US', slow = false): void {
  if (!canSpeak()) return
  const lang = accent === 'UK' ? 'en-GB' : 'en-US'
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = slow ? RATE.slow : RATE.normal
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-') === lang)
  if (voice) utterance.voice = voice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
