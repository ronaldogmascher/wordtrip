import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Sense } from '../content/types.ts'
import { playCorrect, playWrong } from '../audio/effects.ts'
import { db, getSettings, type Accent, type StudyCard } from '../db/db.ts'
import { checkAnswer, hintFor, type AnswerCheck } from '../study/answer.ts'
import { useActiveTime } from '../study/activeTime.ts'
import { applyKnownShortcut, applyReview, lightOf } from '../study/scheduler.ts'
import { timeUntil } from '../study/when.ts'
import { BANDS, finalScore, toRating, xpFor } from '../study/scoring.ts'
import { buildQueue, distractors, saveAnswer, type QueueItem, type SessionKind } from '../study/session.ts'
import { canSpeak, speak } from '../study/speech.ts'
import Flag from '../components/Flag.tsx'
import LightBadge from '../components/LightBadge.tsx'
import VerbFormsTable from '../components/VerbFormsTable.tsx'
import TappableText from '../components/TappableText.tsx'
import WordPopup from '../components/WordPopup.tsx'

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
  const detourId = params.get('desvio') ? Number(params.get('desvio')) : undefined
  const phaseId = params.get('cidade') ?? undefined
  const [queue, setQueue] = useState<QueueItem[] | null>(null)
  const [index, setIndex] = useState(0)
  const [xp, setXp] = useState(0)
  const [accent, setAccent] = useState<Accent>('US')
  const [soundEffects, setSoundEffects] = useState(true)

  useEffect(() => {
    void buildQueue(kind, new Date(), detourId, phaseId).then(setQueue)
    void getSettings().then((s) => {
      setAccent(s.accent)
      setSoundEffects(s.soundEffects)
    })
  }, [kind, detourId, phaseId])

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
          <p><strong>+{xp} km</strong> rodados nesta sessão 🚐</p>
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
        soundEffects={soundEffects}
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

function CardView({ item, accent, soundEffects, onDone }: {
  item: QueueItem
  accent: Accent
  soundEffects: boolean
  onDone: (xp: number, updated: StudyCard) => void
}) {
  const { sense, card, isNew } = item
  const example = sense.examples[0]
  // The memory hook written in the Oficina, shown after answering.
  const mnemonic = useLiveQuery(() => db.mnemonics.get(sense.id), [sense.id])
  const [mode, setMode] = useState(card.mode)
  const [knownAttempt, setKnownAttempt] = useState(false)
  const [usedTranslation, setUsedTranslation] = useState(false)
  const [usedHint, setUsedHint] = useState(false)
  const [typed, setTyped] = useState('')
  const [check, setCheck] = useState<AnswerCheck | null>(null)
  const [selfScore, setSelfScore] = useState(8)
  const [startedAt] = useState(() => Date.now())
  const [answeredAt, setAnsweredAt] = useState<Date | null>(null)
  const [lookup, setLookup] = useState<string | null>(null)

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

  // The card as it will be saved, recomputed while the slider moves, so the learner sees
  // the new traffic-light color and when the word comes back before pressing "Continuar".
  const updated = useMemo(() => {
    if (!answeredAt) return null
    return shortcutConfirmed
      ? applyKnownShortcut(card, answeredAt)
      : applyReview({ ...card, mode }, toRating(score), score, correct, answeredAt)
  }, [answeredAt, shortcutConfirmed, card, mode, score, correct])

  function submit(answer: string) {
    setTyped(answer)
    const result = checkAnswer(answer, example.answer)
    setCheck(result)
    setAnsweredAt(new Date())
    // A wrong answer is capped at 3 anyway, so start the slider in the "Errei" band.
    if (result === 'wrong') setSelfScore(2)
    if (soundEffects) {
      if (result === 'wrong') playWrong()
      else playCorrect()
    }
    // Let the effect finish before the word is read aloud.
    if (canSpeak()) window.setTimeout(() => speak(example.answer, accent), soundEffects ? 450 : 0)
  }

  async function next() {
    if (!updated || !answeredAt) return
    const now = answeredAt
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
      {lookup && <WordPopup word={lookup} onClose={() => setLookup(null)} />}
      <div className="study-meta">
        <span className="badge">{POS_PT[sense.pos]}</span>
        {example.tense && <span className="badge badge-tense">{example.tense}</span>}
        {isNew && <span className="badge badge-new">nova</span>}
        {card.source === 'explorer' && <span className="badge">📓 Diário</span>}
        <span className="study-meta-light"><LightBadge light={lightOf(card.fsrs)} /></span>
      </div>

      <p className="definition"><TappableText text={sense.definition} onWord={setLookup} /></p>
      {usedTranslation && <p className="translation"><Flag country="BR" /> {sense.definitionPt}</p>}

      <p className="sentence">
        <TappableText text={before} onWord={setLookup} />
        <span className={`gap ${answered ? (correct ? 'gap-ok' : 'gap-wrong') : ''}`}>
          {answered ? example.answer : usedHint ? hintFor(example.answer) : '____'}
        </span>
        <TappableText text={after ?? ''} onWord={setLookup} />
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
            {sense.definitionPt && <button onClick={() => setUsedTranslation(true)} disabled={usedTranslation}>Traduzir</button>}
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
          {mnemonic && <p className="mnemonic">⚓ Sua âncora: {mnemonic.text}</p>}
          <div className="word-line">
            <strong className="lemma tappable" role="button" tabIndex={0} onClick={() => setLookup(sense.lemma)} onKeyDown={(e) => e.key === 'Enter' && setLookup(sense.lemma)} title="Ver no dicionário">{sense.lemma} <span className="lookup-icon" aria-hidden="true">📖</span></strong>
          </div>
          {sense.ipaUS && <div className="ipa-list">
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
          </div>}
          {canSpeak() && !sense.ipaUS && (
            <div className="audio-row">
              <button onClick={() => speak(sense.lemma, accent)}>🔊 Ouvir a palavra</button>
            </div>
          )}
          <p><Flag country="BR" /> {sense.translationPt ? <strong>{sense.translationPt}</strong> : <span className="muted">sem tradução ainda (dá para adicionar no Diário)</span>}{example.pt && <span className="muted"> · {example.pt}</span>}</p>
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
          {updated && answeredAt && (
            <p className="light-change">
              <LightBadge light={lightOf(card.fsrs)} />
              {lightOf(card.fsrs) !== lightOf(updated.fsrs) && <><span aria-hidden="true">→</span><LightBadge light={lightOf(updated.fsrs)} /></>}
              <span className="muted">volta {timeUntil(updated.fsrs.due, answeredAt)}</span>
            </p>
          )}
          <button className="primary" onClick={next}>Continuar</button>
        </div>
      )}
    </div>
  )
}
