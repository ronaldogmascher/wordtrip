import type { Accent } from '../db/db.ts'

// Pronunciation with the browser's built-in voices (free and usually offline).

export function canSpeak(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}

export function speak(text: string, accent: Accent = 'US'): void {
  if (!canSpeak()) return
  const lang = accent === 'UK' ? 'en-GB' : 'en-US'
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang
  utterance.rate = 0.9
  const voice = window.speechSynthesis.getVoices().find((v) => v.lang.replace('_', '-') === lang)
  if (voice) utterance.voice = voice
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
}
