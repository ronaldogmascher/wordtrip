import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LightBadge from '../components/LightBadge.tsx'
import { getPhaseOfSense } from '../content/index.ts'
import { db, type ExplorerEntry } from '../db/db.ts'
import { captureWord, deleteEntry, explorerSenseId, senseOfEntry } from '../explorer/explorer.ts'
import { lightOf } from '../study/scheduler.ts'

/** "Diário de bordo": words the learner found on their own (Explorer mode). */
export default function Journal() {
  const navigate = useNavigate()
  const inbox = useLiveQuery(() => db.explorer.where('status').equals('inbox').reverse().sortBy('createdAt'))
  const ready = useLiveQuery(() => db.explorer.where('status').equals('ready').reverse().sortBy('createdAt'))
  const cards = useLiveQuery(() => db.cards.toArray())

  const [word, setWord] = useState('')
  const [sentence, setSentence] = useState('')
  const [source, setSource] = useState('')

  async function save(chooseNow: boolean) {
    if (!word.trim()) return
    const id = await captureWord(word, sentence, source)
    setWord('')
    setSentence('')
    setSource('')
    if (chooseNow) navigate(`/diario/completar/${id}`)
  }

  const cardOf = (entry: ExplorerEntry) => {
    const senseId = entry.senseId ?? (entry.id !== undefined ? explorerSenseId(entry.id) : '')
    return cards?.find((c) => c.senseId === senseId)
  }

  return (
    <section className="screen">
      <h1>Diário de bordo 📓</h1>

      <form className="card capture" onSubmit={(e) => { e.preventDefault(); void save(true) }}>
        <h2>Encontrou uma palavra nova?</h2>
        <p className="muted">Num podcast, série ou leitura. Anote agora e escolha o sentido depois, se estiver com pressa.</p>
        <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="Palavra em inglês" aria-label="Palavra em inglês" autoCapitalize="off" autoCorrect="off" spellCheck={false} />
        <textarea value={sentence} onChange={(e) => setSentence(e.target.value)} placeholder="Frase onde você viu (opcional)" aria-label="Frase onde você viu" rows={2} />
        <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Onde: podcast, série, livro… (opcional)" aria-label="Onde você viu" />
        <div className="row">
          <button type="button" className="button" onClick={() => void save(false)} disabled={!word.trim()}>Guardar na caixa de entrada</button>
          <button type="submit" className="primary inline" disabled={!word.trim()}>Escolher o sentido →</button>
        </div>
      </form>

      {inbox && inbox.length > 0 && (
        <div className="card">
          <h2>Caixa de entrada ({inbox.length})</h2>
          <ul className="entry-list">
            {inbox.map((e) => (
              <li key={e.id}>
                <div>
                  <strong>{e.word}</strong>
                  {e.sentence && <p className="muted">"{e.sentence}"</p>}
                </div>
                <div className="entry-actions">
                  <Link className="button small" to={`/diario/completar/${e.id}`}>Completar</Link>
                  <button className="icon" onClick={() => void deleteEntry(e)} aria-label={`Apagar ${e.word}`}>🗑️</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2>Minhas palavras ({ready?.length ?? 0})</h2>
        {ready && ready.length === 0 && <p className="muted">Ainda vazio. As palavras que você completar entram aqui e passam na frente das novas da rota, dentro do limite diário.</p>}
        <ul className="entry-list">
          {ready?.map((e) => {
            const sense = senseOfEntry(e)
            const card = cardOf(e)
            const city = e.senseId ? getPhaseOfSense(e.senseId)?.city : undefined
            return (
              <li key={e.id}>
                <div>
                  <div className="entry-title">
                    {card ? <LightBadge light={lightOf(card.fsrs)} /> : <span className="badge">na fila</span>}
                    <strong>{sense?.lemma ?? e.word}</strong>
                    {sense?.translationPt && <span className="muted">· {sense.translationPt}</span>}
                  </div>
                  <p className="muted">{sense?.definition}</p>
                  {city && <p className="muted">🛣️ Encontrada na estrada: está na rota em {city}</p>}
                  {e.source && <p className="muted">📍 {e.source}</p>}
                </div>
                <div className="entry-actions">
                  {e.custom && <Link className="button small" to={`/diario/completar/${e.id}`}>Editar</Link>}
                  <button className="icon" onClick={() => { if (window.confirm(`Apagar "${e.word}" do Diário? O progresso dessa palavra será perdido.`)) void deleteEntry(e) }} aria-label={`Apagar ${e.word}`}>🗑️</button>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
