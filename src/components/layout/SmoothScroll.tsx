import { useEffect } from 'react'
import Lenis from 'lenis'
import { setLenis } from '../../lib/scroll'
import { useReducedMotion } from '../../hooks/useReducedMotion'

export function SmoothScroll() {
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (reducedMotion) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.35,
    })

    setLenis(lenis)

    return () => {
      lenis.destroy()
      setLenis(null)
    }
  }, [reducedMotion])

  return null
}
