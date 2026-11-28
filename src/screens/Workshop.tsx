import { useLiveQuery } from 'dexie-react-hooks'
import Flag from '../components/Flag.tsx'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { playCorrect, playWrong } from '../audio/effects.ts'
import { variants } from '../grammar/exercises.ts'
import { getSense } from '../content/index.ts'
import type { Sense } from '../content/types.ts'
import { db, getSettings, type Accent } from '../db/db.ts'
import { checkAnswer } from '../study/answer.ts'
import { canSpeak, speak } from '../study/speech.ts'
import { pickWeakWords, usesWord, WORKSHOP_SIZE } from '../workshop/workshop.ts'

// "Oficina" 🔧: reinforcement for the words the learner forgets the most. Each word goes through
// four stations, each a different memory technique:
//   1. Âncora: write a memory hook linking the sound to something in Portuguese (keyword method).
//   2. Produção: see the Portuguese and write the English word (active recall, the hard direction).
//   3. Ditado: hear the sentence and write the missing word (sound ↔ spelling).
//   4. Sua frase: write an own sentence with the word (elaboration: personal meaning sticks).

const STATIONS = [
  { icon: '⚓', title: 'Âncora' },
  { icon: '✍️', title: 'Produção' },
  { icon: '🎧', title: 'Ditado' },
  { icon: '💬', title: 'Sua frase' },
] as const

export default function Workshop() {
  const [accent, setAccent] = useState<Accent>('US')
  const [soundEffects, setSoundEffects] = useState(true)
  const [words, setWords] = useState<Sense[] | null>(null)
  const [index, setIndex] = useState(0)
  const [station, setStation] = useState(0)
  const [produced, setProduced] = useState<string[]>([])

  useEffect(() => {
    void getSettings().then((s) => {
      setAccent(s.accent)
      setSoundEffects(s.soundEffects)
    })
    void (async () => {
      const [cards, reviews] = await Promise.all([db.cards.toArray(), db.reviews.toArray()])
      const ids = pickWeakWords(cards, reviews, new Date(), WORKSHOP_SIZE)
      setWords(ids.map((id) => getSense(id)).filter((s): s is Sense => !!s))
    })()
  }, [])

  const word = words?.[index]

  const feedback = (ok: boolean) => {
    if (!soundEffects) return
    if (ok) playCorrect()
    else playWrong()
  }

  function next() {
    if (station < STATIONS.length - 1) setStation((s) => s + 1)
    else {
      // The session is saved when the last word is finished, to know when to suggest the next one.
      if (words && index === words.length - 1) void db.workshops.add({ at: new Date(), senseIds: words.map((w) => w.id), produced })
      setStation(0)
      setIndex((i) => i + 1)
    }
  }

  if (words === null) return <section className="screen"><p className="muted">Carregando…</p></section>

  if (words.length === 0) {
    return (
      <section className="screen">
        <h1>🔧 Oficina</h1>
        <div className="card">
          <h2>Nada para consertar 🎉</h2>
          <p>A Oficina reforça as palavras que você mais esquece. Por enquanto nenhuma palavra deu problema. Volte quando errar alguma!</p>
          <Link className="button primary" to="/">Voltar</Link>
        </div>
      </section>
    )
  }

  if (!word) {
    return (
      <section className="screen">
        <h1>🔧 Oficina</h1>
        <div className="card">
          <h2>Revisão completa! 🚐✨</h2>
          <p>Você reforçou <strong>{words.length}</strong> palavras e lembrou de <strong>{produced.length}</strong> só pelo português.</p>
          <p className="muted">As âncoras que você escreveu aparecem nos cards dessas palavras, quando elas voltarem nas revisões.</p>
          <Link className="button primary" to="/">Voltar ao início</Link>
        </div>
      </section>
    )
  }

  return (
    <section className="screen">
      <h1>🔧 Oficina</h1>
      <p className="muted">Palavra {index + 1} de {words.length}</p>
      <ol className="stations" aria-label="Estações">
        {STATIONS.map((s, i) => (
          <li key={s.title} className={i === station ? 'current' : i < station ? 'done' : ''}>{s.icon} {s.title}</li>
        ))}
      </ol>
      {station === 0 && <Anchor key={word.id} sense={word} accent={accent} onNext={next} />}
      {station === 1 && (
        <Produce
          key={word.id}
          sense={word}
          accent={accent}
          onAnswer={(ok) => {
            feedback(ok)
            if (ok) setProduced((p) => [...p, word.id])
          }}
          onNext={next}
        />
      )}
      {station === 2 && <Dictation key={word.id} sense={word} accent={accent} onAnswer={feedback} onNext={next} />}
      {station === 3 && <OwnSentence key={word.id} sense={word} onAnswer={feedback} onNext={next} />}
    </section>
  )
}

function WordHeader({ sense, accent }: { sense: Sense; accent: Accent }) {
  return (
    <div className="workshop-word">
      <strong className="lemma">{sense.lemma}</strong>
      <span className="ipa">/{accent === 'US' ? sense.ipaUS : sense.ipaUK}/</span>
      {canSpeak() && <button className="say" onClick={() => speak(sense.lemma, accent)}>🔊</button>}
      <p className="translation"><Flag country="BR" /> {sense.translationPt}</p>
    </div>
  )
}

