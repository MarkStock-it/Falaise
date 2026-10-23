import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Product, StoreData } from '../api/types'

type SiteState = {
  data: StoreData | null
  loading: boolean
  error: string
  reload: () => Promise<void>
  productBySlug: (slug: string) => Product | undefined
}

const SiteContext = createContext<SiteState | null>(null)

async function fetchStore(): Promise<StoreData> {
  const response = await fetch('/api/store', {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`The store could not be loaded (${response.status}).`)
  return (await response.json()) as StoreData
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<StoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    try {
      setError('')
      const next = await fetchStore()
      setData(next)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The store could not be loaded.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  // An edit in the admin shows up when the store tab is focused again.
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible') void reload()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => {
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [reload])

  const value = useMemo<SiteState>(
    () => ({
      data,
      loading,
      error,
      reload,
      productBySlug: (slug) => data?.products.find((product) => product.slug === slug),
    }),
    [data, loading, error, reload],
  )

  if (loading) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-paper px-6">
        <img
          src="/brand/falaise-wordmark-ink.svg"
          alt="FALAISE"
          width={1100}
          height={171}
          className="h-4 w-auto"
        />
        <p className="label text-mute" role="status">
          Opening the store…
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-paper px-6">
        <div className="w-full max-w-md border border-line p-7">
          <p className="label text-mute">Connection</p>
          <h1 className="display mt-3 text-3xl">The store did not load.</h1>
          <p className="prose-body mt-4 text-[15px] text-mute">
            {error || 'No store data was returned.'} The admin edits are safe — this is only the
            storefront losing its data source.
          </p>
          <button
            type="button"
            onClick={() => {
              setLoading(true)
              void reload()
            }}
            className="label mt-6 h-11 border border-ink bg-ink px-5 text-paper transition-colors hover:bg-ink-soft"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>
}

export function useSite(): SiteState {
  const context = useContext(SiteContext)
  if (!context) throw new Error('useSite must be used inside SiteProvider')
  return context
}
