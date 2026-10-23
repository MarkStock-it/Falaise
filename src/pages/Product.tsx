import { Navigate, useParams, useSearchParams } from 'react-router-dom'

/**
 * Pieces are no longer full pages: every piece opens in the catalogue's
 * quick-view window. Old /product/:slug links (bookmarks, DMs, printed QR
 * codes) forward to the catalogue with that piece already open.
 */
export function ProductRedirect() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const color = searchParams.get('color')

  const target = new URLSearchParams()
  if (slug) target.set('piece', slug)
  if (color) target.set('color', color)

  return <Navigate to={`/shop?${target.toString()}`} replace />
}
