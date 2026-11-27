import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DictionaryDownload from '../components/DictionaryDownload.tsx'
import LightBadge from '../components/LightBadge.tsx'
import { getPhaseOfSense, getSensesByLemma } from '../content/index.ts'
import type { PartOfSpeech } from '../content/types.ts'
import { db, type ExplorerEntry } from '../db/db.ts'
import { POS_LABEL } from '../dictionary/dictionary.ts'
import { normalizeWord } from '../dictionary/lemmatize.ts'
import { useDictionary } from '../dictionary/useDictionary.ts'
import { makeGap, POS_FROM_DICT } from '../explorer/explorer.ts'
import { lightOf } from '../study/scheduler.ts'

const POS_OPTIONS: [PartOfSpeech, string][] = [
  ['noun', 'substantivo'],
  ['verb', 'verbo'],
  ['adjective', 'adjetivo'],
  ['adverb', 'advérbio'],
  ['expression', 'expressão'],
]

/** Choice of meaning: a route sense, a dictionary sense (by index) or one written by the learner. */
type Choice = { kind: 'route'; senseId: string } | { kind: 'dict'; index: number } | { kind: 'manual' }

/** Completes an inbox word (or edits one): choose the meaning, the sentence and the translation. */
export default function ExplorerForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const entry = useLiveQuery(() => db.explorer.get(Number(id)), [id])
  if (entry === undefined) return <section className="screen"><p className="muted">Carregando…</p></section>
  return <Form key={entry.id} entry={entry} onDone={() => navigate('/diario')} />
}

