import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Every new screen opens at its top, not where the previous one was scrolled to. */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
