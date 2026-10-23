import type Lenis from 'lenis'

let instance: Lenis | null = null
const locks = new Set<string>()

function syncLock() {
  const locked = locks.size > 0
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('is-locked', locked)
  }
  if (!instance) return
  if (locked) instance.stop()
  else instance.start()
}

export function setLenis(next: Lenis | null) {
  instance = next
  syncLock()
}

export function getLenis(): Lenis | null {
  return instance
}

export function lockScroll(owner: string, locked: boolean) {
  if (locked) locks.add(owner)
  else locks.delete(owner)
  syncLock()
}
