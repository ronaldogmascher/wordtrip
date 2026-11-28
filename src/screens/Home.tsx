import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import Info, { InfoIcon } from '../components/Info.tsx'
import TrafficLight from '../components/TrafficLight.tsx'
import { phases } from '../content/index.ts'
import { db, getSettings } from '../db/db.ts'
import { nextTryAt } from '../game/boss.ts'
import { routeCities } from '../game/route.ts'
import { placementState } from '../game/placement.ts'
import { hasLicense } from '../school/quiz.ts'
import { NEEDS_LICENSE, OFFERS_PLACEMENT } from '../school/levels.ts'
import { backupDue } from '../db/backup.ts'
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
    const [days, cards, bosses, profile, settings] = await Promise.all([db.days.toArray(), db.cards.toArray(), db.bossAttempts.toArray(), db.profile.get('me'), getSettings()])
    const km = totalKm(days)
    const current = routeProgress(routeCities(profile?.homeCity), phases, cards, bosses).find((p) => p.status === 'current')
    const now = new Date()
    const tryAt = current?.bossReady ? nextTryAt(current.city.phaseId, bosses, now) : null
    return { km, fuel: fuel(km), level: levelOf(km).level, current, profile, bossNow: tryAt !== null && tryAt <= now,
      needsLicense: !!profile?.level && NEEDS_LICENSE.includes(profile.level) && !hasLicense(bosses),
      offerPlacement: !!profile?.level && OFFERS_PLACEMENT.includes(profile.level) && placementState(bosses) === 'open'
        && !bosses.some((b) => b.passed && b.phaseId.startsWith('en:')),
      insuranceDue: cards.length > 0 && backupDue(settings.backupReminderDays, settings.lastBackupAt, profile?.createdAt, now) }
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
            <Info label={<>🛣️ {trip.km} km</>}>
              <strong>Quilômetros rodados.</strong> Cada card respondido faz o motorhome andar: quanto melhor a resposta, mais km. Os km nunca diminuem e definem o seu nível.
            </Info>
            <Info label={<>⛽ {trip.fuel}</>}>
              <strong>Combustível.</strong> Cada km rodado vira 1 ⛽. Em breve dá para gastar em passeios bônus, personalizar o motorhome e proteger a sequência de dias. Dicas e tradução nunca custam combustível.
            </Info>
            <Info label={<>⭐ Nível {trip.level}</>}>
              <strong>Nível do viajante.</strong> Sobe com os km rodados: o nível 2 pede 100 km, o 3 mais 200, o 4 mais 300, e assim por diante.
            </Info>
          </div>
        )}
      </header>

      {trip?.needsLicense && (
        <div className="card school-gate">
          <h2>🚗 Primeiro, a Autoescola</h2>
          <p>Antes de pegar a estrada, tire a sua carteira de motorista: faça as aulas iniciais (alfabeto, cumprimentos, números…) e passe na prova da CNH. Aí o mapa e a primeira cidade abrem.</p>
          <Link className="button primary" to="/autoescola">Ir para a Autoescola</Link>
        </div>
      )}

      {trip?.offerPlacement && (
        <div className="card school-gate">
          <h2>📝 Prova de nivelamento</h2>
          <p>Já sabe o básico? Passe na prova do trecho A1 e as cidades do Brasil ficam concluídas. São 2 tentativas.</p>
          <Link className="button primary" to="/nivelamento">Fazer a prova</Link>
        </div>
      )}

      {!trip?.needsLicense && <div className="card">
        <h2>Plano de hoje <InfoIcon>As <strong>revisões</strong> são palavras que já viu e que o app calculou que está na hora de relembrar, antes de esquecer. As <strong>novas</strong> são as próximas palavras da cidade atual, até o limite diário dos Ajustes. A "Sessão do dia" mistura as duas: uma nova a cada quatro revisões.</InfoIcon></h2>
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
      </div>}

      {trip?.bossNow && trip.current && (
        <div className="card boss-invite">
          <h2>⚔️ O chefão de {trip.current.city.name} apareceu!</h2>
          <p>Você já domina {Math.round(trip.current.share * 100)}% das palavras da cidade. Vença o chefão para seguir viagem.</p>
          <Link className="button primary" to={`/chefao/${trip.current.city.phaseId}`}>Enfrentar o chefão</Link>
        </div>
      )}

      {trip?.insuranceDue && (
        <div className="card insurance-invite">
          <h2>🛡️ Hora de renovar o seguro do motorhome</h2>
          <p>Salve um arquivo com o seu progresso para não perder nada se algo acontecer com o celular.</p>
          <Link className="button primary" to="/ajustes">Ir para o seguro</Link>
        </div>
      )}

      {workshop && <WorkshopInvite reason={workshop} />}

      <div className="card">
        <h2>🚗 Autoescola <InfoIcon>As aulas iniciais ensinam o básico (alfabeto, cumprimentos, números…) e terminam na prova da CNH. A prática livre não mexe no calendário de revisões: números, horas e cores, pronúncia (IPA), tempos verbais e regrinhas, e a Oficina, que reforça as palavras que você mais erra.</InfoIcon></h2>
        <p className="muted">Onde o viajante tira a carteira e volta para a reciclagem. Sem limite diário: treine o que quiser, quando quiser.</p>
        <Link className="button" to="/autoescola">🪪 Aulas iniciais e prova da CNH</Link>
        <h3>Prática livre</h3>
        <div className="gym-grid">
          <Link className="button" to="/numeros">🔢 Números, horas e cores</Link>
          <Link className="button" to="/ipa">🗣️ Trilha de IPA</Link>
          <Link className="button" to="/gramatica">📝 Gramática</Link>
          <Link className="button" to="/oficina">🔧 Oficina</Link>
        </div>
      </div>

      <div className="card">
        <h2>🚦 Como ler o semáforo</h2>
        <TrafficLight />
        <p><Link to="/manual">📘 Como funciona o WordTrip</Link></p>
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
