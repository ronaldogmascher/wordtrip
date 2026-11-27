import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { playCorrect, playWrong } from '../audio/effects.ts'
import { getSettings, type Accent } from '../db/db.ts'
import { CATEGORIES, LEVELS, makeSession, type Category, type Exercise, type Level } from '../numbers/exercises.ts'
import { checkAnswer } from '../study/answer.ts'
import { canSpeak, speak } from '../study/speech.ts'

// "Números e horas": free practice with numbers, times, prices, dates, measures and spoken math.
// Questions are generated on the fly, so there is always something new to practice.

const SESSION_SIZE = 10

export default function Numbers() {
  const [accent, setAccent] = useState<Accent>('US')
  const [soundEffects, setSoundEffects] = useState(true)
  const [selected, setSelected] = useState<Category[]>(['numbers', 'times'])
  const [level, setLevel] = useState<Level>(1)
  const [session, setSession] = useState<Exercise[] | null>(null)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)

  useEffect(() => {
    void getSettings().then((s) => {
      setAccent(s.accent)
      setSoundEffects(s.soundEffects)
    })
  }, [])

  const toggle = (c: Category) =>
    setSelected((cur) => (cur.includes(c) ? (cur.length > 1 ? cur.filter((x) => x !== c) : cur) : [...cur, c]))

  function start() {
    setSession(makeSession(selected, level, accent === 'UK', SESSION_SIZE))
    setIndex(0)
    setScore(0)
  }

  if (!session) {
    return (
      <section className="screen">
        <h1>🔢 Números e horas</h1>
        <p className="muted">Treino livre de números, horas, preços, datas, medidas e contas faladas, com áudio. As perguntas mudam a cada sessão.</p>
        <div className="card settings-group">
          <h2>O que treinar</h2>
          <div className="chips">
            {CATEGORIES.map((c) => (
              <button key={c.id} className="chip" aria-pressed={selected.includes(c.id)} onClick={() => toggle(c.id)}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
          <h2>Nível</h2>
          <div className="segmented" role="group" aria-label="Nível">
            {LEVELS.map((l) => (
              <button key={l.id} aria-pressed={level === l.id} onClick={() => setLevel(l.id)}>{l.label}</button>
            ))}
          </div>
          <p className="muted">Fácil: números até 100 e horas cheias. Médio: até 1.000 e de 5 em 5 minutos. Difícil: até 1 milhão e qualquer minuto.</p>
          <button className="button primary" onClick={start}>Começar ({SESSION_SIZE} perguntas)</button>
        </div>
      </section>
    )
  }

  if (index >= session.length) {
    return (
      <section className="screen">
        <h1>🔢 Números e horas</h1>
        <div className="card">
          <h2>Fim da sessão!</h2>
          <p><strong>{score}</strong> de {session.length} certas.</p>
          <button className="button primary" onClick={start}>Treinar de novo</button>
          <div className="row">
            <button className="button" onClick={() => setSession(null)}>Mudar o treino</button>
            <Link className="button" to="/">Início</Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="screen">
      <p className="muted">Pergunta {index + 1} de {session.length} · {score} certas</p>
      <Question
        key={index}
        exercise={session[index]}
        accent={accent}
        soundEffects={soundEffects}
        onNext={(ok) => {
          if (ok) setScore((s) => s + 1)
          setIndex((i) => i + 1)
        }}
      />
    </section>
  )
}

function Question({ exercise, accent, soundEffects, onNext }: {
  exercise: Exercise
  accent: Accent
  soundEffects: boolean
  onNext: (correct: boolean) => void
}) {
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const answered = result !== null

  // Listening questions are read aloud as soon as they appear.
  useEffect(() => {
    if (exercise.speech && canSpeak()) speak(exercise.speech, accent)
  }, [exercise, accent])

  function submit(answer: string) {
    setTyped(answer)
    const ok = exercise.mode === 'choice'
      ? answer === exercise.answer
      : (exercise.check?.(answer) ?? checkAnswer(answer, exercise.answer) !== 'wrong')
    setResult(ok)
    if (soundEffects) {
      if (ok) playCorrect()
      else playWrong()
    }
    if (canSpeak()) window.setTimeout(() => speak(exercise.words, accent), soundEffects ? 450 : 0)
  }

  return (
    <div className="card study">
      <p className="definition">{exercise.instruction}</p>
      {exercise.shown && <p className="big-prompt">{exercise.shown}</p>}
      {exercise.speech && canSpeak() && (
        <div className="audio-row">
          <button onClick={() => speak(exercise.speech!, accent)}>🔊 Ouvir</button>
          <button onClick={() => speak(exercise.speech!, accent, true)}>🐢 Devagar</button>
        </div>
      )}

      {!answered && (exercise.mode === 'choice' ? (
        <div className="choices">
          {exercise.options!.map((o) => (
            <button key={o} className="choice" onClick={() => submit(o)}>{o}</button>
          ))}
        </div>
      ) : (
        <form className="typing" onSubmit={(e) => { e.preventDefault(); submit(typed) }}>
          <input
            autoFocus
            // Times need ":" and prices "." or ",", which some phone number pads don't have.
            inputMode={exercise.category === 'times' ? 'text' : exercise.category === 'prices' ? 'decimal' : 'numeric'}
            autoComplete="off"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder={exercise.category === 'times' ? 'ex.: 7:45 (ou 745)' : 'Sua resposta'}
            aria-label="Sua resposta"
          />
          <button className="primary" type="submit">Responder</button>
        </form>
      ))}

      {answered && (
        <div className="reveal">
          <p className={`verdict ${result ? 'ok' : 'wrong'}`}>
            {result ? '✔ Correto!' : `✘ ${typed.trim() ? `Você respondeu "${typed}". ` : ''}A resposta era "${exercise.answer}"`}
          </p>
          <p className="sentence">{exercise.words}</p>
          {canSpeak() && (
            <div className="audio-row">
              <button onClick={() => speak(exercise.words, accent)}>🔊 Ouvir a resposta</button>
              <button onClick={() => speak(exercise.words, accent, true)}>🐢 Devagar</button>
            </div>
          )}
          {exercise.tip && <p className="muted">💡 {exercise.tip}</p>}
          <button className="button primary" onClick={() => onNext(result)}>Continuar</button>
        </div>
      )}
    </div>
  )
}
