import { Link } from 'react-router-dom'
import { Arrow } from '../components/ui/Button'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSite } from '../store/site'

export function NotFound() {
  const { data } = useSite()
  const content = data?.content
  const chrome = content?.chrome
  const copy = content?.notFound
  const featured = data?.products.find((product) => product.featured) ?? data?.products[0]

  usePageMeta({
    title: `Not found | ${content?.site.name ?? 'FALAISE'}`,
    description: 'This page is off the edge. Return to the store or see the current piece.',
  })

  if (!data) return null

  return (
    <div className="bg-ink text-paper">
      <div className="shell flex min-h-[calc(100svh-4rem)] flex-col justify-between py-10 sm:py-14">
        <div className="flex items-baseline justify-between border-b border-line-ink pb-4">
          <p className="label text-mute">{chrome?.notFoundKicker ?? 'Error / 404'}</p>
          <p className="label text-mute">{chrome?.notFoundBrand ?? 'Falaise Studio'}</p>
        </div>

        <div className="py-10">
          <p className="label mb-6 text-mute">{chrome?.notFoundTagline ?? 'Off the cliff.'}</p>
          <p
            aria-hidden="true"
            className="display select-none text-[clamp(8rem,38vw,30rem)] leading-[0.72] text-transparent [-webkit-text-stroke:1px_var(--color-paper)]"
          >
            404
          </p>
        </div>

        <div className="grid gap-10 border-t border-line-ink pt-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <h1 className="display text-[clamp(2rem,4vw,3.4rem)] leading-[0.95]">
              {(copy?.headline ?? []).map((line, index) => (
                <span key={`${line}-${index}`}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-5 max-w-[38ch] text-[15px] leading-relaxed text-paper/70">
              {copy?.body}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:col-span-6 lg:justify-end">
            <Link
              to="/"
              className="group flex h-14 min-w-[12rem] items-center justify-between gap-8 border border-paper px-5 transition-colors hover:bg-paper hover:text-ink"
            >
              <span className="label">{chrome?.backHomeLabel ?? 'Back home'}</span>
              <Arrow />
            </Link>
            {featured ? (
              <Link
                to={`/shop?piece=${featured.slug}`}
                viewTransition
                className="group flex h-14 min-w-[12rem] items-center justify-between gap-8 border border-line-ink bg-paper px-5 text-ink transition-colors hover:bg-paper-deep"
              >
                <span className="label">
                  {chrome?.seeLabel ?? 'See'} {featured.name}
                </span>
                <Arrow />
              </Link>
            ) : null}
          </div>
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-line-ink pt-4">
          <p className="label text-mute">{content?.site.city ?? 'Liloan, Cebu'}</p>
          <p className="label text-mute">{content?.footer.hours ?? 'Always open'}</p>
        </div>
      </div>
    </div>
  )
}
