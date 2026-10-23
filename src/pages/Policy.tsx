import { Link } from 'react-router-dom'
import { Arrow, ButtonLink } from '../components/ui/Button'
import { Reveal } from '../components/ui/Reveal'
import { POLICY_PAGES, policyDocument, policyLabel, type PolicyKey } from '../data/policies'
import { usePageMeta } from '../hooks/usePageMeta'
import { cn } from '../lib/cn'
import { fillTokens } from '../lib/tokens'
import { useSite } from '../store/site'

/** Blank-line separated copy becomes separate paragraphs. */
function paragraphs(value: string): string[] {
  return value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function PolicyPage({ doc }: { doc: PolicyKey }) {
  const { data } = useSite()
  const content = data!.content
  const chrome = content.chrome
  const page = POLICY_PAGES.find((item) => item.key === doc) ?? POLICY_PAGES[0]
  const document = policyDocument(content.policies, page.key)

  const tokens = { HANDLE: content.links.handle, CITY: content.site.city }
  const title = document.title || page.label
  const lede = fillTokens(document.lede, tokens)
  const note = fillTokens(content.policies?.note ?? '', tokens)

  const sections = document.sections
    .map((section) => ({
      title: fillTokens(section.title, tokens),
      paragraphs: paragraphs(fillTokens(section.body, tokens)),
    }))
    .filter((section) => section.title || section.paragraphs.length > 0)

  usePageMeta({
    title: `${title} — FALAISE`,
    description: lede || `${title} for FALAISE, ${content.site.city}.`,
  })

  return (
    <div className="bg-paper">
      <header className="shell pb-12 pt-10 sm:pb-16 sm:pt-16">
        <div className="flex items-baseline justify-between gap-6 border-b border-line pb-4">
          <p className="label text-mute">{content.policies?.index}</p>
          <p className="label text-right text-mute">{content.policies?.updated}</p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7">
            <h1 className="display display-tight text-[clamp(3rem,9vw,7.5rem)] leading-[0.84]">
              {title}
            </h1>
          </div>
          <div className="flex flex-col justify-end lg:col-span-4 lg:col-start-9">
            {lede ? <p className="lede max-w-[30ch]">{lede}</p> : null}
          </div>
        </div>

        <nav
          aria-label="Policies"
          className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4"
        >
          {POLICY_PAGES.map((item) => {
            const current = item.key === page.key
            return (
              <Link
                key={item.key}
                to={item.path}
                aria-current={current ? 'page' : undefined}
                className={cn('label link-line', current ? 'text-ink' : 'text-mute hover:text-ink')}
              >
                {current ? title : policyLabel(content.policies, item)}
              </Link>
            )
          })}
        </nav>
      </header>

      <section className="shell pb-16 sm:pb-24" aria-label={`${title} in full`}>
        {sections.length > 0 ? (
          <ol className="border-t border-ink">
            {sections.map((section, index) => (
              <Reveal as="li" key={`${section.title}-${index}`} delay={index * 40}>
                <div className="grid gap-4 border-b border-line py-8 sm:grid-cols-[5rem_1fr] sm:gap-8 lg:grid-cols-[9rem_1fr]">
                  <span className="label text-mute">{String(index + 1).padStart(2, '0')}</span>
                  <div>
                    {section.title ? (
                      <h2 className="font-[family-name:var(--font-label)] text-lg font-[600] leading-tight">
                        {section.title}
                      </h2>
                    ) : null}
                    {section.paragraphs.map((paragraph, part) => (
                      <p
                        key={part}
                        className="prose-body mt-3 max-w-[68ch] text-[15px] leading-[1.8] text-mute first:mt-2"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        ) : (
          <p className="prose-body max-w-[60ch] text-[15px] text-mute">
            This page is not written yet. Message {content.links.handle} and a person will answer the
            question directly.
          </p>
        )}
      </section>

      <section className="bg-ink py-14 text-paper sm:py-20" aria-label="Questions">
        <div className="shell grid gap-8 lg:grid-cols-12">
          <p className="label text-mute lg:col-span-3">{chrome.policyQuestionsLabel}</p>
          <div className="lg:col-span-7 lg:col-start-5">
            <p className="lede max-w-[38ch] text-paper">
              {note || `Message ${content.links.handle} and a person will answer.`}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <ButtonLink href={content.links.instagramDm} variant="paper">
                Message {content.links.handle} <Arrow />
              </ButtonLink>
              <Link to="/contact" className="label link-line text-mute hover:text-paper">
                {chrome.contactStudioLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="shell flex items-center justify-between border-t border-line py-5">
        <p className="label text-mute">{content.site.city}</p>
        <Link to="/shop" className="label link-line">
          {chrome.shopLinkLabel}
        </Link>
      </div>
    </div>
  )
}
