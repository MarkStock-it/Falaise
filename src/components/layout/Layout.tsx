import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Header } from './Header'
import { Footer } from './Footer'
import { CustomCursor } from './CustomCursor'
import { SmoothScroll } from './SmoothScroll'
import { CartDrawer } from '../cart/CartDrawer'
import { getLenis } from '../../lib/scroll'
import { useSite } from '../../store/site'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    getLenis()?.scrollTo(0, { immediate: true })
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export function Layout() {
  const { pathname } = useLocation()
  const { data } = useSite()
  const bannerHeight = data?.content.banner.enabled ? 36 : 0

  return (
    <div className="flex min-h-svh flex-col">
      <a
        href="#main"
        className="sr-only z-[100] bg-ink px-4 py-3 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <SmoothScroll />
      <CustomCursor />
      <ScrollToTop />
      <Header />
      <main
        id="main"
        key={pathname}
        style={{ paddingTop: `calc(4rem + ${bannerHeight}px)` }}
        className="page-in flex-1"
      >
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
    </div>
  )
}
