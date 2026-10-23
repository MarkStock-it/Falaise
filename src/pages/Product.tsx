import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  availableSizes,
  formatPrice,
  isSizeAvailable,
  isSoldOut,
  type Product,
} from '../data/products'
import { useCart } from '../store/cart'
import { useSite } from '../store/site'
import { usePageMeta } from '../hooks/usePageMeta'
import { cn } from '../lib/cn'
import { Arrow, Button } from '../components/ui/Button'
import { ProductGallery } from '../components/product/ProductGallery'
import { SizeGuide } from '../components/product/SizeGuide'
import { NotFound } from './NotFound'

/** Renders one shipping/returns line, turning %HANDLE% into the Instagram link. */
function PolicyLine({
  text,
  handle,
  href,
}: {
  text: string
  handle?: string
  href?: string
}) {
  const [before, ...rest] = text.split('%HANDLE%')
  if (rest.length === 0) return <>{text}</>
  return (
    <>
      {before}
      <a
        href={href || '/contact'}
        target="_blank"
        rel="noreferrer"
        className="text-ink underline decoration-line underline-offset-4"
      >
        {handle || 'the studio'}
      </a>
      {rest.join('%HANDLE%')}
    </>
  )
}


export function ProductPage() {
  const { slug } = useParams()
  const { data } = useSite()
  const product = slug ? data?.products.find((item) => item.slug === slug) : undefined

  if (!product) return <NotFound />
  return <ProductDetail product={product} />
}

