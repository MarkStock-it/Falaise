/**
 * Catalogue + content backup.
 *
 * One JSON file holds every product, colour, variant, collection and content
 * group. Restoring replaces those records and nothing else.
 *
 * Deliberately excluded: customer inquiries (personal data), the admin password
 * hash, the session secret, and the stock/activity logs (append-only history).
 */
import { db, ensureContentKeys, getContentMap, nowIso } from './db.mjs'
import { CONTENT_KEYS } from './validate.mjs'

export const BACKUP_VERSION = 1

const MAX_PRODUCTS = 200
const MAX_COLORS = 600
const MAX_VARIANTS = 6000
const MAX_CONTENT_BYTES = 200_000

const asString = (value, max = 20000) => (typeof value === 'string' ? value.slice(0, max) : '')
const asInt = (value, fallback = 0) => {
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : fallback
}
const asJsonText = (value, fallback = '[]') => {
  if (Array.isArray(value)) return JSON.stringify(value)
  return typeof value === 'string' ? value : fallback
}

export function exportBackup() {
  return {
    app: 'falaise',
    version: BACKUP_VERSION,
    exportedAt: nowIso(),
    includes: 'products, colours, variants, stock counts, collections, site content',
    excludes: 'customer inquiries, admin password, session secret, stock and activity logs',
    content: getContentMap(),
    collections: db.prepare('SELECT * FROM collections ORDER BY position, rowid').all(),
    products: db.prepare('SELECT * FROM products ORDER BY position, rowid').all(),
    colors: db.prepare('SELECT * FROM product_colors ORDER BY position, rowid').all(),
    variants: db.prepare('SELECT * FROM variants').all(),
  }
}

/**
 * @returns {{ok: true, counts: object} | {ok: false, error: string}}
 */
