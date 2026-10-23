import { useMediaQuery } from './useMediaQuery'

export function useReducedMotion(): boolean {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  // QA escape hatch: ?motion=1 forces the animated path without changing the OS setting.
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search)
    if (params.get('motion') === '1') return false
  }
  return reduced
}
