import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import TrafficLight from '../components/TrafficLight.tsx'
import { cities, phases } from '../content/index.ts'
import { db } from '../db/db.ts'
import { nextTryAt } from '../game/boss.ts'
import { fuel, levelOf, routeProgress, totalKm } from '../game/progress.ts'
import { pickWeakWords, workshopReason, type WorkshopReason } from '../workshop/workshop.ts'
import { dayPlan, localDate } from '../study/session.ts'

export default function Home() {
  // Re-computed whenever cards, days or settings change.
  const plan = useLiveQuery(async () => {
    await Promise.all([db.cards.count(), db.days.count(), db.settings.count()])
    return dayPlan(new Date())
  })
  const today = useLiveQuery(() => db.days.get(localDate(new Date())))
  const workshop = useLiveQuery(async () => {
    const [cards, reviews, last, bosses] = await Promise.all([
      db.cards.toArray(), db.reviews.toArray(), db.workshops.orderBy('at').last(), db.bossAttempts.toArray(),
    ])
    const now = new Date()
    return workshopReason(pickWeakWords(cards, reviews, now).length, last, bosses, now)
  })

  const trip = useLiveQuery(async () => {
    const [days, cards, bosses, profile] = await Promise.all([db.days.toArray(), db.cards.toArray(), db.bossAttempts.toArray(), db.profile.get('me')])
    const km = totalKm(days)
    const current = routeProgress(cities, phases, cards, bosses).find((p) => p.status === 'current')
    const now = new Date()
    const tryAt = current?.bossReady ? nextTryAt(current.city.phaseId, bosses, now) : null
    return { km, fuel: fuel(km), level: levelOf(km).level, current, profile, bossNow: tryAt !== null && tryAt <= now }
  })

  return (
    <section className="screen">
      <header className="hero">
        <p className="eyebrow">
          {trip?.current ? `Fase ${trip.current.city.number} · ${trip.current.city.name}` : 'Fronteira à vista'}
        </p>
        <h1>{trip?.profile ? `Olá, ${trip.profile.name}! 🚐` : 'Bem-vindo ao WordTrip 🚐'}</h1>
        <p>
          {trip?.profile ? `O ${trip.profile.motorhomeName} está pronto para mais um trecho.` : 'Sua viagem de motorhome até a fluência em inglês começa aqui.'}
          {trip?.current && <> <Link to="/mapa">Ver no mapa</Link></>}
        </p>
        {trip && (
          <div className="trip-stats">
            <span title="Quilômetros rodados: cada resposta faz o motorhome andar">🛣️ {trip.km} km</span>
            <span title="Combustível: cada km vira 1 ⛽">⛽ {trip.fuel}</span>
            <span title="Nível do viajante, pelos km rodados">⭐ Nível {trip.level}</span>
          </div>
        )}
      </header>

      <div className="card">
        <h2>Plano de hoje</h2>
        {plan ? (
          <>
            <p>
              <strong>{plan.reviewsDue}</strong> revisões + <strong>{plan.newRemaining}</strong> novas
              {plan.estimatedMinutes > 0 && <> · cerca de {plan.estimatedMinutes} min</>}
            </p>
            {plan.recovery && (
              <p className="warning">
                Modo recuperação: muitas revisões acumuladas. As palavras novas voltam quando ficarem menos de 50.
              </p>
            )}
            {today && (
              <p className="muted">
                Hoje: {today.cardsReviewed} cards · {Math.round(today.activeSeconds / 60)} min · {today.xp} km
              </p>
            )}
            <Link className="button primary" to="/estudar?tipo=mixed">Sessão do dia</Link>
            <div className="row">
              <Link className="button" to="/estudar?tipo=reviews">Só revisão</Link>
              {plan.recovery ? (
                <span className="button disabled" aria-disabled="true">Só novas</span>
              ) : (
                <Link className="button" to="/estudar?tipo=new">Só novas</Link>
              )}
            </div>
          </>
        ) : (
          <p className="muted">Carregando…</p>
        )}
      </div>

      {trip?.bossNow && trip.current && (
        <div className="card boss-invite">
          <h2>⚔️ O chefão de {trip.current.city.name} apareceu!</h2>
          <p>Você já domina {Math.round(trip.current.share * 100)}% das palavras da cidade. Vença o chefão para seguir viagem.</p>
          <Link className="button primary" to={`/chefao/${trip.current.city.phaseId}`}>Enfrentar o chefão</Link>
        </div>
      )}

      {workshop && <WorkshopInvite reason={workshop} />}

      <div className="card">
        <h2>🏋️ Academia</h2>
        <p className="muted">Uma parada fora da rota para malhar os músculos do vocabulário. Sem limite diário: treine o que quiser, quando quiser.</p>
        <div className="gym-grid">
          <Link className="button" to="/numeros">🔢 Números e horas</Link>
          <Link className="button" to="/ipa">🗣️ Trilha de IPA</Link>
          <Link className="button" to="/gramatica">📝 Gramática</Link>
          <Link className="button" to="/oficina">🔧 Oficina</Link>
        </div>
      </div>

      <div className="card">
        <h2>Como ler o semáforo</h2>
        <TrafficLight />
      </div>
    </section>
  )
}

const INVITE: Record<WorkshopReason, string> = {
  first: 'Algumas palavras estão escapando da memória. Que tal levar o motorhome para a Oficina e reforçar essas peças?',
  monthly: 'Já faz um mês desde a última revisão na Oficina. Hora de reforçar as palavras que você mais esquece!',
  city: 'Cidade concluída! Antes de seguir viagem, passe na Oficina para reforçar as palavras que mais deram trabalho.',
}

function WorkshopInvite({ reason }: { reason: WorkshopReason }) {
  return (
    <div className="card workshop-invite">
      <h2>🔧 Parada na Oficina</h2>
      <p>{INVITE[reason]}</p>
      <Link className="button primary" to="/oficina">Ir para a Oficina</Link>
    </div>
  )
}
