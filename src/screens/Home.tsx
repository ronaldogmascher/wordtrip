import TrafficLight from '../components/TrafficLight.tsx'

export default function Home() {
  return (
    <section className="screen">
      <header className="hero">
        <p className="eyebrow">Fase 1 · Santo André</p>
        <h1>Bem-vindo ao WordTrip 🚐</h1>
        <p>Sua viagem de motorhome até a fluência em inglês começa aqui.</p>
      </header>

      <div className="card">
        <h2>Plano de hoje</h2>
        <p className="muted">Os cards chegam na próxima etapa da construção. Por enquanto, este é o esqueleto do app.</p>
        <button className="primary" disabled>Começar sessão</button>
      </div>

      <div className="card">
        <h2>Como ler o semáforo</h2>
        <TrafficLight />
      </div>
    </section>
  )
}
