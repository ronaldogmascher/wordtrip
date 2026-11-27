import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { applyTheme, getTheme } from './theme.ts'

applyTheme(getTheme())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter keeps deep links working on GitHub Pages and offline. */}
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
)
