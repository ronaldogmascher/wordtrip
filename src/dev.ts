import { useSyncExternalStore } from 'react'

// Developer mode ("modo trapaça"): lifts the game's locks so every city, its new words and its
// boss can be tested right away. Turned on in Ajustes by tapping the version line 5 times.
// Stored in this browser only; it is not part of backups.

const KEY = 'wordtrip.devMode'
const listeners = new Set<() => void>()

export function isDevMode(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function setDevMode(on: boolean): void {
  try {
    if (on) localStorage.setItem(KEY, '1')
    else localStorage.removeItem(KEY)
  } catch {
    // Storage blocked (private mode): developer mode simply stays off.
  }
  listeners.forEach((l) => l())
}

export function useDevMode(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    isDevMode,
  )
}