function ProductDetail({ product }: { product: Product }) {
  const { data } = useSite()
  const content = data?.content
  const add = useCart((state) => state.add)
  const [searchParams, setSearchParams] = useSearchParams()
  const colorQuery = searchParams.get('color')
  const requestedColor =
    colorQuery && product.colors.some((option) => option.id === colorQuery) ? colorQuery : null

  const initialColor =
    requestedColor ??
    product.colors.find((option) => availableSizes(product, option.id).length > 0)?.id ??
    product.colors[0]?.id ??
    ''

  const [colorId, setColorId] = useState(initialColor)
  const [size, setSize] = useState('')
  const [guideOpen, setGuideOpen] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const sizeGroup = useRef<HTMLDivElement>(null)

  const color = product.colors.find((option) => option.id === colorId) ?? product.colors[0]
  const otherColor = color ? product.colors.find((option) => option.id !== color.id) : undefined
  const needsSize = product.sizes.length > 1
  const soldOut = isSoldOut(product)
  const colorSizes = color ? availableSizes(product, color.id) : []
  const colorSoldOut = Boolean(color) && colorSizes.length === 0
  const images = color?.photos ?? product.images

  usePageMeta({
    title: `${product.name}${color ? ` ${color.name}` : ''} — FALAISE`,
    description: `${product.description.slice(0, 150)}…`,
    image: images.front,
    type: 'product',
  })

  useEffect(() => {
    const next =
      requestedColor ??
      product.colors.find((option) => availableSizes(product, option.id).length > 0)?.id ??
      product.colors[0]?.id ??
      ''
    setColorId(next)
  }, [requestedColor, product])

  useEffect(() => {
    setSize('')
    setError('')
    setMessage('')
  }, [colorId, product.slug])

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
    script.text = JSON.stringify(schema)
    document.head.appendChild(script)
    return () => script.remove()
  }, [product, color])

  if (!color) return <NotFound />

  const addToBag = () => {
    if (soldOut) {
      setError('This piece is sold out. Message the studio for the next run.')
      return
    }
    if (needsSize && !size) {
      setError('Choose a size before adding to the bag.')
      sizeGroup.current?.querySelector<HTMLButtonElement>('button')?.focus()
      return
    }
    const chosenSize = size || product.sizes[0]
    if (!chosenSize || !isSizeAvailable(product, color.id, chosenSize)) {
      setError(`${product.name} in ${color.name}, size ${chosenSize || '—'}, is sold out.`)
      return
    }
    setError('')
    add(product, color.id, chosenSize)
    setMessage(`${product.name} in ${color.name}, size ${chosenSize}, added to the bag.`)
  }

  const chooseColor = (nextColorId: string) => {
    setColorId(nextColorId)
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.set('color', nextColorId)
        return next
      },
      { replace: true },
    )
  }

  const chrome = content?.chrome
  const pageCopy = content?.product
  const navShop =
    chrome?.nav.find((item) => item.href === '/shop')?.label ??
    chrome?.catalogueLabel ??
    'Shop'
  const catalogue = chrome?.catalogueLabel ?? 'Catalogue'

  const ctaLabel = soldOut
    ? 'Sold out'
    : colorSoldOut
      ? 'This colour is sold out'
      : `Add to bag — ${formatPrice(product.price)}`

  return (
    <div className="bg-paper pb-24 lg:pb-0">
      <div className="shell pt-5 sm:pt-7">
        <div className="flex items-start justify-between gap-6">
          <nav aria-label="Breadcrumb" className="label flex flex-wrap items-center gap-2 text-mute">
            <Link to="/" className="inline-flex min-h-6 items-center hover:text-ink">
              {chrome?.homeLabel ?? 'Home'}
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/shop" className="inline-flex min-h-6 items-center hover:text-ink">
              {navShop}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-ink" aria-current="page">
              {product.name}
            </span>
          </nav>
          <p className="label shrink-0 text-mute">
            {product.collection?.name ?? catalogue} / {product.drop || product.code || 'Vol. 01'}
          </p>
        </div>

        <div className="mt-5 grid border-t border-line lg:grid-cols-12">
          <div className="lg:col-span-7 lg:border-r lg:border-line lg:pr-8">
            <div className="lg:py-6">
              <ProductGallery product={product} images={images} colorName={color.name} />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-y border-line py-4">
                <div className="flex items-center gap-4">
                  <p className="label text-mute">{chrome?.colourLabel ?? 'Colour'}</p>
                  <div role="group" aria-label={chrome?.colourLabel ?? 'Colour'} className="flex items-center gap-1">
                    {product.colors.map((option) => {
                      const selected = option.id === color.id
                      const inStock = availableSizes(product, option.id).length > 0
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => chooseColor(option.id)}
                          aria-pressed={selected}
                          aria-label={`${option.name}${inStock ? '' : ', sold out'}${
                            selected ? ', selected' : ''
                          }`}
                          title={inStock ? option.name : `${option.name} — sold out`}
                          className={cn(
                            'flex h-9 w-9 items-center justify-center border transition-colors',
                            selected ? 'border-ink' : 'border-transparent hover:border-line',
                          )}
                        >
                          <span
                            className={cn('block h-6 w-6 border border-ink/20', !inStock && 'opacity-40')}
                            style={{ backgroundColor: option.hex }}
                          />
                        </button>
                      )
                    })}
                  </div>
                  <p className="label text-ink">
                    {color.name}
                    {colorSoldOut ? <span className="text-mute"> / sold out</span> : null}
                  </p>
                </div>
                <p className="label text-mute tabular-nums">
                  {formatPrice(product.price)} / {product.sizes.join(' · ')}
                </p>
              </div>
              <p className="label mt-3 text-mute">{pageCopy?.galleryNote}</p>
            </div>
          </div>

          <aside className="py-8 lg:col-span-5 lg:py-10 lg:pl-10">
            <p className="label text-mute">
              {product.collection?.name ?? catalogue} / {product.drop || 'Vol. 01'}
            </p>
            <h1 className="display display-tight mt-4 text-[clamp(3rem,7vw,5.5rem)]">
              {product.name}
            </h1>
            <p className="lede mt-4 max-w-[22ch] text-ink">{product.tagline}</p>

            <div className="mt-7 flex items-end justify-between gap-6 border-y border-line py-4">
              <p className="font-[family-name:var(--font-label)] text-2xl font-[600] tracking-[-0.02em] tabular-nums">
                {formatPrice(product.price)}
              </p>
              <p className="label text-right text-mute">
                {soldOut
                  ? 'Sold out / message the studio'
                  : colorSoldOut
                    ? 'This colour is sold out'
                    : content?.shipping?.stockLabel}
              </p>
            </div>

            <div ref={sizeGroup} className="mt-6">
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
                      title={available ? option : `${option} — sold out`}
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
                className={cn('mt-3 text-[13px] leading-snug text-mute', error ? 'text-ink' : '')}
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
              className="mt-6 w-full justify-between"
            >
              <span>{ctaLabel}</span>
              <Arrow />
            </Button>
            <p className="mt-3 text-center text-[13px] leading-relaxed text-mute" aria-live="polite">
              {message ||
                (soldOut ? (
                  <>
                    Sold out for now. Message{' '}
                    <a
                      href={content?.links.instagramDm ?? '/contact'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink underline decoration-line underline-offset-4"
                    >
                      {content?.links.handle ?? 'the studio'}
                    </a>{' '}
                    about the next run.
                  </>
                ) : (
                  'Payment and shipping are arranged in Instagram DMs.'
                ))}
            </p>

            <div className="mt-9 border-t border-line pt-6">
              <p className="prose-body">{product.description}</p>

              <ul className="mt-7 border-t border-line">
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

            <dl className="mt-7 grid grid-cols-3 gap-4 border-t border-line pt-5">
              {[
                ['Fabric', product.meta.fabric],
                ['Fit', product.meta.fit],
                ['Made', product.meta.made],
              ].map(([term, value]) => (
                <div key={term}>
                  <dt className="label text-mute">{term}</dt>
                  <dd className="mt-1.5 text-[13px] leading-snug">{value || '—'}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-8 border-t border-line pt-5">
              <p className="label text-mute">{content?.shipping?.heading}</p>
              <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-mute">
                {(content?.shipping?.bullets ?? []).map((line, index) => (
                  <li key={`${line}-${index}`}>
                    <PolicyLine
                      text={line.replaceAll('%CITY%', content?.site?.city ?? '')}
                      handle={content?.links?.handle}
                      href={content?.links?.instagramDm}
                    />
                  </li>
                ))}
              </ul>
            </div>

            {otherColor ? (
              <div className="mt-8 border-t border-line pt-5">
                <p className="label text-mute">
                  {chrome?.alsoInLabel ?? 'Also in'}{' '}
                  {product.collection?.name ?? 'the collection'}
                </p>
                <Link
                  to={`/product/${product.slug}?color=${otherColor.id}`}
                  data-cursor="view"
                  className="group mt-3 flex items-center gap-4 border-b border-line pb-3"
                >
                  <img
                    src={otherColor.photos.front}
                    alt={`${product.name} in ${otherColor.name}`}
                    width={1000}
                    height={1250}
                    loading="lazy"
                    className="h-24 w-20 border border-line object-cover"
                  />
                  <span className="flex flex-1 items-center justify-between gap-3">
                    <span>
                      <span className="block font-[family-name:var(--font-label)] text-[15px] font-[600]">
                        {product.name} — {otherColor.name}
                      </span>
                      <span className="label mt-1 block text-mute">
                        {formatPrice(product.price)}
                      </span>
                    </span>
                    <Arrow className="h-4 w-4" />
                  </span>
                </Link>
              </div>
            ) : null}
          </aside>
        </div>
      </div>

      <section className="mt-10 border-t border-line sm:mt-16">
        <div className="shell py-14 sm:py-20">
          <div className="flex flex-col justify-between gap-5 border-b border-line pb-6 sm:flex-row sm:items-end">
            <div>
              <p className="label text-mute">{chrome?.productWornIndex ?? '02 / Worn'}</p>
              <h2 className="display mt-4 text-[clamp(2.2rem,5vw,4rem)]">
                {pageCopy?.wornHeading}
              </h2>
            </div>
            <p className="prose-body max-w-[30ch] text-mute">{pageCopy?.wornBody}</p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-12">
            <figure className="sm:col-span-7">
              <img
                src="/photos/look-front.webp"
                alt={`${product.name} in ${product.colors[0]?.name ?? 'the first colour'} worn with wide grey trousers.`}
                width={1000}
                height={1250}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover"
              />
              <figcaption className="label mt-2 flex justify-between text-mute">
                <span>
                  {product.colors[0]?.name ?? 'Colour'} / {pageCopy?.frontLabel}
                </span>
                <span>
                  {pageCopy?.lookLabel} 01
                </span>
              </figcaption>
            </figure>
            <figure className="sm:col-span-5 sm:pt-20">
              <img
                src="/photos/look-back.webp"
                alt={`${product.name} seen from the back, showing the print.`}
                width={1000}
                height={1250}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover"
              />
              <figcaption className="label mt-2 flex justify-between text-mute">
                <span>
                  {product.colors[0]?.name ?? 'Colour'} / {pageCopy?.backLabel}
                </span>
                <span>
                  {pageCopy?.lookLabel} 02
                </span>
              </figcaption>
            </figure>
            <figure className="sm:col-span-5 sm:pt-8">
              <img
                src="/photos/blanc-look.webp"
                alt={`${product.name} in ${product.colors[1]?.name ?? product.colors[0]?.name ?? 'the second colour'} worn with white trousers.`}
                width={1000}
                height={1250}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover"
              />
              <figcaption className="label mt-2 flex justify-between text-mute">
                <span>
                  {product.colors[1]?.name ?? product.colors[0]?.name ?? 'Colour'} /{' '}
                  {pageCopy?.frontLabel}
                </span>
                <span>
                  {pageCopy?.lookLabel} 03
                </span>
              </figcaption>
            </figure>
            <figure className="sm:col-span-7 sm:pt-8">
              <img
                src="/photos/editorial-seaside.webp"
                alt={`${product.name} at the seawall, cliff line behind.`}
                width={1169}
                height={632}
                loading="lazy"
                className="aspect-[4/5] w-full object-cover object-[50%_40%] sm:aspect-[16/11]"
              />
              <figcaption className="label mt-2 flex justify-between text-mute">
                <span>
                  {pageCopy?.edgeLabel} / {content?.site.city || 'Liloan, Cebu'}
                </span>
                <span>{product.drop || 'Vol. 01'}</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-4 border-t border-line bg-paper px-5 py-3 lg:hidden">
        <div>
          <p className="label">{product.name}</p>
          <p className="label text-mute">
            {soldOut ? 'Sold out' : formatPrice(product.price)}
            {!soldOut && size ? ` / ${size}` : ''}
          </p>
        </div>
        <Button
          variant="ink"
          size="md"
          onClick={addToBag}
          disabled={soldOut || colorSoldOut}
          className="min-w-[150px]"
        >
          {soldOut || colorSoldOut ? 'Sold out' : 'Add to bag'}
        </Button>
      </div>

      <SizeGuide product={product} open={guideOpen} onClose={() => setGuideOpen(false)} />
    </div>
  )
}
