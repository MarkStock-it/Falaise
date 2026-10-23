import { Link } from 'react-router-dom'
import type { ColorOption, Product } from '../../data/products'
import { formatPrice, availableSizes, isSoldOut, productAlt } from '../../data/products'
import { Arrow } from '../ui/Button'

type ProductCardProps = {
  product: Product
  color: ColorOption
}

export function ProductCard({ product, color }: ProductCardProps) {
  const soldOut = isSoldOut(product) || availableSizes(product, color.id).length === 0
  const front = color.photos.front || product.images.front
  const back = color.photos.back || front

  return (
    <Link
      to={`/shop?piece=${product.slug}&color=${color.id}`}
      data-cursor="view"
      aria-label={`Open ${product.name} in ${color.name}`}
      className="group flex h-full flex-col focus-visible:outline-offset-4"
    >
      <div className="relative overflow-hidden border border-line bg-paper-deep">
        <span className="label absolute left-3 top-3 z-10 bg-paper/90 px-2 py-1.5 text-mute sm:left-4 sm:top-4">
          {product.code ? `(${product.code})` : ''} / {color.name}
        </span>

        {soldOut ? (
          <span className="label absolute right-3 top-3 z-10 bg-ink px-2 py-1 text-paper sm:right-4 sm:top-4">
            Sold out
          </span>
        ) : null}

        <div className="aspect-[4/5]">
          {front ? (
            <img
              src={front}
              alt={productAlt(product, 'front', color.name)}
              width={800}
              height={1000}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-0 group-focus-within:opacity-0"
            />
          ) : null}
          {back ? (
            <img
              src={back}
              alt=""
              aria-hidden="true"
              width={800}
              height={1000}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:opacity-100 group-focus-within:opacity-100"
            />
          ) : null}
        </div>

        <span className="label absolute bottom-3 left-3 z-10 flex items-center gap-2 bg-paper/90 px-2 py-1.5 text-ink opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100 sm:bottom-4 sm:left-4">
          Quick view
          <Arrow className="h-3 w-3" />
        </span>
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-[family-name:var(--font-label)] text-[17px] font-[600] leading-tight tracking-[-0.015em]">
            {product.name} / {color.name}
          </h3>
          <p className="label mt-2 text-mute">
            {product.collection?.name ?? 'Piece'}
            {product.meta.fabric ? ` / ${product.meta.fabric}` : ''}
          </p>
        </div>
        <p className="label shrink-0 pt-0.5 tabular-nums">{formatPrice(product.price)}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-4 border-t border-line pt-3">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          {product.colors.map((option) => (
            <span
              key={option.id}
              className={
                option.id === color.id
                  ? 'block h-2.5 w-2.5 border border-ink'
                  : 'block h-2.5 w-2.5 border border-ink/25'
              }
              style={{ backgroundColor: option.hex }}
            />
          ))}
        </div>
        <span className="label text-mute">
          {product.sizes.length === 1 ? product.sizes[0] : `${product.sizes.length} sizes`}
        </span>
      </div>
    </Link>
  )
}
