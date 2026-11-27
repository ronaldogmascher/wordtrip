import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import EntryRow from '../components/EntryRow.tsx'
import { db, type ExplorerEntry } from '../db/db.ts'
import { DETOUR_NEW_PER_SESSION, deleteDetour } from '../detour/detour.ts'
import { explorerSenseId } from '../explorer/explorer.ts'
import { lightOf } from '../study/scheduler.ts'

/** A detour: its words, progress and the button to train them. */
export default function DetourView() {
  const id = Number(useParams().id)
  const navigate = useNavigate()
  const detour = useLiveQuery(() => db.detours.get(id), [id])
  const words = useLiveQuery(() => db.explorer.where('detourId').equals(id).toArray(), [id])
  const cards = useLiveQuery(() => db.cards.toArray())

  const cardOf = (e: ExplorerEntry) => cards?.find((c) => c.senseId === (e.senseId ?? explorerSenseId(e.id ?? -1)))
  const started = words?.filter((w) => cardOf(w)).length ?? 0
  const learned = words?.filter((w) => {
    const c = cardOf(w)
    return c && lightOf(c.fsrs) === 'learned'
  }).length ?? 0

  if (detour === undefined) return <section className="screen"><p className="muted">Carregando…</p></section>

  return (
    <section className="screen">
      <p className="eyebrow">Desvio fora da rota</p>
      <h1>📍 {detour.name}</h1>
      <div className="card">
        <p><strong>{words?.length ?? 0}</strong> palavras · {started} começadas · {learned} aprendidas</p>
        <p className="muted">Cada treino traz as revisões deste desvio e até {DETOUR_NEW_PER_SESSION} palavras novas. As revisões também aparecem no seu estudo do dia.</p>
        <Link className="button primary" to={`/estudar?tipo=detour&desvio=${id}`}>Treinar este desvio</Link>
      </div>
      <div className="card">
        <h2>Palavras</h2>
        <ul className="entry-list">
          {words?.map((w) => <EntryRow key={w.id} entry={w} card={cardOf(w)} showSource={false} />)}
        </ul>
      </div>
      <button
        className="button"
        onClick={() => {
          if (window.confirm(`Apagar o desvio "${detour.name}" e o progresso das palavras dele?`)) {
            void deleteDetour(id).then(() => navigate('/diario'))
          }
        }}
      >
        Apagar desvio
      </button>
    </section>
  )
}
