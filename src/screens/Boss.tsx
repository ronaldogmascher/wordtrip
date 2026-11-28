import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { playCorrect, playWrong } from '../audio/effects.ts'
import Flag from '../components/Flag.tsx'
import Postcard from '../components/Postcard.tsx'
import { phases } from '../content/index.ts'
import { routeCities } from '../game/route.ts'
import { db, getSettings, type StudyCard } from '../db/db.ts'
import type { City } from '../content/types.ts'
import { bossPool, hasPassed, isBorder, makeBossQuestions, MOTORHOME_UPGRADES, nextTryAt, passMark, questionCount, type BossQuestion } from '../game/boss.ts'
import { routeProgress } from '../game/progress.ts'
import { checkAnswer, type AnswerCheck } from '../study/answer.ts'
import { timeUntil } from '../study/when.ts'
import { useDevMode } from '../dev.ts'

// City boss: written questions with no translation and no hint. Win with 80% to unlock the next
// city and earn its postcard; the border boss (last city of the leg) also upgrades the motorhome.

export interface Answer { question: BossQuestion; typed: string; check: AnswerCheck }

export default function Boss() {
  const { phaseId } = useParams()
  const profile = useLiveQuery(() => db.profile.get('me'))
  const cities = routeCities(profile?.homeCity)
  const city = cities.find((c) => c.phaseId === phaseId)
  const [questions, setQuestions] = useState<BossQuestion[] | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [result, setResult] = useState<{ passed: boolean; correct: number } | null>(null)
  const dev = useDevMode()

  const data = useLiveQuery(async () => {
    const [cards, attempts, reward] = await Promise.all([db.cards.toArray(), db.bossAttempts.toArray(), phaseId ? db.rewards.get(phaseId) : undefined])
    return { cards, attempts, reward, progress: routeProgress(cities, phases, cards, attempts), now: new Date() }
  }, [phaseId])

  if (!city) return <section className="screen"><p>Cidade não encontrada.</p><Link to="/mapa">Voltar ao mapa</Link></section>
  if (!data) return <section className="screen"><p className="muted">Carregando…</p></section>

  const border = isBorder(city, cities)
  const title = border ? `Chefão da fronteira · ${city.name}` : `Chefão de ${city.name}`

  if (result) {
    const retryAt = nextTryAt(city.phaseId, data.attempts, data.now)
    const retryNow = !result.passed && retryAt !== null && retryAt <= data.now
    const tryAgain = () => { setQuestions(null); setAnswers([]); setResult(null) }
    return <BossResult cities={cities} cityIndex={cities.indexOf(city)} border={border} answers={answers} passed={result.passed} correct={result.correct} reward={data.reward?.text} retryNow={retryNow} onRetry={tryAgain} />
  }

  if (questions) {
    const finish = async (all: Answer[]) => {
      const correct = all.filter((a) => a.check !== 'wrong').length
      const passed = hasPassed(correct, all.length)
      const now = new Date()
      await db.transaction('rw', db.bossAttempts, db.rewards, db.cards, async () => {
        await db.bossAttempts.add({ phaseId: city.phaseId, at: now, correct, total: all.length, passed })
        if (passed) await db.rewards.update(city.phaseId, { claimedAt: now })
        // Reinforcement: the words the boss caught come back for review right away.
        const missed = all.filter((a) => a.check === 'wrong').map((a) => a.question.sense.id)
        for (const card of await db.cards.where('senseId').anyOf(missed).toArray()) {
          await db.cards.update(card.id, { 'fsrs.due': now })
        }
      })
      setResult({ passed, correct })
    }
    if (answers.length >= questions.length) return <section className="screen"><p className="muted">Contando os acertos…</p></section>
    return (
      <BossQuestionCard
        key={answers.length}
        title={title}
        question={questions[answers.length]}
        number={answers.length + 1}
        total={questions.length}
        rightSoFar={answers.filter((a) => a.check !== 'wrong').length}
        dev={dev}
        onAnswer={(a) => {
          const all = [...answers, a]
          setAnswers(all)
          if (all.length === questions.length) void finish(all)
        }}
      />
    )
  }

  const progress = data.progress.find((p) => p.city.phaseId === city.phaseId)
  const { now } = data
  const tryAt = nextTryAt(city.phaseId, data.attempts, now)
  // Developer mode asks every word of the city (or leg), studied or not.
  const pool = bossPool(city, cities, phases, dev ? allRouteCards(city, cities) : data.cards)
  const count = Math.min(questionCount(city, cities), pool.length)

  return (
    <section className="screen">
      <p className="eyebrow">Fase {city.number} · {city.name}</p>
      <h1>⚔️ {title}</h1>
      <div className="card boss-intro">
        <p>{border
          ? `O último desafio do Brasil antes de cruzar a fronteira: ${count} perguntas com palavras de todas as cidades do trecho.`
          : `${count} perguntas escritas com as palavras de ${city.name}.`}</p>
        <ul>
          <li>Sem tradução e sem dica: só a definição em inglês e a frase.</li>
          <li>Acerte {passMark(count)} de {count} (80%) para vencer.</li>
          <li>Se perder, as palavras que errar voltam para revisão e você pode tentar de novo na hora. Depois de 2 derrotas seguidas, o chefão espera 24 horas pela revanche.</li>
          {border && <li>Vencendo, o motorhome ganha um upgrade: {MOTORHOME_UPGRADES[0].icon} {MOTORHOME_UPGRADES[0].name}.</li>}
        </ul>
        {data.reward && !data.reward.claimedAt && <p>🎁 Sua recompensa ao vencer: <strong>{data.reward.text}</strong></p>}
        {dev ? (
          <button className="primary" onClick={() => setQuestions(makeBossQuestions(pool, count))}>🛠️ Enfrentar (modo desenvolvedor)</button>
        ) : tryAt === null ? (
          <p>🏁 Você já venceu este chefão.</p>
        ) : !progress?.bossReady ? (
          <p className="muted">O chefão aparece quando 80% das palavras da cidade estiverem amarelas ou verdes. Agora: {Math.round((progress?.share ?? 0) * 100)}%.</p>
        ) : tryAt > now ? (
          <p className="muted">⏳ Revanche liberada {timeUntil(tryAt, now)}. Enquanto isso, revise as palavras que escaparam.</p>
        ) : (
          <button className="primary" onClick={() => setQuestions(makeBossQuestions(pool, count))}>Enfrentar o chefão</button>
        )}
        <Link className="button" to="/mapa">Voltar ao mapa</Link>
      </div>
    </section>
  )
}

