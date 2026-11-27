// Theme preference is per device, so it lives in localStorage (with a safe fallback).
export type ThemeChoice = 'auto' | 'light' | 'dark'
const KEY = 'wordtrip-theme'

export function getTheme(): ThemeChoice {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'light' || value === 'dark' ? value : 'auto'
  } catch {
    return 'auto'
  }
}

export function applyTheme(theme: ThemeChoice): void {
  const root = document.documentElement
  if (theme === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', theme)
}

export function setTheme(theme: ThemeChoice): void {
  try {
    if (theme === 'auto') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    // Storage blocked (private mode): the choice still applies until the app is closed.
  }
  applyTheme(theme)
}
