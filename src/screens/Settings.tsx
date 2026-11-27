import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { MUSIC_THEMES, startMusic, stopMusic, type MusicThemeId } from '../audio/music.ts'
import { db, getSettings, type Settings as AppSettings } from '../db/db.ts'
import { PENALTY, WRONG_ANSWER_CAP } from '../study/scoring.ts'
import { getTheme, setTheme, type ThemeChoice } from '../theme.ts'

const MIN_NEW_PER_DAY = 5
const MAX_NEW_PER_DAY = 50

function Segmented<T extends string>({ value, options, onChange, label }: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  )
}

export default function Settings() {
  const settings = useLiveQuery(getSettings)
  const [theme, setThemeState] = useState<ThemeChoice>(getTheme)

  const update = (patch: Partial<AppSettings>) => {
    if (settings) void db.settings.put({ ...settings, ...patch })
  }

  return (
    <section className="screen">
      <h1>Ajustes</h1>

      <div className="card settings-group">
        <h2>Tema</h2>
        <Segmented
          label="Tema"
          value={theme}
          options={[
            { value: 'auto', label: 'Automático' },
            { value: 'light', label: 'Claro' },
            { value: 'dark', label: 'Escuro' },
          ]}
          onChange={(t) => { setTheme(t); setThemeState(t) }}
        />
        <p className="muted">"Automático" segue o tema do seu celular ou computador.</p>
      </div>

      {settings && (
        <>
          <div className="card settings-group">
            <h2>Sotaque principal</h2>
            <Segmented
              label="Sotaque principal"
              value={settings.accent}
              options={[
                { value: 'US', label: 'Americano (US)' },
                { value: 'UK', label: 'Britânico (UK)' },
              ]}
              onChange={(accent) => update({ accent })}
            />
            <p className="muted">É o sotaque do áudio automático e o primeiro IPA mostrado. O outro continua disponível em cada card.</p>
          </div>

          <div className="card settings-group">
            <h2>Palavras novas por dia</h2>
            <label htmlFor="new-per-day">
              <strong>{Math.max(MIN_NEW_PER_DAY, settings.newPerDay)}</strong> palavras novas
            </label>
            <input
              id="new-per-day"
              className="slider-plain"
              type="range"
              min={MIN_NEW_PER_DAY}
              max={MAX_NEW_PER_DAY}
              step={5}
              value={Math.max(MIN_NEW_PER_DAY, settings.newPerDay)}
              onChange={(e) => update({ newPerDay: Number(e.target.value) })}
            />
            <p className="muted">De 5 a 50. Revisões não têm limite. O padrão é 15 novas por dia.</p>
          </div>

          <div className="card settings-group">
            <h2>Sons</h2>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => update({ soundEffects: e.target.checked })}
              />
              🔔 Efeitos sonoros de acerto e erro
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={settings.backgroundMusic}
                onChange={(e) => update({ backgroundMusic: e.target.checked })}
              />
              🎵 Música de viagem na tela inicial
            </label>
            <MusicPicker value={settings.musicTheme} onChange={(musicTheme) => update({ musicTheme })} />
            <p className="muted">A música começa quando você toca na tela (regra dos navegadores). Se o celular estiver no silencioso, os sons podem não tocar.</p>
          </div>
        </>
      )}

      <div className="card">
        <details className="readme">
          <summary>Leia-me: como funciona a nota de cada card</summary>
          <p>Traduzir e pedir dica fazem parte do aprendizado: use sempre que precisar. A nota só serve para o app decidir quando mostrar cada palavra de novo.</p>
          <ul>
            <li>Você dá uma nota de 0 a 10 para o quão fácil foi (0 = não lembrei, 10 = muito fácil).</li>
            <li>O app ajusta essa nota pelo que aconteceu no card: erro pequeno de ortografia −{PENALTY.typo}, tradução −{PENALTY.translation}, dica −{PENALTY.hint}.</li>
            <li>Se a resposta estiver errada, a nota final fica em no máximo {WRONG_ANSWER_CAP}.</li>
            <li>A nota final cai numa faixa: 0–3 Errei, 4–6 Difícil, 7–8 Bom, 9–10 Fácil. Quanto melhor a faixa, mais tempo até a próxima revisão (algoritmo FSRS).</li>
            <li>Depois de 2 acertos seguidos com nota 7 ou mais, a palavra passa da múltipla escolha para a escrita. Se errar a escrita 2 vezes seguidas, ela volta para a múltipla escolha.</li>
            <li>"Já sei": se você digitar a palavra certa sem tradução e sem dica, ela pula direto para uma revisão bem mais distante.</li>
          </ul>
        </details>
      </div>
    </section>
  )
}

/** Lets the learner hear each music theme and pick the one for the home screen. */
function MusicPicker({ value, onChange }: { value: MusicThemeId; onChange: (id: MusicThemeId) => void }) {
  const [previewing, setPreviewing] = useState<MusicThemeId | null>(null)

  // Stop the preview when leaving the screen.
  useEffect(() => () => stopMusic(), [])

  function togglePreview(id: MusicThemeId) {
    if (previewing === id) {
      stopMusic()
      setPreviewing(null)
    } else {
      startMusic(id)
      setPreviewing(id)
    }
  }

  return (
    <fieldset className="music-picker">
      <legend>Escolha a música</legend>
      {MUSIC_THEMES.map((t) => (
        <div key={t.id} className="music-option">
          <label>
            <input type="radio" name="music-theme" checked={value === t.id} onChange={() => onChange(t.id)} />
            <span>
              <strong>{t.label}</strong>
              <span className="muted"> · {t.description}</span>
            </span>
          </label>
          <button type="button" className="say" onClick={() => togglePreview(t.id)} aria-label={`Ouvir ${t.label}`}>
            {previewing === t.id ? '⏹ Parar' : '▶ Ouvir'}
          </button>
        </div>
      ))}
    </fieldset>
  )
}
