import { useCallback, useEffect, useState } from 'react'
import { downloadDictionary, loadDictionary, type Dictionary } from './dictionary.ts'

export type DictionaryStatus = 'checking' | 'missing' | 'downloading' | 'ready' | 'error'

/** Loads the offline dictionary if it was downloaded; exposes `download()` otherwise. */
export function useDictionary() {
  const [dict, setDict] = useState<Dictionary | null>(null)
  const [status, setStatus] = useState<DictionaryStatus>('checking')

  useEffect(() => {
    let alive = true
    loadDictionary()
      .then((d) => {
        if (!alive) return
        setDict(d)
        setStatus(d ? 'ready' : 'missing')
      })
      .catch(() => alive && setStatus('missing'))
    return () => {
      alive = false
    }
  }, [])

  const download = useCallback(async () => {
    setStatus('downloading')
    try {
      setDict(await downloadDictionary())
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  return { dict, status, download }
}
