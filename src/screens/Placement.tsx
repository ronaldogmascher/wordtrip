import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { phases } from '../content/index.ts'
import { citiesA1 as cities } from '../content/en/journey.ts'
import { db } from '../db/db.ts'
import { makeBossQuestions, passMark, hasPassed, type BossQuestion } from '../game/boss.ts'
import { PLACEMENT_ID, PLACEMENT_QUESTIONS, PLACEMENT_TRIES, placementState, skippedCards } from '../game/placement.ts'
import { BossQuestionCard, type Answer } from './Boss.tsx'

// Prova de nivelamento: 50 questions drawn from the whole A1 leg, two tries in total.
// Passing finishes every A1 city; failing starts the trip from the first city as usual.

export default function Placement() {
  const data = useLiveQuery(async () => ({ attempts: await db.bossAttempts.toArray() }))
  const [questions, setQuestions] = useState<BossQuestion[] | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [result, setResult] = useState<{ passed: boolean; correct: number } | null>(null)
  if (!data) return <section className="screen"><p className="muted">Carregando…</p></section>

  const state = placementState(data.attempts)
  const tries = data.attempts.filter((a) => a.phaseId === PLACEMENT_ID).length

  if (result) {
    return (
      <section className="screen">
        <h1>{result.passed ? '🏆 Aprovado no nivelamento!' : '📘 Resultado do nivelamento'}</h1>
        <div className="card">
          <p><strong>{result.correct}</strong> de {answers.length} acertos (precisava de {passMark(answers.length)}).</p>
          {result.passed ? (
            <p>Você já domina o básico: todas as cidades do Brasil (A1) foram concluídas e as palavras delas entram como revisões leves, espalhadas pelas próximas semanas. O trecho A2, pela América do Sul, chega numa próxima versão.</p>
          ) : state === 'open' ? (
            <p>Não foi dessa vez, mas você ainda tem mais uma tentativa, com perguntas novas. Se preferir, comece a viagem pela primeira cidade.</p>
          ) : (
            <p>Sem problema! Você começa pela primeira cidade e, no seu ritmo, vai rapidinho pelas palavras que já conhece.</p>
          )}
          {!result.passed && state === 'open' && (
            <button className="button primary" onClick={() => { setQuestions(null); setAnswers([]); setResult(null) }}>Tentar de novo</button>
          )}
          <Link className="button" to="/mapa">Ver o mapa</Link>
        </div>
      </section>
    )
  }

  if (questions) {
    if (answers.length >= questions.length) return <section className="screen"><p className="muted">Contando os acertos…</p></section>
    const finish = async (all: Answer[]) => {
      const correct = all.filter((a) => a.check !== 'wrong').length
      const passed = hasPassed(correct, all.length)
      const now = new Date()
      await db.transaction('rw', db.bossAttempts, db.cards, async () => {
        await db.bossAttempts.add({ phaseId: PLACEMENT_ID, at: now, correct, total: all.length, passed })
        if (passed) {
          // Every A1 city counts as done, and its unseen words become known cards.
          await db.bossAttempts.bulkAdd(cities.map((c) => ({ phaseId: c.phaseId, at: now, correct, total: all.length, passed: true })))
          await db.cards.bulkPut(skippedCards(cities, phases, await db.cards.toArray(), now))
        }
      })
      setResult({ passed, correct })
    }
    return (
      <BossQuestionCard
        key={answers.length}
        title="Prova de nivelamento · A1"
        question={questions[answers.length]}
        number={answers.length + 1}
        total={questions.length}
        rightSoFar={answers.filter((a) => a.check !== 'wrong').length}
        dev={false}
        onAnswer={(a) => {
          const all = [...answers, a]
          setAnswers(all)
          if (all.length === questions.length) void finish(all)
        }}
      />
    )
  }

  const pool = phases.filter((p) => cities.some((c) => c.phaseId === p.id)).flatMap((p) => p.senses)
  return (
    <section className="screen">
      <p className="eyebrow">📝 Prova de nivelamento</p>
      <h1>Já sabe o básico? Pule o Brasil!</h1>
      <div className="card boss-intro">
        <p>{PLACEMENT_QUESTIONS} perguntas escritas, sorteadas entre as 600 palavras do trecho A1 (Brasil). Sem tradução e sem dica.</p>
        <ul>
          <li>Acerte {passMark(PLACEMENT_QUESTIONS)} de {PLACEMENT_QUESTIONS} (80%): as 12 cidades do Brasil ficam concluídas.</li>
          <li>Você tem {PLACEMENT_TRIES} tentativas no total. Se não passar, a viagem começa pela primeira cidade, normalmente.</li>
        </ul>
        {state === 'passed' && <p>✅ Você já passou no nivelamento.</p>}
        {state === 'used-up' && <p className="muted">As {PLACEMENT_TRIES} tentativas já foram usadas. Siga pelo mapa, cidade por cidade.</p>}
        {state === 'open' && (
          <button className="button primary" onClick={() => setQuestions(makeBossQuestions(pool, PLACEMENT_QUESTIONS))}>
            {tries === 0 ? 'Começar a prova' : 'Fazer a segunda tentativa'}
          </button>
        )}
        <Link className="button" to="/">Agora não</Link>
      </div>
    </section>
  )
}
