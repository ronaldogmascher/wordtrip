import { useEffect, useState } from 'react'
import { playCorrect, playWrong } from '../audio/effects.ts'
import { getSettings, type Accent } from '../db/db.ts'
import { MINIMAL_PAIRS, PT_MATCH, SOUNDS, type MinimalPair, type Sound, type SoundKind } from '../ipa/sounds.ts'
import { canSpeak, speak } from '../study/speech.ts'

// Trilha de IPA: the sounds of English compared with Portuguese, plus ear training with
// minimal pairs (sheep / ship).

const GROUPS: { kind: SoundKind; title: string }[] = [
  { kind: 'vowel', title: 'Vogais' },
  { kind: 'diphthong', title: 'Ditongos' },
  { kind: 'consonant', title: 'Consoantes' },
]

const ROUNDS = 10

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
      <h1>🗣️ Trilha de IPA</h1>
      <p className="muted">
        O IPA (Alfabeto Fonético Internacional) mostra como as palavras soam: é o que aparece entre barras nos cards,
        como /ʃɪp/. Aqui cada som é comparado com o português. Os símbolos seguem o sotaque escolhido nos Ajustes
        ({accent === 'US' ? 'americano' : 'britânico'}).
      </p>
      <div className="segmented" role="group" aria-label="Seção">
        <button aria-pressed={tab === 'sounds'} onClick={() => setTab('sounds')}>📚 Sons</button>
        <button aria-pressed={tab === 'train'} onClick={() => setTab('train')}>👂 Treinar ouvido</button>
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
  return (
    <>
      <p className="muted ipa-legend">
        {Object.values(PT_MATCH).map((m) => <span key={m.label}>{m.icon} {m.label}</span>)}
      </p>
      {GROUPS.map((g) => (
        <div key={g.kind} className="card">
          <h2>{g.title}</h2>
          {SOUNDS.filter((s) => s.kind === g.kind).map((s) => <SoundItem key={s.id} sound={s} accent={accent} />)}
        </div>
      ))}
    </>
  )
}

function SoundItem({ sound, accent }: { sound: Sound; accent: Accent }) {
  const symbol = accent === 'US' ? sound.us : sound.uk
  const other = accent === 'US' ? sound.uk : sound.us
  const pairs = MINIMAL_PAIRS.filter((p) => p.sounds.includes(sound.id))
  return (
    <details className="ipa-sound">
      <summary>
        <span className="ipa-symbol">/{symbol}/</span>
        <span>{sound.examples[0].word}</span>
        <span className="ipa-match" title={PT_MATCH[sound.match].label}>{PT_MATCH[sound.match].icon}</span>
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
              <Say word={p.a} accent={accent} /> × <Say word={p.b} accent={accent} />
            </span>
          ))}
        </p>
      )}
    </details>
  )
}

interface Round {
  pair: MinimalPair
  target: 'a' | 'b'
}

function makeRounds(): Round[] {
  const shuffled = [...MINIMAL_PAIRS].sort(() => Math.random() - 0.5).slice(0, ROUNDS)
  return shuffled.map((pair) => ({ pair, target: Math.random() < 0.5 ? 'a' : 'b' }))
}

function EarTraining({ accent, soundEffects }: { accent: Accent; soundEffects: boolean }) {
  const [rounds, setRounds] = useState(makeRounds)
  const [index, setIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [picked, setPicked] = useState<'a' | 'b' | null>(null)

  const round = rounds[index]
  const word = round ? round.pair[round.target] : ''

  useEffect(() => {
    if (word && canSpeak()) speak(word, accent)
  }, [word, accent])

  if (!canSpeak()) return <div className="card"><p>Este navegador não tem voz para ler as palavras em inglês.</p></div>

  if (!round) {
    return (
      <div className="card">
        <h2>Fim do treino!</h2>
        <p><strong>{score}</strong> de {rounds.length} certas.</p>
        <button className="button primary" onClick={() => { setRounds(makeRounds()); setIndex(0); setScore(0); setPicked(null) }}>
          Treinar de novo
        </button>
      </div>
    )
  }

  function choose(option: 'a' | 'b') {
    setPicked(option)
    const ok = option === round.target
    if (ok) setScore((s) => s + 1)
    if (soundEffects) {
      if (ok) playCorrect()
      else playWrong()
    }
  }

  const { pair } = round
  return (
    <div className="card study">
      <p className="muted">Rodada {index + 1} de {rounds.length} · {score} certas</p>
      <p className="definition">Ouça e escolha a palavra que você ouviu.</p>
      <div className="audio-row">
        <button onClick={() => speak(word, accent)}>🔊 Ouvir</button>
        <button onClick={() => speak(word, accent, true)}>🐢 Devagar</button>
      </div>
      {picked === null ? (
        <div className="choices">
          <button className="choice" onClick={() => choose('a')}>{pair.a}</button>
          <button className="choice" onClick={() => choose('b')}>{pair.b}</button>
        </div>
      ) : (
        <div className="reveal">
          <p className={`verdict ${picked === round.target ? 'ok' : 'wrong'}`}>
            {picked === round.target ? '✔ Isso! ' : '✘ Era '}"{word}"
          </p>
          <p>
            <Say word={pair.a} accent={accent} /> = {pair.ptA} · <Say word={pair.b} accent={accent} /> = {pair.ptB}
          </p>
          <button className="button primary" onClick={() => { setIndex((i) => i + 1); setPicked(null) }}>Continuar</button>
        </div>
      )}
    </div>
  )
}
