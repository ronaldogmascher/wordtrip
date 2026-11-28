import { useState } from 'react'
import { db, getSettings, type CharacterChoice, type PetChoice, type Profile } from '../db/db.ts'
import HowItWorks from '../components/HowItWorks.tsx'
import { CHARACTERS, PETS } from '../game/traveler.ts'

// First launch: who is traveling. Everything can be changed later in Ajustes.

export default function Onboarding() {
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [character, setCharacter] = useState<CharacterChoice>('male')
  const [pet, setPet] = useState<PetChoice>('dog')
  const [petName, setPetName] = useState('')
  const [motorhomeName, setMotorhomeName] = useState('')
  const [newPerDay, setNewPerDay] = useState(15)

  async function finish() {
    const profile: Profile = {
      id: 'me', name: name.trim(), character, pet, petName: pet === 'none' ? undefined : petName.trim() || undefined,
      motorhomeName: motorhomeName.trim() || 'Motorhome', language: 'en', createdAt: new Date(),
    }
    const settings = await getSettings()
    await db.transaction('rw', db.profile, db.settings, async () => {
      await db.settings.put({ ...settings, newPerDay })
      await db.profile.put(profile)
    })
  }

  return (
    <section className="screen onboarding">
      <p className="eyebrow">WordTrip · Configuração da viagem</p>
      {step === 0 && (
        <div className="card">
          <h1>Bem-vindo a bordo! 🚐</h1>
          <p>O WordTrip ensina vocabulário de inglês com cards e uma viagem de motorhome. Funciona assim:</p>
          <HowItWorks />
          <p className="muted">Dá para rever tudo isso depois em Ajustes → Abrir o manual.</p>
          <button className="button primary" onClick={() => setStep(1)}>Vamos lá!</button>
        </div>
      )}
      {step === 1 && (
        <div className="card">
          <h2>Quem é você?</h2>
          <label className="field">
            Como você se chama?
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" />
          </label>
          <button className="button primary" disabled={!name.trim()} onClick={() => setStep(2)}>Continuar</button>
        </div>
      )}
      {step === 2 && (
        <div className="card">
          <h2>Quem vai dirigir?</h2>
          <div className="choice-grid">
            {CHARACTERS.map((c) => (
              <button key={c.value} className="choice big-choice" aria-pressed={character === c.value} onClick={() => setCharacter(c.value)}>
                <span className="big-emoji">{c.icon}</span>{c.label}
              </button>
            ))}
          </div>
          <h2>Vai levar um pet?</h2>
          <div className="choice-grid three">
            {PETS.map((p) => (
              <button key={p.value} className="choice big-choice" aria-pressed={pet === p.value} onClick={() => setPet(p.value)}>
                <span className="big-emoji">{p.icon}</span>{p.label}
              </button>
            ))}
          </div>
          {pet !== 'none' && (
            <label className="field">
              Nome do {pet === 'dog' ? 'cachorro' : 'gato'}
              <input value={petName} onChange={(e) => setPetName(e.target.value)} placeholder="Opcional" />
            </label>
          )}
          <div className="row">
            <button className="button" onClick={() => setStep(1)}>Voltar</button>
            <button className="button primary" onClick={() => setStep(3)}>Continuar</button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="card">
          <h2>Dê um nome ao seu motorhome</h2>
          <p className="muted">Ele é a sua casa na estrada e aparece no mapa.</p>
          <label className="field">
            Nome do motorhome
            <input autoFocus value={motorhomeName} onChange={(e) => setMotorhomeName(e.target.value)} placeholder="Ex.: Pé na Estrada" />
          </label>
          <h2>Quantas palavras novas por dia?</h2>
          <input type="range" min={5} max={50} step={5} value={newPerDay} onChange={(e) => setNewPerDay(Number(e.target.value))} className="slider" aria-label="Palavras novas por dia" />
          <p className="muted"><strong>{newPerDay}</strong> por dia. O padrão é 15; dá para mudar depois nos Ajustes.</p>
          <div className="row">
            <button className="button" onClick={() => setStep(2)}>Voltar</button>
            <button className="button primary" onClick={() => void finish()}>Pegar a estrada! 🚐</button>
          </div>
        </div>
      )}
    </section>
  )
}
