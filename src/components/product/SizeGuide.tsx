import { useEffect, useRef } from 'react'
import type { Product } from '../../data/products'
import { lockScroll } from '../../lib/scroll'
import { cn } from '../../lib/cn'
import { useSite } from '../../store/site'

export function SizeGuide({
  product,
  open,
  onClose,
}: {
  product: Product
  open: boolean
  onClose: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const { data } = useSite()
  const links = data?.content.links
  const sizing = data?.content.sizing
  const chrome = data?.content.chrome

  const headers = [
    'Size',
    sizing?.widthLabel || 'Width',
    sizing?.lengthLabel || 'Length',
    sizing?.sleeveLabel || 'Sleeve',
  ]
  const rows = product.sizes.map((size) => {
    const row = sizing?.rows.find((item) => item.size === size)
    return [size, row?.width || 'n/a', row?.length || 'n/a', row?.sleeve || 'n/a']
  })
  const note = sizing?.note ?? ''
  const unit = sizing?.unit || 'inches'
  const table = { headers, rows, note, unit }

  useEffect(() => {
    lockScroll('size-guide', open)
    if (open) {
      const timer = window.setTimeout(() => closeRef.current?.focus(), 80)
      const onKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', onKey)
      return () => {
        window.clearTimeout(timer)
        window.removeEventListener('keydown', onKey)
      }
    }
    return () => lockScroll('size-guide', false)
  }, [open, onClose])

  return (
    <div
      className={cn(
        'fixed inset-0 z-[80] overflow-hidden',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close size guide"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
        className={cn(
          'absolute inset-0 bg-ink/45 transition-opacity duration-500',
          open ? 'opacity-100' : 'opacity-0',
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="size-guide-title"
        inert={!open}
        data-lenis-prevent
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-[480px] flex-col border-l border-line bg-paper transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5 sm:px-7">
          <h2 id="size-guide-title" className="label">
            {chrome?.sizeGuideLabel ?? 'Size guide'} / {product.code}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            tabIndex={open ? 0 : -1}
            className="label inline-flex min-h-11 items-center px-1 text-mute transition-colors hover:text-ink"
          >
            {chrome?.closeLabel ?? 'Close'}
          </button>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-5 py-8 sm:px-7" data-lenis-prevent>
          <p className="display text-[clamp(2rem,8vw,3rem)]">{product.name}</p>
          {table.note ? <p className="prose-body mt-4 text-mute">{table.note}</p> : null}

          <div className="mt-8 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">
                {product.name} measurements in {table.unit}
              </caption>
              <thead>
                <tr className="border-b border-ink">
                  {table.headers.map((header) => (
                    <th key={header} scope="col" className="label py-3 pr-4 font-[550]">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {table.rows.map((row) => (
                  <tr key={row[0]} className="border-b border-line">
                    {row.map((cell, index) => (
                      <td
                        key={`${row[0]}-${index}`}
                        className={cn(
                          'py-3 pr-4 text-[14px] tabular-nums',
                          index === 0
                            ? 'font-[family-name:var(--font-label)] font-[550] uppercase tracking-[0.05em]'
                            : 'text-mute',
                        )}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 border-t border-line pt-5">
            <p className="label text-mute">Between sizes?</p>
            <p className="prose-body mt-3">
              Message{' '}
              {links?.instagramDm ? (
                <a
                  href={links.instagramDm}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-line underline-offset-4"
                >
                  {links.handle || 'Instagram'}
                </a>
              ) : (
                'the studio'
              )}{' '}
              with your height and usual size. We answer as soon as we are at the table.
            </p>
          </div>

          <figure className="mt-8 border-t border-line pt-5">
            <img
              src="/photos/size-chart.webp"
              alt="FALAISE Le Tee size card with boxy crop measurements for S to XL."
              width={1200}
              height={1172}
              loading="lazy"
              className="w-full border border-line bg-ink"
            />
            <figcaption className="label mt-2 text-mute">
              Vol. 01 size card / measurements in {table.unit}
            </figcaption>
          </figure>
        </div>
      </aside>
    </div>
  )
}
