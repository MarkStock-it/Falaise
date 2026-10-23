import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { cartCount, cartSubtotal, useCart } from '../../store/cart'
import { formatPrice } from '../../data/products'
import { lockScroll } from '../../lib/scroll'
import { cn } from '../../lib/cn'
import { Arrow } from '../ui/Button'
import { useSite } from '../../store/site'

export function CartDrawer() {
  const lines = useCart((state) => state.lines)
  const open = useCart((state) => state.open)
  const setOpen = useCart((state) => state.setOpen)
  const remove = useCart((state) => state.remove)
  const setQty = useCart((state) => state.setQty)
  const { data } = useSite()
  const closeRef = useRef<HTMLButtonElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const count = cartCount(lines)
  const subtotal = cartSubtotal(lines)
  const chrome = data?.content.chrome

  useEffect(() => {
    lockScroll('cart', open)
    if (open) {
      previousFocus.current = document.activeElement as HTMLElement
      const timer = window.setTimeout(() => closeRef.current?.focus(), 80)
      return () => {
        window.clearTimeout(timer)
        previousFocus.current?.focus()
      }
    }
    return () => lockScroll('cart', false)
  }, [open])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, setOpen])

  return (
    <div
      className={cn(
        'fixed inset-0 z-[70] overflow-hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close bag"
        onClick={() => setOpen(false)}
        className={cn(
          'absolute inset-0 bg-ink/45 transition-opacity duration-500',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="bag-title"
        inert={!open}
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-[440px] flex-col border-l border-line bg-paper transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
        data-lenis-prevent
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 sm:px-7">
          <h2 id="bag-title" className="label">
            {chrome?.bagHeading ?? 'Your bag'}{' '}
            <span className="text-mute">[{String(count).padStart(2, '0')}]</span>
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
            className="label flex min-h-11 items-center gap-2 px-1 text-mute transition-colors hover:text-ink"
          >
            {chrome?.closeLabel ?? 'Close'}
            <span aria-hidden="true" className="relative block h-3 w-3">
              <span className="absolute left-0 top-1/2 h-px w-3 rotate-45 bg-current" />
              <span className="absolute left-0 top-1/2 h-px w-3 -rotate-45 bg-current" />
            </span>
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col justify-between px-5 py-8 sm:px-7">
            <div>
              <p className="display text-[clamp(2.4rem,9vw,3.6rem)]">
                {chrome?.emptyBagTitle ?? 'Nothing yet.'}
              </p>
              <p className="prose-body mt-4 text-mute">{chrome?.emptyBagBody}</p>
            </div>
            <Link
              to="/shop"
              onClick={() => setOpen(false)}
              tabIndex={open ? 0 : -1}
              className="group flex items-center justify-between border-t border-ink py-5"
            >
              <span className="label">{chrome?.shopCollectionLabel ?? 'Shop the collection'}</span>
              <Arrow />
            </Link>
          </div>
        ) : (
          <>
            <ul className="no-scrollbar flex-1 divide-y divide-line overflow-y-auto px-5 sm:px-7">
              {lines.map((line) => (
                <li key={line.key} className="flex gap-4 py-6">
                  <Link
                    to={`/shop?piece=${line.slug}&color=${line.colorId}`}
                    onClick={() => setOpen(false)}
                    tabIndex={open ? 0 : -1}
                    className="block w-20 shrink-0 border border-line bg-paper-deep"
                  >
                    <img
                      src={line.image}
                      alt={`${line.name} in ${line.colorName}`}
                      width={80}
                      height={100}
                      loading="lazy"
                      className="h-[100px] w-full object-cover"
                    />
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-[family-name:var(--font-label)] text-[15px] font-[600] leading-tight">
                          {line.name}
                        </p>
                        <p className="label mt-1.5 text-mute">
                          {line.colorName} / {line.size}
                        </p>
                      </div>
                      <p className="label whitespace-nowrap">{formatPrice(line.price * line.qty)}</p>
                    </div>

                    <div className="mt-auto flex items-end justify-between pt-4">
                      <div className="flex h-8 items-center border border-line">
                        <button
                          type="button"
                          onClick={() => setQty(line.key, line.qty - 1)}
                          tabIndex={open ? 0 : -1}
                          className="flex h-full w-8 items-center justify-center text-sm transition-colors hover:bg-paper-deep"
                          aria-label={`Decrease quantity of ${line.name}`}
                        >
                          −
                        </button>
                        <span className="label w-6 text-center tabular-nums" aria-live="polite">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty(line.key, line.qty + 1)}
                          tabIndex={open ? 0 : -1}
                          className="flex h-full w-8 items-center justify-center text-sm transition-colors hover:bg-paper-deep"
                          aria-label={`Increase quantity of ${line.name}`}
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(line.key)}
                        tabIndex={open ? 0 : -1}
                        className="label text-mute underline decoration-line underline-offset-4 transition-colors hover:text-ink"
                      >
                        {chrome?.removeLabel ?? 'Remove'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="shrink-0 border-t border-line px-5 pb-6 pt-5 sm:px-7">
              <div className="flex items-baseline justify-between">
                <span className="label">{chrome?.subtotalLabel ?? 'Subtotal'}</span>
                <span className="font-[family-name:var(--font-label)] text-xl font-[600] tracking-tight tabular-nums">
                  {formatPrice(subtotal)}
                </span>
              </div>
              <p className="mt-2 text-[13px] leading-relaxed text-mute">
                {data?.content.shipping?.drawerNote}
              </p>
              <Link
                to="/checkout"
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                className="group mt-5 flex h-13 w-full items-center justify-between border border-ink bg-ink px-5 py-4 text-paper transition-colors hover:bg-ink-soft"
              >
                <span className="label">{chrome?.sendOrderLabel ?? 'Send order on Instagram'}</span>
                <Arrow />
              </Link>
              <button
                type="button"
                onClick={() => setOpen(false)}
                tabIndex={open ? 0 : -1}
                className="label mt-4 w-full py-1 text-center text-mute transition-colors hover:text-ink"
              >
                {chrome?.continueBrowsingLabel ?? 'Continue browsing'}
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
