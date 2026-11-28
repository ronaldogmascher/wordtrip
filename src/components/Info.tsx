import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Something on screen that explains itself: tap (or hover, on a computer) to see what it means.
 * Tapping outside closes it.
 */
export default function Info({ label, children, className = '' }: { label: ReactNode; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])

  return (
    <span className={`info ${className}`} ref={ref}>
      <button type="button" className="info-trigger" aria-expanded={open} onClick={() => setOpen(!open)}>
        {label}
      </button>
      <span className="info-bubble" role="tooltip" hidden={!open}>{children}</span>
    </span>
  )
}

/** A small ⓘ next to a title that opens an explanation. */
export function InfoIcon({ children, label = 'O que é isso?' }: { children: ReactNode; label?: string }) {
  return <Info label={<span aria-label={label}>ⓘ</span>} className="info-icon">{children}</Info>
}
