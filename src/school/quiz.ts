import type { BossAttempt } from '../db/db.ts'
import { LESSONS, type Lesson, type SchoolItem } from './lessons.ts'

// Autoescola questions: multiple choice only, with Portuguese and emoji instead of English
// definitions. A lesson passes at 80%; the driving test ("prova da CNH") mixes all lessons.

export const LESSON_PASS_SHARE = 0.8
export const EXAM_QUESTIONS = 30
export const EXAM_PASS_SHARE = 0.8
/** The driving test is stored with the boss attempts under this id (same retry rule). */
export const EXAM_ID = 'school:cnh'

/**
 * 'see-pt': emoji + Portuguese shown, pick the English. 'see-en': English shown, pick the
 * Portuguese. 'listen': hear the English, pick the Portuguese (or the letter, for the alphabet).
 */
export type QuestionKind = 'see-pt' | 'see-en' | 'listen'

export interface SchoolQuestion {
  item: SchoolItem
  lessonId: string
  kind: QuestionKind
  options: string[]
  answer: string
}

type Rng = () => number

function shuffle<T>(items: T[], rng: Rng): T[] {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const KINDS: QuestionKind[] = ['see-pt', 'listen', 'see-en']

function makeQuestion(lesson: Lesson, item: SchoolItem, kind: QuestionKind, rng: Rng): SchoolQuestion {
  // In the alphabet English and Portuguese are the same letter, so only listening makes sense.
  if (lesson.id === 'alphabet') kind = 'listen'
  const shownSide = kind === 'see-pt' ? 'en' : 'pt'
  const answer = item[shownSide]
  const others = [...new Set(lesson.items.map((i) => i[shownSide]).filter((v) => v !== answer))]
  return { item, lessonId: lesson.id, kind, answer, options: shuffle([answer, ...shuffle(others, rng).slice(0, 3)], rng) }
}

/** One question per item of the lesson, rotating the three kinds, in random order. */
export function makeLessonQuiz(lesson: Lesson, rng: Rng = Math.random, canListen = true): SchoolQuestion[] {
  return shuffle(lesson.items, rng).map((item, i) => {
    const kind = KINDS[i % KINDS.length]
    return makeQuestion(lesson, item, !canListen && kind === 'listen' ? 'see-en' : kind, rng)
  })
}

/** The driving test: questions drawn from every lesson, roughly the same number from each. */
export function makeExam(rng: Rng = Math.random, count = EXAM_QUESTIONS, canListen = true): SchoolQuestion[] {
  const perLesson = Math.ceil(count / LESSONS.length)
  const picked = LESSONS.flatMap((lesson) =>
    shuffle(lesson.items, rng).slice(0, perLesson).map((item) => {
      const kind = KINDS[Math.floor(rng() * KINDS.length)]
      return makeQuestion(lesson, item, !canListen && kind === 'listen' ? 'see-en' : kind, rng)
    }),
  )
  return shuffle(picked, rng).slice(0, count)
}

export const passed = (correct: number, total: number, share: number) => total > 0 && correct >= Math.ceil(total * share)

/** True once the driving test was passed. */
export const hasLicense = (attempts: BossAttempt[]) => attempts.some((a) => a.phaseId === EXAM_ID && a.passed)
