import { useEffect, useRef } from 'react'
import { db } from '../db/db.ts'
import { localDate } from './session.ts'

/** Seconds without any interaction after which study time stops counting. */
export const IDLE_AFTER_SECONDS = 60

/**
 * Counts active study time while the screen is visible and the learner
 * interacted in the last minute. Flushes to the database every 15 seconds.
 */
export function useActiveTime(enabled: boolean) {
  const lastInteraction = useRef(0)

  useEffect(() => {
    if (!enabled) return
    lastInteraction.current = Date.now()
    const touch = () => (lastInteraction.current = Date.now())
    const events = ['pointerdown', 'keydown', 'touchstart'] as const
    events.forEach((e) => window.addEventListener(e, touch))

    let pending = 0
    const tick = setInterval(() => {
      const idle = (Date.now() - lastInteraction.current) / 1000 > IDLE_AFTER_SECONDS
      if (document.visibilityState === 'visible' && !idle) pending += 1
    }, 1000)
    const flush = async () => {
      if (pending === 0) return
      const seconds = pending
      pending = 0
      const date = localDate(new Date())
      const day = (await db.days.get(date)) ?? { date, activeSeconds: 0, cardsReviewed: 0, newCards: 0, xp: 0 }
      await db.days.put({ ...day, activeSeconds: day.activeSeconds + seconds })
    }
    const flusher = setInterval(flush, 15000)

    return () => {
      events.forEach((e) => window.removeEventListener(e, touch))
      clearInterval(tick)
      clearInterval(flusher)
      void flush()
    }
  }, [enabled])
}
