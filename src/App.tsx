import { NavLink, Route, Routes } from 'react-router-dom'
import Dictionary from './screens/Dictionary.tsx'
import Home from './screens/Home.tsx'
import Placeholder from './screens/Placeholder.tsx'
import Settings from './screens/Settings.tsx'
import Study from './screens/Study.tsx'

const tabs = [
  { to: '/', label: 'Início', icon: '🏠' },
  { to: '/mapa', label: 'Mapa', icon: '🗺️' },
  { to: '/diario', label: 'Diário', icon: '📓' },
  { to: '/dicionario', label: 'Dicionário', icon: '📖' },
  { to: '/painel', label: 'Painel', icon: '📊' },
  { to: '/ajustes', label: 'Ajustes', icon: '⚙️' },
]

export default function App() {
  return (
    <div className="app">
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/estudar" element={<Study />} />
          <Route path="/mapa" element={<Placeholder title="Mapa da jornada" text="De Santo André a Nova York. As 12 cidades do Brasil chegam em breve." />} />
          <Route path="/diario" element={<Placeholder title="Diário de bordo" text="Aqui vão ficar as palavras que você encontrar em podcasts e leituras." />} />
          <Route path="/painel" element={<Placeholder title="Painel" text="Sua evolução: palavras aprendidas, mais difíceis e tempo de estudo." />} />
          <Route path="/dicionario" element={<Dictionary />} />
          <Route path="/dicionario/:word" element={<Dictionary />} />
          <Route path="/ajustes" element={<Settings />} />
        </Routes>
      </main>
      <nav className="tabbar" aria-label="Navegação principal">
        {tabs.map((t) => (
          <NavLink key={t.to} to={t.to} end={t.to === '/'} className="tab">
            <span aria-hidden="true">{t.icon}</span>
            <span>{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
