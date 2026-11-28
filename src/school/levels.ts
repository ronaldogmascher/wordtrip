import type { EnglishLevel } from '../db/db.ts'

// The level question on first launch and what each answer does to the start of the trip.

export const LEVELS: { value: EnglishLevel; icon: string; label: string; text: string; plan: string }[] = [
  {
    value: 'zero', icon: '🌱', label: 'Do zero', text: 'Nunca estudei, ou sei só "hello" e "thank you".',
    plan: '🚗 Você começa na Autoescola: aulas iniciais e a prova da CNH, que libera o mapa. O modo iniciante vem ligado.',
  },
  {
    value: 'pre', icon: '🎒', label: 'Pré-iniciante', text: 'O básico da escola: verbo to be, números, cores, cumprimentos.',
    plan: '🚗 Você começa na Autoescola e pode fazer a prova da CNH direto. O modo iniciante vem ligado.',
  },
  {
    value: 'beginner', icon: '🚐', label: 'Iniciante', text: 'Entendo frases simples e conheço algumas centenas de palavras.',
    plan: '🗺️ Você vai direto para o mapa, com o modo iniciante ligado (tradução da definição já aberta).',
  },
  {
    value: 'intermediate', icon: '🛣️', label: 'Intermediário', text: 'Leio textos simples e acompanho séries com legenda.',
    plan: '📝 Você pode fazer a prova de nivelamento: passando, o trecho do Brasil (A1) fica concluído.',
  },
  {
    value: 'advanced', icon: '🗽', label: 'Avançado', text: 'Converso e entendo quase tudo sem legenda.',
    plan: '📝 Você pode fazer a prova de nivelamento: passando, o trecho do Brasil (A1) fica concluído.',
  },
]

/** Levels that start at the Autoescola: the map stays locked until the driving test. */
export const NEEDS_LICENSE: EnglishLevel[] = ['zero', 'pre']
/** Levels that start with the beginner mode on. */
export const STARTS_AS_BEGINNER: EnglishLevel[] = ['zero', 'pre', 'beginner']
/** Levels offered the placement test. */
export const OFFERS_PLACEMENT: EnglishLevel[] = ['intermediate', 'advanced']
