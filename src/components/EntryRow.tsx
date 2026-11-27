import { Link } from 'react-router-dom'
import { getPhaseOfSense } from '../content/index.ts'
import type { ExplorerEntry, StudyCard } from '../db/db.ts'
import { deleteEntry, senseOfEntry } from '../explorer/explorer.ts'
import { lightOf } from '../study/scheduler.ts'
import LightBadge from './LightBadge.tsx'

/** One word of the Diário de bordo, with its traffic light and actions. */
export default function EntryRow({ entry, card, showSource = true }: { entry: ExplorerEntry; card?: StudyCard; showSource?: boolean }) {
  const sense = senseOfEntry(entry)
  const city = entry.senseId ? getPhaseOfSense(entry.senseId)?.city : undefined
  return (
    <li>
      <div>
        <div className="entry-title">
          {card ? <LightBadge light={lightOf(card.fsrs)} /> : <span className="badge">na fila</span>}
          <strong>{sense?.lemma ?? entry.word}</strong>
          {sense?.translationPt && <span className="muted">· {sense.translationPt}</span>}
        </div>
        <p className="muted">{sense?.definition}</p>
        {city && <p className="muted">🛣️ Encontrada na estrada: está na rota em {city}</p>}
        {showSource && entry.source && <p className="muted">📍 {entry.source}</p>}
      </div>
      <div className="entry-actions">
        {entry.custom && <Link className="button small" to={`/diario/completar/${entry.id}`}>Editar</Link>}
        <button
          className="icon"
          onClick={() => {
            if (window.confirm(`Apagar "${entry.word}" do Diário? O progresso dessa palavra será perdido.`)) void deleteEntry(entry)
          }}
          aria-label={`Apagar ${entry.word}`}
        >
          🗑️
        </button>
      </div>
    </li>
  )
}
