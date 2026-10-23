import { useState } from 'react'
import type { ColorPhotos, Product } from '../../data/products'
import { productAlt } from '../../data/products'
import { cn } from '../../lib/cn'

const VIEWS = [
  { key: 'front', label: 'Worn', index: '01' },
  { key: 'back', label: 'Second', index: '02' },
  { key: 'detail', label: 'Detail', index: '03' },
] as const

export function ProductGallery({
  product,
  images,
  colorName,
}: {
  product: Product
  images: ColorPhotos
  colorName: string
}) {
  const [active, setActive] = useState(0)
  const view = VIEWS[active]

  return (
    <div>
      <figure>
        <div className="relative overflow-hidden border border-line bg-paper-deep">
          <img
            src={images[view.key]}
            alt={productAlt(product, view.key, colorName)}
            width={1000}
            height={1250}
            className="aspect-[4/5] w-full object-cover mix-blend-multiply"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4 sm:p-5">
            <span className="label bg-paper/90 px-2 py-1.5 text-ink">{colorName}</span>
            <span className="label bg-paper/90 px-2 py-1.5 tabular-nums text-ink">
              {view.index} / 03
            </span>
          </div>
        </div>
        <figcaption className="label mt-3 flex items-center justify-between gap-4 text-mute">
          <span>
            {colorName} / {view.label.toLowerCase()}
          </span>
          <span>{product.code} — Vol. 01</span>
        </figcaption>
      </figure>

      <div
        role="group"
        aria-label="Product photograph"
        className="mt-4 grid grid-cols-3 gap-2"
      >
        {VIEWS.map((item, index) => {
          const selected = index === active
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setActive(index)}
              aria-pressed={selected}
              className="group text-left"
            >
              <span
                className={cn(
                  'block overflow-hidden border bg-paper-deep transition-colors',
                  selected ? 'border-ink' : 'border-line group-hover:border-ink/40',
                )}
              >
                <img
                  src={images[item.key]}
                  alt=""
                  aria-hidden="true"
                  width={1000}
                  height={1250}
                  loading="lazy"
                  className={cn(
                    'aspect-[4/5] w-full object-cover mix-blend-multiply transition-opacity',
                    selected ? 'opacity-100' : 'opacity-70 group-hover:opacity-100',
                  )}
                />
              </span>
              <span
                className={cn(
                  'label mt-2 flex items-center gap-2',
                  selected ? 'text-ink' : 'text-mute',
                )}
              >
                <span className="tabular-nums">{item.index}</span>
                <span>{item.label}</span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
