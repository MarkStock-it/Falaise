import { useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { cartCount, useCart } from '../../store/cart'
import { useUi } from '../../store/ui'
import { useSite } from '../../store/site'
import { lockScroll } from '../../lib/scroll'
import { cn } from '../../lib/cn'
import { Arrow } from '../ui/Button'

const isExternal = (href: string) => /^https?:\/\//i.test(href)

export function Header() {
  const { data } = useSite()
  const lines = useCart((state) => state.lines)
  const setCartOpen = useCart((state) => state.setOpen)
  const menuOpen = useUi((state) => state.menuOpen)
  const setMenuOpen = useUi((state) => state.setMenuOpen)
  const location = useLocation()
  const count = cartCount(lines)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, setMenuOpen])

  useEffect(() => {
    lockScroll('menu', menuOpen)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      lockScroll('menu', false)
    }
  }, [menuOpen, setMenuOpen])

  if (!data) return null

  const { content } = data
  const banner = content.banner
  const showBanner = Boolean(banner.enabled && banner.text)
  const bannerHeight = showBanner ? 36 : 0
  const links = content.links
  const chrome = content.chrome
  const nav = chrome.nav.filter((item) => item.label && item.href)
  const ordersHref = links.instagramDm || links.instagram || '/contact'
  const ordersLabel = links.handle || chrome.menuOrdersLabel

  return (
    <>
      <header className="site-header fixed inset-x-0 top-0 z-50 border-b border-line bg-paper">
        {showBanner ? (
          <div className="flex h-9 items-center justify-center gap-4 bg-ink px-4 text-paper">
            <p className="label min-w-0 truncate text-center" title={banner.text}>
              {banner.text}
            </p>
            {banner.linkLabel && banner.linkUrl ? (
              isExternal(banner.linkUrl) ? (
                <a
                  href={banner.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="label link-line shrink-0 whitespace-nowrap text-acid"
                >
                  {banner.linkLabel}
                </a>
              ) : (
                <Link
                  to={banner.linkUrl}
                  className="label link-line shrink-0 whitespace-nowrap text-acid"
                >
                  {banner.linkLabel}
                </Link>
              )
            ) : null}
          </div>
        ) : null}

        <div className="h-16">
          <div className="shell flex h-full items-center justify-between gap-6 md:grid md:grid-cols-[1fr_auto_1fr]">
            <Link to="/" viewTransition className="group flex items-center gap-4 md:justify-self-start">
              <img
                src="/brand/falaise-wordmark-ink.svg"
                alt="FALAISE"
                width={1100}
                height={171}
                className="h-[13px] w-auto sm:h-[16px]"
              />
              <span className="label hidden text-mute transition-colors group-hover:text-ink sm:block">
                {content.site.city}
              </span>
            </Link>

            <nav
              aria-label="Primary"
              className="hidden items-center gap-8 md:flex md:justify-self-center"
            >
              {nav.map((item) => (
                <NavLink
                  key={`${item.href}-${item.label}`}
                  to={item.href}
                  viewTransition
                  className={({ isActive }) =>
                    cn(
                      'label group relative flex items-center gap-1.5 py-2 transition-colors',
                      isActive ? 'text-ink' : 'text-mute hover:text-ink',
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          'absolute -left-3.5 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-acid transition-opacity',
                          isActive ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {item.label}
                    </>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="flex items-center gap-4 sm:gap-6 md:justify-self-end">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="label flex items-center gap-1.5 py-2 transition-colors hover:text-mute"
              >
                {chrome.bagLabel}
                <span className="tabular-nums">[{String(count).padStart(2, '0')}]</span>
                <span className="sr-only"> item{count === 1 ? '' : 's'}</span>
              </button>

              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-8 w-8 flex-col items-end justify-center gap-1.5 md:hidden"
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              >
                <span
                  className={cn(
                    'h-px w-6 bg-ink transition-transform duration-300',
                    menuOpen && 'translate-y-[3.5px] rotate-45',
                  )}
                />
                <span
                  className={cn(
                    'h-px w-4 bg-ink transition-transform duration-300',
                    menuOpen && '-translate-y-[3.5px] -rotate-45',
                  )}
                />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        id="mobile-menu"
        style={{ top: `calc(4rem + ${bannerHeight}px)` }}
        className={cn(
          'fixed inset-x-0 bottom-0 z-40 flex flex-col justify-between bg-paper px-5 pb-8 pt-10 transition-[opacity,visibility] duration-300 md:hidden',
          menuOpen ? 'visible opacity-100' : 'invisible opacity-0',
        )}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <nav aria-label="Mobile" className="flex flex-col">
          {nav.map((item) => (
            <NavLink
              key={`${item.href}-${item.label}`}
              to={item.href}
              className="group flex items-baseline justify-between border-b border-line py-4"
              tabIndex={menuOpen ? 0 : -1}
            >
              <span className="display text-[clamp(2.5rem,13vw,5rem)]">{item.label}</span>
              <span className="label text-mute">{item.index}</span>
            </NavLink>
          ))}
        </nav>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="label text-mute">{chrome.menuOrdersLabel}</p>
              {isExternal(ordersHref) ? (
                <a
                  href={ordersHref}
                  target="_blank"
                  rel="noreferrer"
                  className="link-line mt-2 font-[family-name:var(--font-label)] text-sm"
                  tabIndex={menuOpen ? 0 : -1}
                >
                  {ordersLabel}
                </a>
              ) : (
                <Link
                  to={ordersHref}
                  className="link-line mt-2 font-[family-name:var(--font-label)] text-sm"
                  tabIndex={menuOpen ? 0 : -1}
                >
                  {ordersLabel}
                </Link>
              )}
            </div>
            <div>
              <p className="label text-mute">{chrome.menuStudioLabel}</p>
              <p className="mt-2 font-[family-name:var(--font-label)] text-sm">{content.site.city}</p>
            </div>
          </div>
          <Link
            to="/shop"
            viewTransition
            className="group flex items-center justify-between border-t border-ink pt-4"
            tabIndex={menuOpen ? 0 : -1}
          >
            <span className="label">{chrome.shopLinkLabel}</span>
            <Arrow className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  )
}
