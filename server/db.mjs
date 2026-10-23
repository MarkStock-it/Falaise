import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import {
  DEFAULT_COLLECTIONS,
  DEFAULT_CONTENT,
  DEFAULT_PRODUCTS,
  LOW_STOCK_THRESHOLD,
} from './seed.mjs'

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
// Everything writable (database, session secret, uploads) lives under this one
// directory, so a host only has to mount a single persistent disk at it.
export const DATA_DIR = process.env.DATA_DIR ? resolve(process.env.DATA_DIR) : join(ROOT, 'data')
export const UPLOAD_DIR = join(DATA_DIR, 'uploads')
const DB_PATH = process.env.DB_PATH || join(DATA_DIR, 'falaise.db')

mkdirSync(UPLOAD_DIR, { recursive: true })

export const db = new DatabaseSync(DB_PATH)

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS content (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    visible INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    code TEXT NOT NULL DEFAULT '',
    tagline TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    details TEXT NOT NULL DEFAULT '[]',
    sizes TEXT NOT NULL DEFAULT '[]',
    price_cents INTEGER NOT NULL DEFAULT 0,
    collection_id TEXT REFERENCES collections(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'active',
    featured INTEGER NOT NULL DEFAULT 0,
    drop_label TEXT NOT NULL DEFAULT '',
    fabric TEXT NOT NULL DEFAULT '',
    fit TEXT NOT NULL DEFAULT '',
    made TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS product_colors (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    hex TEXT NOT NULL DEFAULT '#161616',
    front TEXT NOT NULL DEFAULT '',
    back TEXT NOT NULL DEFAULT '',
    detail TEXT NOT NULL DEFAULT '',
    position INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    color_id TEXT NOT NULL REFERENCES product_colors(id) ON DELETE CASCADE,
    size TEXT NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    UNIQUE (product_id, color_id, size)
  );

  CREATE TABLE IF NOT EXISTS stock_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    variant_id TEXT,
    product_id TEXT,
    product_name TEXT NOT NULL,
    color_name TEXT NOT NULL,
    size TEXT NOT NULL,
    old_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT NOT NULL DEFAULT 'manual',
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT,
    summary TEXT NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    contact TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL DEFAULT '',
    product TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    password_hash TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_variants_product ON variants(product_id);
  CREATE INDEX IF NOT EXISTS idx_stock_log_created ON stock_log(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at DESC);
`)

export const nowIso = () => new Date().toISOString()

export function logActivity(action, entity, entityId, summary) {
  db.prepare(
    'INSERT INTO activity (action, entity, entity_id, summary, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(action, entity, entityId ?? null, summary, nowIso())
}

export function seedIfEmpty() {
  const contentCount = db.prepare('SELECT COUNT(*) AS n FROM content').get().n
  if (contentCount === 0) {
    const insert = db.prepare('INSERT INTO content (key, value, updated_at) VALUES (?, ?, ?)')
    for (const [key, value] of Object.entries(DEFAULT_CONTENT)) {
      insert.run(key, JSON.stringify(value), nowIso())
    }
  }

  const collectionCount = db.prepare('SELECT COUNT(*) AS n FROM collections').get().n
  if (collectionCount === 0) {
    const insert = db.prepare(
      'INSERT INTO collections (id, name, slug, description, position, visible, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    for (const collection of DEFAULT_COLLECTIONS) {
      insert.run(
        collection.id,
        collection.name,
        collection.slug,
        collection.description,
        collection.position,
        collection.visible,
        nowIso(),
      )
    }
  }

  const productCount = db.prepare('SELECT COUNT(*) AS n FROM products').get().n
  if (productCount === 0) {
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

    for (const product of DEFAULT_PRODUCTS) {
      const ts = nowIso()
      insertProduct.run(
        product.id,
        product.slug,
        product.name,
        product.code,
        product.tagline,
        product.description,
        JSON.stringify(product.details),
        JSON.stringify(product.sizes),
        product.priceCents,
        product.collectionId,
        product.status,
        product.featured,
        product.drop,
        product.fabric,
        product.fit,
        product.made,
        product.position,
        ts,
        ts,
      )
      for (const color of product.colors) {
        insertColor.run(
          color.id,
          product.id,
          color.name,
          color.hex,
          color.front,
          color.back,
          color.detail,
          color.position,
        )
        for (const size of product.sizes) {
          insertVariant.run(
            randomUUID(),
            product.id,
            color.id,
            size,
            product.stock[`${color.id}|${size}`] ?? 0,
          )
        }
      }
    }
  }
}

seedIfEmpty()

/**
 * Additive migration: a content group introduced in a later release gets its
 * default row the next time the server boots. Existing rows are never touched,
 * so live edits survive deploys.
 */
function withDefaults(defaultValue, stored) {
  if (Array.isArray(defaultValue)) return stored === undefined ? defaultValue : stored
  if (defaultValue && typeof defaultValue === 'object') {
    const base = stored && typeof stored === 'object' && !Array.isArray(stored) ? stored : {}
    const merged = { ...base }
    let changed = false
    for (const [key, value] of Object.entries(defaultValue)) {
      const next = withDefaults(value, merged[key])
      if (next !== merged[key]) {
        merged[key] = next
        changed = true
      }
    }
    return changed ? merged : stored
  }
  return stored === undefined ? defaultValue : stored
}

export function ensureContentKeys() {
  const insert = db.prepare('INSERT INTO content (key, value, updated_at) VALUES (?, ?, ?)')
  const update = db.prepare('UPDATE content SET value = ?, updated_at = ? WHERE key = ?')
  const read = db.prepare('SELECT value FROM content WHERE key = ?')
  const added = []
  const filled = []
  for (const [key, value] of Object.entries(DEFAULT_CONTENT)) {
    const row = read.get(key)
    if (!row) {
      insert.run(key, JSON.stringify(value), nowIso())
      added.push(key)
      continue
    }
    const stored = JSON.parse(row.value)
    const merged = withDefaults(value, stored)
    if (merged !== stored) {
      update.run(JSON.stringify(merged), nowIso(), key)
      filled.push(key)
    }
  }
  if (added.length > 0) console.log(`  Content: added default group(s) ${added.join(', ')}`)
  if (filled.length > 0) {
    console.log(`  Content: filled missing field(s) in ${filled.join(', ')}`)
  }
}

ensureContentKeys()

export function getContentMap() {
  const rows = db.prepare('SELECT key, value FROM content').all()
  const content = {}
  for (const row of rows) {
    content[row.key] = JSON.parse(row.value)
  }
  return content
}

export function getContent(key) {
  const row = db.prepare('SELECT value FROM content WHERE key = ?').get(key)
  return row ? JSON.parse(row.value) : null
}

export function putContent(key, value) {
  const existing = db.prepare('SELECT 1 AS ok FROM content WHERE key = ?').get(key)
  if (existing) {
    db.prepare('UPDATE content SET value = ?, updated_at = ? WHERE key = ?').run(
      JSON.stringify(value),
      nowIso(),
      key,
    )
  } else {
    db.prepare('INSERT INTO content (key, value, updated_at) VALUES (?, ?, ?)').run(
      key,
      JSON.stringify(value),
      nowIso(),
    )
  }
}

export { LOW_STOCK_THRESHOLD }
