import { Link, useSearchParams } from 'react-router-dom'
import { useSite } from '../store/site'
import { usePageMeta } from '../hooks/usePageMeta'
import { Reveal } from '../components/ui/Reveal'
import { Arrow } from '../components/ui/Button'
import { ProductCard } from '../components/shop/ProductCard'
import { ProductQuickView } from '../components/shop/ProductQuickView'
import { formatPrice, isSoldOut } from '../data/products'
import { fillTokens } from '../lib/tokens'

/** Renders copy that may contain %HANDLE%, turning it into the Instagram DM link. */
function HandleText({ text, handle, href }: { text: string; handle: string; href: string }) {
  const [before, ...rest] = text.split('%HANDLE%')
  if (rest.length === 0) return <>{text}</>
  return (
    <>
      {before}
      <a
        href={href}
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

export function Shop() {
  const { data } = useSite()
  const [searchParams, setSearchParams] = useSearchParams()
  const pieceSlug = searchParams.get('piece')
  const featured = data?.products.find((product) => product.featured) ?? data?.products[0]
  const collectionName = data?.collections[0]?.name ?? data?.content.chrome.catalogueLabel ?? 'Catalogue'
  const colourCount = featured?.colors.length ?? 0
  const sizes = featured?.sizes ?? []

  usePageMeta({
    title: `FALAISE | ${collectionName}`,
    description:
      featured?.description.slice(0, 155) ??
      'The FALAISE catalogue. Heavyweight cotton, cut boxy, finished in Cebu.',
    image: featured?.images.front ?? '/og/falaise-og.jpg',
  })

  if (!data) return null

  const { products, content } = data
  const pieces = products.flatMap((product) =>
    product.colors.map((color) => ({ product, color })),
  )
  const active = pieceSlug ? products.find((product) => product.slug === pieceSlug) : undefined

  const closePiece = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('piece')
    next.delete('color')
    setSearchParams(next, { replace: true })
  }
  const { editorial, print, chrome, shop } = content
  const backBeat = print.beats[2] ?? print.beats[0]
  const constructionBody = fillTokens(shop.constructionBody, { COLLECTION: collectionName })

  const specs: [string, string][] = featured
    ? ([
        ['Fabric', featured.meta.fabric],
        ['Fit', featured.meta.fit],
        ['Made', featured.meta.made],
        ['Sizes', featured.sizes.join(' / ')],
        ...featured.details.map((detail, index) => [
          `Detail ${String(index + 1).padStart(2, '0')}`,
          detail,
        ] as [string, string]),
      ].filter(([, value]) => Boolean(value)) as [string, string][])
    : []

  return (
    <div className="bg-paper">
      <header className="shell pb-12 pt-10 sm:pb-16 sm:pt-16">
        <div className="flex items-start justify-between gap-6">
          <p className="label text-mute">
            {collectionName} / {chrome.catalogueLabel}
          </p>
          <p className="label text-mute">{content.hero.location || content.site.city}</p>
        </div>

        <h1 className="display display-tight mt-8 max-w-[10ch] text-[clamp(3.5rem,13vw,12rem)]">
          {collectionName}
        </h1>

        <div className="mt-10 grid gap-6 border-t border-line pt-6 sm:grid-cols-2 sm:pt-8">
          <div>
            <p className="lede max-w-[26ch]">
              {featured?.tagline || content.site.tagline}
            </p>
            <p className="prose-body mt-4 max-w-[48ch] text-mute">
              {featured?.description || shop.introFallback}
            </p>
          </div>
          <div className="sm:text-right">
            <p className="label text-mute">
              {products.length} piece{products.length === 1 ? '' : 's'} / {colourCount}{' '}
              colour{colourCount === 1 ? '' : 's'} /{' '}
              {sizes.length > 0 ? sizes.join('–') : 'One size'}
            </p>
            <p className="mt-3 font-[family-name:var(--font-label)] text-xl font-[600] tabular-nums">
              {featured ? formatPrice(featured.price) : 'Price on request'}
            </p>
            <p className="label mt-3 text-mute">
              {featured
                ? isSoldOut(featured)
                  ? `Sold out / message ${content.links.handle}`
                  : content.shipping.stockLabel
                : 'No pieces listed'}
            </p>
          </div>
        </div>
      </header>

      <section aria-labelledby="catalogue" className="shell pb-16 sm:pb-24">
        <h2 id="catalogue" className="sr-only">
          {chrome.catalogueLabel}
        </h2>

        {products.length === 0 ? (
          <div className="border-y border-line py-16 text-center sm:py-20">
            <p className="display text-[clamp(1.8rem,4vw,2.6rem)]">{shop.emptyTitle}</p>
            <p className="mx-auto mt-4 max-w-[40ch] text-[15px] leading-relaxed text-mute">
              <HandleText
                text={shop.emptyBody}
                handle={content.links.handle}
                href={content.links.instagramDm}
              />
            </p>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 sm:gap-6">
            {pieces.map(({ product, color }, index) => (
              <Reveal key={`${product.id}-${color.id}`} delay={(index % 2) * 90}>
                <ProductCard product={product} color={color} />
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {featured ? (
        <section className="border-y border-line bg-paper-deep/40">
          <div className="shell grid gap-10 py-16 sm:py-20 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <Reveal>
                <p className="label text-mute">{chrome.shopConstructionIndex}</p>
                <h2 className="display display-tight mt-5 max-w-[10ch] text-[clamp(2.4rem,5vw,4.5rem)]">
                  {shop.constructionHeading}
                </h2>
                <p className="prose-body mt-5 text-mute">{constructionBody}</p>
              </Reveal>
            </div>
            <div className="lg:col-span-6 lg:col-start-7">
              <Reveal delay={120}>
                <dl className="border-t border-line">
                  {specs.map(([term, value]) => (
                    <div
                      key={`${term}-${value}`}
                      className="grid grid-cols-[7rem_1fr] gap-4 border-b border-line py-3 sm:grid-cols-[10rem_1fr]"
                    >
                      <dt className="label pt-1 text-mute">{term}</dt>
                      <dd className="text-[15px] leading-relaxed">{value}</dd>
                    </div>
                  ))}
                </dl>
                <Link
                  to={`/shop?piece=${featured.slug}`}
                  className="label link-line mt-6 inline-flex items-center gap-2"
                >
                  {chrome.shopViewLabel}
                  <Arrow />
                </Link>
              </Reveal>
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-ink text-paper">
        <div className="relative overflow-hidden">
          <img
            src={editorial.image}
            alt={editorial.alt}
            width={1169}
            height={632}
            loading="lazy"
            className="h-[52svh] w-full object-cover opacity-90 sm:h-[62svh]"
          />
          <div className="absolute inset-0 flex items-end">
            <div className="shell w-full pb-8 sm:pb-12">
              <p className="label text-paper/60">{editorial.kicker}</p>
              <p className="display display-tight mt-3 max-w-[12ch] text-[clamp(2.4rem,6vw,5.5rem)]">
                {editorial.headline}
              </p>
            </div>
          </div>
        </div>
        <div className="shell grid gap-8 py-12 sm:grid-cols-2 sm:py-16">
          <p className="lede max-w-[30ch] text-paper">{editorial.lede}</p>
          <p className="prose-body max-w-[46ch] text-paper/60 sm:ml-auto">{editorial.body}</p>
        </div>
      </section>

      {backBeat ? (
        <section className="shell py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-12">
            <Reveal className="lg:col-span-7">
              <img
                src={print.image}
                alt={print.alt}
                width={1200}
                height={900}
                loading="lazy"
                className="w-full border border-line bg-ink"
              />
            </Reveal>
            <div className="lg:col-span-4 lg:col-start-9 lg:self-end">
              <Reveal delay={100}>
                <p className="label text-mute">{print.index}</p>
                <h2 className="display mt-5 text-[clamp(2rem,4vw,3.5rem)]">{backBeat.title}</h2>
                <p className="prose-body mt-5 text-mute">{backBeat.body}</p>
                <Link
                  to={featured ? `/shop?piece=${featured.slug}` : print.linkHref}
                  className="label link-line mt-6 inline-flex items-center gap-2"
                >
                  {print.linkLabel}
                  <Arrow />
                </Link>
              </Reveal>
            </div>
          </div>
        </section>
      ) : null}

      {active ? (
        <ProductQuickView
          key={active.slug}
          product={active}
          colorId={searchParams.get('color')}
          onClose={closePiece}
        />
      ) : null}

      <section className="shell pb-20 sm:pb-28">
        <div className="grid gap-6 border-t border-line pt-6 sm:grid-cols-12">
          <div className="sm:col-span-4">
            <p className="label text-mute">{chrome.shopWornIndex}</p>
            <p className="prose-body mt-4 max-w-[28ch]">{shop.wornBody}</p>
          </div>
          <div className="sm:col-span-4">
            <img
              src="/photos/look-front.webp"
              alt={`${featured?.name ?? 'The piece'} worn with wide grey trousers.`}
              width={1000}
              height={1250}
              loading="lazy"
              className="w-full border border-line object-cover"
            />
          </div>
          <div className="sm:col-span-4 sm:pt-16">
            <img
              src="/photos/look-back.webp"
              alt={`${featured?.name ?? 'The piece'} seen from the back, showing the print.`}
              width={1000}
              height={1250}
              loading="lazy"
              className="w-full border border-line object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
