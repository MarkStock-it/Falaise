import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import { Button, ConfirmProvider, Spinner, ToastProvider } from './ui'
import { Dashboard } from './pages/Dashboard'
import { Products } from './pages/Products'
import { Stock } from './pages/Stock'
import { Collections } from './pages/Collections'
import { Content } from './pages/Content'
import { Inquiries } from './pages/Inquiries'
import { Activity } from './pages/Activity'
import { Backup } from './pages/Backup'

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Products' },
  { key: 'stock', label: 'Stock' },
  { key: 'collections', label: 'Collections' },
  { key: 'content', label: 'Site content' },
  { key: 'inquiries', label: 'Inquiries' },
  { key: 'activity', label: 'Activity' },
  { key: 'backup', label: 'Backup' },
] as const

type TabKey = (typeof TABS)[number]['key']

function tabFromHash(): TabKey {
  const key = window.location.hash.replace('#', '')
  return TABS.some((tab) => tab.key === key) ? (key as TabKey) : 'overview'
}

export function AdminApp() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'error'>('checking')
  const [tab, setTab] = useState<TabKey>(tabFromHash)
  const [signingOut, setSigningOut] = useState(false)

  const checkSession = useCallback(() => {
    setStatus('checking')
    api
      .get<{ authenticated: boolean }>('/api/admin/session')
      .then((session) => {
        if (!session.authenticated) {
          window.location.replace('/admin-login.html')
          return
        }
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [])

  useEffect(() => {
    checkSession()
  }, [checkSession])

  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (key: TabKey) => {
    setTab(key)
    window.history.replaceState(null, '', `#${key}`)
    window.scrollTo({ top: 0, left: 0 })
  }

  async function signOut() {
    setSigningOut(true)
    try {
      await api.post('/api/admin/logout')
    } finally {
      window.location.replace('/admin-login.html')
    }
  }

  if (status === 'checking') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-paper">
        <img src="/brand/falaise-wordmark-ink.svg" alt="FALAISE" width={1100} height={171} className="h-4 w-auto" />
        <p className="label flex items-center gap-3 text-mute" role="status">
          <Spinner /> Opening admin
        </p>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-paper px-5">
        <div className="w-full max-w-md border border-line p-7">
          <p className="label text-mute">Session</p>
          <h1 className="display mt-3 text-3xl">The admin did not load.</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-mute">
            The API did not answer. Check that the server is running, then try again.
          </p>
          <div className="mt-6 flex gap-2">
            <Button onClick={checkSession}>Try again</Button>
            <Button variant="outline" onClick={() => window.location.assign('/admin-login.html')}>
              Sign in
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <ConfirmProvider>
        <div className="min-h-svh bg-paper">
          <header className="sticky top-0 z-40 border-b border-ink bg-paper">
            <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
              <a href="/admin.html#overview" onClick={() => go('overview')} className="flex items-center gap-3">
                <img
                  src="/brand/falaise-wordmark-ink.svg"
                  alt="FALAISE"
                  width={1100}
                  height={171}
                  className="h-3.5 w-auto"
                />
                <span className="label hidden border-l border-line pl-3 text-mute sm:inline">
                  Admin
                </span>
              </a>

              <div className="flex items-center gap-2 sm:gap-3">
                <a
                  href="/"
                  target="_blank"
                  rel="noreferrer"
                  className="label inline-flex h-8 items-center gap-2 whitespace-nowrap border border-line px-2.5 text-ink transition-colors hover:border-ink sm:px-3"
                >
                  <span className="hidden sm:inline">View store</span>
                  <span className="sm:hidden">Store</span>
                  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M3 11L11 3M5 3h6v6" stroke="currentColor" strokeWidth="1.3" />
                  </svg>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  disabled={signingOut}
                  className="whitespace-nowrap px-2"
                >
                  {signingOut ? 'Signing out' : 'Sign out'}
                </Button>
              </div>
            </div>

            <nav aria-label="Admin sections" className="mx-auto w-full max-w-[1440px] px-4 sm:px-6">
              <div className="relative py-2 sm:hidden">
                <label htmlFor="admin-section" className="sr-only">
                  Admin section
                </label>
                <select
                  id="admin-section"
                  value={tab}
                  onChange={(event) => go(event.target.value as TabKey)}
                  className="label h-10 w-full appearance-none border border-line bg-paper px-3 pr-9 text-ink"
                >
                  {TABS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <svg
                  width="11"
                  height="7"
                  viewBox="0 0 12 8"
                  fill="none"
                  aria-hidden="true"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <path d="M1 1.5 6 6.5l5-5" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </div>
              <ul className="no-scrollbar -mb-px hidden gap-5 sm:flex sm:gap-7">
                {TABS.map((item) => {
                  const selected = tab === item.key
                  return (
                    <li key={item.key} className="shrink-0">
                      <button
                        type="button"
                        onClick={() => go(item.key)}
                        aria-current={selected ? 'page' : undefined}
                        className={`label relative flex h-11 items-center border-b-2 transition-colors ${
                          selected ? 'border-ink text-ink' : 'border-transparent text-mute hover:text-ink'
                        }`}
                      >
                        {item.label}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </header>

          <main className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-6 sm:px-6 sm:pt-8">
            {tab === 'overview' ? <Dashboard onNavigate={(key) => go(key as TabKey)} /> : null}
            {tab === 'products' ? <Products /> : null}
            {tab === 'stock' ? <Stock /> : null}
            {tab === 'collections' ? <Collections /> : null}
            {tab === 'content' ? <Content /> : null}
            {tab === 'inquiries' ? <Inquiries /> : null}
            {tab === 'activity' ? <Activity /> : null}
            {tab === 'backup' ? <Backup /> : null}
          </main>
        </div>
      </ConfirmProvider>
    </ToastProvider>
  )
}
