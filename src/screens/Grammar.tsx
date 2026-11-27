import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { playCorrect, playWrong } from '../audio/effects.ts'
import { getSettings, type Accent } from '../db/db.ts'
import { isRight, makeSession, TOPICS, type GrammarMode, type GrammarQuestion, type GrammarTopic } from '../grammar/exercises.ts'
import { canSpeak, speak } from '../study/speech.ts'

// "Treino de gramática": free practice of verb tenses with the verbs of the route.

const SESSION_SIZE = 10

export default function Grammar() {
  const [accent, setAccent] = useState<Accent>('US')
  const [soundEffects, setSoundEffects] = useState(true)
  const [selected, setSelected] = useState<GrammarTopic[]>(['present-simple', 'past-simple'])
  const [mode, setMode] = useState<GrammarMode>('choice')
  const [session, setSession] = useState<GrammarQuestion[] | null>(null)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)

  useEffect(() => {
    void getSettings().then((s) => {
      setAccent(s.accent)
      setSoundEffects(s.soundEffects)
    })
  }, [])

  const toggle = (t: GrammarTopic) =>
    setSelected((cur) => (cur.includes(t) ? (cur.length > 1 ? cur.filter((x) => x !== t) : cur) : [...cur, t]))

  function start() {
    setSession(makeSession(selected, SESSION_SIZE))
    setIndex(0)
    setScore(0)
  }

  if (!session) {
    return (
      <section className="screen">
        <h1>📝 Treino de gramática</h1>
        <p className="muted">Pratique os tempos verbais com os verbos da sua rota. Cada frase tem uma pista de tempo (yesterday, right now, tomorrow…) para você escolher a forma certa.</p>
        <div className="card settings-group">
          <h2>O que treinar</h2>
          <div className="chips">
            {TOPICS.map((t) => (
              <button key={t.id} className="chip" aria-pressed={selected.includes(t.id)} onClick={() => toggle(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <ul className="grammar-rules">
            {TOPICS.filter((t) => selected.includes(t.id)).map((t) => (
              <li key={t.id}><strong>{t.label}:</strong> {t.rule}</li>
            ))}
          </ul>
          <h2>Como responder</h2>
          <div className="segmented" role="group" aria-label="Como responder">
            <button aria-pressed={mode === 'choice'} onClick={() => setMode('choice')}>Escolher</button>
            <button aria-pressed={mode === 'type'} onClick={() => setMode('type')}>Digitar</button>
          </div>
          <button className="button primary" onClick={start}>Começar ({SESSION_SIZE} frases)</button>
        </div>
        <Link className="button" to="/">Voltar</Link>
      </section>
    )
  }

  const question = session[index]
  if (!question) {
    return (
      <section className="screen">
        <h1>📝 Treino de gramática</h1>
        <div className="card">
          <h2>Fim do treino!</h2>
          <p><strong>{score}</strong> de {session.length} certas.</p>
          <button className="button primary" onClick={start}>Treinar de novo</button>
          <button className="button" onClick={() => setSession(null)}>Escolher outros tempos</button>
        </div>
      </section>
    )
  }

  return (
    <section className="screen">
      <p className="muted">Frase {index + 1} de {session.length} · {score} certas</p>
      <Question
        key={index}
        question={question}
        mode={mode}
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

function Question({ question, mode, accent, soundEffects, onNext }: {
  question: GrammarQuestion
  mode: GrammarMode
  accent: Accent
  soundEffects: boolean
  onNext: (correct: boolean) => void
}) {
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<boolean | null>(null)
  const topic = TOPICS.find((t) => t.id === question.topic)!

  function submit(answer: string) {
    setTyped(answer)
    const ok = isRight(question, answer, mode)
    setResult(ok)
    if (soundEffects) {
      if (ok) playCorrect()
      else playWrong()
    }
    if (canSpeak()) window.setTimeout(() => speak(question.full, accent), soundEffects ? 450 : 0)
  }

  return (
    <div className="card study">
      <p className="muted">{topic.icon} {topic.label}</p>
      <p className="sentence">{question.text}</p>
      <p className="muted">({question.verb} = {question.verbPt})</p>
      {result === null ? (mode === 'choice' ? (
        <div className="ipa-options">
          {question.options.map((o) => (
            <button key={o} className="choice" onClick={() => submit(o)}>{o}</button>
          ))}
        </div>
      ) : (
        <form className="typing" onSubmit={(e) => { e.preventDefault(); submit(typed) }}>
          <input
            autoFocus
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Verbo na forma certa"
            aria-label="Sua resposta"
          />
          <button className="primary" type="submit">Responder</button>
        </form>
      )) : (
        <div className="reveal">
          <p className={`verdict ${result ? 'ok' : 'wrong'}`}>
            {result ? '✔ Correto!' : `✘ ${typed.trim() ? `Você respondeu "${typed}". ` : ''}A resposta era "${question.answer}"`}
          </p>
          <p className="sentence">{question.full}</p>
          {canSpeak() && (
            <div className="audio-row">
              <button onClick={() => speak(question.full, accent)}>🔊 Ouvir</button>
              <button onClick={() => speak(question.full, accent, true)}>🐢 Devagar</button>
            </div>
          )}
          <p className="muted">💡 {topic.rule}</p>
          <button className="button primary" onClick={() => onNext(result)}>Continuar</button>
        </div>
      )}
    </div>
  )
}
