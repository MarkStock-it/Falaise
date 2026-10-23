import { StrictMode, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { createRoot } from 'react-dom/client'
import { api, ApiError } from './api'
import { Button, Input, Spinner } from './ui'
import './admin.css'

function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let active = true
    api
      .get<{ authenticated: boolean }>('/api/admin/session')
      .then((session) => {
        if (active && session.authenticated) window.location.replace('/admin.html')
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setChecking(false)
      })
    return () => {
      active = false
    }
  }, [])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/api/admin/login', { password })
      window.location.replace('/admin.html')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'Could not sign in.')
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-svh bg-paper lg:grid-cols-12">
      <aside className="relative hidden overflow-hidden bg-ink text-paper lg:col-span-6 lg:block xl:col-span-7">
        <img
          src="/photos/editorial-seaside.webp"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/10" aria-hidden="true" />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <img
            src="/brand/falaise-wordmark-paper.svg"
            alt="FALAISE"
            width={1100}
            height={171}
            className="h-5 w-auto"
          />
          <div>
            <p className="label text-paper/70">Studio / Admin</p>
            <p className="display display-tight mt-4 max-w-[10ch] text-[clamp(3rem,6vw,5.5rem)]">
              Run the store.
            </p>
            <p className="mt-6 max-w-[34ch] text-[14px] leading-relaxed text-paper/70">
              Products, stock, collections and every word on the front page — edited here, live on
              the storefront.
            </p>
          </div>
          <p className="label text-paper/50">Liloan, Cebu / Independent</p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10 lg:col-span-6 xl:col-span-5">
        <div className="w-full max-w-sm">
          <img
            src="/brand/falaise-wordmark-ink.svg"
            alt="FALAISE"
            width={1100}
            height={171}
            className="mb-10 h-4 w-auto lg:hidden"
          />

          <p className="label text-mute">Admin / Sign in</p>
          <h1 className="display display-tight mt-4 text-[clamp(2.6rem,7vw,3.6rem)]">
            The back
            <br />
            of the shop.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-mute">
            One password, no public sign-up. The storefront never sees this screen.
          </p>

          {checking ? (
            <p className="label mt-10 flex items-center gap-3 text-mute" role="status">
              <Spinner /> Checking session
            </p>
          ) : (
            <form onSubmit={onSubmit} className="mt-8">
              <label htmlFor="password" className="label mb-2 block text-mute">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                autoFocus
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                invalid={Boolean(error)}
                placeholder="••••••••••"
              />

              {error ? (
                <p className="mt-3 border border-ink bg-paper-deep/50 px-3 py-2 text-[13px] leading-snug" role="alert">
                  {error}
                </p>
              ) : null}

              <Button type="submit" size="lg" className="mt-5 w-full" disabled={submitting || !password}>
                {submitting ? (
                  <>
                    <Spinner /> Signing in
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

              <p className="mt-6 border-t border-line pt-4 text-[12px] leading-relaxed text-mute">
                Sessions last 12 hours. The password hash and signing key live on the server, never
                in the browser bundle.
              </p>
            </form>
          )}

          <a href="/" className="label mt-8 inline-flex items-center gap-2 text-mute hover:text-ink">
            ← Back to the store
          </a>
        </div>
      </main>
    </div>
  )
}

createRoot(document.getElementById('admin-login-root')!).render(
  <StrictMode>
    <Login />
  </StrictMode>,
)
