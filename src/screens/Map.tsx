import { useLiveQuery } from 'dexie-react-hooks'
import { cities, phases } from '../content/index.ts'
import { db } from '../db/db.ts'
import { BOSS_READY_SHARE, routeProgress, type CityProgress } from '../game/progress.ts'
import { LIGHTS } from '../study/lights.ts'
import { characterIcon, petIcon } from '../game/traveler.ts'

// The journey map: a trail (not geographic) from Santo André to the border in Foz do Iguaçu.
// Finished cities show a flag, the current one pulses with the motorhome, the next ones wait.

export default function JourneyMap() {
  const data = useLiveQuery(async () => {
    const [cards, bosses, profile] = await Promise.all([db.cards.toArray(), db.bossAttempts.toArray(), db.profile.get('me')])
    return { progress: routeProgress(cities, phases, cards, bosses), profile }
  })

  if (!data) return <section className="screen"><p className="muted">Carregando…</p></section>
  const { progress, profile } = data

  return (
    <section className="screen">
      <p className="eyebrow">Trecho 1 · A1 · Brasil</p>
      <h1>🗺️ Mapa da jornada</h1>
      <p className="muted">De Santo André até a fronteira em Foz do Iguaçu. Quando {Math.round(BOSS_READY_SHARE * 100)}% das palavras de uma cidade estiverem amarelas ou verdes, o chefão da cidade aparece.</p>
      <ol className="trail">
        {progress.map((p) => (
          <CityStop key={p.city.phaseId} p={p} traveler={profile ? `${characterIcon(profile.character)}${petIcon(profile.pet)}` : ''} motorhome={profile?.motorhomeName} />
        ))}
        <li className="trail-stop ahead">
          <span className="trail-icon">🌎</span>
          <div className="trail-body">
            <strong>Próximo trecho: América Latina (A2)</strong>
            <p className="muted">Buenos Aires, Lima, Machu Picchu, Cidade do México… chega depois da fronteira.</p>
          </div>
        </li>
      </ol>
    </section>
  )
}

function CityStop({ p, traveler, motorhome }: { p: CityProgress; traveler: string; motorhome?: string }) {
  const { city, status } = p
  const pct = Math.round(p.share * 100)
  return (
    <li className={`trail-stop ${status}`}>
      <span className="trail-icon" aria-hidden="true">{status === 'done' ? '🏁' : city.icon}</span>
      <div className="trail-body">
        <strong>{city.number}. {city.name}</strong> <span className="muted">· {city.region}</span>
        <p className="muted">{city.landmark}</p>
        {status === 'current' && (
          <p className="trail-here">🚐 {motorhome ?? 'Seu motorhome'} está aqui {traveler}</p>
        )}
        {(status === 'current' || p.learning + p.learned > 0) && (
          <>
            <div className="trail-bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% amarelas ou verdes`}>
              <span className="learned" style={{ width: `${(p.learned / p.total) * 100}%` }} />
              <span className="learning" style={{ width: `${(p.learning / p.total) * 100}%` }} />
            </div>
            <p className="trail-counts">
              <span className="state-discovering">{LIGHTS.discovering.icon} {p.discovering}</span>
              <span className="state-learning">{LIGHTS.learning.icon} {p.learning}</span>
              <span className="state-learned">{LIGHTS.learned.icon} {p.learned}</span>
              <span className="muted">de {p.total} · {pct}%</span>
            </p>
          </>
        )}
        {status === 'current' && p.bossReady && <p className="trail-boss">⚔️ O chefão da cidade está te esperando! (chega na próxima atualização)</p>}
        {status === 'done' && <p className="muted">🏁 Cidade concluída · cartão-postal conquistado</p>}
      </div>
    </li>
  )
}
