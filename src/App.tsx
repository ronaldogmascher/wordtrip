import { useLiveQuery } from 'dexie-react-hooks'
import { NavLink, Route, Routes } from 'react-router-dom'
import { db } from './db/db.ts'
import JourneyMap from './screens/Map.tsx'
import Onboarding from './screens/Onboarding.tsx'
import Dictionary from './screens/Dictionary.tsx'
import DetourNew from './screens/DetourNew.tsx'
import DetourView from './screens/DetourView.tsx'
import ExplorerForm from './screens/ExplorerForm.tsx'
import Home from './screens/Home.tsx'
import Ipa from './screens/Ipa.tsx'
import Grammar from './screens/Grammar.tsx'
import Workshop from './screens/Workshop.tsx'
import Journal from './screens/Journal.tsx'
import Numbers from './screens/Numbers.tsx'
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
  // Wrapped in an object so "still loading" (undefined) differs from "no profile yet".
  const loaded = useLiveQuery(async () => ({ profile: await db.profile.get('me') }))
  if (!loaded) return null
  if (!loaded.profile) {
    return (
      <div className="app">
        <main className="content"><Onboarding /></main>
      </div>
    )
  }

  return (
    <div className="app">
      <main className="content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/estudar" element={<Study />} />
          <Route path="/mapa" element={<JourneyMap />} />
          <Route path="/diario" element={<Journal />} />
          <Route path="/diario/completar/:id" element={<ExplorerForm />} />
          <Route path="/diario/desvio/novo" element={<DetourNew />} />
          <Route path="/diario/desvio/:id" element={<DetourView />} />
          <Route path="/painel" element={<Placeholder title="Painel" text="Sua evolução: palavras aprendidas, mais difíceis e tempo de estudo." />} />
          <Route path="/dicionario" element={<Dictionary />} />
          <Route path="/dicionario/:word" element={<Dictionary />} />
          <Route path="/numeros" element={<Numbers />} />
          <Route path="/ipa" element={<Ipa />} />
          <Route path="/gramatica" element={<Grammar />} />
          <Route path="/oficina" element={<Workshop />} />
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
