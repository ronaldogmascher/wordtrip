import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import EntryRow from '../components/EntryRow.tsx'
import { db, type ExplorerEntry } from '../db/db.ts'
import { captureWord, deleteEntry, explorerSenseId } from '../explorer/explorer.ts'
import { lightOf } from '../study/scheduler.ts'

/** "Diário de bordo": words the learner found on their own (Explorer mode). */
export default function Journal() {
  const navigate = useNavigate()
  const inbox = useLiveQuery(() => db.explorer.where('status').equals('inbox').reverse().sortBy('createdAt'))
  const ready = useLiveQuery(async () =>
    (await db.explorer.where('status').equals('ready').reverse().sortBy('createdAt')).filter((e) => e.detourId === undefined),
  )
  const detours = useLiveQuery(() => db.detours.orderBy('createdAt').reverse().toArray())
  const detourWords = useLiveQuery(() => db.explorer.where('detourId').above(0).toArray())
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
        <h2>Desvios 🛣️</h2>
        <p className="muted">
          Cole um texto (notícia, artigo, letra de música) ou um PDF de um assunto que você gosta. O app tira as palavras que você
          já sabe e monta um treino só com as que faltam. Cada texto vira um lugar fora da rota.
        </p>
        <ul className="entry-list">
          {detours?.map((d) => {
            const words = detourWords?.filter((w) => w.detourId === d.id) ?? []
            const learned = words.filter((w) => {
              const c = cardOf(w)
              return c && lightOf(c.fsrs) === 'learned'
            }).length
            return (
              <li key={d.id}>
                <div>
                  <strong>📍 {d.name}</strong>
                  <p className="muted">{words.length} palavras · {learned} aprendidas</p>
                </div>
                <div className="entry-actions">
                  <Link className="button small" to={`/diario/desvio/${d.id}`}>Abrir</Link>
                </div>
              </li>
            )
          })}
        </ul>
        <Link className="button" to="/diario/desvio/novo">+ Fazer um desvio (importar texto)</Link>
      </div>

      <div className="card">
        <h2>Minhas palavras ({ready?.length ?? 0})</h2>
        {ready && ready.length === 0 && <p className="muted">Ainda vazio. As palavras que você completar entram aqui e passam na frente das novas da rota, dentro do limite diário.</p>}
        <ul className="entry-list">
          {ready?.map((e) => <EntryRow key={e.id} entry={e} card={cardOf(e)} />)}
        </ul>
      </div>
    </section>
  )
}
