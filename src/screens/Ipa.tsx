import { useEffect, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { playCorrect, playWrong } from '../audio/effects.ts'
import LightBadge from '../components/LightBadge.tsx'
import { db, getSettings, type Accent, type IpaCard, type SchoolLesson } from '../db/db.ts'
import {
  BOSS_PASS, BOSS_READY, bossReady, lessonId, openSoundIds, openStages, passed, RANGER, RANGER_QUESTIONS,
  rangerOpen, STAGES, stageProgress, stageSounds, type Stage,
} from '../ipa/camping.ts'
import { MINIMAL_PAIRS, pairIpa, PT_MATCH, type Sound } from '../ipa/sounds.ts'
import { answerIpaCard, makeBossTest, makeSession, symbolOf, transcriptionOf, type IpaQuestion } from '../ipa/training.ts'
import { lightOf } from '../study/scheduler.ts'
import { canSpeak, speak } from '../study/speech.ts'

// Trilha de IPA no camping: five stages of sounds compared with Portuguese, each closed by a
// boss, and the forest ranger at the end. Every sound is a spaced-repetition card.

interface Boss {
  id: string
  title: string
  questions: IpaQuestion[]
}

export default function Ipa() {
  const [accent, setAccent] = useState<Accent>('US')
  const [soundEffects, setSoundEffects] = useState(true)
  const [tab, setTab] = useState<'trail' | 'train'>('trail')
  const [boss, setBoss] = useState<Boss | null>(null)
  const cards = useLiveQuery(() => db.ipaCards.toArray())
  const lessons = useLiveQuery(() => db.schoolLessons.toArray())

  useEffect(() => {
    void getSettings().then((s) => {
      setAccent(s.accent)
      setSoundEffects(s.soundEffects)
    })
  }, [])

  if (!cards || !lessons) return <section className="screen"><p className="muted">Carregando…</p></section>

  if (boss) {
    return (
      <section className="screen">
        <p className="eyebrow">🏕️ Trilha de IPA · Chefão</p>
        <h1>{boss.title}</h1>
        <BossRun boss={boss} accent={accent} soundEffects={soundEffects} onExit={() => setBoss(null)} />
      </section>
    )
  }

  const startStageBoss = (stage: Stage) => setBoss({
    id: stage.id, title: `${stage.icon} Chefão da ${stage.name}`,
    questions: makeBossTest(stage.soundIds, Math.max(10, stage.soundIds.length * 2), accent),
  })
  const startRanger = () => setBoss({
    id: RANGER.id, title: `${RANGER.icon} ${RANGER.name}`,
    questions: makeBossTest(STAGES.flatMap((s) => s.soundIds), RANGER_QUESTIONS, accent),
  })

  return (
    <section className="screen">
      <p className="eyebrow">🚗 Autoescola · Prática livre</p>
      <h1>🏕️ Trilha de IPA no camping</h1>
      <p className="muted">
        O IPA (Alfabeto Fonético Internacional) mostra como as palavras soam: é o que aparece entre barras nos cards,
        como /ʃɪp/. No camping, cada atividade ensina alguns sons, comparados com o português. Os símbolos seguem o
        sotaque escolhido nos Ajustes ({accent === 'US' ? 'americano' : 'britânico'}).
      </p>
      {passed(RANGER.id, lessons) && (
        <div className="card license-badge">
          <span className="license-icon" aria-hidden="true">👂</span>
          <div>
            <strong>Ouvido afiado!</strong>
            <p className="muted">Você venceu o Guarda-florestal e conhece todos os sons do inglês.</p>
          </div>
        </div>
      )}
      <div className="segmented" role="group" aria-label="Seção">
        <button aria-pressed={tab === 'trail'} onClick={() => setTab('trail')}>🏕️ Trilha</button>
        <button aria-pressed={tab === 'train'} onClick={() => setTab('train')}>👂 Treinar</button>
      </div>
      {tab === 'trail'
        ? <Trail accent={accent} cards={cards} lessons={lessons} onBoss={startStageBoss} onRanger={startRanger} onTrain={() => setTab('train')} />
        : <EarTraining accent={accent} soundEffects={soundEffects} lessons={lessons} />}
    </section>
  )
}

function Trail({ accent, cards, lessons, onBoss, onRanger, onTrain }: {
  accent: Accent
  cards: IpaCard[]
  lessons: SchoolLesson[]
  onBoss: (stage: Stage) => void
  onRanger: () => void
  onTrain: () => void
}) {
  const open = new Set(openStages(lessons).map((s) => s.id))
  const byId = new Map(cards.map((c) => [c.id, c]))
  return (
    <>
      <p className="muted ipa-legend">
        {Object.values(PT_MATCH).map((m) => <span key={m.label}>{m.icon} {m.label}</span>)}
      </p>
      {STAGES.map((stage, i) => {
        const isOpen = open.has(stage.id)
        const beaten = passed(stage.id, lessons)
        const { ready, total } = stageProgress(stage, cards)
        return (
          <details key={stage.id} className={`card ipa-stage ${isOpen ? '' : 'locked'}`} open={isOpen && !beaten}>
            <summary>
              <span className="ipa-stage-icon" aria-hidden="true">{isOpen ? stage.icon : '🔒'}</span>
              <span>
                <strong>Etapa {i + 1} · {stage.name}</strong>
                <span className="muted"> · {beaten ? '🏆 chefão vencido' : `${ready} de ${total} sons em 🟡/🟢`}</span>
              </span>
            </summary>
            <p>{stage.about}</p>
            {!isOpen && <p className="muted">🔒 Abre quando você vencer o chefão da etapa anterior. Dá para espiar os sons aqui embaixo.</p>}
            {isOpen && !beaten && (
              <>
                <div className="progress" aria-hidden="true"><div style={{ width: `${(ready / total) * 100}%` }} /></div>
                {bossReady(stage, cards) ? (
                  <button className="button primary" onClick={() => onBoss(stage)}>⚔️ Enfrentar o chefão da {stage.name}</button>
                ) : (
                  <>
                    <p className="muted">O chefão aparece quando {Math.round(BOSS_READY * 100)}% dos sons desta etapa estiverem em 🟡 Aprendendo ou 🟢 Aprendido.</p>
                    <button className="button" onClick={onTrain}>👂 Treinar estes sons</button>
                  </>
                )}
              </>
            )}
            {stageSounds(stage).map((s) => <SoundItem key={s.id} sound={s} accent={accent} card={byId.get(s.id)} />)}
          </details>
        )
      })}
      <div className={`card ipa-stage ${rangerOpen(lessons) ? '' : 'locked'}`}>
        <h2>{rangerOpen(lessons) ? RANGER.icon : '🔒'} Chefão final · {RANGER.name}</h2>
        <p>
          O guarda do parque testa todos os sons, de todas as etapas: {RANGER_QUESTIONS} perguntas. Vencendo, você ganha
          o selo <strong>{RANGER.badge}</strong>.
        </p>
        {passed(RANGER.id, lessons)
          ? <p>🏆 Vencido! Pode enfrentar de novo quando quiser.</p>
          : !rangerOpen(lessons) && <p className="muted">Aparece depois que você vencer os 5 chefões das etapas.</p>}
        {rangerOpen(lessons) && <button className="button primary" onClick={onRanger}>⚔️ Enfrentar o Guarda-florestal</button>}
      </div>
    </>
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
      <p className="ipa-big ipa-card-symbol">/{symbol}/</p>
      <p>{sound.pt}</p>
      {other !== symbol && <p className="muted">No sotaque {accent === 'US' ? 'britânico' : 'americano'}: /{other}/</p>}
      <ul className="ipa-examples">
        {sound.examples.map((e) => (
          <li key={e.word}>
            <Say word={e.word} accent={accent} /> <span className="muted">/{transcriptionOf(e, accent)}/</span>
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

function EarTraining({ accent, soundEffects, lessons }: { accent: Accent; soundEffects: boolean; lessons: SchoolLesson[] }) {
  const [questions, setQuestions] = useState<IpaQuestion[] | null>(null)
  const [round, setRound] = useState(0)

  // Build the session once; "Treinar de novo" builds a new one with the current cards.
  useEffect(() => {
    if (questions === null) void db.ipaCards.toArray().then((all) => setQuestions(makeSession(all, accent, openSoundIds(lessons))))
  }, [questions, accent, lessons])

  if (!questions) return <div className="card"><p className="muted">Carregando…</p></div>

  async function record(q: IpaQuestion, ok: boolean) {
    const now = new Date()
    const card = await db.ipaCards.get(q.sound.id)
    await db.ipaCards.put(answerIpaCard(card, q.sound.id, ok, now))
    await db.ipaReviews.add({ soundId: q.sound.id, at: now, kind: q.kind, correct: ok })
  }

  return (
    <QuizRun
      key={round}
      questions={questions}
      accent={accent}
      soundEffects={soundEffects}
      onAnswer={record}
      end={(score) => (
        <>
          <h2>Fim do treino!</h2>
          <p><strong>{score}</strong> de {questions.length} certas.</p>
          <p className="muted">Cada som virou um card com repetição espaçada: os que você errou voltam antes.</p>
          <button className="button primary" onClick={() => { setQuestions(null); setRound((r) => r + 1) }}>Treinar de novo</button>
        </>
      )}
    />
  )
}

function BossRun({ boss, accent, soundEffects, onExit }: { boss: Boss; accent: Accent; soundEffects: boolean; onExit: () => void }) {
  const total = boss.questions.length
  const needed = Math.ceil(total * BOSS_PASS)
  const [saved, setSaved] = useState(false)

  async function save(score: number) {
    const id = lessonId(boss.id)
    const previous = await db.schoolLessons.get(id)
    await db.schoolLessons.put({
      id, best: Math.max(score, previous?.best ?? 0), total,
      passedAt: previous?.passedAt ?? (score >= needed ? new Date() : undefined),
    })
    setSaved(true)
  }

  return (
    <>
      <p className="muted">{total} perguntas, sem dicas. Para vencer, acerte {needed}. O chefão não mexe nas suas revisões.</p>
      <QuizRun
        questions={boss.questions}
        accent={accent}
        soundEffects={soundEffects}
        onFinish={(score) => void save(score)}
        end={(score) => (
          <>
            <h2>{score >= needed ? '🏆 Chefão vencido!' : 'Quase!'}</h2>
            <p><strong>{score}</strong> de {total} certas.</p>
            <p className="muted">
              {score >= needed
                ? boss.id === RANGER.id ? `Você ganhou o selo ${RANGER.badge}.` : 'A próxima etapa do camping está aberta.'
                : `Era preciso acertar ${needed}. Treine mais um pouco e tente de novo quando quiser.`}
            </p>
            <button className="button primary" disabled={!saved} onClick={onExit}>Voltar ao camping</button>
          </>
        )}
      />
    </>
  )
}

function QuizRun({ questions, accent, soundEffects, onAnswer, onFinish, end }: {
  questions: IpaQuestion[]
  accent: Accent
  soundEffects: boolean
  onAnswer?: (q: IpaQuestion, ok: boolean) => Promise<void>
  onFinish?: (score: number) => void
  end: (score: number) => ReactNode
}) {
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<string | null>(null)
  const question = questions[index]
  const spoken = question && question.kind !== 'symbol' ? question.word : ''

  useEffect(() => {
    if (spoken && canSpeak()) speak(spoken, accent)
  }, [spoken, accent, index])

  if (!canSpeak()) return <div className="card"><p>Este navegador não tem voz para ler as palavras em inglês.</p></div>
  if (!question) return <div className="card">{end(score)}</div>

  const q = question
  async function choose(option: string) {
    setPicked(option)
    const ok = option === q.answer
    const newScore = score + (ok ? 1 : 0)
    setScore(newScore)
    if (soundEffects) {
      if (ok) playCorrect()
      else playWrong()
    }
    // The word is read after the answer, so symbol and sound stay together.
    if (q.kind === 'symbol') setTimeout(() => speak(q.word, accent), 450)
    await onAnswer?.(q, ok)
    if (index === questions.length - 1) onFinish?.(newScore)
  }

  const example = q.sound.examples.find((e) => e.word === q.word)
  const ipa = example ? transcriptionOf(example, accent) : pairIpa(q.word, accent)
  return (
    <div className="card study">
      <p className="muted">Rodada {index + 1} de {questions.length} · {score} certas</p>
      <p className="definition">{q.prompt}</p>
      {q.kind === 'symbol' ? (
        <p className="big-prompt ipa-big ipa-huge">/{symbolOf(q.sound, accent)}/</p>
      ) : (
        <div className="audio-row">
          <button onClick={() => speak(q.word, accent)}>🔊 Ouvir</button>
          <button onClick={() => speak(q.word, accent, true)}>🐢 Devagar</button>
        </div>
      )}
      {picked === null ? (
        <div className={`ipa-options ${q.kind === 'hear' ? 'ipa-options-symbols' : ''} ${q.kind === 'pair' ? 'ipa-options-pair' : ''}`}>
          {q.options.map((o) => (
            <button key={o} className="choice" onClick={() => void choose(o)}>
              {o}
              {q.kind === 'pair' && <small className="ipa">/{pairIpa(o, accent)}/</small>}
            </button>
          ))}
        </div>
      ) : (
        <div className="reveal">
          <p className={`verdict ${picked === q.answer ? 'ok' : 'wrong'}`}>
            {picked === q.answer ? '✔ Isso!' : `✘ Era ${q.answer}`}
          </p>
          {q.kind === 'pair' ? (
            <p className="ipa-pairs">
              {q.options.map((o) => (
                <span key={o} className="ipa-pair">
                  <Say word={o} accent={accent} /> <span className="ipa-symbol">/{pairIpa(o, accent)}/</span>
                  {o === q.word && <span className="muted">(foi esta)</span>}
                </span>
              ))}
            </p>
          ) : (
            <p className="ipa-reveal">
              <span className="ipa-big">/{symbolOf(q.sound, accent)}/</span>
              <span>
                <Say word={q.word} accent={accent} /> {ipa && <span className="ipa-symbol">/{ipa}/</span>}
              </span>
            </p>
          )}
          {q.kind !== 'pair' && <p>{q.sound.pt}</p>}
          <button className="button primary" onClick={() => { setIndex((i) => i + 1); setPicked(null) }}>Continuar</button>
        </div>
      )}
    </div>
  )
}