function Form({ entry, onDone }: { entry: ExplorerEntry; onDone: () => void }) {
  const { dict, status, download } = useDictionary()
  const [word, setWord] = useState(entry.custom?.lemma ?? entry.word)
  const [lemma, setLemma] = useState<string | null>(entry.custom?.lemma ?? null)
  const [choice, setChoice] = useState<Choice | null>(entry.custom ? { kind: 'manual' } : null)
  const [manualDefinition, setManualDefinition] = useState(entry.custom?.definition ?? '')
  const [manualPos, setManualPos] = useState<PartOfSpeech>(entry.custom?.pos ?? 'noun')
  const [sentence, setSentence] = useState(entry.custom ? entry.custom.gap.text.replace('____', entry.custom.gap.answer) : (entry.sentence ?? ''))
  const [translation, setTranslation] = useState(entry.custom?.translationPt ?? '')
  const [source, setSource] = useState(entry.source ?? '')

  // Base forms of the typed word that exist in the dictionary ("went" → go).
  const bases = dict ? dict.resolve(word) : []
  const current = lemma && (bases.includes(lemma) || !dict) ? lemma : (bases[0] ?? (normalizeWord(word) || null))

  const routeSenses = current ? getSensesByLemma(current) : []
  const dictSenses = dict && current ? dict.lookup(current) : []
  const cards = useLiveQuery(() => db.cards.where('senseId').anyOf(routeSenses.map((s) => s.id)).toArray(), [current])

  const chosenDict = choice?.kind === 'dict' ? dictSenses[choice.index] : undefined
  const isCustom = choice?.kind === 'dict' || choice?.kind === 'manual'
  const gap = isCustom && current ? makeGap(sentence, current) : null
  const definition = choice?.kind === 'manual' ? manualDefinition.trim() : (chosenDict?.definition ?? '')
  const canSave = !!current && !!choice && (choice.kind === 'route' || (!!gap && !!definition))

  function pickDict(index: number) {
    setChoice({ kind: 'dict', index })
    // Suggest the dictionary example when the learner has no sentence yet.
    const example = dictSenses[index]?.example
    if (!sentence.trim() && example && current && makeGap(example, current)) setSentence(example)
  }

  async function save() {
    if (!canSave || !current || !choice || entry.id === undefined) return
    const base = { ...entry, word, source: source.trim() || undefined, status: 'ready' as const }
    if (choice.kind === 'route') {
      await db.explorer.put({ ...base, senseId: choice.senseId, custom: undefined })
    } else {
      await db.explorer.put({
        ...base,
        senseId: undefined,
        custom: {
          lemma: current,
          pos: chosenDict ? POS_FROM_DICT[chosenDict.pos] : manualPos,
          definition,
          gap: gap!,
          translationPt: translation.trim() || undefined,
          synonyms: chosenDict?.synonyms ?? [],
        },
      })
    }
    onDone()
  }

  return (
    <section className="screen">
      <h1>Completar palavra</h1>

      <div className="card capture">
        <label htmlFor="ex-word"><strong>Palavra</strong></label>
        <input id="ex-word" value={word} onChange={(e) => { setWord(e.target.value); setLemma(null); setChoice(null) }} autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        {bases.length > 1 && (
          <div className="sheet-choices">
            {bases.map((b) => (
              <button key={b} className={b === current ? 'active' : ''} onClick={() => { setLemma(b); setChoice(null) }}>{b}</button>
            ))}
          </div>
        )}
        {current && normalizeWord(word) !== current && <p className="muted">{normalizeWord(word)} → {current}</p>}
      </div>

      {!dict && (
        <div className="card">
          <DictionaryDownload status={status} onDownload={download} />
          <p className="muted">Sem o dicionário, você ainda pode escrever a definição abaixo.</p>
        </div>
      )}

      <div className="card">
        <h2>Qual é o sentido?</h2>
        {routeSenses.length > 0 && (
          <div className="road-found">
            <p>🛣️ <strong>Encontrada na estrada!</strong> Essa palavra está na rota em {getPhaseOfSense(routeSenses[0].id)?.city}. Se for um destes sentidos, você estuda agora a versão da rota:</p>
            {routeSenses.map((s) => {
              const card = cards?.find((c) => c.senseId === s.id)
              return (
                <label key={s.id} className={`sense-option ${card ? 'disabled' : ''}`}>
                  <input type="radio" name="sense" disabled={!!card} checked={choice?.kind === 'route' && choice.senseId === s.id} onChange={() => setChoice({ kind: 'route', senseId: s.id })} />
                  <span>
                    {card && <LightBadge light={lightOf(card.fsrs)} />} <strong>{s.translationPt}</strong> · {s.definition}
                    {card && <em className="muted"> (você já estuda essa)</em>}
                  </span>
                </label>
              )
            })}
          </div>
        )}

        {dictSenses.map((s, i) => (
          <label key={i} className="sense-option">
            <input type="radio" name="sense" checked={choice?.kind === 'dict' && choice.index === i} onChange={() => pickDict(i)} />
            <span>
              <span className="badge">{POS_LABEL[s.pos]}</span> {s.definition}
              {s.example && <em className="muted"> "{s.example}"</em>}
            </span>
          </label>
        ))}

        <label className="sense-option">
          <input type="radio" name="sense" checked={choice?.kind === 'manual'} onChange={() => setChoice({ kind: 'manual' })} />
          <span>{dictSenses.length ? 'Outro sentido (escrever)' : 'Escrever a definição'}</span>
        </label>
        {choice?.kind === 'manual' && (
          <div className="capture">
            <select value={manualPos} onChange={(e) => setManualPos(e.target.value as PartOfSpeech)} aria-label="Classe gramatical">
              {POS_OPTIONS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
            <textarea value={manualDefinition} onChange={(e) => setManualDefinition(e.target.value)} placeholder="Definição curta em inglês" aria-label="Definição em inglês" rows={2} />
          </div>
        )}
      </div>

      {isCustom && (
        <div className="card capture">
          <h2>Frase do card</h2>
          <p className="muted">Use a frase onde você encontrou a palavra. A palavra vira a lacuna do card.</p>
          <textarea value={sentence} onChange={(e) => setSentence(e.target.value)} rows={3} aria-label="Frase do card" placeholder="Uma frase com a palavra" />
          {sentence.trim() && (gap ? <p className="muted">Card: {gap.text}</p> : <p className="warning">A frase precisa conter "{current}" (ou uma forma dela, como "{current}s" ou "{current}ed").</p>)}
          <label htmlFor="ex-pt"><strong>Tradução</strong> <span className="muted">(opcional, dá para adicionar depois)</span></label>
          <input id="ex-pt" value={translation} onChange={(e) => setTranslation(e.target.value)} placeholder="Em português" />
          <label htmlFor="ex-source"><strong>Onde você viu</strong> <span className="muted">(opcional)</span></label>
          <input id="ex-source" value={source} onChange={(e) => setSource(e.target.value)} placeholder="Podcast, série, livro…" />
        </div>
      )}

      <button className="primary" onClick={() => void save()} disabled={!canSave}>Salvar no Diário</button>
      <button onClick={onDone} className="button">Voltar</button>
    </section>
  )
}
