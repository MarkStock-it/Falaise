import { useEffect } from 'react'

type MetaOptions = {
  title: string
  description: string
  image?: string
  type?: 'website' | 'product'
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attribute, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export function usePageMeta({ title, description, image, type = 'website' }: MetaOptions) {
  useEffect(() => {
    document.title = title
    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', type)

    const socialImage = new URL(image ?? '/og/falaise-og.jpg', window.location.origin).toString()
    upsertMeta('property', 'og:image', socialImage)
    upsertMeta('name', 'twitter:card', 'summary_large_image')

    const canonicalHref = `${window.location.origin}${window.location.pathname}`
    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalHref
    upsertMeta('property', 'og:url', canonicalHref)
  }, [title, description, image, type])
}
