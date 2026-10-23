import { randomUUID } from 'node:crypto'
import { db, getContentMap, logActivity, nowIso, LOW_STOCK_THRESHOLD } from './db.mjs'
import { slugify } from './validate.mjs'

const money = (cents) => Math.round(cents) / 100

function collectionFor(id) {
  if (!id) return null
  const row = db.prepare('SELECT id, name, slug FROM collections WHERE id = ?').get(id)
  return row ?? null
}

function hydrateProduct(row, { includeStock = true } = {}) {
  const colors = db
    .prepare('SELECT * FROM product_colors WHERE product_id = ? ORDER BY position, name')
    .all(row.id)
    .map((color) => ({
      id: color.id,
      name: color.name,
      hex: color.hex,
      photos: { front: color.front, back: color.back || color.front, detail: color.detail || color.front },
      front: color.front,
      back: color.back,
      detail: color.detail,
    }))

  const variants = db
    .prepare('SELECT * FROM variants WHERE product_id = ?')
    .all(row.id)
    .map((variant) => ({
      id: variant.id,
      colorId: variant.color_id,
      size: variant.size,
      stock: variant.stock,
      available: variant.stock > 0,
    }))

  const sizes = JSON.parse(row.sizes || '[]')
  const orderedVariants = variants.sort((a, b) => {
    const colorA = colors.findIndex((c) => c.id === a.colorId)
    const colorB = colors.findIndex((c) => c.id === b.colorId)
    if (colorA !== colorB) return colorA - colorB
    return sizes.indexOf(a.size) - sizes.indexOf(b.size)
  })

  const totalStock = variants.reduce((sum, variant) => sum + variant.stock, 0)
  const manualStatus = row.status
  const status = manualStatus === 'hidden' ? 'hidden' : totalStock === 0 ? 'sold_out' : 'active'

  const base = {
    id: row.id,
    slug: row.slug,
    name: row.name,
    code: row.code,
    tagline: row.tagline,
    description: row.description,
    details: JSON.parse(row.details || '[]'),
    price: money(row.price_cents),
    priceCents: row.price_cents,
    collection: collectionFor(row.collection_id),
    collectionId: row.collection_id,
    sizes,
    colors,
    variants: orderedVariants,
    totalStock,
    manualStatus,
    status,
    featured: Boolean(row.featured),
    drop: row.drop_label,
    meta: { fabric: row.fabric, fit: row.fit, made: row.made },
    images: colors[0]?.photos ?? { front: '', back: '', detail: '' },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  if (!includeStock) {
    return {
      ...base,
      colors: base.colors.map((color) => ({ id: color.id, name: color.name, hex: color.hex, photos: color.photos })),
      variants: base.variants.map(({ id, colorId, size, available }) => ({ id, colorId, size, available })),
      totalStock: undefined,
      manualStatus: undefined,
    }
  }

  return base
}

export function listProducts({ includeHidden = false } = {}) {
  const rows = db
    .prepare(
      includeHidden
        ? 'SELECT * FROM products ORDER BY position, created_at'
        : "SELECT * FROM products WHERE status = 'active' ORDER BY position, created_at",
    )
    .all()
  return rows.map((row) => hydrateProduct(row, { includeStock: includeHidden }))
}

export function getProduct(id) {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(id)
  return row ? hydrateProduct(row) : null
}

export function getProductBySlug(slug) {
  const row = db.prepare('SELECT * FROM products WHERE slug = ?').get(slug)
  return row ? hydrateProduct(row) : null
}

export function listCollections({ includeHidden = false } = {}) {
  const rows = db
    .prepare(
      includeHidden
        ? 'SELECT * FROM collections ORDER BY position, name'
        : 'SELECT * FROM collections WHERE visible = 1 ORDER BY position, name',
    )
    .all()
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    position: row.position,
    visible: Boolean(row.visible),
    productCount: db
      .prepare("SELECT COUNT(*) AS n FROM products WHERE collection_id = ? AND status = 'active'")
      .get(row.id).n,
  }))
}

function uniqueSlug(name, currentId = null) {
  const base = slugify(name) || 'product'
  let candidate = base
  let n = 1
  while (true) {
    const row = db.prepare('SELECT id FROM products WHERE slug = ?').get(candidate)
    if (!row || row.id === currentId) return candidate
    n += 1
    candidate = `${base}-${n}`
  }
}

