import { Link } from 'react-router-dom'
import type { Link as SiteLink } from '../../api/types'
import { POLICY_PAGES, policyLabel } from '../../data/policies'
import { useSite } from '../../store/site'
import { Arrow } from '../ui/Button'

const isExternal = (href: string) => /^https?:\/\//i.test(href)

function FooterLink({ link }: { link: SiteLink }) {
  if (!link.href) return <span>{link.label}</span>

  if (isExternal(link.href)) {
    return (
      <a href={link.href} target="_blank" rel="noreferrer" className="link-line">
        {link.label}
      </a>
    )
  }

  return (
    <Link to={link.href} className="link-line">
      {link.label}
    </Link>
  )
}

export function Footer() {
  const { data } = useSite()
  if (!data) return null

  const { content } = data
  const { footer, links } = content
  const ordersHref = links.instagram
  const hasOrders = Boolean(ordersHref)

  return (
    <footer className="bg-ink text-paper">
      <div className="shell pt-16 sm:pt-24">
        <div className="grid gap-12 border-b border-line-ink pb-14 sm:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="label text-mute">{footer.eyebrow}</p>
            <p className="lede mt-5 max-w-[24ch] text-paper">{footer.tagline}</p>
            {footer.messageLabel && links.instagramDm ? (
              <a
                href={links.instagramDm}
                target="_blank"
                rel="noreferrer"
                className="group mt-8 inline-flex items-center gap-2 font-[family-name:var(--font-label)] text-sm text-paper"
              >
                <span className="link-line">{footer.messageLabel}</span>
                <Arrow className="h-3 w-3" />
              </a>
            ) : null}
          </div>

          <div className="lg:col-span-2">
            <p className="label text-mute">{footer.shopHeading}</p>
            <ul className="mt-5 space-y-3 font-[family-name:var(--font-label)] text-sm">
              {footer.shopLinks.map((link, index) => (
                <li key={`${link.label}-${link.href}-${index}`}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <p className="label text-mute">{footer.studioHeading}</p>
            <ul className="mt-5 space-y-3 font-[family-name:var(--font-label)] text-sm">
              {footer.studioLinks.map((link, index) => (
                <li key={`${link.label}-${link.href}-${index}`}>
                  <FooterLink link={link} />
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-3">
            <p className="label text-mute">{footer.ordersHeading}</p>
            {hasOrders ? (
              <a
                href={ordersHref}
                target="_blank"
                rel="noreferrer"
                className="link-line mt-5 inline-flex font-[family-name:var(--font-label)] text-sm"
              >
                {links.handle || footer.ordersHeading}
              </a>
            ) : (
              <span className="mt-5 inline-flex font-[family-name:var(--font-label)] text-sm">
                {links.handle}
              </span>
            )}
            <p className="mt-4 text-[13px] leading-relaxed text-mute">{footer.orderNote}</p>

            <dl className="mt-7 space-y-4 border-t border-line-ink pt-5">
              <div>
                <dt className="label text-mute">{footer.addressLabel}</dt>
                <dd className="mt-1 font-[family-name:var(--font-label)] text-sm">{footer.address}</dd>
              </div>
              <div>
                <dt className="label text-mute">{footer.hoursLabel}</dt>
                <dd className="mt-1 font-[family-name:var(--font-label)] text-sm">{footer.hours}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="label text-mute">{footer.copyright}</p>
          <nav aria-label="Policies" className="flex flex-wrap gap-x-5 gap-y-2">
            {POLICY_PAGES.map((page) => (
              <Link
                key={page.key}
                to={page.path}
                className="label link-line text-mute hover:text-paper"
              >
                {policyLabel(content.policies, page)}
              </Link>
            ))}
          </nav>
          <p className="label text-mute">{footer.colophon}</p>
        </div>
      </div>

      {footer.wordmark ? (
        <div className="overflow-hidden px-3 pb-3">
          <img
            src={footer.wordmark}
            alt=""
            width={1100}
            height={171}
            aria-hidden="true"
            className="h-auto w-full select-none opacity-95"
          />
        </div>
      ) : null}
    </footer>
  )
}
