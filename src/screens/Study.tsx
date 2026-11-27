import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Sense } from '../content/types.ts'
import { getSettings, type Accent, type StudyCard } from '../db/db.ts'
import { checkAnswer, hintFor, type AnswerCheck } from '../study/answer.ts'
import { useActiveTime } from '../study/activeTime.ts'
import { applyKnownShortcut, applyReview } from '../study/scheduler.ts'
import { BANDS, finalScore, toRating, xpFor } from '../study/scoring.ts'
import { buildQueue, distractors, saveAnswer, type QueueItem, type SessionKind } from '../study/session.ts'
import { canSpeak, speak } from '../study/speech.ts'
import Flag from '../components/Flag.tsx'
import VerbFormsTable from '../components/VerbFormsTable.tsx'

/** A card scheduled again within this window is repeated at the end of the session. */
const AGAIN_IN_SESSION_MS = 15 * 60 * 1000

const POS_PT: Record<Sense['pos'], string> = {
  noun: 'substantivo',
  verb: 'verbo',
  adjective: 'adjetivo',
  adverb: 'advérbio',
  pronoun: 'pronome',
  preposition: 'preposição',
  conjunction: 'conjunção',
  interjection: 'interjeição',
  expression: 'expressão',
}

export default function Study() {
  const [params] = useSearchParams()
  const kind = (params.get('tipo') as SessionKind) ?? 'mixed'
  const [queue, setQueue] = useState<QueueItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [xp, setXp] = useState(0)
  const [accent, setAccent] = useState<Accent>('US')

  useEffect(() => {
    void buildQueue(kind, new Date()).then(setQueue)
    void getSettings().then((s) => setAccent(s.accent))
  }, [kind])

  const done = queue !== null && index >= queue.length
  useActiveTime(queue !== null && !done)

  if (queue === null) return <section className="screen"><p className="muted">Preparando a sessão…</p></section>

  if (queue.length === 0)
    return (
      <section className="screen">
        <h1>Tudo em dia! 🎉</h1>
        <div className="card">
          <p>Não há revisões nem palavras novas para agora. Volte mais tarde.</p>
          <Link className="button primary" to="/">Voltar ao início</Link>
        </div>
      </section>
    )

  if (done)
    return (
      <section className="screen">
        <h1>Sessão concluída! 🚐</h1>
        <div className="card">
          <p><strong>{queue.length}</strong> cards estudados</p>
          <p><strong>+{xp} XP</strong> nesta sessão</p>
          <Link className="button primary" to="/">Voltar ao início</Link>
        </div>
      </section>
    )

  const item = queue[index]
  return (
    <section className="screen">
      <div className="progress" aria-label={`Card ${index + 1} de ${queue.length}`}>
        <div style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>
      <CardView
        key={item.card.id + index}
        item={item}
        accent={accent}
        onDone={(gained, updated) => {
          setXp((x) => x + gained)
          // Cards due again within a few minutes (learning steps) come back later in this session.
          if (updated.fsrs.due.getTime() - Date.now() < AGAIN_IN_SESSION_MS) {
            setQueue((q) => [...(q ?? []), { card: updated, sense: item.sense, isNew: false }])
          }
          setIndex((i) => i + 1)
        }}
      />
    </section>
  )
}

