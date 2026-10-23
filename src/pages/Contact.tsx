import { Arrow, ButtonLink } from '../components/ui/Button'
import { Reveal } from '../components/ui/Reveal'
import { usePageMeta } from '../hooks/usePageMeta'
import { fillTokens } from '../lib/tokens'
import { useSite } from '../store/site'

export function Contact() {
  const { data } = useSite()
  const content = data!.content
  const links = content.links
  const chrome = content.chrome
  const copy = content.contact
  const featured = data!.products.find((product) => product.featured) ?? data!.products[0]

  const tokens = { HANDLE: links.handle, CITY: content.site.city }
  const steps = content.order.contactSteps.map((step) => ({
    ...step,
    body: fillTokens(step.body, tokens),
  }))
  const faqs = content.faq.questions.map((item) => ({
    ...item,
    answer: fillTokens(item.answer, tokens),
  }))

  usePageMeta({
    title: 'Contact | FALAISE',
    description: `Questions about Le Tee, sizing, shipping or a return? Message FALAISE in ${content.site.city} on Instagram at ${links.handle}. Hours: ${content.footer.hours}.`,
  })

  return (
    <div className="bg-paper">
      <header className="shell pb-14 pt-10 sm:pb-20 sm:pt-16">
        <div className="flex items-baseline justify-between border-b border-line pb-4">
          <p className="label text-mute">{chrome.contactKicker}</p>
          <p className="label text-mute">{content.footer.hours}</p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-8">
            <h1 className="display display-tight text-[clamp(3.2rem,11vw,9.5rem)] leading-[0.84]">
              {copy.headline.map((line, index) => (
                <span key={`${line}-${index}`}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h1>
          </div>
          <div className="flex flex-col justify-end lg:col-span-4">
            <p className="lede max-w-[26ch]">{copy.lede}</p>
            <p className="prose-body mt-6 text-mute">{copy.body}</p>
          </div>
        </div>
      </header>

      <section className="border-y border-line" aria-labelledby="order-flow">
        <div className="shell grid gap-12 py-14 sm:py-20 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <p className="label text-mute">{chrome.contactOrdersIndex}</p>
            <h2 id="order-flow" className="display mt-4 text-[clamp(2rem,3.6vw,3rem)] leading-none">
              {copy.ordersHeading}
            </h2>
            <p className="prose-body mt-6 text-[15px] text-mute">{copy.ordersBody}</p>
          </div>

          <ol className="lg:col-span-8 lg:col-start-5">
            {steps.map((step, index) => (
              <Reveal as="li" key={step.index} delay={index * 60}>
                <div className="grid gap-4 border-b border-line py-7 first:border-t first:pt-6 sm:grid-cols-[3rem_1fr_1.2fr] sm:gap-8">
                  <span className="label text-mute">{step.index}</span>
                  <h3 className="font-[family-name:var(--font-label)] text-lg font-[600] leading-tight">
                    {step.title}
                  </h3>
                  <p className="text-[15px] leading-[1.75] text-mute">{step.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="shell py-16 sm:py-24" aria-labelledby="details">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <p className="label text-mute">{chrome.contactDirectIndex}</p>
            <h2 id="details" className="display mt-4 text-[clamp(2.2rem,4.5vw,3.6rem)] leading-none">
              {copy.directHeading}
            </h2>
            <p className="prose-body mt-6 max-w-[34ch] text-[15px] text-mute">{copy.directBody}</p>
            <ButtonLink
              href={links.instagramDm}
              variant="ink"
              className="mt-8"
              ariaLabel={`Message FALAISE on Instagram at ${links.handle}`}
            >
              Message {links.handle} <Arrow />
            </ButtonLink>
          </Reveal>

          <div className="lg:col-span-7 lg:col-start-6">
            <dl className="border-t border-ink">
              <div className="grid grid-cols-[1fr_1.6fr] gap-4 border-b border-line py-5">
                <dt className="label text-mute">{copy.ordersLabel}</dt>
                <dd className="font-[family-name:var(--font-label)] text-[15px]">
                  <a
                    href={links.instagramDm}
                    target="_blank"
                    rel="noreferrer"
                    className="link-line"
                  >
                    {copy.reachLinkLabel}
                  </a>
                </dd>
              </div>
              <div className="grid grid-cols-[1fr_1.6fr] gap-4 border-b border-line py-5">
                <dt className="label text-mute">{copy.instagramLabel}</dt>
                <dd className="font-[family-name:var(--font-label)] text-[15px]">
                  <a
                    href={links.instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="link-line"
                  >
                    {links.handle}
                  </a>
                </dd>
              </div>
              {links.email ? (
                <div className="grid grid-cols-[1fr_1.6fr] gap-4 border-b border-line py-5">
                  <dt className="label text-mute">{copy.emailLabel}</dt>
                  <dd className="font-[family-name:var(--font-label)] text-[15px]">
                    <a href={`mailto:${links.email}`} className="link-line break-all">
                      {links.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              <div className="grid grid-cols-[1fr_1.6fr] gap-4 border-b border-line py-5">
                <dt className="label text-mute">{content.footer.addressLabel}</dt>
                <dd className="font-[family-name:var(--font-label)] text-[15px] leading-relaxed">
                  {content.footer.address}
                  <br />
                  <span className="text-mute">{copy.addressNote}</span>
                </dd>
              </div>
              <div className="grid grid-cols-[1fr_1.6fr] gap-4 border-b border-line py-5">
                <dt className="label text-mute">{content.footer.hoursLabel}</dt>
                <dd className="font-[family-name:var(--font-label)] text-[15px] leading-relaxed">
                  {content.footer.hours}
                  <br />
                  <span className="text-mute">{copy.hoursNote}</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {faqs.length > 0 ? (
        <section className="bg-ink py-16 text-paper sm:py-24" aria-labelledby="faq">
          <div className="shell grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="label text-mute">{chrome.contactQuestionsIndex}</p>
              <h2 id="faq" className="display mt-4 text-[clamp(2.2rem,4.5vw,3.6rem)] leading-none">
                {content.faq.heading}
              </h2>
              <p className="mt-6 max-w-[30ch] text-[15px] leading-relaxed text-mute">
                {content.faq.intro}
              </p>
            </div>

            <div className="lg:col-span-7 lg:col-start-6">
              {faqs.map((faq) => (
                <details key={faq.question} className="group border-b border-line-ink">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                    <span className="font-[family-name:var(--font-label)] text-[16px] font-[550] leading-snug">
                      {faq.question}
                    </span>
                    <span
                      aria-hidden="true"
                      className="mt-0.5 text-xl leading-none text-mute transition-transform duration-300 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-[56ch] pb-7 pr-8 text-[15px] leading-[1.75] text-paper/75">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="shell flex flex-col gap-6 py-14 sm:flex-row sm:items-center sm:justify-between">
        <p className="display text-[clamp(1.8rem,4vw,3.2rem)] uppercase">{copy.closing}</p>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={links.instagramDm} variant="ink">
            Message {links.handle} <Arrow />
          </ButtonLink>
          {featured ? (
            <ButtonLink to={`/shop?piece=${featured.slug}`} variant="outline" viewTransition>
              See {featured.name}
            </ButtonLink>
          ) : (
            <ButtonLink to="/shop" variant="outline">
              {chrome.shopCollectionLabel}
            </ButtonLink>
          )}
        </div>
      </section>
    </div>
  )
}
