import { describe, expect, it } from 'vitest'
import { LESSONS } from './lessons.ts'
import { EXAM_ID, EXAM_QUESTIONS, hasLicense, makeExam, makeLessonQuiz, passed } from './quiz.ts'

describe('Autoescola', () => {
  it('has lessons with unique words', () => {
    for (const lesson of LESSONS) {
      expect(lesson.items.length).toBeGreaterThanOrEqual(10)
      expect(new Set(lesson.items.map((i) => i.en)).size).toBe(lesson.items.length)
    }
  })
  it('asks every item of a lesson once, with the answer among 4 different options', () => {
    for (const lesson of LESSONS) {
      const quiz = makeLessonQuiz(lesson, () => 0.37)
      expect(quiz).toHaveLength(lesson.items.length)
      for (const q of quiz) {
        expect(q.options).toContain(q.answer)
        expect(new Set(q.options).size).toBe(q.options.length)
        expect(q.options.length).toBe(4)
      }
    }
  })
  it('only uses listening for the alphabet', () => {
    expect(makeLessonQuiz(LESSONS[0]).every((q) => q.kind === 'listen')).toBe(true)
  })
  it('falls back to reading when the device cannot speak', () => {
    const quiz = makeLessonQuiz(LESSONS[1], Math.random, false)
    expect(quiz.some((q) => q.kind === 'listen')).toBe(false)
  })
  it('builds a 30-question exam from every lesson', () => {
    const exam = makeExam()
    expect(exam).toHaveLength(EXAM_QUESTIONS)
    expect(new Set(exam.map((q) => q.lessonId)).size).toBe(LESSONS.length)
  })
  it('passes at 80% and grants the license', () => {
    expect(passed(24, 30, 0.8)).toBe(true)
    expect(passed(23, 30, 0.8)).toBe(false)
    expect(hasLicense([{ phaseId: EXAM_ID, at: new Date(), correct: 25, total: 30, passed: true }])).toBe(true)
  })
})