function CardView({ item, accent, onDone }: { item: QueueItem; accent: Accent; onDone: (xp: number, updated: StudyCard) => void }) {
  const { sense, card, isNew } = item
  const example = sense.examples[0]
  const [mode, setMode] = useState(card.mode)
  const [knownAttempt, setKnownAttempt] = useState(false)
  const [usedTranslation, setUsedTranslation] = useState(false)
  const [usedHint, setUsedHint] = useState(false)
  const [typed, setTyped] = useState('')
  const [check, setCheck] = useState<AnswerCheck | null>(null)
  const [selfScore, setSelfScore] = useState(8)
  const [startedAt] = useState(() => Date.now())

  // Shuffled once per card (the component is re-mounted for every card).
  const [options] = useState(() => {
    const capital = example.answer[0] !== example.answer[0].toLowerCase()
    const wrong = distractors(sense).map((w) => (capital ? w[0].toUpperCase() + w.slice(1) : w))
    return [...wrong, example.answer].sort(() => Math.random() - 0.5)
  })

  const answered = check !== null
  const correct = check === 'correct' || check === 'typo'
  const shortcutConfirmed = knownAttempt && check === 'correct' && !usedTranslation && !usedHint
  const score = finalScore({ selfScore, correct, typo: check === 'typo', usedTranslation, usedHint })
  const band = BANDS.find((b) => score >= b.min && score <= b.max)!

  function submit(answer: string) {
    setTyped(answer)
    const result = checkAnswer(answer, example.answer)
    setCheck(result)
    // A wrong answer is capped at 3 anyway, so start the slider in the "Errei" band.
    if (result === 'wrong') setSelfScore(2)
    if (canSpeak()) speak(example.answer, accent)
  }

  async function next() {
    const now = new Date()
    const updated = shortcutConfirmed
      ? applyKnownShortcut(card, now)
      : applyReview({ ...card, mode }, toRating(score), score, correct, now)
    const finalValue = shortcutConfirmed ? 10 : score
    const gained = xpFor(finalValue)
    await saveAnswer(
      updated,
      {
        cardId: card.id,
        senseId: sense.id,
        at: now,
        mode,
        selfScore: shortcutConfirmed ? 10 : selfScore,
        finalScore: finalValue,
        correct,
        typo: check === 'typo',
        usedTranslation,
        usedHint,
        knownShortcut: shortcutConfirmed,
        durationMs: Date.now() - startedAt,
      },
      isNew,
      gained,
    )
    onDone(gained, updated)
  }

  const [before, after] = example.text.split('____')
  const fullSentence = example.text.replace('____', example.answer)

  return (
    <div className="card study">
      <div className="study-meta">
        <span className="badge">{POS_PT[sense.pos]}</span>
        {example.tense && <span className="badge badge-tense">{example.tense}</span>}
        {isNew && <span className="badge badge-new">nova</span>}
      </div>

      <p className="definition">{sense.definition}</p>
      {usedTranslation && <p className="translation"><Flag country="BR" /> {sense.definitionPt}</p>}

      <p className="sentence">
        {before}
        <span className={`gap ${answered ? (correct ? 'gap-ok' : 'gap-wrong') : ''}`}>
          {answered ? example.answer : usedHint ? hintFor(example.answer) : '____'}
        </span>
        {after}
      </p>
      {answered && canSpeak() && (
        <div className="audio-row">
          <button onClick={() => speak(fullSentence, accent)} aria-label="Ouvir a frase">🔊 Ouvir a frase</button>
          <button onClick={() => speak(fullSentence, accent, true)} aria-label="Ouvir a frase devagar">🐢 Devagar</button>
        </div>
      )}

      {!answered && (
        <>
          <div className="tools">
            <button onClick={() => setUsedTranslation(true)} disabled={usedTranslation}>Traduzir</button>
            <button onClick={() => setUsedHint(true)} disabled={usedHint}>Dica</button>
            {isNew && mode === 'choice' && !knownAttempt && (
              <button onClick={() => { setKnownAttempt(true); setMode('typing') }}>Já sei</button>
            )}
          </div>
          {knownAttempt && <p className="muted">Digite a palavra sem ajuda. Se acertar, ela vai direto para uma revisão bem mais distante.</p>}

          {mode === 'choice' ? (
            <div className="choices">
              {options.map((o) => (
                <button key={o} className="choice" onClick={() => submit(o)}>{o}</button>
              ))}
            </div>
          ) : (
            <form className="typing" onSubmit={(e) => { e.preventDefault(); submit(typed) }}>
              <input
                autoFocus
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Digite a palavra"
                aria-label="Sua resposta"
              />
              <button className="primary" type="submit">Responder</button>
            </form>
          )}
        </>
      )}

      {answered && (
        <div className="reveal">
          <p className={`verdict ${correct ? 'ok' : 'wrong'}`}>
            {check === 'correct' && '✔ Correto!'}
            {check === 'typo' && `✔ Quase! Você escreveu "${typed}"`}
            {check === 'wrong' && (typed.trim() ? `✘ Você respondeu "${typed}". A resposta era "${example.answer}"` : `✘ A resposta era "${example.answer}"`)}
          </p>
          <div className="word-line">
            <strong className="lemma">{sense.lemma}</strong>
          </div>
          <div className="ipa-list">
            {(accent === 'US' ? (['US', 'UK'] as const) : (['UK', 'US'] as const)).map((a) => (
              <div key={a} className={`ipa-row ${a === accent ? '' : 'muted'}`}>
                <Flag country={a} />
                <span className="ipa">/{a === 'US' ? sense.ipaUS : sense.ipaUK}/</span>
                {canSpeak() && (
                  <>
                    <button className="icon" onClick={() => speak(sense.lemma, a)} aria-label={`Ouvir a pronúncia ${a}`}>🔊</button>
                    <button className="icon" onClick={() => speak(sense.lemma, a, true)} aria-label={`Ouvir a pronúncia ${a} devagar`}>🐢</button>
                  </>
                )}
              </div>
            ))}
          </div>
          <p><Flag country="BR" /> <strong>{sense.translationPt}</strong>{example.pt && <span className="muted"> · {example.pt}</span>}</p>
          {sense.forms && <VerbFormsTable lemma={sense.lemma} forms={sense.forms} />}
          {(sense.synonyms.length > 0 || sense.antonym) && (
            <p className="muted">
              {sense.synonyms.length > 0 && <>Sinônimos: <em>{sense.synonyms.join(', ')}</em></>}
              {sense.antonym && <> · Antônimo: <em>{sense.antonym}</em></>}
            </p>
          )}

          {shortcutConfirmed ? (
            <p className="muted">Confirmado! Essa palavra já está na sua bagagem e só volta daqui a alguns dias.</p>
          ) : (
            <div className="rating">
              <label htmlFor="self-score">Quão fácil foi? <strong>{selfScore}</strong></label>
              <input
                id="self-score"
                type="range"
                min={0}
                max={10}
                step={1}
                value={selfScore}
                onChange={(e) => setSelfScore(Number(e.target.value))}
                className="slider"
              />
              <div className="bands" aria-hidden="true">
                {BANDS.map((b) => <span key={b.label}>{b.label}</span>)}
              </div>
              <p className="muted">
                Nota final: <strong>{score}</strong> ({band.label})
              </p>
            </div>
          )}
          <button className="primary" onClick={next}>Continuar</button>
        </div>
      )}
    </div>
  )
}
