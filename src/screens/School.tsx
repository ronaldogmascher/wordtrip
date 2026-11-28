import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { playCorrect, playWrong } from '../audio/effects.ts'
import { db, getSettings, type Accent } from '../db/db.ts'
import { nextTryAt } from '../game/boss.ts'
import { LESSONS, type Lesson } from '../school/lessons.ts'
import { EXAM_ID, EXAM_PASS_SHARE, EXAM_QUESTIONS, hasLicense, LESSON_PASS_SHARE, makeExam, makeLessonQuiz, passed, type SchoolQuestion } from '../school/quiz.ts'
import { canSpeak, speak } from '../study/speech.ts'
import { timeUntil } from '../study/when.ts'

// Autoescola: first lessons (alphabet, greetings, numbers…) and the driving test that opens the
// map for learners starting from zero. Always open afterwards, for a refresher.

type View = { kind: 'list' } | { kind: 'lesson'; lesson: Lesson } | { kind: 'exam' }

export default function School() {
  const [view, setView] = useState<View>({ kind: 'list' })
  const data = useLiveQuery(async () => {
    const [lessons, attempts, settings] = await Promise.all([db.schoolLessons.toArray(), db.bossAttempts.toArray(), getSettings()])
    return { lessons, attempts, accent: settings.accent, soundEffects: settings.soundEffects, now: new Date() }
  })
  if (!data) return <section className="screen"><p className="muted">Carregando…</p></section>

  const back = () => setView({ kind: 'list' })
  if (view.kind === 'lesson') return <LessonRun lesson={view.lesson} accent={data.accent} soundEffects={data.soundEffects} onExit={back} />
  if (view.kind === 'exam') return <ExamRun accent={data.accent} soundEffects={data.soundEffects} onExit={back} />

  const done = new Map(data.lessons.map((l) => [l.id, l]))
  const license = hasLicense(data.attempts)
  const tryAt = nextTryAt(EXAM_ID, data.attempts, data.now)
  const passedCount = LESSONS.filter((l) => done.get(l.id)?.passedAt).length

  return (
    <section className="screen">
      <p className="eyebrow">🚗 Autoescola</p>
      <h1>Aulas iniciais</h1>
      <p className="muted">
        {license
          ? 'Você já tem a sua CNH 🪪! As aulas continuam aqui para reciclagem sempre que quiser.'
          : 'Antes de pegar a estrada, o viajante tira a carteira de motorista. Faça as aulas, passe na prova da CNH e o mapa da viagem abre.'}
      </p>
      <div className="card">
        <ol className="lessons">
          {LESSONS.map((lesson) => {
            const record = done.get(lesson.id)
            return (
              <li key={lesson.id}>
                <button className="lesson-button" onClick={() => setView({ kind: 'lesson', lesson })}>
                  <span className="lesson-icon" aria-hidden="true">{lesson.icon}</span>
                  <span className="lesson-text">
                    <strong>{lesson.title}</strong>
                    <span className="muted">{lesson.intro}</span>
                  </span>
                  <span className="lesson-status" aria-label={record?.passedAt ? 'Aula concluída' : 'Aula pendente'}>
                    {record?.passedAt ? '✅' : record ? `${record.best}/${record.total}` : '▶️'}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
        <p className="muted">{passedCount} de {LESSONS.length} aulas concluídas.</p>
      </div>

      <div className="card exam-card">
        <h2>🪪 Prova da CNH</h2>
        <p>{EXAM_QUESTIONS} perguntas com palavras de todas as aulas. Acerte {Math.round(EXAM_PASS_SHARE * 100)}% para tirar a carteira e liberar o mapa.</p>
        {license ? (
          <p>✅ Aprovado! A estrada está liberada.</p>
        ) : tryAt && tryAt > data.now ? (
          <p className="muted">⏳ Nova tentativa {timeUntil(tryAt, data.now)}. Enquanto isso, revise as aulas.</p>
        ) : (
          <>
            {passedCount < LESSONS.length && <p className="muted">Dica: faça as aulas antes. Mas, se já souber o básico, pode tentar a prova direto.</p>}
            <button className="button primary" onClick={() => setView({ kind: 'exam' })}>Fazer a prova</button>
          </>
        )}
      </div>
      <Link className="button" to="/">Voltar ao início</Link>
    </section>
  )
}

/** A lesson: first meet the words, then answer one question about each. */
function LessonRun({ lesson, accent, soundEffects, onExit }: { lesson: Lesson; accent: Accent; soundEffects: boolean; onExit: () => void }) {
  const [step, setStep] = useState<'meet' | 'quiz'>('meet')
  if (step === 'meet') {
    return (
      <section className="screen">
        <p className="eyebrow">🚗 Autoescola · {lesson.title}</p>
        <h1>{lesson.icon} Conheça as palavras</h1>
        <p className="muted">Toque em 🔊 para ouvir e repita em voz alta. Quando estiver pronto, faça o exercício.</p>
        <div className="card">
          <ul className="meet-list">
            {lesson.items.map((item) => (
              <li key={item.en}>
                <span className="meet-emoji" aria-hidden="true">{item.emoji}</span>
                <strong>{item.en}</strong>
                <span className="muted">{item.pt === item.en ? '' : item.pt}</span>
                {canSpeak() && <button className="icon" onClick={() => speak(item.en, accent)} aria-label={`Ouvir ${item.en}`}>🔊</button>}
              </li>
            ))}
          </ul>
        </div>
        <button className="button primary" onClick={() => setStep('quiz')}>Fazer o exercício</button>
        <button className="button" onClick={onExit}>Voltar às aulas</button>
      </section>
    )
  }
  return (
    <QuizRun
      title={`${lesson.icon} ${lesson.title}`}
      questions={makeLessonQuiz(lesson, Math.random, canSpeak())}
      share={LESSON_PASS_SHARE}
      accent={accent}
      soundEffects={soundEffects}
      onFinish={async (correct, total) => {
        const previous = await db.schoolLessons.get(lesson.id)
        const ok = passed(correct, total, LESSON_PASS_SHARE)
        await db.schoolLessons.put({
          id: lesson.id,
          best: Math.max(correct, previous?.best ?? 0),
          total,
          passedAt: previous?.passedAt ?? (ok ? new Date() : undefined),
        })
      }}
      passText="Aula concluída! ✅"
      failText={`Quase! Para concluir a aula, acerte ${Math.round(LESSON_PASS_SHARE * 100)}%. Pode tentar de novo quantas vezes quiser.`}
      onExit={onExit}
    />
  )
}

function ExamRun({ accent, soundEffects, onExit }: { accent: Accent; soundEffects: boolean; onExit: () => void }) {
  const [questions] = useState(() => makeExam(Math.random, EXAM_QUESTIONS, canSpeak()))
  return (
    <QuizRun
      title="🪪 Prova da CNH"
      questions={questions}
      share={EXAM_PASS_SHARE}
      accent={accent}
      soundEffects={soundEffects}
      onFinish={async (correct, total) => {
        await db.bossAttempts.add({ phaseId: EXAM_ID, at: new Date(), correct, total, passed: passed(correct, total, EXAM_PASS_SHARE) })
      }}
      passText="Parabéns, você tirou a sua CNH! 🪪 O mapa está liberado: a viagem começa agora."
      failText="Não foi dessa vez. Revise as aulas em que errou mais e tente de novo: a primeira revanche é na hora; depois de 2 tentativas, espere 24 horas."
      onExit={onExit}
      passLink={{ to: '/mapa', label: 'Ver o mapa 🗺️' }}
    />
  )
}

function QuizRun({ title, questions, share, accent, soundEffects, onFinish, passText, failText, onExit, passLink }: {
  title: string
  questions: SchoolQuestion[]
  share: number
  accent: Accent
  soundEffects: boolean
  onFinish: (correct: number, total: number) => Promise<void>
  passText: string
  failText: string
  onExit: () => void
  passLink?: { to: string; label: string }
}) {
  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const [finished, setFinished] = useState(false)
  const q = questions[index]

  // Listening questions are read aloud as soon as they appear.
  useEffect(() => {
    if (!finished && q.kind === 'listen' && canSpeak()) speak(q.item.en, accent)
  }, [q, finished, accent])

  if (finished) {
    const ok = passed(correct, questions.length, share)
    return (
      <section className="screen">
        <h1>{ok ? '🎉 Aprovado!' : '💪 Continue treinando'}</h1>
        <div className="card">
          <p><strong>{correct}</strong> de {questions.length} certas.</p>
          <p>{ok ? passText : failText}</p>
          {ok && passLink && <Link className="button primary" to={passLink.to}>{passLink.label}</Link>}
          <button className="button" onClick={onExit}>Voltar às aulas</button>
        </div>
      </section>
    )
  }

  const answered = picked !== null
  const right = picked === q.answer
  const choose = (option: string) => {
    if (answered) return
    setPicked(option)
    const ok = option === q.answer
    if (ok) setCorrect((c) => c + 1)
    if (soundEffects) (ok ? playCorrect : playWrong)()
    if (canSpeak()) window.setTimeout(() => speak(q.item.en, accent), soundEffects ? 400 : 0)
  }
  const next = async () => {
    if (index + 1 >= questions.length) {
      await onFinish(correct, questions.length)
      setFinished(true)
    } else {
      setIndex(index + 1)
      setPicked(null)
    }
  }

  return (
    <section className="screen">
      <p className="eyebrow">🚗 {title}</p>
      <p className="muted">Pergunta {index + 1} de {questions.length} · {correct} certas</p>
      <div className="card study">
        {q.kind === 'see-pt' && (
          <>
            <p className="definition">Como se diz em inglês?</p>
            <p className="big-prompt school-prompt"><span aria-hidden="true">{q.item.emoji}</span> {q.item.pt}</p>
          </>
        )}
        {q.kind === 'see-en' && (
          <>
            <p className="definition">O que significa?</p>
            <p className="big-prompt school-prompt">{q.item.en}</p>
          </>
        )}
        {q.kind === 'listen' && (
          <>
            <p className="definition">Ouça e escolha:</p>
            <div className="audio-row">
              <button onClick={() => speak(q.item.en, accent)} autoFocus>🔊 Ouvir</button>
              <button onClick={() => speak(q.item.en, accent, true)}>🐢 Devagar</button>
            </div>
          </>
        )}
        <div className="choices">
          {q.options.map((o) => (
            <button key={o} className={`choice ${answered && o === q.answer ? 'choice-right' : ''} ${answered && o === picked && !right ? 'choice-wrong' : ''}`} onClick={() => choose(o)} disabled={answered}>{o}</button>
          ))}
        </div>
        {answered && (
          <div className="reveal">
            <p className={`verdict ${right ? 'ok' : 'wrong'}`}>{right ? '✔ Correto!' : `✘ A resposta era "${q.answer}"`}</p>
            <p className="big-prompt school-prompt"><span aria-hidden="true">{q.item.emoji}</span> <strong>{q.item.en}</strong>{q.item.pt !== q.item.en && <> = {q.item.pt}</>}</p>
            <button className="button primary" onClick={() => void next()}>{index + 1 >= questions.length ? 'Ver resultado' : 'Continuar'}</button>
          </div>
        )}
      </div>
    </section>
  )
}
