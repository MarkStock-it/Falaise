import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from '../data/products'

export type CartLine = {
  key: string
  slug: string
  name: string
  code: string
  price: number
  colorId: string
  colorName: string
  colorHex: string
  size: string
  qty: number
  image: string
}

type CartState = {
  lines: CartLine[]
  open: boolean
  lastAdded: string | null
  add: (product: Product, colorId: string, size: string, qty?: number) => void
  remove: (key: string) => void
  setQty: (key: string, qty: number) => void
  clear: () => void
  setOpen: (open: boolean) => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      lastAdded: null,
      add: (product, colorId, size, qty = 1) => {
        const color = product.colors.find((option) => option.id === colorId) ?? product.colors[0]
        const key = `${product.slug}::${color.id}::${size}`
        set((state) => {
          const existing = state.lines.find((line) => line.key === key)
          const lines = existing
            ? state.lines.map((line) =>
                line.key === key ? { ...line, qty: Math.min(9, line.qty + qty) } : line,
              )
            : [
                ...state.lines,
                {
                  key,
                  slug: product.slug,
                  name: product.name,
                  code: product.code,
                  price: product.price,
                  colorId: color.id,
                  colorName: color.name,
                  colorHex: color.hex,
                  size,
                  qty,
                  image: color.photos.front,
                },
              ]
          return { lines, open: true, lastAdded: key }
        })
      },
      remove: (key) =>
        set((state) => ({
          lines: state.lines.filter((line) => line.key !== key),
          lastAdded: state.lastAdded === key ? null : state.lastAdded,
        })),
      setQty: (key, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((line) => line.key !== key)
              : state.lines.map((line) =>
                  line.key === key ? { ...line, qty: Math.min(9, qty) } : line,
                ),
        })),
      clear: () => set({ lines: [], lastAdded: null }),
      setOpen: (open) => set({ open }),
    }),
    {
      name: 'falaise.cart.v1',
      version: 1,
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
)

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.qty, 0)
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((total, line) => total + line.price * line.qty, 0)
}
