import type { ColorOption, ColorPhotos, Product, Variant } from '../api/types'

export type { ColorOption, ColorPhotos, Product, Variant }

export function formatPrice(php: number): string {
  return `₱${new Intl.NumberFormat('en-PH').format(Math.round(php))}`
}

export function getColor(product: Product, colorId: string): ColorOption {
  return product.colors.find((color) => color.id === colorId) ?? product.colors[0]
}

export function photosFor(product: Product, colorId: string): ColorPhotos {
  return getColor(product, colorId).photos
}

export function productAlt(
  product: Product,
  view: 'front' | 'back' | 'detail',
  colorName?: string,
): string {
  const colour = colorName ? ` in ${colorName}` : ''
  const viewLabel =
    view === 'front' ? 'worn front view' : view === 'back' ? 'second view' : 'print detail'
  return `FALAISE ${product.name}${colour}, ${viewLabel}.`
}

export function variantFor(
  product: Product,
  colorId: string,
  size: string,
): Variant | undefined {
  return product.variants.find((variant) => variant.colorId === colorId && variant.size === size)
}

export function isSizeAvailable(product: Product, colorId: string, size: string): boolean {
  const variant = variantFor(product, colorId, size)
  return variant ? variant.available : false
}

export function availableSizes(product: Product, colorId: string): string[] {
  return product.sizes.filter((size) => isSizeAvailable(product, colorId, size))
}

export function isSoldOut(product: Product): boolean {
  return product.status === 'sold_out' || product.variants.every((variant) => !variant.available)
}

export function lowestPrice(products: Product[]): number {
  return products.length === 0 ? 0 : Math.min(...products.map((product) => product.price))
}
