import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import TrafficLight from '../components/TrafficLight.tsx'
import { useHomeMusic } from '../audio/useHomeMusic.ts'
import { db, getSettings } from '../db/db.ts'
import { dayPlan, localDate } from '../study/session.ts'

export default function Home() {
  // Re-computed whenever cards, days or settings change.
  const plan = useLiveQuery(async () => {
    await Promise.all([db.cards.count(), db.days.count(), db.settings.count()])
    return dayPlan(new Date())
  })
  const today = useLiveQuery(() => db.days.get(localDate(new Date())))
  const settings = useLiveQuery(getSettings)
  useHomeMusic(settings?.backgroundMusic ?? false)

  return (
    <section className="screen">
      <header className="hero">
        <p className="eyebrow">Fase 1 · Santo André</p>
        <h1>Bem-vindo ao WordTrip 🚐</h1>
        <p>Sua viagem de motorhome até a fluência em inglês começa aqui.</p>
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
                Hoje: {today.cardsReviewed} cards · {Math.round(today.activeSeconds / 60)} min · {today.xp} XP
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

      <div className="card">
        <h2>Treinos livres</h2>
        <p className="muted">Fora da rota, sem limite diário.</p>
        <div className="row">
          <Link className="button" to="/numeros">🔢 Números e horas</Link>
          <Link className="button" to="/ipa">🗣️ Trilha de IPA</Link>
        </div>
      </div>

      <div className="card">
        <h2>Como ler o semáforo</h2>
        <TrafficLight />
      </div>
    </section>
  )
}
