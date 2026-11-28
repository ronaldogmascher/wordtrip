import { useEffect, useState } from 'react'
import { playCorrect, playWrong } from '../audio/effects.ts'
import { useLiveQuery } from 'dexie-react-hooks'
import LightBadge from '../components/LightBadge.tsx'
import { db, getSettings, type Accent, type IpaCard } from '../db/db.ts'
import { MINIMAL_PAIRS, pairIpa, PT_MATCH, SOUNDS, type Sound, type SoundKind } from '../ipa/sounds.ts'
import { answerIpaCard, makeSession, symbolOf, transcriptionOf, type IpaQuestion } from '../ipa/training.ts'
import { lightOf } from '../study/scheduler.ts'
import { canSpeak, speak } from '../study/speech.ts'

// Trilha de IPA: the sounds of English compared with Portuguese, plus training where every
// sound is a spaced-repetition card (hear → pick the transcription, see the symbol → pick the word).

const GROUPS: { kind: SoundKind; title: string }[] = [
  { kind: 'vowel', title: 'Vogais' },
  { kind: 'diphthong', title: 'Ditongos' },
  { kind: 'consonant', title: 'Consoantes' },
]

export default function Ipa() {
  const [accent, setAccent] = useState<Accent>('US')
  const [soundEffects, setSoundEffects] = useState(true)
  const [tab, setTab] = useState<'sounds' | 'train'>('sounds')

  useEffect(() => {
    void getSettings().then((s) => {
      setAccent(s.accent)
      setSoundEffects(s.soundEffects)
    })
  }, [])

  return (
    <section className="screen">
      <p className="eyebrow">🏋️ Academia</p>
      <h1>🗣️ Trilha de IPA</h1>
      <p className="muted">
        O IPA (Alfabeto Fonético Internacional) mostra como as palavras soam: é o que aparece entre barras nos cards,
        como /ʃɪp/. Aqui cada som é comparado com o português. Os símbolos seguem o sotaque escolhido nos Ajustes
        ({accent === 'US' ? 'americano' : 'britânico'}).
      </p>
      <div className="segmented" role="group" aria-label="Seção">
        <button aria-pressed={tab === 'sounds'} onClick={() => setTab('sounds')}>📚 Sons</button>
        <button aria-pressed={tab === 'train'} onClick={() => setTab('train')}>👂 Treinar</button>
      </div>
      {tab === 'sounds' ? <SoundList accent={accent} /> : <EarTraining accent={accent} soundEffects={soundEffects} />}
    </section>
  )
}

function Say({ word, accent, label }: { word: string; accent: Accent; label?: string }) {
  if (!canSpeak()) return <span>{label ?? word}</span>
  return (
    <button className="say" onClick={() => speak(word, accent)} aria-label={`Ouvir ${word}`}>
      🔊 {label ?? word}
    </button>
  )
}

function SoundList({ accent }: { accent: Accent }) {
  const cards = useLiveQuery(() => db.ipaCards.toArray()) ?? []
  const byId = new Map(cards.map((c) => [c.id, c]))
  return (
    <>
      <p className="muted ipa-legend">
        {Object.values(PT_MATCH).map((m) => <span key={m.label}>{m.icon} {m.label}</span>)}
      </p>
      {GROUPS.map((g) => (
        <div key={g.kind} className="card">
          <h2>{g.title}</h2>
          {SOUNDS.filter((s) => s.kind === g.kind).map((s) => <SoundItem key={s.id} sound={s} accent={accent} card={byId.get(s.id)} />)}
        </div>
      ))}
    </>
  )
}

function SoundItem({ sound, accent, card }: { sound: Sound; accent: Accent; card?: IpaCard }) {
  const symbol = accent === 'US' ? sound.us : sound.uk
  const other = accent === 'US' ? sound.uk : sound.us
  const pairs = MINIMAL_PAIRS.filter((p) => p.sounds.includes(sound.id))
  return (
    <details className="ipa-sound">
      <summary>
        <span className="ipa-symbol">/{symbol}/</span>
        <span>{sound.examples[0].word}</span>
        <span className="ipa-match" title={PT_MATCH[sound.match].label}>{PT_MATCH[sound.match].icon}</span>
        {card && <LightBadge light={lightOf(card.fsrs)} />}
      </summary>
      <p>{sound.pt}</p>
      {other !== symbol && <p className="muted">No sotaque {accent === 'US' ? 'britânico' : 'americano'}: /{other}/</p>}
      <ul className="ipa-examples">
        {sound.examples.map((e) => (
          <li key={e.word}>
            <Say word={e.word} accent={accent} /> <span className="muted">/{accent === 'US' ? e.us : e.uk}/</span>
          </li>
        ))}
      </ul>
      {sound.tip && <p>💡 {sound.tip}</p>}
      {pairs.length > 0 && (
        <p className="ipa-pairs">
          Compare:{' '}
          {pairs.map((p) => (
            <span key={p.a + p.b} className="ipa-pair">
              <Say word={p.a} accent={accent} /> <span className="muted">/{pairIpa(p.a, accent)}/</span>
              {' × '}
              <Say word={p.b} accent={accent} /> <span className="muted">/{pairIpa(p.b, accent)}/</span>
            </span>
          ))}
        </p>
      )}
    </details>
  )
}