function Anchor({ sense, accent, onNext }: { sense: Sense; accent: Accent; onNext: () => void }) {
  const saved = useLiveQuery(() => db.mnemonics.get(sense.id), [sense.id])
  const [text, setText] = useState<string | null>(null)
  const value = text ?? saved?.text ?? ''

  async function save() {
    const trimmed = value.trim()
    if (trimmed) await db.mnemonics.put({ senseId: sense.id, text: trimmed, updatedAt: new Date() })
    onNext()
  }

  return (
    <div className="card study">
      <h2>⚓ Crie uma âncora</h2>
      <WordHeader sense={sense} accent={accent} />
      <p className="muted">{sense.definition}</p>
      <p>
        Ligue o <strong>som</strong> da palavra a uma imagem em português, quanto mais absurda melhor. Exemplo:
        <em> borrow</em> (pegar emprestado) soa como "<em>borracha</em>": imagine alguém pegando sua borracha emprestada e nunca devolvendo.
      </p>
      <textarea
        className="workshop-text"
        value={value}
        onChange={(e) => setText(e.target.value)}
        placeholder={`${sense.lemma} soa como… imagine…`}
        rows={3}
        aria-label="Sua âncora"
      />
      <button className="button primary" onClick={() => void save()}>{value.trim() ? 'Salvar âncora' : 'Pular'}</button>
    </div>
  )
}

function Produce({ sense, accent, onAnswer, onNext }: {
  sense: Sense
  accent: Accent
  onAnswer: (ok: boolean) => void
  onNext: () => void
}) {
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<boolean | null>(null)

  function submit() {
    const ok = checkAnswer(typed, sense.lemma) !== 'wrong'
    setResult(ok)
    onAnswer(ok)
    if (canSpeak()) window.setTimeout(() => speak(sense.lemma, accent), 450)
  }

  return (
    <div className="card study">
      <h2>✍️ Como se diz em inglês?</h2>
      <p className="big-prompt">{sense.translationPt}</p>
      <p className="muted">{sense.definitionPt}</p>
      {result === null ? (
        <form className="typing" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <input autoFocus autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="A palavra em inglês" />
          <button className="primary" type="submit">Responder</button>
        </form>
      ) : (
        <div className="reveal">
          <p className={`verdict ${result ? 'ok' : 'wrong'}`}>{result ? '✔ Isso!' : `✘ Era "${sense.lemma}"`}</p>
          <WordHeader sense={sense} accent={accent} />
          <button className="button primary" onClick={onNext}>Continuar</button>
        </div>
      )}
    </div>
  )
}

function Dictation({ sense, accent, onAnswer, onNext }: {
  sense: Sense
  accent: Accent
  onAnswer: (ok: boolean) => void
  onNext: () => void
}) {
  // A different sentence from the one usually shown on the card, when there is one.
  const example = sense.examples[1] ?? sense.examples[0]
  const full = example.text.replace('____', example.answer)
  const [typed, setTyped] = useState('')
  const [result, setResult] = useState<boolean | null>(null)

  useEffect(() => {
    if (canSpeak()) speak(full, accent)
  }, [full, accent])

  if (!canSpeak()) {
    return (
      <div className="card"><p>Este navegador não tem voz para o ditado.</p><button className="button primary" onClick={onNext}>Pular</button></div>
    )
  }

  function submit() {
    const ok = checkAnswer(typed, example.answer) !== 'wrong'
    setResult(ok)
    onAnswer(ok)
  }

  return (
    <div className="card study">
      <h2>🎧 Ouça e complete</h2>
      <div className="audio-row">
        <button onClick={() => speak(full, accent)}>🔊 Ouvir</button>
        <button onClick={() => speak(full, accent, true)}>🐢 Devagar</button>
      </div>
      <p className="sentence">{example.text}</p>
      {result === null ? (
        <form className="typing" onSubmit={(e) => { e.preventDefault(); submit() }}>
          <input autoFocus autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false} value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="A palavra que falta" />
          <button className="primary" type="submit">Responder</button>
        </form>
      ) : (
        <div className="reveal">
          <p className={`verdict ${result ? 'ok' : 'wrong'}`}>{result ? '✔ Isso!' : `✘ Era "${example.answer}"`}</p>
          <p className="sentence">{full}</p>
          <p className="translation"><Flag country="BR" /> {example.pt}</p>
          <button className="button primary" onClick={onNext}>Continuar</button>
        </div>
      )}
    </div>
  )
}

/** All the ways the word can appear in a sentence: base, verb forms, plural, the card answers. */
function formsOf(sense: Sense): string[] {
  const f = sense.forms
  const verbForms = f ? [f.thirdPerson, f.past, f.pastParticiple, f.ing].flatMap(variants) : []
  return [sense.lemma, `${sense.lemma}s`, `${sense.lemma}es`, ...verbForms, ...sense.examples.map((e) => e.answer)]
}

function OwnSentence({ sense, onAnswer, onNext }: { sense: Sense; onAnswer: (ok: boolean) => void; onNext: () => void }) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<boolean | null>(null)

  function submit() {
    const ok = usesWord(text, formsOf(sense))
    setResult(ok)
    onAnswer(ok)
  }

  return (
    <div className="card study">
      <h2>💬 Escreva sua frase</h2>
      <p>Escreva uma frase sua com <strong>{sense.lemma}</strong> ({sense.translationPt}). De preferência sobre a sua vida ou a viagem: frases pessoais grudam mais na memória.</p>
      <p className="muted">Exemplo: {sense.examples[0].text.replace('____', sense.examples[0].answer)}</p>
      <textarea className="workshop-text" value={text} onChange={(e) => { setText(e.target.value); setResult(null) }} rows={3} aria-label="Sua frase" />
      {result === false && <p className="verdict wrong">Não encontrei "{sense.lemma}" na frase. Tente de novo ou pule.</p>}
      {result === true ? (
        <>
          <p className="verdict ok">✔ Boa frase!</p>
          <button className="button primary" onClick={onNext}>Próxima palavra</button>
        </>
      ) : (
        <div className="row">
          <button className="button primary" onClick={submit} disabled={!text.trim()}>Conferir</button>
          <button className="button" onClick={onNext}>Pular</button>
        </div>
      )}
    </div>
  )
}
