import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'
import { formatPrice } from '../data/products'
import { useSite } from '../store/site'
import { Reveal } from '../components/ui/Reveal'
import { Arrow, ButtonLink } from '../components/ui/Button'
import type { Link as ContentLink, StoreData } from '../api/types'

const isExternal = (href: string) => /^https?:\/\//i.test(href)

function TextLink({
  link,
  className,
  children,
}: {
  link: ContentLink
  className?: string
  children?: ReactNode
}) {
  const content = children ?? link.label
  if (isExternal(link.href)) {
    return (
      <a href={link.href} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    )
  }
  return (
    <Link to={link.href || '/'} className={className}>
      {content}
    </Link>
  )
}

export function Home() {
  const { data } = useSite()
  if (!data) return null
  return <HomeView data={data} />
}

function HomeView({ data }: { data: StoreData }) {
  const { content, products } = data
  const featured = products.find((product) => product.featured) ?? products[0]
  const hero = content.hero
  const studio = content.studio
  const print = content.print
  const colours = content.colours
  const editorial = content.editorial
  const drop = content.drop
  const closing = content.closing
  const testimonials = content.testimonials.filter((item) => item.quote.trim() !== '')

  usePageMeta({
    title: content.site.metaTitle,
    description: content.site.metaDescription,
    image: content.site.ogImage,
  })

  return (
    <>
      <section className="shell pb-14 pt-6 sm:pb-20 sm:pt-8">
        <div className="flex items-baseline justify-between gap-6 border-b border-line pb-4">
          <p className="label text-mute">{hero.eyebrow}</p>
          <p className="label text-mute">{hero.location}</p>
        </div>

        <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-6">
          <div className="flex flex-col justify-between lg:col-span-7">
            <div>
              <h1 className="display display-tight text-[clamp(3.2rem,7.6vw,8rem)] leading-[0.8]">
                {hero.headline.filter(Boolean).map((line, index) => (
                  <span key={`${line}-${index}`} className="block">
                    {line}
                  </span>
                ))}
              </h1>

              <div className="mt-10 grid gap-8 border-t border-line pt-6 sm:grid-cols-[1fr_auto] sm:items-end">
                <p className="prose-body max-w-[34ch] text-mute">{hero.body}</p>
                <div className="flex flex-wrap items-center gap-5">
                  <ButtonLink
                    {...(isExternal(hero.primaryCta.href)
                      ? { href: hero.primaryCta.href }
                      : { to: hero.primaryCta.href })}
                    variant="ink"
                    size="md"
                  >
                    {hero.primaryCta.label}
                    <Arrow />
                  </ButtonLink>
                  <TextLink
                    link={hero.secondaryCta}
                    className="label link-line whitespace-nowrap text-mute hover:text-ink"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 hidden grid-cols-3 gap-6 border-t border-line pt-4 lg:grid">
              {hero.specs.map((spec) => (
                <div key={spec.term}>
                  <p className="label text-mute">{spec.term}</p>
                  <p className="mt-1.5 font-[family-name:var(--font-label)] text-[13px]">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="grid grid-cols-2 gap-3 lg:hidden">
              {[hero.mainImage, hero.insetImage].map((image, index) => (
                <figure key={`${image.src}-${index}`}>
                  <div className="overflow-hidden bg-paper-deep">
                    <img
                      src={image.src}
                      alt={image.alt}
                      width={1000}
                      height={1250}
                      className="aspect-[4/5] w-full object-cover mix-blend-multiply"
                    />
                  </div>
                  <figcaption className="label mt-2 text-mute">{image.caption}</figcaption>
                </figure>
              ))}
            </div>

            <Reveal className="relative hidden lg:block" delay={80}>
              <figure>
                <div className="overflow-hidden bg-paper-deep">
                  <img
                    src={hero.mainImage.src}
                    alt={hero.mainImage.alt}
                    width={1000}
                    height={1250}
                    fetchPriority="high"
                    className="aspect-[4/5] w-full object-cover mix-blend-multiply"
                  />
                </div>
                <figcaption className="label mt-3 flex items-center justify-between gap-4 text-mute">
                  <span>{hero.mainImage.caption}</span>
                  <span>{hero.mainImage.note}</span>
                </figcaption>
              </figure>

              <figure className="absolute bottom-8 left-6 w-[42%] border-[6px] border-paper bg-paper">
                <div className="overflow-hidden">
                  <img
                    src={hero.insetImage.src}
                    alt={hero.insetImage.alt}
                    width={1000}
                    height={1250}
                    className="aspect-[4/5] w-full object-cover mix-blend-multiply"
                  />
                </div>
                <figcaption className="label mt-2 flex items-center justify-between gap-2 text-mute">
                  <span>{hero.insetImage.caption}</span>
                  <span>{hero.insetImage.note}</span>
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="shell py-20 sm:py-28 lg:py-36">
        <div className="grid gap-10 border-t border-line pt-6 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7">
            <Reveal>
              <p className="label text-mute">{studio.index}</p>
              <h2 className="display display-tight mt-6 max-w-[9ch] text-[clamp(2.8rem,7.5vw,7.5rem)]">
                {studio.heading.filter(Boolean).map((line, index) => (
                  <span key={`${line}-${index}`} className="block">
                    {line}
                  </span>
                ))}
              </h2>
            </Reveal>
          </div>
          <div className="lg:col-span-4 lg:col-start-9">
            <Reveal delay={120}>
              <p className="prose-body">{studio.body1}</p>
              <p className="prose-body mt-5 text-mute">{studio.body2}</p>
              <TextLink
                link={{ label: studio.linkLabel, href: studio.linkHref }}
                className="label link-line mt-8 inline-flex items-center gap-2 text-ink"
              >
                {studio.linkLabel}
                <Arrow />
              </TextLink>
            </Reveal>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-px border-y border-line bg-line sm:grid-cols-4">
          {content.stats.map((stat) => (
            <div key={`${stat.value}-${stat.label}`} className="bg-paper px-4 py-6 sm:px-6 sm:py-8">
              <p className="display text-4xl sm:text-5xl">{stat.value}</p>
              <p className="label mt-2 text-mute">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-paper-deep/35">
        <div className="shell grid gap-0 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <div className="relative overflow-hidden lg:sticky lg:top-16 lg:h-[calc(100svh-4rem)]">
              <img
                src={print.image}
                alt={print.alt}
                width={1200}
                height={900}
                loading="lazy"
                className="h-[52svh] w-full object-cover sm:h-[60svh] lg:h-full"
              />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-ink/70 to-transparent p-5 sm:p-7">
                <p className="label text-paper">{print.captionLeft}</p>
                <p className="label text-paper/60">{print.captionRight}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 lg:col-start-7 lg:py-16">
            <p className="label text-mute lg:pt-4">{print.index}</p>
            <div className="mt-4">
              {print.beats.map((item, index) => (
                <article
                  key={`${item.index}-${index}`}
                  className="grid gap-4 border-t border-line py-8 sm:grid-cols-[3rem_1fr] sm:gap-6 sm:py-10"
                >
                  <span className="label pt-1 text-mute">{item.index}</span>
                  <div>
                    <p className="label text-mute">{item.kicker}</p>
                    <h2 className="display mt-3 text-[clamp(2rem,4vw,3.6rem)]">{item.title}</h2>
                    <p className="prose-body mt-4 max-w-[46ch] text-mute">{item.body}</p>
                  </div>
                </article>
              ))}
              <div className="border-t border-line pt-6">
                <TextLink
                  link={{ label: print.linkLabel, href: print.linkHref }}
                  className="label link-line inline-flex items-center gap-2"
                >
                  {print.linkLabel}
                  <Arrow />
                </TextLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {featured ? (
        <section className="shell py-20 sm:py-28">
          <div className="flex flex-col justify-between gap-6 border-t border-line pt-6 sm:flex-row sm:items-end">
            <div>
              <p className="label text-mute">{colours.index}</p>
              <h2 className="display mt-5 text-[clamp(2.4rem,5vw,4.5rem)]">{colours.heading}</h2>
            </div>
            <TextLink
              link={{ label: colours.linkLabel, href: colours.linkHref }}
              className="label link-line flex items-center gap-2"
            >
              {colours.linkLabel}
              <Arrow />
            </TextLink>
          </div>

          <ul className="mt-10">
            <li>
              <Link
                to={`/product/${featured.slug}`}
                data-cursor="view"
                className="group grid grid-cols-12 items-center gap-3 border-y border-line py-5 transition-colors hover:bg-paper-deep sm:gap-4 sm:py-6"
              >
                <span className="label col-span-1 text-mute">{featured.code}</span>
                <span className="display col-span-6 text-[clamp(1.6rem,3.4vw,2.8rem)]">
                  {featured.name}
                </span>
                <span className="label col-span-2 hidden text-mute sm:block">
                  {featured.meta.fabric}
                </span>
                <span className="label col-span-3 text-right tabular-nums sm:col-span-2">
                  {formatPrice(featured.price)}
                </span>
                <span className="label col-span-2 flex items-center justify-end gap-1.5 sm:col-span-1">
                  {featured.colors.map((color) => (
                    <span
                      key={color.id}
                      aria-hidden="true"
                      className="block h-2.5 w-2.5 border border-ink/25"
                      style={{ backgroundColor: color.hex }}
                    />
                  ))}
                </span>
              </Link>
            </li>
          </ul>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {featured.colors.map((color, index) => (
              <Reveal key={color.id} delay={index * 100}>
                <Link
                  to={`/product/${featured.slug}?color=${color.id}`}
                  data-cursor="view"
                  className="group block"
                >
                  <div className="relative aspect-[4/5] overflow-hidden border border-line bg-paper-deep">
                    <img
                      src={color.photos.front}
                      alt={`${featured.name} in ${color.name}, worn.`}
                      width={1000}
                      height={1250}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0 group-focus-within:opacity-0"
                    />
                    <img
                      src={color.photos.back}
                      alt=""
                      aria-hidden="true"
                      width={1000}
                      height={1250}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover opacity-0 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-100 group-focus-within:opacity-100"
                    />
                    <span className="label absolute left-3 top-3 bg-paper/90 px-2 py-1.5 text-ink sm:left-4 sm:top-4">
                      {color.name}
                    </span>
                    <span className="label absolute bottom-3 right-3 bg-paper/90 px-2 py-1.5 text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 sm:bottom-4 sm:right-4">
                      View
                    </span>
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-4 border-b border-line pb-3">
                    <div>
                      <h3 className="display text-[clamp(1.8rem,3.4vw,2.6rem)]">
                        {featured.name} — {color.name}
                      </h3>
                      <p className="label mt-2 text-mute">{colours.productNote}</p>
                    </div>
                    <p className="label shrink-0 pt-1 tabular-nums">{formatPrice(featured.price)}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
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
            className="h-[60svh] w-full object-cover opacity-90 sm:h-[70svh]"
          />
          <div className="absolute inset-0 bg-ink/25" aria-hidden="true" />
          <div className="absolute inset-0 flex items-end">
            <div className="shell w-full pb-8 sm:pb-12">
              <p className="label text-paper/70">{editorial.kicker}</p>
              <p className="display display-tight mt-3 max-w-[12ch] text-[clamp(2.8rem,8vw,7rem)]">
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

      {testimonials.length > 0 ? (
        <section className="shell py-20 sm:py-28">
          <div className="border-t border-line pt-6">
            <ul className="mt-2 grid gap-px bg-line sm:grid-cols-2">
              {testimonials.slice(0, 6).map((item, index) => (
                <li
                  key={`${item.author}-${index}`}
                  className={
                    testimonials.length % 2 === 1 && index === 0
                      ? 'bg-paper px-5 py-8 sm:col-span-2 sm:px-8 sm:py-10'
                      : 'bg-paper px-5 py-8 sm:px-8 sm:py-10'
                  }
                >
                  <blockquote className="lede max-w-[38ch]">“{item.quote}”</blockquote>
                  <footer className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-line pt-3">
                    <span className="label text-ink">{item.author}</span>
                    {item.detail ? <span className="label text-mute">{item.detail}</span> : null}
                  </footer>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="shell py-20 sm:py-28">
        <div className="grid gap-12 border-t border-line pt-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="label text-mute">{drop.eyebrow}</p>
            <p className="display display-tight mt-5 text-[clamp(4rem,13vw,12rem)] leading-[0.82]">
              {drop.headline.filter(Boolean).map((line, index) => (
                <span key={`${line}-${index}`} className="block">
                  {line}
                </span>
              ))}
            </p>
          </div>
          <div className="flex flex-col justify-between gap-10 lg:col-span-4 lg:col-start-9">
            <div>
              <p className="lede">{drop.lede}</p>
              <p className="mt-5 text-[15px] leading-[1.8] text-mute">{drop.body}</p>
            </div>
            <ButtonLink
              href={content.links.instagramDm}
              variant="ink"
              size="lg"
              ariaLabel={`${drop.ctaLabel} — ${content.links.handle}`}
            >
              {drop.ctaLabel}
              <Arrow />
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="shell pb-20 sm:pb-28">
        <div className="grid gap-8 border-t border-line pt-6 lg:grid-cols-12">
          <p className="label text-mute lg:col-span-3">{closing.index}</p>
          <div className="lg:col-span-8 lg:col-start-5">
            <p className="display max-w-[18ch] text-[clamp(2rem,4.6vw,4rem)]">{closing.statement}</p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <TextLink
                link={{ label: closing.primaryLabel, href: closing.primaryHref }}
                className="label link-line flex items-center gap-2"
              >
                {closing.primaryLabel}
                <Arrow />
              </TextLink>
              <TextLink
                link={{ label: closing.secondaryLabel, href: closing.secondaryHref }}
                className="label link-line text-mute hover:text-ink"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
