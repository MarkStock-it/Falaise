import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'

type Mode = 'default' | 'link' | 'drag' | 'view'

const LABELS: Record<Mode, string> = {
  default: '',
  link: '',
  drag: 'DRAG',
  view: 'VIEW',
}

export function CustomCursor() {
  const reducedMotion = useReducedMotion()
  const dotRef = useRef<HTMLDivElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const modeRef = useRef<Mode>('default')
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!finePointer || reducedMotion) return

    setEnabled(true)
    document.documentElement.classList.add('cursor-ready')

    let x = window.innerWidth / 2
    let y = window.innerHeight / 2
    let targetX = x
    let targetY = y
    let frame = 0

    const onMove = (event: PointerEvent) => {
      targetX = event.clientX
      targetY = event.clientY
    }

    const onOver = (event: Event) => {
      const target = event.target as HTMLElement | null
      const el = target?.closest<HTMLElement>('[data-cursor], a, button')
      if (!el) {
        modeRef.current = 'default'
      } else {
        const requested = el.dataset.cursor as Mode | undefined
        modeRef.current = requested ?? 'link'
      }
      if (dotRef.current) dotRef.current.dataset.mode = modeRef.current
      if (labelRef.current) labelRef.current.textContent = LABELS[modeRef.current]
    }

    const onLeave = () => {
      if (dotRef.current) dotRef.current.style.opacity = '0'
    }

    const onEnter = () => {
      if (dotRef.current) dotRef.current.style.opacity = '1'
    }

    const tick = () => {
      x += (targetX - x) * 0.22
      y += (targetY - y) * 0.22
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`
      }
      frame = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    document.documentElement.addEventListener('pointerenter', onEnter)
    frame = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      document.documentElement.removeEventListener('pointerenter', onEnter)
      document.documentElement.classList.remove('cursor-ready')
    }
  }, [reducedMotion])

  if (!enabled) return null

  return (
    <div
      ref={dotRef}
      data-mode="default"
      aria-hidden="true"
      className="group pointer-events-none fixed left-0 top-0 z-[100] mix-blend-difference"
    >
      <div className="flex h-3 w-3 items-center justify-center rounded-full border border-white bg-white transition-[width,height,background-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-data-[mode=link]:h-8 group-data-[mode=link]:w-8 group-data-[mode=link]:bg-white group-data-[mode=drag]:h-20 group-data-[mode=drag]:w-20 group-data-[mode=drag]:bg-transparent group-data-[mode=view]:h-16 group-data-[mode=view]:w-16 group-data-[mode=view]:bg-transparent group-data-[mode=drag]:border-white group-data-[mode=view]:border-white">
        <span
          ref={labelRef}
          className="label !text-[9px] text-white opacity-0 transition-opacity duration-200 group-data-[mode=drag]:opacity-100 group-data-[mode=view]:opacity-100"
        />
      </div>
    </div>
  )
}
