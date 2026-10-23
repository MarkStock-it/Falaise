/** Input validation for admin writes. Every error names a field so the form can show it. */

const HEX = /^#[0-9a-fA-F]{6}$/

export const PRODUCT_STATUSES = ['active', 'hidden']
export const INQUIRY_STATUSES = ['new', 'replied', 'closed']
export const CONTENT_KEYS = [
  'site',
  'banner',
  'hero',
  'studio',
  'stats',
  'print',
  'colours',
  'editorial',
  'drop',
  'testimonials',
  'closing',
  'links',
  'footer',
  'sizing',
  'shipping',
  'faq',
  'about',
  'order',
  'policies',
  'chrome',
  'shop',
  'product',
  'contact',
  'checkout',
  'notFound',
]

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function text(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function int(value, { min = 0, max = 1000000 } = {}) {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return null
  if (n < min || n > max) return null
  return n
}

/**
 * @returns {{ok: true, value: object} | {ok: false, errors: Record<string,string>}}
 */
export function normalizeProduct(body) {
  const errors = {}

  const name = text(body?.name, 120)
  if (!name) errors.name = 'Name is required.'

  const priceCents = int(body?.priceCents, { min: 0, max: 100000000 })
  if (priceCents === null) errors.priceCents = 'Price must be a positive amount.'

  const description = text(body?.description, 5000)
  const tagline = text(body?.tagline, 200)
  const code = text(body?.code, 24)

  const status = PRODUCT_STATUSES.includes(body?.status) ? body.status : 'active'
  const collectionId = typeof body?.collectionId === 'string' ? body.collectionId : null

  const details = Array.isArray(body?.details)
    ? body.details.map((item) => text(item, 300)).filter(Boolean).slice(0, 20)
    : []

  const sizes = []
  if (Array.isArray(body?.sizes)) {
    for (const size of body.sizes) {
      const clean = text(size, 12)
      if (clean && !sizes.includes(clean)) sizes.push(clean)
    }
  }
  if (sizes.length === 0) errors.sizes = 'Add at least one size.'
  if (sizes.length > 12) errors.sizes = 'Keep it to 12 sizes or fewer.'

  const colors = []
  if (Array.isArray(body?.colors)) {
    body.colors.forEach((color, index) => {
      const colorName = text(color?.name, 40)
      if (!colorName) errors[`colors.${index}.name`] = 'Colour name is required.'

      const hex = text(color?.hex, 7) || '#161616'
      if (!HEX.test(hex)) errors[`colors.${index}.hex`] = 'Use a hex colour like #161616.'

      const front = text(color?.front, 500)
      if (!front) errors[`colors.${index}.front`] = 'A front image is required.'

      colors.push({
        id: typeof color?.id === 'string' && color.id ? color.id : null,
        name: colorName,
        hex,
        front,
        back: text(color?.back, 500),
        detail: text(color?.detail, 500),
      })
    })
  }
  if (colors.length === 0) errors.colors = 'Add at least one colour.'
  if (colors.length > 8) errors.colors = 'Keep it to 8 colours or fewer.'

  const stock = {}
  if (body?.stock && typeof body.stock === 'object') {
    for (const [key, value] of Object.entries(body.stock)) {
      const n = int(value, { min: 0, max: 100000 })
      if (n === null) {
        errors.stock = 'Stock must be a whole number between 0 and 100000.'
        break
      }
      stock[key] = n
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors }

  return {
    ok: true,
    value: {
      name,
      priceCents,
      description,
      tagline,
      code,
      status,
      collectionId: collectionId || null,
      details,
      sizes,
      colors,
      stock,
      featured: Boolean(body?.featured),
      drop: text(body?.drop, 40),
      fabric: text(body?.fabric, 80),
      fit: text(body?.fit, 80),
      made: text(body?.made, 80),
    },
  }
}

export function normalizeCollection(body) {
  const name = text(body?.name, 80)
  if (!name) return { ok: false, errors: { name: 'Collection name is required.' } }
  return {
    ok: true,
    value: {
      name,
      slug: text(body?.slug, 80) || slugify(name),
      description: text(body?.description, 400),
      visible: body?.visible === false ? 0 : 1,
      position: int(body?.position, { min: 0, max: 9999 }) ?? 0,
    },
  }
}

export function normalizeStock(value) {
  const n = int(value, { min: 0, max: 100000 })
  return n === null ? null : n
}

export function normalizeInquiry(body) {
  const name = text(body?.name, 120)
  if (!name) return { ok: false, errors: { name: 'Customer name or handle is required.' } }
  return {
    ok: true,
    value: {
      name,
      contact: text(body?.contact, 160),
      message: text(body?.message, 2000),
      product: text(body?.product, 160),
      status: INQUIRY_STATUSES.includes(body?.status) ? body.status : 'new',
    },
  }
}

/** Content groups are free-form by design; guard size and JSON shape only. */
export function normalizeContent(value) {
  const json = JSON.stringify(value)
  if (json.length > 200_000) {
    return { ok: false, errors: { content: 'This section is too large (200 kB max).' } }
  }
  if (value === null || typeof value !== 'object') {
    return { ok: false, errors: { content: 'Content must be an object.' } }
  }
  return { ok: true, value }
}

const MAGIC = {
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47],
  webp: [0x52, 0x49, 0x46, 0x46],
}

export const IMAGE_LIMIT_BYTES = 5 * 1024 * 1024

export function decodeImageUpload(body) {
  const data = typeof body?.data === 'string' ? body.data : ''
  const match = /^data:(image\/(jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/.exec(data)
  if (!match) {
    return { ok: false, error: 'Upload a JPEG, PNG or WebP image.' }
  }
  const [, mime, subtype, payload] = match
  const buffer = Buffer.from(payload, 'base64')
  if (buffer.length === 0) return { ok: false, error: 'The image is empty.' }
  if (buffer.length > IMAGE_LIMIT_BYTES) {
    return { ok: false, error: 'Images must be 5 MB or smaller.' }
  }
  const magic = MAGIC[subtype]
  for (let i = 0; i < magic.length; i += 1) {
    if (buffer[i] !== magic[i]) {
      return { ok: false, error: 'The file contents do not match a supported image type.' }
    }
  }
  const ext = subtype === 'jpeg' ? 'jpg' : subtype
  return { ok: true, buffer, mime, ext }
}
