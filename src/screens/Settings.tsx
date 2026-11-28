import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { db, getSettings, type Profile, type Settings as AppSettings } from '../db/db.ts'
import { CHARACTERS, PETS } from '../game/traveler.ts'
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

      <TravelerCard />

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
            <p className="muted">Se o celular estiver no silencioso, os sons podem não tocar.</p>
          </div>
        </>
      )}

      <div className="card">
        <h2>📘 Ajuda</h2>
        <p className="muted">Como funcionam a nota de cada card, os chefões, os km e o resto do app.</p>
        <Link className="button" to="/manual">Abrir o manual</Link>
      </div>

      <ResetCard />
    </section>
  )
}


/** The traveler set up on first launch: name, character, pet and the motorhome's name. */
function TravelerCard() {
  const profile = useLiveQuery(() => db.profile.get('me'))
  if (!profile) return null
  const update = (patch: Partial<Profile>) => void db.profile.put({ ...profile, ...patch })
  return (
    <div className="card settings-group">
      <h2>🚐 Viajante</h2>
      <label className="field">
        Seu nome
        <input value={profile.name} onChange={(e) => update({ name: e.target.value })} />
      </label>
      <label className="field">
        Nome do motorhome
        <input value={profile.motorhomeName} onChange={(e) => update({ motorhomeName: e.target.value })} />
      </label>
      <Segmented
        label="Personagem"
        value={profile.character}
        options={CHARACTERS.map((c) => ({ value: c.value, label: `${c.icon} ${c.label}` }))}
        onChange={(character) => update({ character })}
      />
      <Segmented
        label="Pet"
        value={profile.pet}
        options={PETS.map((p) => ({ value: p.value, label: `${p.icon} ${p.label}` }))}
        onChange={(pet) => update({ pet })}
      />
      {profile.pet !== 'none' && (
        <label className="field">
          Nome do pet
          <input value={profile.petName ?? ''} onChange={(e) => update({ petName: e.target.value })} />
        </label>
      )}
    </div>
  )
}

/** Erases everything on this device and starts the trip again from the first-launch setup. */
function ResetCard() {
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const reset = async () => {
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map((t) => t.clear()))
    })
    window.location.hash = '#/'
  }
  return (
    <div className="card danger">
      <h2>🧨 Zerar tudo</h2>
      <p className="muted">Apaga o perfil, todas as palavras estudadas, o histórico, o Diário, os chefões e as recompensas deste aparelho, e a viagem recomeça do zero. O dicionário baixado continua.</p>
      {!confirming ? (
        <button className="button" onClick={() => setConfirming(true)}>Zerar e começar de novo</button>
      ) : (
        <form className="typing" onSubmit={(e) => { e.preventDefault(); if (typed.trim().toUpperCase() === 'ZERAR') void reset() }}>
          <label className="field">
            Não dá para desfazer. Para confirmar, digite ZERAR:
            <input value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="characters" aria-label="Digite ZERAR para confirmar" />
          </label>
          <div className="row">
            <button type="button" className="button" onClick={() => { setConfirming(false); setTyped('') }}>Cancelar</button>
            <button type="submit" className="button danger" disabled={typed.trim().toUpperCase() !== 'ZERAR'}>Apagar tudo</button>
          </div>
        </form>
      )}
    </div>
  )
}