function EarTraining({ accent, soundEffects }: { accent: Accent; soundEffects: boolean }) {
  const cards = useLiveQuery(() => db.ipaCards.toArray())
  const [questions, setQuestions] = useState<IpaQuestion[] | null>(null)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)

  // Build the session once the cards are loaded; "Treinar de novo" builds a new one.
  useEffect(() => {
    if (questions === null) void db.ipaCards.toArray().then((all) => setQuestions(makeSession(all, accent)))
  }, [questions, accent])

  const question = questions?.[index]
  const hearWord = question?.kind === 'hear' ? question.word : ''

  useEffect(() => {
    if (hearWord && canSpeak()) speak(hearWord, accent)
  }, [hearWord, accent, index])

  if (!canSpeak()) return <div className="card"><p>Este navegador não tem voz para ler as palavras em inglês.</p></div>
  if (!cards || !questions) return <div className="card"><p className="muted">Carregando…</p></div>

  if (!question) {
    return (
      <div className="card">
        <h2>Fim do treino!</h2>
        <p><strong>{score}</strong> de {questions.length} certas.</p>
        <p className="muted">Cada som virou um card com repetição espaçada: os que você errou voltam antes.</p>
        <button className="button primary" onClick={() => { setQuestions(null); setIndex(0); setScore(0); setPicked(null) }}>
          Treinar de novo
        </button>
      </div>
    )
  }

  const q = question
  async function choose(option: string) {
    setPicked(option)
    const ok = option === q.answer
    if (ok) setScore((s) => s + 1)
    if (soundEffects) {
      if (ok) playCorrect()
      else playWrong()
    }
    const now = new Date()
    const card = await db.ipaCards.get(q.sound.id)
    await db.ipaCards.put(answerIpaCard(card, q.sound.id, ok, now))
    await db.ipaReviews.add({ soundId: q.sound.id, at: now, kind: q.kind, correct: ok })
    // The word is read after the answer in both kinds, so symbol and sound stay together.
    if (q.kind === 'symbol') setTimeout(() => speak(q.word, accent), 450)
  }

  const example = q.sound.examples.find((e) => e.word === q.word)
  const card = cards.find((c) => c.id === q.sound.id)
  return (
    <div className="card study">
      <p className="muted">
        Rodada {index + 1} de {questions.length} · {score} certas ·{' '}
        {card ? <LightBadge light={lightOf(card.fsrs)} /> : <span className="badge">som novo</span>}
      </p>
      <p className="definition">{q.prompt}</p>
      {q.kind === 'hear' ? (
        <div className="audio-row">
          <button onClick={() => speak(q.word, accent)}>🔊 Ouvir</button>
          <button onClick={() => speak(q.word, accent, true)}>🐢 Devagar</button>
        </div>
      ) : (
        <p className="big-prompt ipa-big">/{symbolOf(q.sound, accent)}/</p>
      )}
      {picked === null ? (
        <div className={`ipa-options ${q.kind === 'hear' ? 'ipa-options-symbols' : ''}`}>
          {q.options.map((o) => (
            <button key={o} className="choice" onClick={() => void choose(o)}>{o}</button>
          ))}
        </div>
      ) : (
        <div className="reveal">
          <p className={`verdict ${picked === q.answer ? 'ok' : 'wrong'}`}>
            {picked === q.answer ? '✔ Isso!' : `✘ Era ${q.answer}`}
          </p>
          <p className="ipa-reveal">
            <span className="ipa-big">/{symbolOf(q.sound, accent)}/</span>
            <span>
              <Say word={q.word} accent={accent} />{' '}
              {example && <span className="ipa-symbol">/{transcriptionOf(example, accent)}/</span>}
            </span>
          </p>
          <p>{q.sound.pt}</p>
          <button className="button primary" onClick={() => { setIndex((i) => i + 1); setPicked(null) }}>Continuar</button>
        </div>
      )}
    </div>
  )
}
