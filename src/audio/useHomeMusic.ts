import { useEffect } from 'react'
import { startMusic, stopMusic, type MusicThemeId } from './music.ts'

/**
 * Plays the background music while the home screen is open, if enabled. Browsers block audio
 * until the user touches the page, so it starts on the first tap when needed.
 */
export function useHomeMusic(enabled: boolean, theme: MusicThemeId): void {
  useEffect(() => {
    if (!enabled) return
    const start = () => {
      if (document.visibilityState === 'visible') startMusic(theme)
    }
    const onVisibility = () => (document.visibilityState === 'visible' ? startMusic(theme) : stopMusic())
    start()
    window.addEventListener('pointerdown', start, { once: true })
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pointerdown', start)
      document.removeEventListener('visibilitychange', onVisibility)
      stopMusic()
    }
  }, [enabled, theme])
}
