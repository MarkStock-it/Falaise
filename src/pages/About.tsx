import { Link } from 'react-router-dom'
import { Arrow, ButtonLink } from '../components/ui/Button'
import { Reveal } from '../components/ui/Reveal'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSite } from '../store/site'

export function About() {
  const { data } = useSite()
  const featured = data!.products.find((product) => product.featured) ?? data!.products[0]
  const about = data!.content.about
  const chrome = data!.content.chrome

  usePageMeta({
    title: 'Studio | FALAISE',
    description: about.lede,
    image: '/photos/editorial-seaside.webp',
  })

  return (
    <div className="bg-paper">
      <header className="shell pb-14 pt-10 sm:pb-20 sm:pt-16">
        <div className="flex items-baseline justify-between border-b border-line pb-4">
          <p className="label text-mute">{about.index}</p>
          <p className="label text-mute">{data!.content.site.city}</p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8">
            <h1 className="display display-tight text-[clamp(3.1rem,10.5vw,9.5rem)] leading-[0.82]">
              {about.headline.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h1>
          </div>
          <div className="flex flex-col justify-end lg:col-span-4">
            <img
              src="/brand/falaise-lockup-black.png"
              alt="FALAISE"
              width={606}
              height={401}
              className="mb-8 h-16 w-auto self-start"
            />
            <p className="lede max-w-[24ch]">{about.lede}</p>
            <p className="prose-body mt-6 text-mute">{about.body}</p>
          </div>
        </div>
      </header>

      <section className="shell py-14 sm:py-20" aria-labelledby="edge-image">
        <Reveal>
          <figure>
            <div className="overflow-hidden border border-line bg-paper-deep">
              <img
                src="/photos/editorial-seaside.webp"
                alt="FALAISE Le Tee in noir, worn on the coast away from the studio."
                width={1169}
                height={632}
                loading="lazy"
                className="h-auto w-full"
              />
            </div>
            <figcaption className="mt-4 flex flex-col gap-2 border-t border-line pt-3 sm:flex-row sm:justify-between">
              <p className="label text-mute" id="edge-image">
                {about.figureCaption}
              </p>
              <p className="label text-mute">{about.figureNote}</p>
            </figcaption>
          </figure>
        </Reveal>
      </section>

      <section className="shell py-16 sm:py-24" aria-labelledby="manifesto">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <p className="label text-mute">{chrome.aboutPositionIndex}</p>
            </div>
            <div className="lg:col-span-8 lg:col-start-5">
              <h2
                id="manifesto"
                className="display text-[clamp(2.3rem,5.6vw,5rem)] leading-[0.94]"
              >
                {about.manifestoTitle}
              </h2>
              <div className="mt-10 grid gap-8 sm:grid-cols-2">
                <p className="prose-body">{about.manifestoA}</p>
                <p className="prose-body text-mute">{about.manifestoB}</p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="bg-ink py-20 text-paper sm:py-28" aria-labelledby="process">
        <div className="shell">
          <Reveal>
            <div className="flex flex-col gap-6 border-b border-line-ink pb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="label text-mute">{chrome.aboutProcessIndex}</p>
                <h2
                  id="process"
                  className="display mt-4 text-[clamp(2.4rem,6vw,5.5rem)] leading-[0.9]"
                >
                  {about.processHeading.map((line, index) => (
                    <span key={`${line}-${index}`}>
                      {index > 0 ? <br /> : null}
                      {line}
                    </span>
                  ))}
                </h2>
              </div>
              <p className="max-w-[34ch] text-[15px] leading-relaxed text-mute">
                {about.processIntro}
              </p>
            </div>
          </Reveal>

          <ol>
            {about.process.map((step, index) => (
              <Reveal as="li" key={`${step.index}-${step.title}`} delay={index * 60}>
                <div className="grid gap-5 border-b border-line-ink py-10 sm:py-12 lg:grid-cols-12">
                  <div className="lg:col-span-2">
                    <span className="display text-[clamp(3rem,6vw,5rem)] leading-none text-mute">
                      {step.index}
                    </span>
                  </div>
                  <div className="lg:col-span-3">
                    <h3 className="display text-[clamp(1.7rem,3vw,2.6rem)] uppercase">
                      {step.title}
                    </h3>
                  </div>
                  <div className={index === 1 ? 'lg:col-span-6 lg:col-start-7' : 'lg:col-span-6'}>
                    <p className="max-w-[52ch] text-[15px] leading-[1.75] text-paper/80">
                      {step.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="shell py-20 sm:py-28" aria-labelledby="facts">
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <p className="label text-mute">{chrome.aboutRecordIndex}</p>
              <h2 id="facts" className="display mt-4 text-[clamp(2rem,3.6vw,3rem)] leading-none">
                {about.factsHeading}
              </h2>
            </div>
            <div className="lg:col-span-7 lg:col-start-6">
              <dl className="border-t border-ink">
                {about.facts.map((fact) => (
                  <div
                    key={fact.term}
                    className="flex items-baseline justify-between gap-6 border-b border-line py-4"
                  >
                    <dt className="label text-mute">{fact.term}</dt>
                    <dd className="font-[family-name:var(--font-label)] text-[15px] font-[550] tabular-nums">
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-6 max-w-[48ch] text-[13px] leading-relaxed text-mute">
                {about.factsNote}
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="border-t border-line">
        <div className="shell flex flex-col gap-10 py-16 sm:py-24 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <p className="label text-mute">{chrome.aboutNextIndex}</p>
            <p className="display mt-4 text-[clamp(2.8rem,8vw,7rem)] leading-[0.88]">
              {about.closingHeadline.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </p>
            <p className="prose-body mt-6 max-w-[38ch] text-mute">{about.closingBody}</p>
          </Reveal>
          <Reveal delay={80} className="flex flex-wrap gap-3">
            {featured ? (
              <ButtonLink to={`/shop?piece=${featured.slug}`} variant="ink" viewTransition>
                {chrome.seeLabel} {featured.name} <Arrow />
              </ButtonLink>
            ) : null}
            <ButtonLink to="/contact" variant="outline">
              {chrome.contactStudioLabel}
            </ButtonLink>
          </Reveal>
        </div>
        <div className="shell flex items-center justify-between border-t border-line py-5">
          <p className="label text-mute">{data!.content.site.city}</p>
          <Link to="/shop" className="label link-line">
            {chrome.shopLinkLabel}
          </Link>
        </div>
      </section>
    </div>
  )
}