export function restoreBackup(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, error: 'That file does not contain a backup object.' }
  }
  if (payload.app !== 'falaise') {
    return { ok: false, error: 'This is not a FALAISE backup file.' }
  }
  if (asInt(payload.version, 0) !== BACKUP_VERSION) {
    return {
      ok: false,
      error: `Unsupported backup version. This build reads version ${BACKUP_VERSION}.`,
    }
  }

  const content = payload.content
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return { ok: false, error: 'The backup has no content section.' }
  }

  const collections = Array.isArray(payload.collections) ? payload.collections : []
  const products = Array.isArray(payload.products) ? payload.products : []
  const colors = Array.isArray(payload.colors) ? payload.colors : []
  const variants = Array.isArray(payload.variants) ? payload.variants : []

  if (products.length > MAX_PRODUCTS) {
    return { ok: false, error: `A backup can hold at most ${MAX_PRODUCTS} products.` }
  }
  if (colors.length > MAX_COLORS || variants.length > MAX_VARIANTS) {
    return { ok: false, error: 'The backup has more colour or variant records than this store supports.' }
  }

  const contentRows = []
  for (const [key, value] of Object.entries(content)) {
    if (!CONTENT_KEYS.includes(key)) continue
    const json = JSON.stringify(value)
    if (json.length > MAX_CONTENT_BYTES) {
      return { ok: false, error: `The “${key}” section is larger than the 200 kB limit.` }
    }
    contentRows.push({ key, json })
  }
  if (contentRows.length === 0) {
    return { ok: false, error: 'The backup has no content sections this build recognises.' }
  }

  const collectionIds = new Set()
  for (const collection of collections) {
    const id = asString(collection?.id, 64)
    if (!id) return { ok: false, error: 'Every collection in the backup needs an id.' }
    if (collectionIds.has(id)) return { ok: false, error: `Duplicate collection id “${id}”.` }
    collectionIds.add(id)
  }

  const productIds = new Set()
  for (const product of products) {
    const id = asString(product?.id, 64)
    const slug = asString(product?.slug, 80)
    if (!id || !slug) return { ok: false, error: 'Every product in the backup needs an id and a slug.' }
    if (productIds.has(id)) return { ok: false, error: `Duplicate product id “${id}”.` }
    productIds.add(id)
  }
  const slugs = new Set()
  for (const product of products) {
    const slug = asString(product?.slug, 80)
    if (slugs.has(slug)) return { ok: false, error: `Two products share the slug “${slug}”.` }
    slugs.add(slug)
  }

  const colorIds = new Set()
  for (const color of colors) {
    const id = asString(color?.id, 64)
    const productId = asString(color?.product_id, 64)
    if (!id) return { ok: false, error: 'Every colour in the backup needs an id.' }
    if (colorIds.has(id)) return { ok: false, error: `Duplicate colour id “${id}”.` }
    if (!productIds.has(productId)) {
      return { ok: false, error: `Colour “${id}” points at a product that is not in the backup.` }
    }
    colorIds.add(id)
  }

  const variantKeys = new Set()
  for (const variant of variants) {
    const productId = asString(variant?.product_id, 64)
    const colorId = asString(variant?.color_id, 64)
    const size = asString(variant?.size, 12)
    if (!productIds.has(productId) || !colorIds.has(colorId) || !size) {
      return { ok: false, error: 'A variant in the backup points at a missing product, colour or size.' }
    }
    const key = `${productId}|${colorId}|${size}`
    if (variantKeys.has(key)) {
      return { ok: false, error: `Two variants share ${size} in the same colour.` }
    }
    variantKeys.add(key)
  }

  const insertCollection = db.prepare(`
    INSERT INTO collections (id, name, slug, description, position, visible, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, slug, name, code, tagline, description, details, sizes, price_cents,
      collection_id, status, featured, drop_label, fabric, fit, made,
      position, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertColor = db.prepare(`
    INSERT INTO product_colors (id, product_id, name, hex, front, back, detail, position)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertVariant = db.prepare(
    'INSERT INTO variants (id, product_id, color_id, size, stock) VALUES (?, ?, ?, ?, ?)',
  )
  const insertContent = db.prepare(
    'INSERT INTO content (key, value, updated_at) VALUES (?, ?, ?)',
  )

  const timestamp = nowIso()

  db.exec('BEGIN')
  try {
    db.prepare('DELETE FROM variants').run()
    db.prepare('DELETE FROM product_colors').run()
    db.prepare('DELETE FROM products').run()
    db.prepare('DELETE FROM collections').run()
    db.prepare('DELETE FROM content').run()

    for (const collection of collections) {
      insertCollection.run(
        asString(collection.id, 64),
        asString(collection.name, 120),
        asString(collection.slug, 120),
        asString(collection.description, 1000),
        asInt(collection.position, 0),
        asInt(collection.visible, 1) ? 1 : 0,
        asString(collection.created_at, 40) || timestamp,
      )
    }

    for (const product of products) {
      const collectionId = asString(product.collection_id, 64)
      insertProduct.run(
        asString(product.id, 64),
        asString(product.slug, 120),
        asString(product.name, 160),
        asString(product.code, 24),
        asString(product.tagline, 200),
        asString(product.description, 5000),
        asJsonText(product.details),
        asJsonText(product.sizes),
        Math.max(0, asInt(product.price_cents, 0)),
        collectionId && collectionIds.has(collectionId) ? collectionId : null,
        asString(product.status, 16) === 'hidden' ? 'hidden' : 'active',
        asInt(product.featured, 0) ? 1 : 0,
        asString(product.drop_label, 40),
        asString(product.fabric, 80),
        asString(product.fit, 80),
        asString(product.made, 80),
        asInt(product.position, 0),
        asString(product.created_at, 40) || timestamp,
        asString(product.updated_at, 40) || timestamp,
      )
    }

    for (const color of colors) {
      insertColor.run(
        asString(color.id, 64),
        asString(color.product_id, 64),
        asString(color.name, 40),
        asString(color.hex, 7) || '#161616',
        asString(color.front, 500),
        asString(color.back, 500),
        asString(color.detail, 500),
        asInt(color.position, 0),
      )
    }

    for (const variant of variants) {
      insertVariant.run(
        asString(variant.id, 64) || `var_${Math.random().toString(36).slice(2, 10)}`,
        asString(variant.product_id, 64),
        asString(variant.color_id, 64),
        asString(variant.size, 12),
        Math.max(0, asInt(variant.stock, 0)),
      )
    }

    for (const row of contentRows) {
      insertContent.run(row.key, row.json, timestamp)
    }

    db.exec('COMMIT')
  } catch (cause) {
    db.exec('ROLLBACK')
    const message = cause instanceof Error ? cause.message : 'The backup could not be applied.'
    return { ok: false, error: `Restore failed and was rolled back: ${message}` }
  }

  // A backup taken before a newer content group existed must not leave holes.
  ensureContentKeys()

  return {
    ok: true,
    counts: {
      collections: collections.length,
      products: products.length,
      colors: colors.length,
      variants: variants.length,
      contentSections: contentRows.length,
    },
  }
}
