import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DictionaryDownload from '../components/DictionaryDownload.tsx'
import { getSensesByLemma } from '../content/index.ts'
import { db } from '../db/db.ts'
import { analyzeText, type Analysis } from '../detour/analyze.ts'
import { createDetour } from '../detour/detour.ts'
import { useDictionary } from '../dictionary/useDictionary.ts'
import { explorerSenseId } from '../explorer/explorer.ts'
import { lightOf, type Light } from '../study/scheduler.ts'

/** How many of the most frequent words start selected. */
const PRESELECTED = 20
const RANK: Record<Light, number> = { discovering: 1, learning: 2, learned: 3 }

/** "Fazer um desvio": import a text, filter known words, create a training set. */
export default function DetourNew() {
  const navigate = useNavigate()
  const { dict, status, download } = useDictionary()
  const [name, setName] = useState('')
  const [text, setText] = useState('')
  const [fileNote, setFileNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  async function readFile(file: File) {
    setBusy(true)
    setFileNote('')
    try {
      if (file.name.toLowerCase().endsWith('.pdf')) {
        const { pdfToText } = await import('../detour/pdf.ts')
        const result = await pdfToText(file)
        setText(result.text)
        setFileNote(result.truncated ? `PDF grande: li as primeiras ${result.pages} páginas.` : `PDF lido (${result.pages} páginas).`)
      } else {
        setText(await file.text())
      }
      if (!name) setName(file.name.replace(/\.[^.]+$/, ''))
    } catch {
      setFileNote('Não consegui ler esse arquivo. Tente copiar e colar o texto.')
    } finally {
      setBusy(false)
    }
  }

  async function analyze() {
    if (!dict) return
    setBusy(true)
    const [cards, entries] = await Promise.all([db.cards.toArray(), db.explorer.toArray()])
    const lightBySense = new Map(cards.map((c) => [c.senseId, lightOf(c.fsrs)]))
    // Lemmas the learner already has as their own words (Diário), with their card's light.
    const ownLights = new Map<string, Light | undefined>()
    for (const e of entries) {
      if (e.custom && e.id !== undefined) ownLights.set(e.custom.lemma.toLowerCase(), lightBySense.get(explorerSenseId(e.id)) ?? 'discovering')
    }
    const queued = new Set(entries.flatMap((e) => (e.senseId ? [e.senseId] : [])))
    const best = (lights: (Light | undefined)[]) =>
      lights.filter(Boolean).sort((a, b) => RANK[b!] - RANK[a!])[0]

    const result = analyzeText(text, {
      resolve: (w) => dict.resolve(w),
      lightOf: (lemma) => best([...getSensesByLemma(lemma).map((s) => lightBySense.get(s.id)), ownLights.get(lemma)]),
      routeSenseOf: (lemma) => getSensesByLemma(lemma).find((s) => !lightBySense.has(s.id) && !queued.has(s.id))?.id,
    })
    setAnalysis(result)
    setSelected(new Set(result.candidates.slice(0, PRESELECTED).map((c) => c.lemma)))
    setBusy(false)
  }

  async function save() {
    if (!dict || !analysis) return
    setBusy(true)
    const words = analysis.candidates.filter((c) => selected.has(c.lemma))
    const id = await createDetour(name, analysis.totalWords, words, dict)
    navigate(`/diario/desvio/${id}`, { replace: true })
  }

  const toggle = (lemma: string) =>
    setSelected((s) => {
      const next = new Set(s)
      if (next.has(lemma)) next.delete(lemma)
      else next.add(lemma)
      return next
    })

  if (!dict)
    return (
      <section className="screen">
        <h1>Fazer um desvio 🛣️</h1>
        <div className="card">
          <p>Para analisar o texto, o app usa o dicionário offline.</p>
          <DictionaryDownload status={status} onDownload={download} />
        </div>
      </section>
    )

  if (analysis)
    return (
      <section className="screen">
        <h1>📍 {name || 'Desvio'}</h1>
        <div className="card funnel">
          <p><strong>{analysis.totalWords}</strong> palavras no texto</p>
          <p>→ <strong>{analysis.distinct}</strong> palavras diferentes (sem as muito comuns, como "the" e "of")</p>
          <p>→ <span className="light-text learned">✔ {analysis.known.length} você já sabe</span></p>
          <p>→ <span className="light-text learning">◐ {analysis.studying.length} você já está estudando</span></p>
          <p>→ <strong>{analysis.candidates.length} para aprender</strong></p>
        </div>

        <div className="card">
          <div className="row-between">
            <h2>Escolha as palavras ({selected.size})</h2>
            <span>
              <button className="link" onClick={() => setSelected(new Set(analysis.candidates.map((c) => c.lemma)))}>todas</button>
              {' · '}
              <button className="link" onClick={() => setSelected(new Set())}>nenhuma</button>
            </span>
          </div>
          <p className="muted">As mais frequentes no texto vêm primeiro. O app usa o sentido mais comum de cada uma; você pode trocar depois no Diário.</p>
          <ul className="entry-list">
            {analysis.candidates.map((c) => (
              <li key={c.lemma}>
                <label className="sense-option bare">
                  <input type="checkbox" checked={selected.has(c.lemma)} onChange={() => toggle(c.lemma)} />
                  <span>
                    <strong>{c.lemma}</strong> <span className="muted">×{c.count}</span>
                    {c.routeSenseId && <span className="badge">🛣️ na rota</span>}
                    <br />
                    <span className="muted">{(dict.lookup(c.lemma).find((s) => s.pos === c.posHint) ?? dict.lookup(c.lemma)[0])?.definition}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
        <button className="primary" disabled={busy || selected.size === 0} onClick={() => void save()}>
          Criar desvio com {selected.size} palavras
        </button>
        <button className="button" onClick={() => setAnalysis(null)}>Voltar ao texto</button>
      </section>
    )

  return (
    <section className="screen">
      <h1>Fazer um desvio 🛣️</h1>
      <p className="muted">Em teste: na versão final, os desvios liberam quando você cruzar a fronteira em Foz do Iguaçu.</p>
      <div className="card capture">
        <label htmlFor="detour-name"><strong>Nome do lugar</strong></label>
        <input id="detour-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Wall Street, Maracanã, Atenas" />
        <label htmlFor="detour-text"><strong>Texto</strong> <span className="muted">(cole aqui, em inglês)</span></label>
        <textarea id="detour-text" value={text} onChange={(e) => setText(e.target.value)} rows={8} placeholder="Cole uma notícia, artigo, letra de música…" />
        <label className="button file-button">
          📄 Ou carregar arquivo (.txt ou .pdf)
          <input type="file" accept=".txt,.pdf,text/plain,application/pdf" onChange={(e) => e.target.files?.[0] && void readFile(e.target.files[0])} hidden />
        </label>
        {fileNote && <p className="muted">{fileNote}</p>}
        <p className="muted">O texto é analisado no seu aparelho e não é enviado para lugar nenhum.</p>
      </div>
      <button className="primary" disabled={busy || text.trim().length < 20} onClick={() => void analyze()}>
        {busy ? 'Lendo…' : 'Analisar texto'}
      </button>
    </section>
  )
}
