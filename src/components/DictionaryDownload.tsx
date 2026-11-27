import { DOWNLOAD_SIZE_MB } from '../dictionary/dictionary.ts'
import type { DictionaryStatus } from '../dictionary/useDictionary.ts'

/** Shown while the offline dictionary is not available yet. */
export default function DictionaryDownload({ status, onDownload }: { status: DictionaryStatus; onDownload: () => void }) {
  if (status === 'checking') return <p className="muted">Abrindo o dicionário…</p>
  return (
    <div className="dict-download">
      <p>
        O dicionário de inglês tem cerca de <strong>{DOWNLOAD_SIZE_MB} MB</strong>. Baixe uma vez (de preferência no Wi-Fi) e ele
        passa a funcionar sem internet.
      </p>
      {status === 'error' && <p className="warning">Não foi possível baixar agora. Confira a internet e tente de novo.</p>}
      <button className="primary" onClick={onDownload} disabled={status === 'downloading'}>
        {status === 'downloading' ? 'Baixando… pode levar alguns segundos' : 'Baixar dicionário'}
      </button>
    </div>
  )
}
