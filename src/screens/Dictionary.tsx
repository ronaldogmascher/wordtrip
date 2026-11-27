import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import DictionaryDownload from '../components/DictionaryDownload.tsx'
import WordEntry from '../components/WordEntry.tsx'
import { normalizeWord } from '../dictionary/lemmatize.ts'
import { useDictionary } from '../dictionary/useDictionary.ts'

export default function Dictionary() {
  const { word } = useParams()
  const navigate = useNavigate()
  const { dict, status, download } = useDictionary()
  const [query, setQuery] = useState('')

  const open = (w: string) => {
    setQuery('')
    navigate(`/dicionario/${encodeURIComponent(w)}`)
  }

  if (!dict)
    return (
      <section className="screen">
        <h1>Dicionário</h1>
        <div className="card">
          <DictionaryDownload status={status} onDownload={download} />
        </div>
      </section>
    )

  const typed = normalizeWord(query) || query.trim().toLowerCase()
  const suggestions = dict.search(query)
  // An inflected form ("went") points to its base form ("go").
  const bases = typed ? dict.resolve(typed).filter((b) => b !== typed) : []
  const current = word ? decodeURIComponent(word) : null

  return (
    <section className="screen">
      <h1>Dicionário</h1>
      <form
        className="search"
        onSubmit={(e) => {
          e.preventDefault()
          const target = dict.has(typed) ? typed : (bases[0] ?? suggestions[0])
          if (target) open(target)
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar palavra em inglês"
          aria-label="Buscar palavra em inglês"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
        />
      </form>

      {query && (
        <div className="card suggestions">
          {bases.map((b) => (
            <button key={`base-${b}`} className="suggestion" onClick={() => open(b)}>
              <span className="muted">{typed} →</span> <strong>{b}</strong>
            </button>
          ))}
          {suggestions.map((s) => (
            <button key={s} className="suggestion" onClick={() => open(s)}>{s}</button>
          ))}
          {suggestions.length === 0 && bases.length === 0 && <p className="muted">Nenhuma palavra encontrada.</p>}
        </div>
      )}

      {!query && current && (
        <div className="card">
          <WordEntry dict={dict} lemma={current} onWord={open} />
        </div>
      )}

      {!query && !current && (
        <div className="card">
          <p className="muted">
            Digite uma palavra para ver todos os sentidos dela. Durante o estudo, toque em qualquer palavra do card para abrir a
            definição.
          </p>
        </div>
      )}

      <p className="muted credits">Definições: WordNet 3.1 © Princeton University.</p>
    </section>
  )
}