/** Stand-in cards so the boss pool includes every word of the city (or the whole leg). */
function allRouteCards(city: City, cities: City[]) {
  const ids = isBorder(city, cities) ? cities.map((c) => c.phaseId) : [city.phaseId]
  return phases.filter((p) => ids.includes(p.id)).flatMap((p) => p.senses).map((s) => ({ senseId: s.id }) as StudyCard)
}

export function BossQuestionCard({ title, question, number, total, rightSoFar, dev, onAnswer }: {
  title: string; question: BossQuestion; number: number; total: number; rightSoFar: number; dev: boolean; onAnswer: (a: Answer) => void
}) {
  const [typed, setTyped] = useState('')
  const [check, setCheck] = useState<AnswerCheck | null>(null)
  const [before, after] = question.sentence.split('____')

  const submit = async () => {
    const result = checkAnswer(typed, question.answer)
    setCheck(result)
    if ((await getSettings()).soundEffects) (result === 'wrong' ? playWrong : playCorrect)()
  }

  return (
    <section className="screen">
      <p className="eyebrow">⚔️ {title}</p>
      <p className="muted">Pergunta {number} de {total} · {rightSoFar} acertos</p>
      <div className="card study">
        <p className="definition">{question.sense.definition}</p>
        <p className="sentence">
          {before}
          <span className={`gap ${check ? (check === 'wrong' ? 'gap-wrong' : 'gap-ok') : ''}`}>{check ? question.answer : '____'}</span>
          {after}
        </p>
        {dev && check === null && <p className="dev-note">🛠️ Resposta: {question.answer}</p>}
        {check === null ? (
          <form className="typing" onSubmit={(e) => { e.preventDefault(); void submit() }}>
            <input autoFocus autoCapitalize="off" autoCorrect="off" spellCheck={false} value={typed}
              onChange={(e) => setTyped(e.target.value)} placeholder="Digite a palavra" aria-label="Sua resposta" />
            <button className="primary" type="submit">Responder</button>
          </form>
        ) : (
          <div className="reveal">
            <p className={`verdict ${check === 'wrong' ? 'wrong' : 'ok'}`}>
              {check === 'correct' && '✔ Correto!'}
              {check === 'typo' && `✔ Quase! Você escreveu "${typed}"`}
              {check === 'wrong' && (typed.trim() ? `✘ Você respondeu "${typed}". A resposta era "${question.answer}"` : `✘ A resposta era "${question.answer}"`)}
            </p>
            {question.sense.translationPt && <p><Flag country="BR" /> <strong>{question.sense.translationPt}</strong></p>}
            {question.sense.definitionPt && <p className="translation"><Flag country="BR" /> {question.sense.definitionPt}</p>}
            {question.pt && <p className="muted">{question.sentence.replace('____', question.answer)} · {question.pt}</p>}
            <button className="primary" onClick={() => onAnswer({ question, typed, check })}>{number === total ? 'Ver resultado' : 'Continuar'}</button>
          </div>
        )}
      </div>
    </section>
  )
}