function syncProductRelations(productId, value) {
  const existingColors = db
    .prepare('SELECT * FROM product_colors WHERE product_id = ?')
    .all(productId)
  const keepIds = new Set()

  value.colors.forEach((color, index) => {
    let colorId = color.id
    if (colorId && existingColors.some((row) => row.id === colorId)) {
      db.prepare(
        'UPDATE product_colors SET name = ?, hex = ?, front = ?, back = ?, detail = ?, position = ? WHERE id = ?',
      ).run(color.name, color.hex, color.front, color.back, color.detail, index, colorId)
    } else {
      colorId = randomUUID()
      db.prepare(
        'INSERT INTO product_colors (id, product_id, name, hex, front, back, detail, position) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ).run(colorId, productId, color.name, color.hex, color.front, color.back, color.detail, index)
    }
    keepIds.add(colorId)

    for (const size of value.sizes) {
      const stock =
        value.stock[`${color.id}|${size}`] ??
        value.stock[`${index}|${size}`] ??
        value.stock[`${colorId}|${size}`] ??
        0
      const existing = db
        .prepare('SELECT id FROM variants WHERE product_id = ? AND color_id = ? AND size = ?')
        .get(productId, colorId, size)
      if (existing) {
        db.prepare('UPDATE variants SET stock = ? WHERE id = ?').run(stock, existing.id)
      } else {
        db.prepare(
          'INSERT INTO variants (id, product_id, color_id, size, stock) VALUES (?, ?, ?, ?, ?)',
        ).run(randomUUID(), productId, colorId, size, stock)
      }
    }

    db.prepare(
      'DELETE FROM variants WHERE product_id = ? AND color_id = ? AND size NOT IN (' +
        value.sizes.map(() => '?').join(',') +
        ')',
    ).run(productId, colorId, ...value.sizes)
  })

  for (const row of existingColors) {
    if (!keepIds.has(row.id)) {
      db.prepare('DELETE FROM product_colors WHERE id = ?').run(row.id)
    }
  }
}

export function createProduct(value) {
  const id = randomUUID()
  const ts = nowIso()
  const position = db.prepare('SELECT COALESCE(MAX(position), 0) + 1 AS n FROM products').get().n
  const slug = uniqueSlug(value.name)

  db.exec('BEGIN')
  try {
    db.prepare(`
      INSERT INTO products (
        id, slug, name, code, tagline, description, details, sizes, price_cents,
        collection_id, status, featured, drop_label, fabric, fit, made,
        position, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      slug,
      value.name,
      value.code,
      value.tagline,
      value.description,
      JSON.stringify(value.details),
      JSON.stringify(value.sizes),
      value.priceCents,
      value.collectionId,
      value.status,
      value.featured ? 1 : 0,
      value.drop,
      value.fabric,
      value.fit,
      value.made,
      position,
      ts,
      ts,
    )
    syncProductRelations(id, value)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  logActivity('created', 'product', id, `Added product “${value.name}”.`)
  return getProduct(id)
}

export function updateProduct(id, value) {
  const current = getProduct(id)
  if (!current) return null
  const slug = uniqueSlug(value.name, id)
  const ts = nowIso()

  db.exec('BEGIN')
  try {
    db.prepare(`
      UPDATE products SET
        slug = ?, name = ?, code = ?, tagline = ?, description = ?, details = ?, sizes = ?,
        price_cents = ?, collection_id = ?, status = ?, featured = ?, drop_label = ?,
        fabric = ?, fit = ?, made = ?, updated_at = ?
      WHERE id = ?
    `).run(
      slug,
      value.name,
      value.code,
      value.tagline,
      value.description,
      JSON.stringify(value.details),
      JSON.stringify(value.sizes),
      value.priceCents,
      value.collectionId,
      value.status,
      value.featured ? 1 : 0,
      value.drop,
      value.fabric,
      value.fit,
      value.made,
      ts,
      id,
    )
    syncProductRelations(id, value)
    db.exec('COMMIT')
  } catch (error) {
    db.exec('ROLLBACK')
    throw error
  }

  logActivity('updated', 'product', id, `Edited product “${value.name}”.`)
  return getProduct(id)
}

export function deleteProduct(id) {
  const product = getProduct(id)
  if (!product) return false
  db.prepare('DELETE FROM products WHERE id = ?').run(id)
  logActivity('deleted', 'product', id, `Deleted product “${product.name}”.`)
  return true
}

export function duplicateProduct(id) {
  const product = getProduct(id)
  if (!product) return null

  const value = {
    name: `${product.name} (copy)`,
    code: product.code,
    tagline: product.tagline,
    description: product.description,
    details: product.details,
    sizes: product.sizes,
    priceCents: product.priceCents,
    collectionId: product.collectionId,
    status: 'hidden',
    featured: false,
    drop: product.drop,
    fabric: product.meta.fabric,
    fit: product.meta.fit,
    made: product.meta.made,
    colors: product.colors.map((color) => ({
      id: null,
      name: color.name,
      hex: color.hex,
      front: color.photos.front,
      back: color.photos.back,
      detail: color.photos.detail,
    })),
    stock: Object.fromEntries(
      product.variants.map((variant) => [`${variant.colorId}|${variant.size}`, variant.stock]),
    ),
  }

  // Remap stock keys from old colour ids to the new colour order.
  const remapped = {}
  product.colors.forEach((color, index) => {
    for (const size of product.sizes) {
      const variant = product.variants.find((v) => v.colorId === color.id && v.size === size)
      remapped[`${index}|${size}`] = variant?.stock ?? 0
    }
  })
  value.stock = remapped

  const copy = createProduct(value)
  logActivity('duplicated', 'product', copy.id, `Duplicated “${product.name}” as “${copy.name}”.`)
  return copy
}

export function setVariantStock(variantId, newStock, reason = 'manual') {
  const variant = db
    .prepare(
      `SELECT v.*, p.name AS product_name, p.id AS product_id, c.name AS color_name
       FROM variants v
       JOIN products p ON p.id = v.product_id
       JOIN product_colors c ON c.id = v.color_id
       WHERE v.id = ?`,
    )
    .get(variantId)
  if (!variant) return null
  if (variant.stock === newStock) return { ...variant, stock: newStock }

  db.prepare('UPDATE variants SET stock = ? WHERE id = ?').run(newStock, variantId)
  db.prepare('UPDATE products SET updated_at = ? WHERE id = ?').run(nowIso(), variant.product_id)
  db.prepare(
    `INSERT INTO stock_log (variant_id, product_id, product_name, color_name, size, old_stock, new_stock, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    variantId,
    variant.product_id,
    variant.product_name,
    variant.color_name,
    variant.size,
    variant.stock,
    newStock,
    reason,
    nowIso(),
  )

  logActivity(
    'stock',
    'variant',
    variantId,
    `${variant.product_name} / ${variant.color_name} / ${variant.size}: ${variant.stock} → ${newStock}.`,
  )

  return { ...variant, stock: newStock }
}

export function bulkSetStock(variantIds, mode, value) {
  const results = []
  for (const variantId of variantIds) {
    const current = db.prepare('SELECT stock FROM variants WHERE id = ?').get(variantId)
    if (!current) continue
    const next = mode === 'add' ? Math.min(100000, current.stock + value) : value
    const updated = setVariantStock(variantId, Math.max(0, next), mode === 'add' ? 'restock' : 'bulk')
    if (updated) results.push(updated)
  }
  return results
}

export function listStockLog({ limit = 50, productId = null } = {}) {
  const rows = productId
    ? db
        .prepare('SELECT * FROM stock_log WHERE product_id = ? ORDER BY id DESC LIMIT ?')
        .all(productId, limit)
    : db.prepare('SELECT * FROM stock_log ORDER BY id DESC LIMIT ?').all(limit)
  return rows
}

export function listActivity(limit = 20) {
  return db.prepare('SELECT * FROM activity ORDER BY id DESC LIMIT ?').all(limit)
}

export function createCollection(value) {
  const id = randomUUID()
  let slug = value.slug || slugify(value.name)
  let n = 1
  while (db.prepare('SELECT 1 FROM collections WHERE slug = ?').get(slug)) {
    n += 1
    slug = `${slugify(value.name)}-${n}`
  }
  db.prepare(
    'INSERT INTO collections (id, name, slug, description, position, visible, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(id, value.name, slug, value.description, value.position, value.visible, nowIso())
  logActivity('created', 'collection', id, `Created collection “${value.name}”.`)
  return listCollections({ includeHidden: true }).find((row) => row.id === id)
}

export function updateCollection(id, value) {
  const existing = db.prepare('SELECT * FROM collections WHERE id = ?').get(id)
  if (!existing) return null
  let slug = value.slug || existing.slug
  const clash = db.prepare('SELECT id FROM collections WHERE slug = ?').get(slug)
  if (clash && clash.id !== id) slug = `${slug}-${Date.now().toString(36).slice(-4)}`

  db.prepare(
    'UPDATE collections SET name = ?, slug = ?, description = ?, visible = ?, position = ? WHERE id = ?',
  ).run(value.name, slug, value.description, value.visible, value.position, id)
  logActivity('updated', 'collection', id, `Edited collection “${value.name}”.`)
  return listCollections({ includeHidden: true }).find((row) => row.id === id)
}

export function deleteCollection(id) {
  const existing = db.prepare('SELECT * FROM collections WHERE id = ?').get(id)
  if (!existing) return false
  db.prepare('DELETE FROM collections WHERE id = ?').run(id)
  logActivity('deleted', 'collection', id, `Deleted collection “${existing.name}”.`)
  return true
}

export function reorderCollections(ids) {
  const update = db.prepare('UPDATE collections SET position = ? WHERE id = ?')
  ids.forEach((id, index) => update.run(index, id))
  logActivity('reordered', 'collection', null, 'Reordered collections.')
  return listCollections({ includeHidden: true })
}

export function listInquiries(limit = 50) {
  return db.prepare('SELECT * FROM inquiries ORDER BY created_at DESC LIMIT ?').all(limit)
}

export function createInquiry(value) {
  const id = randomUUID()
  const ts = nowIso()
  db.prepare(
    'INSERT INTO inquiries (id, name, contact, message, product, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
  ).run(id, value.name, value.contact, value.message, value.product, value.status, ts, ts)
  logActivity('created', 'inquiry', id, `Logged inquiry from “${value.name}”.`)
  return db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id)
}

export function updateInquiry(id, value) {
  const existing = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id)
  if (!existing) return null
  db.prepare(
    'UPDATE inquiries SET name = ?, contact = ?, message = ?, product = ?, status = ?, updated_at = ? WHERE id = ?',
  ).run(value.name, value.contact, value.message, value.product, value.status, nowIso(), id)
  logActivity('updated', 'inquiry', id, `Updated inquiry from “${value.name}”.`)
  return db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id)
}

export function deleteInquiry(id) {
  const existing = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(id)
  if (!existing) return false
  db.prepare('DELETE FROM inquiries WHERE id = ?').run(id)
  logActivity('deleted', 'inquiry', id, `Deleted inquiry from “${existing.name}”.`)
  return true
}

export function overview() {
  const products = listProducts({ includeHidden: true })
  const total = products.length
  const active = products.filter((product) => product.status === 'active').length
  const hidden = products.filter((product) => product.manualStatus === 'hidden').length
  const soldOut = products.filter((product) => product.status === 'sold_out').length

  const lowStock = db
    .prepare(
      `SELECT v.id, v.stock, v.size, p.id AS product_id, p.name AS product_name, p.status AS product_status,
              c.name AS color_name, c.id AS color_id
       FROM variants v
       JOIN products p ON p.id = v.product_id
       JOIN product_colors c ON c.id = v.color_id
       WHERE v.stock > 0 AND v.stock <= ? AND p.status = 'active'
       ORDER BY v.stock ASC, p.name ASC`,
    )
    .all(LOW_STOCK_THRESHOLD)

  return {
    counts: { total, active, hidden, soldOut, lowStock: lowStock.length },
    products,
    lowStock,
    recentStock: listStockLog({ limit: 8 }),
    recentActivity: listActivity(8),
    recentInquiries: listInquiries(5),
    content: getContentMap(),
    threshold: LOW_STOCK_THRESHOLD,
  }
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  // A cell opening with =, +, - or @ is executed as a formula by spreadsheet
  // apps. Prefix it with an apostrophe so an imported product name stays text.
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function productsCsv() {
  const products = listProducts({ includeHidden: true })
  const sizes = [...new Set(products.flatMap((product) => product.sizes))]
  const colors = [...new Set(products.flatMap((product) => product.colors.map((c) => c.name)))]

  const header = [
    'id',
    'slug',
    'name',
    'code',
    'collection',
    'status',
    'manual_status',
    'price_php',
    'featured',
    'total_stock',
    ...colors.map((color) => `stock:${color}`),
    ...sizes.map((size) => `stock:${size}`),
    'updated_at',
  ]

  const rows = products.map((product) => {
    const byColor = colors.map((colorName) => {
      const color = product.colors.find((item) => item.name === colorName)
      if (!color) return ''
      return product.variants
        .filter((variant) => variant.colorId === color.id)
        .reduce((sum, variant) => sum + variant.stock, 0)
    })
    const bySize = sizes.map((size) =>
      product.variants
        .filter((variant) => variant.size === size)
        .reduce((sum, variant) => sum + variant.stock, 0),
    )
    return [
      product.id,
      product.slug,
      product.name,
      product.code,
      product.collection?.name ?? '',
      product.status,
      product.manualStatus,
      product.price.toFixed(2),
      product.featured ? 'yes' : 'no',
      product.totalStock,
      ...byColor,
      ...bySize,
      product.updatedAt,
    ]
  })

  return [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')
}
