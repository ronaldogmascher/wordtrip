import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Postcard from '../components/Postcard.tsx'
import { cities, phases } from '../content/index.ts'
import { db, type BossAttempt, type Reward } from '../db/db.ts'
import { nextTryAt, upgradesEarned } from '../game/boss.ts'
import { BOSS_READY_SHARE, routeProgress, type CityProgress } from '../game/progress.ts'
import { LIGHTS } from '../study/lights.ts'
import { timeUntil } from '../study/when.ts'
import { characterIcon, petIcon } from '../game/traveler.ts'

// The journey map: a trail (not geographic) from Santo André to the border in Foz do Iguaçu.
// Finished cities show a flag, the current one pulses with the motorhome, the next ones wait.

export default function JourneyMap() {
  const data = useLiveQuery(async () => {
    const [cards, bosses, profile, rewards] = await Promise.all([db.cards.toArray(), db.bossAttempts.toArray(), db.profile.get('me'), db.rewards.toArray()])
    return { progress: routeProgress(cities, phases, cards, bosses), bosses, profile, rewards, now: new Date() }
  })

  if (!data) return <section className="screen"><p className="muted">Carregando…</p></section>
  const { progress, bosses, profile, rewards, now } = data
  const beatenAt = new Map(bosses.filter((b) => b.passed).map((b) => [b.phaseId, b.at]))
  const postcards = cities.filter((c) => beatenAt.has(c.phaseId))
  const upgrades = upgradesEarned([cities], bosses)
  const claimed = rewards.filter((r) => r.claimedAt)

  return (
    <section className="screen">
      <p className="eyebrow">Trecho 1 · A1 · Brasil</p>
      <h1>🗺️ Mapa da jornada</h1>
      <p className="muted">De Santo André até a fronteira em Foz do Iguaçu. Quando {Math.round(BOSS_READY_SHARE * 100)}% das palavras de uma cidade estiverem amarelas ou verdes, o chefão da cidade aparece. Vencendo, a próxima cidade abre.</p>
      <ol className="trail">
        {progress.map((p) => (
          <CityStop key={p.city.phaseId} p={p} bosses={bosses} now={now} reward={rewards.find((r) => r.phaseId === p.city.phaseId)}
            traveler={profile ? `${characterIcon(profile.character)}${petIcon(profile.pet)}` : ''} motorhome={profile?.motorhomeName} />
        ))}
        <li className="trail-stop ahead">
          <span className="trail-icon">🌎</span>
          <div className="trail-body">
            <strong>Próximo trecho: América Latina (A2)</strong>
            <p className="muted">Buenos Aires, Lima, Machu Picchu, Cidade do México… chega depois da fronteira.</p>
          </div>
        </li>
      </ol>

      <div className="card">
        <h2>🚐 {profile?.motorhomeName ?? 'Seu motorhome'}</h2>
        {upgrades.length > 0 && <p>{upgrades.map((u) => `${u.icon} ${u.name}`).join(' · ')}</p>}
        {postcards.length === 0 ? (
          <p className="muted">Cada chefão vencido dá um cartão-postal, que fica colado aqui no motorhome.</p>
        ) : (
          <div className="postcards">
            {postcards.map((c) => <Postcard key={c.phaseId} icon={c.icon} name={c.name} landmark={c.landmark} date={beatenAt.get(c.phaseId)} />)}
          </div>
        )}
      </div>

      {claimed.length > 0 && (
        <div className="card">
          <h2>🏆 Mural de conquistas</h2>
          <ul className="achievements">
            {claimed.map((r) => (
              <li key={r.phaseId}>🎁 <strong>{r.text}</strong> <span className="muted">· {cities.find((c) => c.phaseId === r.phaseId)?.name} · {r.claimedAt?.toLocaleDateString('pt-BR')}</span></li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

function CityStop({ p, bosses, now, reward, traveler, motorhome }: { p: CityProgress; bosses: BossAttempt[]; now: Date; reward?: Reward; traveler: string; motorhome?: string }) {
  const { city, status } = p
  const pct = Math.round(p.share * 100)
  const tryAt = status === 'current' ? nextTryAt(city.phaseId, bosses, now) : null
  const arrival = phases.find((ph) => ph.id === city.phaseId)?.arrival
  return (
    <li className={`trail-stop ${status}`}>
      <span className="trail-icon" aria-hidden="true">{status === 'done' ? '🏁' : status === 'ahead' ? '🔒' : city.icon}</span>
      <div className="trail-body">
        <strong>{city.number}. {city.name}</strong> <span className="muted">· {city.region}</span>
        <p className="muted">{city.landmark}</p>
        {status === 'current' && (
          <>
            <p className="trail-here">🚐 {motorhome ?? 'Seu motorhome'} está aqui {traveler}</p>
            {arrival && <p className="arrival">{arrival}</p>}
          </>
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
        {status === 'current' && <RewardField phaseId={city.phaseId} reward={reward} />}
        {status === 'current' && p.bossReady && tryAt && (
          tryAt > now
            ? <p className="trail-boss">⏳ Revanche contra o chefão {timeUntil(tryAt, now)}.</p>
            : <Link className="button primary trail-boss-button" to={`/chefao/${city.phaseId}`}>⚔️ Enfrentar o chefão</Link>
        )}
        {status === 'done' && <p className="muted">🏁 Cidade concluída · cartão-postal conquistado</p>}
      </div>
    </li>
  )
}

/** Optional personal reward for beating this city's boss, chosen by the learner. */
function RewardField({ phaseId, reward }: { phaseId: string; reward?: Reward }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(reward?.text ?? '')
  if (reward && !editing) {
    return <p className="reward">🎁 Recompensa: <strong>{reward.text}</strong> <button className="link" onClick={() => setEditing(true)}>mudar</button></p>
  }
  if (!editing) return <button className="link reward" onClick={() => setEditing(true)}>🎁 Definir uma recompensa para quando vencer o chefão (opcional)</button>
  const save = async () => {
    const value = text.trim()
    if (value) await db.rewards.put({ phaseId, text: value })
    else await db.rewards.delete(phaseId)
    setEditing(false)
  }
  return (
    <form className="typing reward" onSubmit={(e) => { e.preventDefault(); void save() }}>
      <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: um açaí, um filme no cinema" aria-label="Sua recompensa" maxLength={80} />
      <button className="primary" type="submit">Salvar</button>
    </form>
  )
}