function BossResult({ cities, cityIndex, border, answers, passed, correct, reward, retryNow, onRetry }: {
  retryNow: boolean; onRetry: () => void
  cities: City[]; cityIndex: number; border: boolean; answers: Answer[]; passed: boolean; correct: number; reward?: string
}) {
  const city = cities[cityIndex]
  const next = cities[cityIndex + 1]
  const nextPhase = next && phases.find((p) => p.id === next.phaseId)
  const missed = answers.filter((a) => a.check === 'wrong')
  return (
    <section className="screen">
      <h1>{passed ? '🏆 Chefão vencido!' : '💥 Não foi dessa vez'}</h1>
      <div className="card">
        <p><strong>{correct}</strong> de {answers.length} acertos (precisava de {passMark(answers.length)}).</p>
        {passed ? (
          <>
            <Postcard icon={city.icon} name={city.name} landmark={city.landmark} />
            {reward && <p>🎁 Recompensa liberada: <strong>{reward}</strong>. Aproveite, você merece!</p>}
            {border && <p>{MOTORHOME_UPGRADES[0].icon} Upgrade no motorhome: <strong>{MOTORHOME_UPGRADES[0].name}</strong>. {MOTORHOME_UPGRADES[0].text}</p>}
            {next && nextPhase ? (
              <p>🚐 Próxima parada: <strong>{next.icon} {next.name}</strong>. {nextPhase.arrival}</p>
            ) : (
              <p>🌎 Fronteira cruzada! O próximo trecho, pela América Latina, chega numa próxima versão.</p>
            )}
          </>
        ) : (
          <>
            <p>{retryNow ? 'Você ainda tem mais uma tentativa agora, com perguntas novas.' : 'Foram 2 derrotas seguidas: o chefão espera 24 horas pela revanche.'} As palavras que escaparam já voltaram para a sua revisão:</p>
            <ul className="missed">
              {missed.map((a) => <li key={a.question.sense.id}><strong>{a.question.answer}</strong> <span className="muted">· {a.question.sense.translationPt}</span></li>)}
            </ul>
          </>
        )}
        {retryNow && <button className="button primary" onClick={onRetry}>⚔️ Tentar de novo</button>}
        <Link className={`button ${retryNow ? '' : 'primary'}`} to="/mapa">Voltar ao mapa</Link>
      </div>
    </section>
  )
}
