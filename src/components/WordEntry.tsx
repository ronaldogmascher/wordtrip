import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { getPhaseOfSense, getSensesByLemma } from '../content/index.ts'
import { db } from '../db/db.ts'
import { POS_LABEL, wiktionaryUrl, type Dictionary } from '../dictionary/dictionary.ts'
import { lightOf } from '../study/scheduler.ts'
import LightBadge from './LightBadge.tsx'

interface Props {
  dict: Dictionary
  lemma: string
  /** Compact mode (popup): fewer senses, no synonym links. */
  compact?: boolean
  /** Called when the learner taps a synonym. */
  onWord?: (word: string) => void
}

/** Everything the app knows about a word: route senses (with traffic light) + dictionary senses. */
export default function WordEntry({ dict, lemma, compact = false, onWord }: Props) {
  const routeSenses = getSensesByLemma(lemma)
  const cards = useLiveQuery(
    () => db.cards.where('senseId').anyOf(routeSenses.map((s) => s.id)).toArray(),
    [lemma],
  )
  const senses = dict.lookup(lemma)
  const maxPerPos = compact ? 2 : 8
  // Parts of speech in order of their most frequent sense ("up": adverb before verb).
  const posOrder = [...new Set(senses.map((s) => s.pos))]

  return (
    <article className="word-entry">
      <h2 className="lemma">{lemma}</h2>
      {routeSenses[0] && (
        <p className="ipa muted">
          /{routeSenses[0].ipaUS}/
        </p>
      )}

      {routeSenses.length > 0 && (
        <div className="route-senses">
          {routeSenses.map((s) => {
            const card = cards?.find((c) => c.senseId === s.id)
            return (
              <div key={s.id} className="route-sense">
                {card ? <LightBadge light={lightOf(card.fsrs)} /> : <span className="badge">na rota · {getPhaseOfSense(s.id)?.city}</span>}
                <span><strong>{s.translationPt}</strong> · <span className="muted">{s.definition}</span></span>
              </div>
            )
          })}
        </div>
      )}

      {senses.length === 0 && <p className="muted">Essa palavra não está no dicionário offline.</p>}
      {posOrder.map((pos) => {
        const list = senses.filter((s) => s.pos === pos)
        if (list.length === 0) return null
        return (
          <section key={pos} className="dict-pos">
            <h3>{POS_LABEL[pos]}</h3>
            <ol>
              {list.slice(0, maxPerPos).map((s, i) => (
                <li key={i}>
                  {s.definition}
                  {s.example && <em className="dict-example"> "{s.example}"</em>}
                  {!compact && s.synonyms.length > 0 && (
                    <span className="dict-synonyms">
                      {' '}= {s.synonyms.map((w, j) => (
                        <span key={w}>
                          {j > 0 && ', '}
                          {onWord ? <button className="link" onClick={() => onWord(w)}>{w}</button> : w}
                        </span>
                      ))}
                    </span>
                  )}
                </li>
              ))}
            </ol>
            {list.length > maxPerPos && <p className="muted">+ {list.length - maxPerPos} outros sentidos</p>}
          </section>
        )
      })}

      <p className="dict-links">
        {compact && <Link to={`/dicionario/${encodeURIComponent(lemma)}`}>Abrir no Dicionário</Link>}
        <a href={wiktionaryUrl(lemma)} target="_blank" rel="noreferrer">Wiktionary (online) ↗</a>
      </p>
    </article>
  )
}
