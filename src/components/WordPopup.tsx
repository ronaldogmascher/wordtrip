import { useEffect, useState } from 'react'
import { normalizeWord } from '../dictionary/lemmatize.ts'
import { useDictionary } from '../dictionary/useDictionary.ts'
import DictionaryDownload from './DictionaryDownload.tsx'
import WordEntry from './WordEntry.tsx'

/** Bottom sheet with the dictionary entry of a tapped word. */
export default function WordPopup({ word, onClose }: { word: string; onClose: () => void }) {
  const { dict, status, download } = useDictionary()
  const [lemma, setLemma] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const bases = dict?.resolve(word) ?? []
  const shown = lemma ?? bases[0]

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={`Dicionário: ${word}`} onClick={(e) => e.stopPropagation()}>
        <button className="sheet-close icon" onClick={onClose} aria-label="Fechar">✕</button>
        {!dict && <DictionaryDownload status={status} onDownload={download} />}
        {dict && bases.length > 1 && (
          <div className="sheet-choices">
            {bases.map((b) => (
              <button key={b} className={b === shown ? 'active' : ''} onClick={() => setLemma(b)}>{b}</button>
            ))}
          </div>
        )}
        {dict && shown && (
          <>
            {normalizeWord(word) !== shown && <p className="muted">{normalizeWord(word)} → {shown}</p>}
            <WordEntry dict={dict} lemma={shown} compact />
          </>
        )}
        {dict && !shown && <p className="muted">"{word}" não está no dicionário offline.</p>}
      </div>
    </div>
  )
}
