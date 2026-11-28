import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Postcard from '../components/Postcard.tsx'
import { phases } from '../content/index.ts'
import { db, type BossAttempt, type Reward } from '../db/db.ts'
import { nextTryAt, upgradesEarned } from '../game/boss.ts'
import { cityPreview } from '../game/preview.ts'
import { BOSS_READY_SHARE, routeProgress, type CityProgress } from '../game/progress.ts'
import { LIGHTS } from '../study/lights.ts'
import { timeUntil } from '../study/when.ts'
import { characterIcon, petIcon } from '../game/traveler.ts'
import { routeCities } from '../game/route.ts'
import { EXAM_ID, hasLicense } from '../school/quiz.ts'
import { NEEDS_LICENSE } from '../school/levels.ts'
import { useDevMode } from '../dev.ts'
import { LEGS } from '../content/legs.ts'

// The journey map: a trail (not geographic) from the traveler's home city to New York, in four legs.
// The current leg is open; the others fold into a summary.
// Finished cities show a flag, the current one pulses with the motorhome, the next ones wait.

export default function JourneyMap() {
  const data = useLiveQuery(async () => {
    const [cards, bosses, profile, rewards] = await Promise.all([db.cards.toArray(), db.bossAttempts.toArray(), db.profile.get('me'), db.rewards.toArray()])
    const route = routeCities(profile?.homeCity)
    return { route, progress: routeProgress(route, phases, cards, bosses), bosses, profile, rewards, now: new Date() }
  })

  if (!data) return <section className="screen"><p className="muted">Carregando…</p></section>
  const { route, progress, bosses, profile, rewards, now } = data
  const locked = Boolean(profile?.level && NEEDS_LICENSE.includes(profile.level) && !hasLicense(bosses))
  const license = bosses.find((b) => b.phaseId === EXAM_ID && b.passed)
  const beatenAt = new Map(bosses.filter((b) => b.passed).map((b) => [b.phaseId, b.at]))
  const postcards = route.filter((c) => beatenAt.has(c.phaseId))
  const legs = LEGS.map((leg) => ({ leg, stops: progress.filter((p) => p.city.cefr === leg.cefr) }))
  const upgrades = upgradesEarned(legs.map((l) => l.stops.map((p) => p.city)), bosses)
  const currentCity = progress.find((p) => p.status === 'current')?.city
  const currentLeg = LEGS.find((l) => l.cefr === (currentCity?.cefr ?? 'B2')) ?? LEGS[0]
  const showAsLocked = (p: CityProgress) => (locked ? { ...p, status: 'ahead' as const, bossReady: false } : p)
  const claimed = rewards.filter((r) => r.claimedAt)

  return (
    <section className="screen">
      <p className="eyebrow">Trecho {LEGS.indexOf(currentLeg) + 1} · {currentLeg.cefr} · {currentLeg.name}</p>
      <h1>🗺️ Mapa da jornada</h1>
      <p className="muted">De {route[0].name === 'Sua cidade' ? 'sua cidade' : route[0].name} até Nova York: {route.length} cidades em 4 trechos, um por nível. Quando {Math.round(BOSS_READY_SHARE * 100)}% das palavras de uma cidade estiverem amarelas ou verdes, o chefão da cidade aparece. Vencendo, a próxima cidade abre.</p>
      {locked && (
        <div className="card school-gate">
          <h2>🚧 Estrada fechada para quem ainda não tem CNH</h2>
          <p>O mapa abre quando você passar na prova da CNH, na Autoescola. Lá você aprende o básico do inglês antes de pegar a estrada. Enquanto isso, dá para espiar o caminho aqui embaixo.</p>
          <Link className="button primary" to="/autoescola">Ir para a Autoescola</Link>
        </div>
      )}
      {license && (
        <div className="card license-badge">
          <span className="license-icon" aria-hidden="true">🪪</span>
          <div>
            <strong>CNH conquistada!</strong>
            <p className="muted">Aprovado na prova da Autoescola em {license.at.toLocaleDateString('pt-BR')}. A estrada está liberada.</p>
          </div>
        </div>
      )}
      {legs.map(({ leg, stops }, i) => {
        const done = stops.filter((p) => p.status === 'done').length
        const trail = (
          <ol className="trail">
            {stops.map((p) => (
              <CityStop key={p.city.phaseId} p={showAsLocked(p)} bosses={bosses} now={now} reward={rewards.find((r) => r.phaseId === p.city.phaseId)}
                traveler={profile ? `${characterIcon(profile.character)}${petIcon(profile.pet)}` : ''} motorhome={profile?.motorhomeName} />
            ))}
          </ol>
        )
        const heading = <>Trecho {i + 1} · {leg.name} <span className="muted">· {leg.cefr} · {done} de {stops.length} cidades</span></>
        return leg === currentLeg
          ? <section key={leg.cefr} className="leg"><h2 className="leg-title">{heading}</h2>{trail}</section>
          : <details key={leg.cefr} className="leg card"><summary className="leg-title">{heading}</summary>{trail}</details>
      })}

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
              <li key={r.phaseId}>🎁 <strong>{r.text}</strong> <span className="muted">· {route.find((c) => c.phaseId === r.phaseId)?.name} · {r.claimedAt?.toLocaleDateString('pt-BR')}</span></li>
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
  const phase = phases.find((ph) => ph.id === city.phaseId)
  const arrival = phase?.arrival
  const preview = phase && cityPreview(phase)
  const dev = useDevMode()
  return (
    <li className={`trail-stop ${status}`}>
      <span className="trail-icon" aria-hidden="true">{status === 'done' ? '🏁' : status === 'ahead' ? '🔒' : city.icon}</span>
      <div className="trail-body">
        <strong>{city.number}. {city.name}</strong>{city.region && <span className="muted"> · {city.region}</span>}
        <p className="muted">{city.landmark}</p>
        {preview && (
          <p className="preview">
            📚 {status === 'done' ? 'Você aprendeu' : 'Você vai aprender'}: <em>{preview.topics.join(', ')}</em>
            <span className="muted"> · {preview.sample.join(', ')}…</span>
          </p>
        )}
        {!city.available && <p className="muted">🚧 As palavras desta cidade chegam numa próxima versão do app.</p>}
        {status === 'current' && (
          <>
            <p className="trail-here">🚐 {motorhome ?? 'Seu motorhome'} está aqui {traveler}</p>
            {arrival && <p className="arrival">{arrival}</p>}
          </>
        )}
        {city.available && (status === 'current' || p.learning + p.learned > 0) && (
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
        {status === 'current' && city.available && <RewardField phaseId={city.phaseId} reward={reward} />}
        {status === 'current' && p.bossReady && tryAt && (
          tryAt > now
            ? <p className="trail-boss">⏳ Revanche contra o chefão {timeUntil(tryAt, now)}.</p>
            : <Link className="button primary trail-boss-button" to={`/chefao/${city.phaseId}`}>⚔️ Enfrentar o chefão</Link>
        )}
        {status === 'done' && <p className="muted">🏁 Cidade concluída · cartão-postal conquistado</p>}
        {dev && city.available && (
          <div className="row dev-row">
            <Link className="button" to={`/estudar?tipo=city&cidade=${city.phaseId}`}>🛠️ 10 novas</Link>
            <Link className="button" to={`/chefao/${city.phaseId}`}>🛠️ Chefão</Link>
          </div>
        )}
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
