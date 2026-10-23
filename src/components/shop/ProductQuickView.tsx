import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Product } from '../../data/products'
import {
  availableSizes,
  formatPrice,
  isSizeAvailable,
  isSoldOut,
  productAlt,
} from '../../data/products'
import { useCart } from '../../store/cart'
import { useSite } from '../../store/site'
import { lockScroll } from '../../lib/scroll'
import { fillTokens } from '../../lib/tokens'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import { cn } from '../../lib/cn'
import { Arrow, Button } from '../ui/Button'
import { SizeGuide } from '../product/SizeGuide'

const VIEWS = [
  { key: 'front', label: 'Worn', index: '01' },
  { key: 'back', label: 'Second', index: '02' },
  { key: 'detail', label: 'Detail', index: '03' },
] as const

/** Renders %HANDLE% in a line of copy as the Instagram link. */
function TokenText({ text }: { text: string }) {
  const { data } = useSite()
  const handle = data?.content.links.handle
  const href = data?.content.links.instagramDm
  const [before, ...rest] = text.split('%HANDLE%')
  if (rest.length === 0 || !handle) return <>{text}</>
  return (
    <>
      {before}
      <a
        href={href || '/contact'}
        target="_blank"
        rel="noreferrer"
        className="text-ink underline decoration-line underline-offset-4"
      >
        {handle}
      </a>
      {rest.join('%HANDLE%')}
    </>
  )
}

type QuickViewProps = {
  product: Product
  colorId: string | null
  onClose: () => void
}

