// Extracts the text of a PDF in the browser (no upload). Loaded only when the learner picks a
// PDF, so pdf.js (~1.8 MB) is not downloaded otherwise.
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

GlobalWorkerOptions.workerSrc = workerUrl

/** Max pages read, to keep big books manageable. */
export const MAX_PAGES = 60

export async function pdfToText(file: File): Promise<{ text: string; pages: number; truncated: boolean }> {
  const pdf = await getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const pages = Math.min(pdf.numPages, MAX_PAGES)
  const parts: string[] = []
  for (let i = 1; i <= pages; i++) {
    const content = await (await pdf.getPage(i)).getTextContent()
    parts.push(content.items.map((item) => ('str' in item ? item.str : '')).join(' '))
  }
  return { text: parts.join('\n'), pages, truncated: pdf.numPages > MAX_PAGES }
}