export function ProductQuickView({ product, colorId, onClose }: QuickViewProps) {
  const { data } = useSite()
  const add = useCart((state) => state.add)
  const reducedMotion = useReducedMotion()
  const chrome = data?.content.chrome
  const shipping = data?.content.shipping
  const content = data?.content

  const requested = colorId && product.colors.some((option) => option.id === colorId) ? colorId : null
  const [color, setColor] = useState(
    () =>
      product.colors.find((option) => option.id === requested) ??
      product.colors.find((option) => availableSizes(product, option.id).length > 0) ??
      product.colors[0],
  )
  const [view, setView] = useState<(typeof VIEWS)[number]['key']>('front')
  const [size, setSize] = useState('')
  const [guideOpen, setGuideOpen] = useState(false)
  const [error, setError] = useState('')
  const [closing, setClosing] = useState(false)
  const [entered, setEntered] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const sizeGroup = useRef<HTMLDivElement>(null)
  const restoreFocus = useRef(true)
  const timer = useRef<number | null>(null)

  const close = useCallback(() => {
    if (closing) return
    setClosing(true)
    timer.current = window.setTimeout(() => onClose(), reducedMotion ? 0 : 220)
  }, [closing, onClose, reducedMotion])

  // Transitions rather than keyframes: if the browser never runs the animation
  // (reduced motion, throttled tab), the window still lands in its final state
  // instead of sticking halfway down the screen.
  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const trigger = document.activeElement as HTMLElement | null
    lockScroll('quick-view', true)
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 120)
    return () => {
      window.clearTimeout(focusTimer)
      lockScroll('quick-view', false)
      if (restoreFocus.current) trigger?.focus?.()
    }
  }, [])

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current)
    },
    [],
  )

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (guideOpen) {
        setGuideOpen(false)
        return
      }
      close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [guideOpen, close])

  // Product structured data, as on the old product page, so a shared piece URL
  // still describes the garment to search engines.
  useEffect(() => {
    if (!color) return
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: `FALAISE ${product.name}`,
      description: product.description,
      image: new URL(color.photos.front, window.location.origin).toString(),
      brand: { '@type': 'Brand', name: 'FALAISE' },
      color: color.name,
      material: product.meta.fabric,
      offers: {
        '@type': 'Offer',
        priceCurrency: 'PHP',
        price: product.price,
        availability:
          product.status === 'sold_out'
            ? 'https://schema.org/OutOfStock'
            : 'https://schema.org/InStock',
        url: window.location.href,
      },
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    // Production sends a per-response CSP nonce for inline scripts.
    const nonce = document.querySelector<HTMLMetaElement>('meta[name="csp-nonce"]')?.content
    if (nonce) script.nonce = nonce
    script.text = JSON.stringify(schema)
    document.head.appendChild(script)
    return () => script.remove()
  }, [product, color])

  const trapTab = (event: React.KeyboardEvent) => {
    if (event.key !== 'Tab' || guideOpen) return
    const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )
    if (!focusables || focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  if (!color) return null

  const needsSize = product.sizes.length > 1
  const soldOut = isSoldOut(product)
  const colorSizes = availableSizes(product, color.id)
  const colorSoldOut = soldOut || colorSizes.length === 0
  const shown = entered && !closing
  const photos = color.photos
  const activeView = VIEWS.find((item) => item.key === view) ?? VIEWS[0]
  const catalogueLabel = product.collection?.name ?? chrome?.catalogueLabel ?? 'Catalogue'

  const addToBag = () => {
    if (soldOut) {
      setError('This piece is sold out. Message the studio for the next run.')
      return
    }
    if (needsSize && !size) {
      setError('Choose a size before adding to the bag.')
      sizeGroup.current?.querySelector<HTMLButtonElement>('button[aria-pressed]')?.focus()
      return
    }
    const chosenSize = size || product.sizes[0]
    if (!chosenSize || !isSizeAvailable(product, color.id, chosenSize)) {
      setError(`${product.name} in ${color.name}, size ${chosenSize || 'this one'}, is sold out.`)
      return
    }
    setError('')
    // The bag opens over the catalogue, so the window closes without pulling
    // focus back to the card underneath it.
    restoreFocus.current = false
    add(product, color.id, chosenSize)
    close()
  }

  const ctaLabel = soldOut
    ? 'Sold out'
    : colorSoldOut
      ? 'This colour is sold out'
      : 'Add to bag'

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center lg:items-center lg:p-6"
      data-lenis-prevent
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label={chrome?.closeLabel ?? 'Close piece'}
        onClick={close}
        className={cn(
          'absolute inset-0 bg-ink/50 backdrop-blur-[2px] transition-opacity',
          shown ? 'opacity-100 duration-300' : 'opacity-0 duration-200',
        )}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-view-title"
        onKeyDown={trapTab}
        className={cn(
          'relative flex h-[94svh] w-full flex-col overflow-hidden border-t border-line bg-paper transition-[transform,opacity] ease-[cubic-bezier(0.16,1,0.3,1)] lg:h-[min(86svh,52rem)] lg:w-[min(68rem,94vw)] lg:border',
          shown
            ? 'translate-y-0 opacity-100 duration-500'
            : 'translate-y-6 opacity-0 duration-200',
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-line px-5 sm:px-7 lg:px-9">
          <p className="label text-mute">
            {product.drop || 'Vol. 01'} / {catalogueLabel} / {product.code}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            className="label inline-flex min-h-11 items-center gap-2 text-mute transition-colors hover:text-ink"
          >
            {chrome?.closeLabel ?? 'Close'}
            <span aria-hidden="true" className="relative block h-3 w-3">
              <span className="absolute left-0 top-1/2 h-px w-3 rotate-45 bg-current" />
              <span className="absolute left-0 top-1/2 h-px w-3 -rotate-45 bg-current" />
            </span>
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[1.05fr_1fr]">
          <div className="relative hidden overflow-hidden bg-paper-deep lg:block">
            <img
              src={photos[view]}
              alt={productAlt(product, view, color.name)}
              width={1000}
              height={1250}
              className="absolute inset-0 h-full w-full object-cover mix-blend-multiply"
            />
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-5">
              <span className="label bg-paper/90 px-2 py-1.5 text-ink">{color.name}</span>
              <span className="label bg-paper/90 px-2 py-1.5 tabular-nums text-ink">
                {activeView.index} / 03
              </span>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-end gap-2 bg-gradient-to-t from-ink/45 to-transparent p-5">
              {VIEWS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setView(item.key)}
                  aria-pressed={view === item.key}
                  aria-label={`Show the ${item.label.toLowerCase()} view`}
                  className={cn(
                    'block h-16 w-12 overflow-hidden border transition-opacity',
                    view === item.key
                      ? 'border-paper opacity-100'
                      : 'border-paper/30 opacity-60 hover:opacity-100',
                  )}
                >
                  <img
                    src={photos[item.key]}
                    alt=""
                    aria-hidden="true"
                    width={1000}
                    height={1250}
                    loading="lazy"
                    className="h-full w-full object-cover mix-blend-multiply"
                  />
                </button>
              ))}
            </div>
          </div>

          <div
            className="no-scrollbar min-h-0 overflow-y-auto overscroll-contain"
            data-lenis-prevent
          >
            <div className="lg:hidden">
              <div className="relative aspect-[4/5] overflow-hidden bg-paper-deep">
                <img
                  src={photos[view]}
                  alt={productAlt(product, view, color.name)}
                  width={1000}
                  height={1250}
                  className="h-full w-full object-cover mix-blend-multiply"
                />
                <span className="label absolute left-4 top-4 bg-paper/90 px-2 py-1.5 text-ink">
                  {color.name}
                </span>
                <span className="label absolute right-4 top-4 bg-paper/90 px-2 py-1.5 tabular-nums text-ink">
                  {activeView.index} / 03
                </span>
              </div>
              <div className="flex gap-2 px-5 pt-3">
                {VIEWS.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setView(item.key)}
                    aria-pressed={view === item.key}
                    aria-label={`Show the ${item.label.toLowerCase()} view`}
                    className={cn(
                      'block h-20 w-16 overflow-hidden border bg-paper-deep',
                      view === item.key ? 'border-ink' : 'border-line opacity-70',
                    )}
                  >
                    <img
                      src={photos[item.key]}
                      alt=""
                      aria-hidden="true"
                      width={1000}
                      height={1250}
                      loading="lazy"
                      className="h-full w-full object-cover mix-blend-multiply"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="px-5 py-6 sm:px-7 lg:px-9 lg:py-8">
              <p className="label text-mute">
                {catalogueLabel} / {product.drop || 'Vol. 01'}
              </p>
              <h2
                id="quick-view-title"
                className="display display-tight mt-3 text-[clamp(2.4rem,6vw,3.6rem)]"
              >
                {product.name}
              </h2>
              <p className="lede mt-3 max-w-[24ch] text-ink">{product.tagline}</p>

              <div className="mt-6 flex items-end justify-between gap-6 border-y border-line py-4">
                <p className="font-[family-name:var(--font-label)] text-2xl font-[600] tracking-[-0.02em] tabular-nums">
                  {formatPrice(product.price)}
                </p>
                <p className="label max-w-[16rem] text-right text-mute">
                  {soldOut
                    ? 'Sold out / message the studio'
                    : colorSoldOut
                      ? 'This colour is sold out'
                      : shipping?.stockLabel}
                </p>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-4">
                <p className="label text-mute">{chrome?.colourLabel ?? 'Colour'}</p>
                <div
                  role="group"
                  aria-label={chrome?.colourLabel ?? 'Colour'}
                  className="flex items-center gap-1"
                >
                  {product.colors.map((option) => {
                    const selected = option.id === color.id
                    const inStock = availableSizes(product, option.id).length > 0
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => {
                          setColor(option)
                          setSize('')
                          setError('')
                        }}
                        aria-pressed={selected}
                        aria-label={`${option.name}${inStock ? '' : ', sold out'}${
                          selected ? ', selected' : ''
                        }`}
                        title={inStock ? option.name : `${option.name} / sold out`}
                        className={cn(
                          'flex h-9 w-9 items-center justify-center border transition-colors',
                          selected ? 'border-ink' : 'border-transparent hover:border-line',
                        )}
                      >
                        <span
                          className={cn(
                            'block h-6 w-6 border border-ink/20',
                            !inStock && 'opacity-40',
                          )}
                          style={{ backgroundColor: option.hex }}
                        />
                      </button>
                    )
                  })}
                </div>
                <p className="label">
                  {color.name}
                  {colorSoldOut ? <span className="text-mute"> / sold out</span> : null}
                </p>
              </div>

              <div ref={sizeGroup} className="mt-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="label">
                    {chrome?.sizeLabel ?? 'Size'}
                    {size ? <span className="text-mute"> / {size}</span> : null}
                  </p>
                  <button
                    type="button"
                    onClick={() => setGuideOpen(true)}
                    className="label link-line -my-2 inline-flex min-h-11 items-center text-mute transition-colors hover:text-ink"
                  >
                    {chrome?.sizeGuideLabel ?? 'Size guide'}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {product.sizes.map((option) => {
                    const available = isSizeAvailable(product, color.id, option)
                    const selected = size === option
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          if (!available) return
                          setSize(option)
                          setError('')
                        }}
                        disabled={!available}
                        aria-disabled={!available}
                        aria-pressed={selected}
                        title={available ? option : `${option} / sold out`}
                        className={cn(
                          'label h-11 min-w-12 border px-3 transition-colors',
                          !available
                            ? 'cursor-not-allowed border-line text-mute/60 line-through'
                            : selected
                              ? 'border-ink bg-ink text-paper'
                              : 'border-line text-ink hover:border-ink',
                        )}
                      >
                        {option}
                      </button>
                    )
                  })}
                </div>
                <p
                  className={cn('mt-3 text-[13px] leading-snug text-mute', error && 'text-ink')}
                  role={error ? 'alert' : undefined}
                >
                  {error ||
                    (colorSoldOut
                      ? 'Every size in this colour is sold out. Try the other colour or message the studio.'
                      : needsSize
                        ? `${product.meta.fit || 'True to size'}. Size up for more length through the body.`
                        : 'One size, adjustable.')}
                </p>
              </div>

              <Button
                variant="ink"
                size="lg"
                onClick={addToBag}
                disabled={soldOut || colorSoldOut}
                aria-label={
                  soldOut || colorSoldOut
                    ? ctaLabel
                    : `Add to bag, ${formatPrice(product.price)}`
                }
                className="mt-4 w-full justify-between"
              >
                <span>{ctaLabel}</span>
                <span className="flex items-center gap-3 tabular-nums">
                  {soldOut || colorSoldOut ? null : formatPrice(product.price)}
                  <Arrow />
                </span>
              </Button>
              <p className="mt-3 text-center text-[13px] leading-relaxed text-mute">
                Payment and shipping are arranged in Instagram DMs.
              </p>

              <div className="mt-7 border-t border-line pt-5">
                <p className="prose-body">{product.description}</p>
                <ul className="mt-5 border-t border-line">
                  {product.details.map((item, index) => (
                    <li
                      key={`${item}-${index}`}
                      className="flex gap-4 border-b border-line py-3 text-[14px] leading-relaxed"
                    >
                      <span className="label shrink-0 pt-1 text-mute">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <dl className="mt-6 grid grid-cols-3 gap-4 border-t border-line pt-5">
                {[
                  ['Fabric', product.meta.fabric],
                  ['Fit', product.meta.fit],
                  ['Made', product.meta.made],
                ].map(([term, value]) => (
                  <div key={term}>
                    <dt className="label text-mute">{term}</dt>
                    <dd className="mt-1.5 text-[13px] leading-snug">{value || 'Not listed'}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 border-t border-line pt-5">
                <p className="label text-mute">{shipping?.heading}</p>
                <ul className="mt-3 space-y-2 text-[13px] leading-relaxed text-mute">
                  {(shipping?.bullets ?? []).map((line, index) => (
                    <li key={`${line}-${index}`}>
                      <TokenText
                        text={fillTokens(line, { CITY: content?.site.city })}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SizeGuide product={product} open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>,
    document.body,
  )
}
